import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventsService } from '@/src/modules/events/events.service';
import { handleError } from '@/src/core/response';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const events = await eventsService.listByOrganizer(session.user.id);
    return NextResponse.json({ events });
  } catch (err) {
    return handleError(err);
  }
}
