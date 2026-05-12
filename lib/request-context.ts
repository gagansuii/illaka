import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withRequestId } from '@/src/core/logger';

/**
 * Wraps a Next.js route handler to inject a request-scoped correlation ID.
 * The ID is echoed back in X-Request-Id response header for client-side tracing.
 */
export function withContext<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    const requestId = randomUUID();
    return withRequestId(requestId, () => handler(...args));
  };
}

/**
 * Adds X-Request-Id to every response at the middleware layer.
 * Call this from proxy.ts after auth checks.
 */
export function attachRequestId(req: NextRequest, res: NextResponse): NextResponse {
  const id = req.headers.get('x-request-id') ?? randomUUID();
  res.headers.set('x-request-id', id);
  return res;
}
