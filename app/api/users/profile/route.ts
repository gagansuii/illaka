import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Strip HTML tags from name before storage — names are rendered into the DOM
// in several places and a stored XSS payload would fire for every viewer.
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '').trim();
}

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  radiusPreference: z.number().optional()
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const updateData: { name?: string; radiusPreference?: number } = {};
  if (parsed.data.name !== undefined) updateData.name = stripHtml(parsed.data.name);
  if (parsed.data.radiusPreference !== undefined) updateData.radiusPreference = parsed.data.radiusPreference;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    });
  } catch (err) {
    console.error('Profile update failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
