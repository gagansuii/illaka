import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDatabaseErrorDetails } from '@/lib/database-errors';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { getOpenAIClient, getPineconeIndex, isOpenAIConfigured, isPineconeConfigured } from '@/lib/ai';
import { randomUUID } from 'crypto';
import { sanitizeEventMediaList } from '@/lib/media';
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

const createSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  bannerUrl: z.string().min(1),
  badgeIcon: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  capacity: z.number().int().min(1),
  isPaid: z.boolean(),
  ticketPrice: z.number().int().positive().optional(),
  paymentQrUrl: z.string().optional(),
  eventType: z.enum(['PHYSICAL', 'ONLINE']).optional(),
  onlineLink: z.string().url().optional().or(z.literal('')),
  linkShareMode: z.enum(['IMMEDIATE', 'BEFORE_EVENT']).optional()
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime']
});

const EVENT_CACHE_FRESH_MS = 15_000;
const EVENT_CACHE_STALE_MS = 60_000;

type EventRow = {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  badgeIcon: string;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  capacity: number;
  organizerId: string;
  isPaid: boolean;
  engagementScore: number;
};

type CacheEntry = {
  events: EventRow[];
  fetchedAt: number;
};

async function fetchEventsFromDb(lat: number, lng: number, radius: number) {
  const events = await prisma.$queryRaw<EventRow[]>`
    SELECT
      "id",
      "title",
      "description",
      "bannerUrl",
      "badgeIcon",
      "latitude",
      "longitude",
      "startTime",
      "endTime",
      "visibility",
      "capacity",
      "organizerId",
      "isPaid",
      "engagementScore"
    FROM "Event"
    WHERE "visibility" = 'PUBLIC'
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radius}
      )
    ORDER BY "engagementScore" DESC
    LIMIT 200
  `;
  return sanitizeEventMediaList(events);
}

function refreshEvents(cacheKey: string, lat: number, lng: number, radius: number) {
  const existing = getInFlightEventsRefresh(cacheKey) as Promise<EventRow[]> | undefined;
  if (existing) {
    return existing;
  }

  const refreshPromise = fetchEventsFromDb(lat, lng, radius)
    .then((events) => {
      setCachedEvents(cacheKey, events);
      return events;
    })
    .finally(() => {
      clearInFlightEventsRefresh(cacheKey);
    });

  setInFlightEventsRefresh(cacheKey, refreshPromise);
  return refreshPromise;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const rawRadius = Number(searchParams.get('radius') ?? 5000);
  // Use at least 10 km so newly created events are discoverable
  const radius = Number.isFinite(rawRadius) && rawRadius > 0 ? Math.max(rawRadius, 10_000) : 10_000;

  if (!(await rateLimit(`events:${normalizeCoord(lat)}:${normalizeCoord(lng)}`))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ events: [] });
  }

  const cacheKey = makeEventsCacheKey(lat, lng, radius);
  const now = Date.now();
  const cached = getCachedEvents(cacheKey) as CacheEntry | undefined;

  if (cached) {
    const age = now - cached.fetchedAt;
    if (age <= EVENT_CACHE_FRESH_MS) {
      return NextResponse.json({ events: cached.events });
    }
    if (age <= EVENT_CACHE_FRESH_MS + EVENT_CACHE_STALE_MS) {
      void refreshEvents(cacheKey, lat, lng, radius).catch((err) => {
        console.error('Background events refresh failed:', err);
      });
      return NextResponse.json({ events: cached.events });
    }
  }

  try {
    const events = await refreshEvents(cacheKey, lat, lng, radius);
    return NextResponse.json({ events });
  } catch (err) {
    if (cached) {
      return NextResponse.json({ events: cached.events });
    }
    console.error('Events query failed:', err);
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message, events: [] }, { status: details.status });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await rateLimit(`events:create:${session.user.id}`, 10))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });

  const data = parsed.data;
  const eventId = randomUUID();

  // datetime-local inputs omit seconds ("2026-04-20T10:30"); normalize to full ISO
  const normalizeDateTime = (dt: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt) ? dt + ':00' : dt;

  const startTime = new Date(normalizeDateTime(data.startTime));
  const endTime = new Date(normalizeDateTime(data.endTime));

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return NextResponse.json({ error: 'Invalid date/time format. Please re-select start and end times.' }, { status: 400 });
  }

  const eventType = data.eventType ?? 'PHYSICAL';
  const onlineLink = data.onlineLink ?? null;
  const linkShareMode = data.linkShareMode ?? null;

  let inserted: any;
  try {
    // Keep the raw SQL for the PostGIS geography column; paymentQrUrl is
    // updated separately below to avoid null-handling issues in raw queries.
    inserted = await prisma.$queryRaw<any>`
      INSERT INTO "Event" (
        "id",
        "title",
        "description",
        "bannerUrl",
        "badgeIcon",
        "latitude",
        "longitude",
        "location",
        "startTime",
        "endTime",
        "visibility",
        "capacity",
        "organizerId",
        "isPaid",
        "engagementScore",
        "eventType",
        "onlineLink",
        "linkShareMode",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${eventId},
        ${data.title},
        ${data.description},
        ${data.bannerUrl},
        ${data.badgeIcon},
        ${data.latitude},
        ${data.longitude},
        ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography,
        ${startTime},
        ${endTime},
        ${data.visibility}::"Visibility",
        ${data.capacity},
        ${session.user.id},
        ${data.isPaid},
        0,
        ${eventType}::"EventType",
        ${onlineLink},
        ${linkShareMode}::"LinkShareMode",
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      RETURNING "id", "title", "description", "bannerUrl", "badgeIcon", "latitude", "longitude", "startTime", "endTime", "visibility", "capacity", "organizerId", "isPaid", "engagementScore", "eventType", "onlineLink", "linkShareMode", "createdAt", "updatedAt"
    `;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('Event creation failed:', msg, err);
    return NextResponse.json({ error: `Event creation failed: ${msg}` }, { status: 500 });
  }

  const event = inserted[0];
  if (!event) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }

  // Set optional fields (paymentQrUrl, ticketPrice) via Prisma — handles null safely
  if (data.paymentQrUrl || data.ticketPrice) {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.paymentQrUrl) updateData.paymentQrUrl = data.paymentQrUrl;
      if (data.ticketPrice) updateData.ticketPrice = data.ticketPrice;
      await prisma.event.update({ where: { id: event.id }, data: updateData });
      if (data.paymentQrUrl) event.paymentQrUrl = data.paymentQrUrl;
      if (data.ticketPrice) event.ticketPrice = data.ticketPrice;
    } catch (err) {
      console.error('Failed to set paymentQrUrl/ticketPrice:', err);
    }
  }

  // Best-effort: index in Pinecone for AI search. Failure here does not roll back the event.
  try {
    if (isOpenAIConfigured() && isPineconeConfigured()) {
      const openai = getOpenAIClient();
      const embedding = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `${event.title} - ${event.description}`
      });

      const index = getPineconeIndex();
      await index.upsert([
        {
          id: event.id,
          values: embedding.data[0].embedding,
          metadata: {
            latitude: event.latitude,
            longitude: event.longitude
          }
        }
      ]);
    }
  } catch (err) {
    console.error('Pinecone indexing failed for event', event.id, err);
  }

  clearEventsCache();
  return NextResponse.json({ event });
}
