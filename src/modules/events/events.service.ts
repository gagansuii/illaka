import { Prisma } from '@prisma/client';
import {
  clearEventsCache,
  clearInFlightEventsRefresh,
  getCachedEvents,
  getInFlightEventsRefresh,
  makeEventsCacheKey,
  normalizeCoord,
  setCachedEvents,
  setInFlightEventsRefresh,
} from '@/lib/events-cache';
import { recalcEngagementScore } from '@/lib/engagement';
import { sendTicketEmail } from '@/lib/mailer';
import { sanitizeEventMediaList } from '@/lib/media';
import { rateLimit } from '@/lib/rate-limit';
import { getOpenAIClient, getPineconeIndex, isOpenAIConfigured, isPineconeConfigured } from '@/lib/ai';
import { withRetry } from '@/lib/retry';
import { prisma } from '@/lib/prisma';
import { ServiceError } from '@/src/core/errors';
import { logger } from '@/src/core/logger';
import { authService } from '@/src/modules/auth/auth.service';
import { analytics } from '@/lib/posthog';
import { eventsRepository } from './events.repository';
import type {
  CreateEventInput,
  EventForRsvp,
  EventRow,
  NearbyEventsQuery,
  OrganizerEventSummary,
  RsvpRecord,
  UpdateEventInput,
} from './events.types';

const CACHE_FRESH_MS = 15_000;
const CACHE_STALE_MS = 60_000;

type CacheEntry = { events: EventRow[]; fetchedAt: number };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchAndCache(cacheKey: string, lat: number, lng: number, radius: number): Promise<EventRow[]> {
  const existing = getInFlightEventsRefresh(cacheKey) as Promise<EventRow[]> | undefined;
  if (existing) return existing;

  const promise = eventsRepository
    .findNearby(lat, lng, radius)
    .then((events) => { setCachedEvents(cacheKey, events); return events; })
    .finally(() => { clearInFlightEventsRefresh(cacheKey); });

  setInFlightEventsRefresh(cacheKey, promise);
  return promise;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const eventsService = {
  async listNearby(query: NearbyEventsQuery): Promise<{ events: EventRow[]; stale: boolean }> {
    const { lat, lng, radius } = query;

    if (!await rateLimit(`events:${normalizeCoord(lat)}:${normalizeCoord(lng)}`)) {
      throw ServiceError.rateLimited();
    }

    if (Number.isNaN(lat) || Number.isNaN(lng)) return { events: [], stale: false };

    const cacheKey = makeEventsCacheKey(lat, lng, radius);
    const now = Date.now();
    const cached = getCachedEvents(cacheKey) as CacheEntry | undefined;

    if (cached) {
      const age = now - cached.fetchedAt;
      if (age <= CACHE_FRESH_MS) return { events: cached.events, stale: false };
      if (age <= CACHE_FRESH_MS + CACHE_STALE_MS) {
        fetchAndCache(cacheKey, lat, lng, radius).catch((err) =>
          logger.error('Background events refresh failed', { error: String(err) }),
        );
        return { events: cached.events, stale: true };
      }
    }

    try {
      const events = await fetchAndCache(cacheKey, lat, lng, radius);
      return { events, stale: false };
    } catch (err) {
      if (cached) return { events: cached.events, stale: true };
      throw err;
    }
  },

  async getById(
    id: string,
    opts: { token?: string | null; userId?: string | null; role?: string | null },
  ): Promise<EventRow> {
    const event = await eventsRepository.findById(id);
    if (!event) throw ServiceError.notFound('Event');

    if (event.visibility === 'PRIVATE') {
      const tokenValid = opts.token && event.shareToken && opts.token === event.shareToken;
      if (!tokenValid) {
        if (!opts.userId || (event.organizerId !== opts.userId && opts.role !== 'ADMIN')) {
          throw ServiceError.notFound('Event');
        }
      }
    }

    return event;
  },

  async create(input: Omit<CreateEventInput, 'organizerId'>, organizerId: string): Promise<EventRow> {
    if (!await rateLimit(`events:create:${organizerId}`, 10)) {
      throw ServiceError.rateLimited();
    }

    // Block unverified users from creating events (gated by env var)
    await authService.requireEmailVerified(organizerId);

    const event = await eventsRepository.create({ ...input, organizerId });
    analytics.eventCreated(organizerId, { eventId: event.id, visibility: input.visibility });

    // Pinecone indexing — retried up to 3 times in the background
    void withRetry(
      `pinecone:index:${event.id}`,
      () => eventsService._indexInPinecone(event),
      { attempts: 3, baseDelayMs: 1_000 },
    );

    clearEventsCache();
    return event;
  },

  async update(id: string, data: UpdateEventInput, userId: string, role: string): Promise<EventRow> {
    const owned = await eventsRepository.findOwnership(id);
    if (!owned) throw ServiceError.notFound('Event');
    if (owned.organizerId !== userId && role !== 'ADMIN') throw ServiceError.forbidden();

    try {
      return await eventsRepository.update(id, data);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw ServiceError.notFound('Event');
      }
      throw err;
    } finally {
      clearEventsCache();
    }
  },

  async delete(id: string, userId: string, role: string): Promise<void> {
    const owned = await eventsRepository.findOwnership(id);
    if (!owned) throw ServiceError.notFound('Event');
    if (owned.organizerId !== userId && role !== 'ADMIN') throw ServiceError.forbidden();

    try {
      await eventsRepository.delete(id);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw ServiceError.notFound('Event');
      }
      throw err;
    }
    clearEventsCache();
  },

  async rsvp(eventId: string, userId: string): Promise<{ rsvpId: string }> {
    const event = await eventsRepository.findForRsvp(eventId);
    if (!event) throw ServiceError.notFound('Event');

    let rsvp: RsvpRecord;
    try {
      rsvp = await eventsRepository.createRsvp({ eventId, userId, capacity: event.capacity });
    } catch (err: unknown) {
      const code = (err as Record<string, unknown>)?.code;
      if (code === 'EVENT_FULL') throw ServiceError.conflict('Event is full');
      if (code === 'ALREADY_RSVPED') throw ServiceError.conflict('Already RSVPed');
      logger.error('RSVP error', { eventId, userId, error: String(err) });
      throw ServiceError.badRequest('Failed to RSVP. Please try again.');
    }

    recalcEngagementScore(eventId).catch(() => undefined);
    clearEventsCache();
    analytics.rsvpCreated(userId, { eventId });

    void withRetry(
      `ticket-email:${rsvp.id}`,
      () => eventsService._sendTicketEmail(rsvp, event, userId),
      { attempts: 3, baseDelayMs: 1_000 },
    );

    return { rsvpId: rsvp.id };
  },

  async share(eventId: string, userId: string): Promise<void> {
    const event = await eventsRepository.findOwnership(eventId);
    if (!event) throw ServiceError.notFound('Event');

    try {
      await eventsRepository.createShare(eventId, userId);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return; // idempotent — duplicate share is fine
      }
      throw err;
    }

    await recalcEngagementScore(eventId).catch(() => undefined);
    clearEventsCache();
  },

  async generateInviteToken(eventId: string, userId: string, role: string): Promise<string> {
    const event = await eventsRepository.findById(eventId);
    if (!event) throw ServiceError.notFound('Event');
    if (event.organizerId !== userId && role !== 'ADMIN') throw ServiceError.forbidden();

    return eventsRepository.upsertShareToken(eventId, event.shareToken ?? null);
  },

  async listByOrganizer(organizerId: string): Promise<OrganizerEventSummary[]> {
    return eventsRepository.findByOrganizer(organizerId);
  },

  async listByOrganizerSplit(organizerId: string): Promise<{ upcoming: OrganizerEventSummary[]; past: OrganizerEventSummary[] }> {
    const all = await eventsRepository.findByOrganizerSplit(organizerId);
    const now = new Date();
    return {
      upcoming: all.filter((e) => new Date(e.endTime) >= now),
      past: all.filter((e) => new Date(e.endTime) < now),
    };
  },

  // Internal: Pinecone indexing — called fire-and-forget after create
  async _indexInPinecone(event: EventRow): Promise<void> {
    if (!isOpenAIConfigured() || !isPineconeConfigured()) return;
    const openai = getOpenAIClient();
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: `${event.title} - ${event.description}`,
    });
    const index = getPineconeIndex();
    await index.upsert([{
      id: event.id,
      values: embedding.data[0].embedding,
      metadata: { latitude: event.latitude as number, longitude: event.longitude as number },
    }]);
  },

  // Internal: ticket email — called fire-and-forget after RSVP
  async _sendTicketEmail(rsvp: RsvpRecord, event: EventForRsvp, userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (!user?.email) return;

    const eventDate = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(event.startTime));

    await sendTicketEmail({
      to: user.email,
      userName: user.name,
      eventTitle: event.title,
      eventDate,
      ticketId: rsvp.ticketId ?? rsvp.id,
      rsvpId: rsvp.id,
      ticketPrice: event.ticketPrice ?? null,
      organizerName: event.organizerName ?? 'Organizer',
    });
  },
};
