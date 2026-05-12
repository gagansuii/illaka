import { AsyncLocalStorage } from 'async_hooks';

const isProd = process.env.NODE_ENV === 'production';

type Level = 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

// Request-scoped context (populated per-request via withRequestId)
const requestStorage = new AsyncLocalStorage<{ requestId: string }>();

export function withRequestId<T>(requestId: string, fn: () => T): T {
  return requestStorage.run({ requestId }, fn);
}

export function getRequestId(): string | undefined {
  return requestStorage.getStore()?.requestId;
}

function write(level: Level, msg: string, meta?: Meta): void {
  const reqId = getRequestId();
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(reqId ? { requestId: reqId } : {}),
    ...meta,
  };

  if (isProd) {
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${level.toUpperCase()}] ${msg}`, meta ?? '');
  }
}

export const logger = {
  info: (msg: string, meta?: Meta) => write('info', msg, meta),
  warn: (msg: string, meta?: Meta) => write('warn', msg, meta),
  error: (msg: string, meta?: Meta) => write('error', msg, meta),
};
