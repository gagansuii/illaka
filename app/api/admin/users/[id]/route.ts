import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

const roleSchema = z.object({ role: z.enum(['USER', 'ORGANIZER', 'ADMIN']) });

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'role must be USER, ORGANIZER, or ADMIN' }, { status: 400 });

  try {
    const user = await prisma.user.update({ where: { id }, data: { role: parsed.data.role } });
    return NextResponse.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.user.delete({ where: { id } });
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
