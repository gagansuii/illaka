import { NextResponse } from 'next/server';
import { logger } from '@/src/core/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      message?: string;
      digest?: string;
      stack?: string;
      url?: string;
      ts?: string;
    };

    logger.error('Client-side error reported', {
      message: body.message,
      digest: body.digest,
      url: body.url,
      ts: body.ts,
    });
  } catch {
    // Malformed payload — log nothing, still return 204
  }

  return new NextResponse(null, { status: 204 });
}
