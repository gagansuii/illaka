import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { usersService } from '@/src/modules/users/users.service';
import { handleError } from '@/src/core/response';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { members, total } = await usersService.listMembers();
    return NextResponse.json({ members, totalMembers: total });
  } catch (err) {
    return handleError(err);
  }
}
