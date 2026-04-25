import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabaseErrorDetails } from '@/lib/database-errors';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [members, totalMembers] = await Promise.all([
      prisma.user.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          latitude: true,
          longitude: true,
          radiusPreference: true,
          subscriptionType: true,
          createdAt: true
        }
      }),
      prisma.user.count()
    ]);

    return NextResponse.json({ members, totalMembers });
  } catch (err) {
    console.error('Members lookup failed:', err);
    const details = getDatabaseErrorDetails(err);
    return NextResponse.json({ error: details.message }, { status: details.status });
  }
}
