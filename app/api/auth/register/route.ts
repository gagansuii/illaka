import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabaseErrorDetails } from '@/lib/database-errors';
import { authService } from '@/src/modules/auth/auth.service';
import { handleError } from '@/src/core/response';

const schema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  try {
    const { id } = await authService.register(parsed.data.name, parsed.data.email, parsed.data.password, ip);
    return NextResponse.json({ id });
  } catch (err) {
    // DB-specific errors get a friendlier message
    const details = getDatabaseErrorDetails(err);
    if (details.status !== 500) {
      return NextResponse.json({ error: details.message }, { status: details.status });
    }
    return handleError(err);
  }
}
