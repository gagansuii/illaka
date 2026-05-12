import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/src/modules/auth/auth.service';
import { handleError } from '@/src/core/response';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  try {
    // Service handles rate limiting and user enumeration protection internally
    await authService.forgotPassword(parsed.data.email, ip);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
