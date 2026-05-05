import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authService } from '@/src/modules/auth/auth.service';
import { handleError } from '@/src/core/response';

// Complexity parity with register — prevents setting a weaker password via reset flow
const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message
      ?? 'Password must be at least 8 characters and include uppercase, number, and special character';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
