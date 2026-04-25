import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getDatabaseErrorDetails } from '@/lib/database-errors';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await rateLimit(`register:${ip}`, 5))) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  let existing;
  try {
    existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  } catch (err) {
    console.error('Register lookup failed:', err);
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message }, { status: details.status });
  }
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const password = await bcrypt.hash(parsed.data.password, 10);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: normalizedEmail,
        password
      }
    });
  } catch (err) {
    console.error('User creation failed:', err);
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message }, { status: details.status });
  }

  return NextResponse.json({ id: user.id });
}
