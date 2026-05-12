import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/authenticate-api-key';
import { z } from 'zod';
import { usersService } from '@/src/modules/users/users.service';
import { handleError } from '@/src/core/response';

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  radiusPreference: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? await authenticateApiKey(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  try {
    await usersService.updateProfile(userId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
