import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sanitizeEventMedia, sanitizeEventMediaList } from '@/lib/media';
import { logger } from '@/src/core/logger';
import type {
  CreateEventInput,
  EventForRsvp,
  EventRow,
  OrganizerEventSummary,
  RsvpRecord,
  UpdateEventInput,
} from './events.types';

// Columns guaranteed present across all migrations
const SAFE_SELECT = {
  id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
  latitude: true, longitude: true, startTime: true, endTime: true,
  visibility: true, capacity: true, organizerId: true, isPaid: true,
  engagementScore: true, createdAt: true, updatedAt: true,
} as const;

export const eventsRepository = {
  async findNearby(lat: number, lng: number, radius: number): Promise<EventRow[]> {
    const rows = await prisma.$queryRaw<EventRow[]>`
      SELECT
        "id", "title", "description", "bannerUrl", "badgeIcon",
        "latitude", "longitude", "startTime", "endTime",
        "visibility", "capacity", "organizerId", "isPaid", "engagementScore"
      FROM "Event"
      WHERE "visibility" = 'PUBLIC'
        AND "endTime" >= NOW()
        AND ("deletedAt" IS NULL)
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radius}
        )
      ORDER BY "engagementScore" DESC
      LIMIT 200
    `;
    return sanitizeEventMediaList(rows);
  },

  async findById(id: string): Promise<EventRow | null> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        select: {
          ...SAFE_SELECT,
          paymentQrUrl: true, shareToken: true,
          eventType: true, onlineLink: true, linkShareMode: true,
        },
      });
      return event ? sanitizeEventMedia(event as EventRow) : null;
    } catch {
      try {
        const event = await prisma.event.findUnique({
          where: { id },
          select: { ...SAFE_SELECT, paymentQrUrl: true },
        });
        return event
          ? sanitizeEventMedia({ ...event, shareToken: null, eventType: null, onlineLink: null, linkShareMode: null })
          : null;
      } catch {
        const event = await prisma.event.findUnique({ where: { id }, select: SAFE_SELECT });
        return event
          ? sanitizeEventMedia({ ...event, paymentQrUrl: null, shareToken: null, eventType: null, onlineLink: null, linkShareMode: null })
          : null;
      }
    }
  },

  async findOwnership(id: string): Promise<{ id: string; organizerId: string } | null> {
    return prisma.event.findUnique({ where: { id }, select: { id: true, organizerId: true } });
  },

  async findForRsvp(id: string): Promise<EventForRsvp | null> {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        select: {
          id: true, title: true, capacity: true, visibility: true,
          organizerId: true, isPaid: true, ticketPrice: true, startTime: true,
          organizer: { select: { name: true } },
        },
      });
      if (!event) return null;
      return { ...event, ticketPrice: event.ticketPrice ?? null, organizerName: event.organizer?.name ?? null };
    } catch {
      const base = await prisma.event.findUnique({
        where: { id },
        select: { id: true, title: true, capacity: true, visibility: true, organizerId: true, isPaid: true, startTime: true },
      });
      return base ? { ...base, ticketPrice: null, organizerName: null } : null;
    }
  },

  async create(input: CreateEventInput): Promise<EventRow> {
    const eventId = randomUUID();
    let inserted: EventRow[];

    try {
      inserted = await prisma.$queryRaw<EventRow[]>`
        INSERT INTO "Event" (
          "id", "title", "description", "bannerUrl", "badgeIcon",
          "latitude", "longitude", "location",
          "startTime", "endTime", "visibility", "capacity",
          "organizerId", "isPaid", "engagementScore",
          "eventType", "onlineLink", "linkShareMode", "paymentQrUrl", "address",
          "createdAt", "updatedAt"
        ) VALUES (
          ${eventId}, ${input.title}, ${input.description}, ${input.bannerUrl}, ${input.badgeIcon},
          ${input.latitude}, ${input.longitude},
          ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
          ${input.startTime}, ${input.endTime},
          ${input.visibility}::"Visibility", ${input.capacity},
          ${input.organizerId}, ${input.isPaid}, 0,
          ${input.eventType}::"EventType",
          ${input.onlineLink ?? null}, ${input.linkShareMode ?? null}::"LinkShareMode",
          ${input.paymentQrUrl ?? null}, ${input.address ?? null},
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING "id", "title", "description", "bannerUrl", "badgeIcon", "latitude", "longitude",
                  "startTime", "endTime", "visibility", "capacity", "organizerId", "isPaid",
                  "engagementScore", "eventType", "onlineLink", "linkShareMode", "paymentQrUrl",
                  "address", "createdAt", "updatedAt"
      `;
    } catch (fullErr: unknown) {
      const msg = fullErr instanceof Error ? fullErr.message : String(fullErr);
      const code = (fullErr as Record<string, unknown>)?.code;
      if (code === '42703' || /column.*does not exist/i.test(msg)) {
        logger.warn('Newer columns missing — falling back to base insert. Run prisma migrate deploy.');
        inserted = await prisma.$queryRaw<EventRow[]>`
          INSERT INTO "Event" (
            "id", "title", "description", "bannerUrl", "badgeIcon",
            "latitude", "longitude", "location",
            "startTime", "endTime", "visibility", "capacity",
            "organizerId", "isPaid", "engagementScore",
            "createdAt", "updatedAt"
          ) VALUES (
            ${eventId}, ${input.title}, ${input.description}, ${input.bannerUrl}, ${input.badgeIcon},
            ${input.latitude}, ${input.longitude},
            ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography,
            ${input.startTime}, ${input.endTime},
            ${input.visibility}::"Visibility", ${input.capacity},
            ${input.organizerId}, ${input.isPaid}, 0,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING "id", "title", "description", "bannerUrl", "badgeIcon", "latitude", "longitude",
                    "startTime", "endTime", "visibility", "capacity", "organizerId", "isPaid",
                    "engagementScore", "createdAt", "updatedAt"
        `;
      } else {
        throw fullErr;
      }
    }

    const event = inserted?.[0];
    if (!event) throw new Error('INSERT returned no rows');

    // Set optional fields that Prisma handles safely (handles null columns)
    if (input.paymentQrUrl || input.ticketPrice) {
      const updateData: Record<string, unknown> = {};
      if (input.paymentQrUrl) updateData.paymentQrUrl = input.paymentQrUrl;
      if (input.ticketPrice) updateData.ticketPrice = input.ticketPrice;
      try {
        await prisma.event.update({ where: { id: event.id }, data: updateData });
        if (input.paymentQrUrl) event.paymentQrUrl = input.paymentQrUrl;
        if (input.ticketPrice) event.ticketPrice = input.ticketPrice;
      } catch (err) {
        logger.warn('Failed to set paymentQrUrl/ticketPrice', { eventId: event.id, error: String(err) });
      }
    }

    return event;
  },

  async update(id: string, data: UpdateEventInput): Promise<EventRow> {
    const updated = await prisma.event.update({ where: { id }, data });
    return updated as unknown as EventRow;
  },

  async delete(id: string): Promise<void> {
    // Soft delete: preserve the record for audit trail and payment FK integrity
    await prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async findByOrganizer(organizerId: string): Promise<OrganizerEventSummary[]> {
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
        latitude: true, longitude: true, startTime: true, endTime: true,
        visibility: true, capacity: true, organizerId: true,
        isPaid: true, engagementScore: true,
        _count: { select: { rsvps: true } },
      },
    });
    return events.map((e) => ({
      ...e,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      rsvpCount: e._count.rsvps,
    }));
  },

  // Upcoming/past split — used by /api/users/my-events
  async findByOrganizerSplit(organizerId: string): Promise<OrganizerEventSummary[]> {
    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { startTime: 'desc' },
      select: {
        id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
        startTime: true, endTime: true, visibility: true, capacity: true,
        isPaid: true, engagementScore: true, organizerId: true,
        latitude: true, longitude: true,
        _count: { select: { rsvps: true } },
      },
    });
    return sanitizeEventMediaList(
      events.map((e) => ({
        ...e,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        rsvpCount: e._count.rsvps,
      })),
    );
  },

  async createRsvp(params: { eventId: string; userId: string; capacity: number }): Promise<RsvpRecord> {
    const { eventId, userId, capacity } = params;
    const rsvpId = randomUUID();

    return prisma.$transaction(async (tx) => {
      // Row-level lock on Event prevents concurrent over-capacity inserts
      await tx.$executeRaw`SELECT 1 FROM "Event" WHERE "id" = ${eventId} FOR UPDATE`;
      const count = await tx.rSVP.count({ where: { eventId } });
      if (count >= capacity) {
        throw Object.assign(new Error('Event full'), { code: 'EVENT_FULL' });
      }

      const rows = await tx.$queryRaw<Array<{ id: string; ticketId: string }>>`
        INSERT INTO "RSVP" ("id", "userId", "eventId", "createdAt")
        VALUES (${rsvpId}, ${userId}, ${eventId}, NOW())
        ON CONFLICT ("userId", "eventId") DO NOTHING
        RETURNING "id", "ticketId"
      `;

      if (!rows?.length) {
        throw Object.assign(new Error('Already RSVPed'), { code: 'ALREADY_RSVPED' });
      }
      return rows[0];
    });
  },

  async createShare(eventId: string, userId: string): Promise<void> {
    await prisma.share.create({ data: { eventId, userId } });
  },

  async upsertShareToken(id: string, existingToken: string | null): Promise<string> {
    const token = existingToken ?? randomUUID();
    if (!existingToken) {
      await prisma.event.update({ where: { id }, data: { shareToken: token } });
    }
    return token;
  },

  async deleteExpired(cutoff: Date): Promise<number> {
    const { count } = await prisma.event.deleteMany({ where: { endTime: { lt: cutoff } } });
    return count;
  },

  // Used by admin routes
  async adminUpdate(id: string, data: UpdateEventInput): Promise<EventRow> {
    const updated = await prisma.event.update({ where: { id }, data });
    return updated as unknown as EventRow;
  },

  async adminDelete(id: string): Promise<void> {
    // Admin hard delete: purge all related data permanently
    await prisma.$transaction([
      prisma.reminderLog.deleteMany({ where: { eventId: id } }),
      prisma.attendance.deleteMany({ where: { eventId: id } }),
      prisma.share.deleteMany({ where: { eventId: id } }),
      prisma.like.deleteMany({ where: { eventId: id } }),
      prisma.rSVP.deleteMany({ where: { eventId: id } }),
      prisma.payment.updateMany({ where: { eventId: id }, data: { eventId: null } }),
      prisma.event.delete({ where: { id } }),
    ]);
  },
};

// Re-export Prisma error class for use in service error handling
export { Prisma };
