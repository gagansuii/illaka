import { NextResponse } from 'next/server';
import { ServiceError } from './errors';
import { logger } from './logger';

export function handleError(err: unknown): NextResponse {
  if (err instanceof ServiceError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  logger.error('Unhandled route error', { error: String(err) });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
