import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/authenticate-api-key';
import { eventsService } from '@/src/modules/events/events.service';
import { handleError } from '@/src/core/response';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? await authenticateApiKey(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const events = await eventsService.listByOrganizer(userId);
    return NextResponse.json({ events });
  } catch (err) {
    return handleError(err);
  }
}
