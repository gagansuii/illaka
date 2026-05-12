import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { apiKeysService } from '@/src/modules/api-keys/api-keys.service';
import { handleError } from '@/src/core/response';
import { sendApiKeyEmail } from '@/lib/mailer';

const createSchema = z.object({
  name: z.string().min(1).max(50).trim(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await rateLimit(`api-keys:${session.user.id}`, 30))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const keys = await apiKeysService.list(session.user.id);
    return NextResponse.json({ keys });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await rateLimit(`api-keys:${session.user.id}`, 30))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid payload' }, { status: 400 });
  }

  try {
    const result = await apiKeysService.create({ userId: session.user.id, name: parsed.data.name });
    void sendApiKeyEmail(session.user.email as string, result.key.slice(0, 8));
    return NextResponse.json(
      { id: result.id, key: result.key, name: result.name, createdAt: result.createdAt },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}
