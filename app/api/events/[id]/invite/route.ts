import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';

type RouteContext = { params: Promise<{ id: string }> };

// POST — generate (or return existing) invite token for a private event
export async function POST(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let event;
  try {
    event = await prisma.event.findUnique({ where: { id } });
  } catch (err) {
    console.error('Event fetch failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (event.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = event.shareToken ?? randomUUID();
  if (!event.shareToken) {
    await prisma.event.update({ where: { id }, data: { shareToken: token } });
  }

  return NextResponse.json({ token });
}
