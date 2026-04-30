import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clearEventsCache } from '@/lib/events-cache';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.$transaction([
      prisma.reminderLog.deleteMany({ where: { eventId: id } }),
      prisma.attendance.deleteMany({ where: { eventId: id } }),
      prisma.share.deleteMany({ where: { eventId: id } }),
      prisma.like.deleteMany({ where: { eventId: id } }),
      prisma.rSVP.deleteMany({ where: { eventId: id } }),
      prisma.payment.updateMany({ where: { eventId: id }, data: { eventId: null } }),
      prisma.event.delete({ where: { id } }),
    ]);
    clearEventsCache();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw error;
  }
  return NextResponse.json({ ok: true });
}

// Keep POST for backwards compatibility
export async function POST(req: Request, ctx: RouteContext) {
  return DELETE(req, ctx);
}
