import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabaseErrorDetails } from '@/lib/database-errors';
import { z } from 'zod';
import { eventsService } from '@/src/modules/events/events.service';
import { ServiceError } from '@/src/core/errors';
import { handleError } from '@/src/core/response';

const createSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().min(10).max(5000).trim(),
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
  address: z.string().max(300).trim().optional(),
  eventType: z.enum(['PHYSICAL', 'ONLINE']).optional(),
  onlineLink: z.string().url().optional().or(z.literal('')),
  linkShareMode: z.enum(['IMMEDIATE', 'BEFORE_EVENT']).optional(),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: 'endTime must be after startTime',
  path: ['endTime'],
});

const normalizeDateTime = (dt: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt) ? dt + ':00' : dt;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const rawRadius = Number(searchParams.get('radius') ?? 5000);
  const radius = Number.isFinite(rawRadius) && rawRadius > 0 ? Math.max(rawRadius, 10_000) : 10_000;

  try {
    const { events } = await eventsService.listNearby({ lat, lng, radius });
    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof ServiceError && err.code === 'RATE_LIMIT') {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message, events: [] }, { status: details.status });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  const { startTime: rawStart, endTime: rawEnd, eventType, ...rest } = parsed.data;
  const startTime = new Date(normalizeDateTime(rawStart));
  const endTime = new Date(normalizeDateTime(rawEnd));

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return NextResponse.json({ error: 'Invalid date/time format. Please re-select start and end times.' }, { status: 400 });
  }

  try {
    const event = await eventsService.create(
      {
        ...rest,
        startTime,
        endTime,
        eventType: eventType ?? 'PHYSICAL',
        onlineLink: rest.onlineLink ?? null,
        linkShareMode: rest.linkShareMode ?? null,
        paymentQrUrl: rest.paymentQrUrl ?? null,
        address: rest.address ?? null,
      },
      session.user.id,
    );
    return NextResponse.json({ event });
  } catch (err) {
    return handleError(err);
  }
}
