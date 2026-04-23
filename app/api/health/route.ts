import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Health endpoint is internal-only. Callers must supply the same CRON_SECRET
// used by the scheduler, or a dedicated HEALTH_SECRET env var. This prevents
// unauthenticated reconnaissance of database connectivity status.
function isAuthorized(req: NextRequest): boolean {
  const token =
    process.env.HEALTH_SECRET ??
    process.env.CRON_SECRET;

  if (!token) {
    // No secret configured — allow only in development to keep local dev easy.
    return process.env.NODE_ENV !== 'production';
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;

  const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch {
    return NextResponse.json({ ok: false, db: 'unreachable' }, { status: 503 });
  }
}
