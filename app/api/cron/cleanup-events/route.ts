import { NextResponse } from 'next/server';
import { processCleanup } from '@/src/workers/cleanup.worker';

export async function GET(req: Request): Promise<NextResponse> {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processCleanup();
    return NextResponse.json(result);
  } catch (err) {
    console.error('[cron/cleanup-events] failed:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
