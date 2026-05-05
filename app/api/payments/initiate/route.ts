import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { paymentsService } from '@/src/modules/payments/payments.service';
import { handleError } from '@/src/core/response';

const schema = z.object({
  reason: z.enum(['subscription', 'hosting_fee', 'promotion']),
  currency: z.string().default('INR'),
  eventId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  try {
    const result = await paymentsService.initiatePayment({
      ...parsed.data,
      userId: session.user.id,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}
