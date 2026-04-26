import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearEventsCache } from '@/lib/events-cache';

// Vercel cron: runs daily at 1 AM IST (19:30 UTC previous day)
// Deletes events whose endTime was more than 30 days ago.
export async function GET(req: Request) {
  const secret = req.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  try {
    const { count } = await prisma.event.deleteMany({
      where: { endTime: { lt: cutoff } },
    });

    if (count > 0) clearEventsCache();

    return NextResponse.json({ deleted: count, cutoff: cutoff.toISOString() });
  } catch (err) {
    console.error('Event cleanup failed:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
