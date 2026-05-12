import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateApiKey } from '@/lib/authenticate-api-key';
import { eventsService } from '@/src/modules/events/events.service';
import { handleError } from '@/src/core/response';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? await authenticateApiKey(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { rsvpId } = await eventsService.rsvp(id, userId);
    return NextResponse.json({ ok: true, rsvpId });
  } catch (err) {
    return handleError(err);
  }
}
