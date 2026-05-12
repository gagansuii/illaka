import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getEnvOptional } from '@/lib/config';
import { processReminders } from '@/src/workers/reminder.worker';

function verifyCronSecret(req: NextRequest, secret: string): boolean {
  const auth = req.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (provided.length !== secret.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = getEnvOptional('CRON_SECRET');
  if (!cronSecret) {
    return NextResponse.json({ error: 'Endpoint not configured' }, { status: 503 });
  }
  if (!verifyCronSecret(req, cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/reminders] failed:', err);
    return NextResponse.json({ error: 'Reminder processing failed' }, { status: 500 });
  }
}
