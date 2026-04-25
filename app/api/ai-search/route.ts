import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAIClient, getPineconeIndex, isOpenAIConfigured, isPineconeConfigured } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sanitizeEventMediaList } from '@/lib/media';

const schema = z.object({
  query: z.string().min(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().positive().default(5000)
});

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const rateLimitKey = session?.user?.id
    ? `ai-search:user:${session.user.id}`
    : `ai-search:ip:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}`;

  if (!(await rateLimit(rateLimitKey, 30))) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

  const { query, latitude, longitude, radius } = parsed.data;

  if (!isOpenAIConfigured() || !isPineconeConfigured()) {
    return NextResponse.json({ error: 'AI search is not configured' }, { status: 503 });
  }

  let embedding;
  try {
    const openai = getOpenAIClient();
    embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query
    });
  } catch (err) {
    console.error('OpenAI embedding failure', err);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }

  let results;
  try {
    const index = getPineconeIndex();
    results = await index.query({
      vector: embedding.data[0].embedding,
      topK: 50,
      includeMetadata: true
    });
  } catch (err) {
    console.error('Pinecone query failure', err);
    return NextResponse.json({ error: 'AI search unavailable' }, { status: 503 });
  }

  const scoreMap = new Map(results.matches.map((m) => [m.id, m.score ?? 0]));
  const ids = results.matches.map((m) => m.id);
  let events;
  try {
    events = await prisma.event.findMany({
      where: { id: { in: ids }, visibility: 'PUBLIC' },
      select: {
        id: true, title: true, description: true, bannerUrl: true, badgeIcon: true,
        latitude: true, longitude: true, startTime: true, endTime: true,
        visibility: true, capacity: true, organizerId: true, isPaid: true,
        ticketPrice: true, engagementScore: true, eventType: true,
      }
    });
  } catch (err) {
    console.error('AI search DB query failed:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const filtered = events.filter((event) =>
    distanceMeters(latitude, longitude, event.latitude, event.longitude) <= radius
  );

  const ranked = filtered.sort((a, b) => {
    const scoreA = (scoreMap.get(a.id) ?? 0) * 0.7 + (a.engagementScore / 100) * 0.3;
    const scoreB = (scoreMap.get(b.id) ?? 0) * 0.7 + (b.engagementScore / 100) * 0.3;
    return scoreB - scoreA;
  });

  return NextResponse.json({ events: sanitizeEventMediaList(ranked) });
}
