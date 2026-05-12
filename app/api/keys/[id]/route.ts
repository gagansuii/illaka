import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiKeysService } from '@/src/modules/api-keys/api-keys.service';
import { handleError } from '@/src/core/response';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await apiKeysService.revoke(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
