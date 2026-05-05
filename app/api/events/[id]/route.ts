import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabaseErrorDetails } from '@/lib/database-errors';
import { z } from 'zod';
import { eventsService } from '@/src/modules/events/events.service';
import { handleError } from '@/src/core/response';

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get('token');
  const session = await getServerSession(authOptions);

  try {
    const event = await eventsService.getById(id, {
      token,
      userId: session?.user?.id ?? null,
      role: session?.user?.role ?? null,
    });
    return NextResponse.json({ event });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  try {
    const event = await eventsService.update(id, parsed.data, session.user.id, session.user.role ?? 'USER');
    return NextResponse.json({ event });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await eventsService.delete(id, session.user.id, session.user.role ?? 'USER');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
