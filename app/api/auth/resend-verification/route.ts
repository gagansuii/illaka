import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authService } from '@/src/modules/auth/auth.service';
import { handleError } from '@/src/core/response';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, message: 'Already verified' });

  try {
    await authService.sendVerificationEmail(session.user.id, user.email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
