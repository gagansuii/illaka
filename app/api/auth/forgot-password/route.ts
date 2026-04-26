import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sendPasswordResetEmail } from '@/lib/mailer';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!(await rateLimit(`forgot-password:${ip}`, 5))) {
    return NextResponse.json({ ok: true }); // silently throttle to avoid timing leaks
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to avoid user enumeration
  if (!user) return NextResponse.json({ ok: true });

  // Expire any existing unused tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true }
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt }
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error('[forgot-password] Failed to send reset email:', err);
  }

  return NextResponse.json({ ok: true });
}
