const isProd = process.env.NODE_ENV === 'production';

type Level = 'info' | 'warn' | 'error';
type Meta = Record<string, unknown>;

function write(level: Level, msg: string, meta?: Meta): void {
  if (isProd) {
    process.stdout.write(
      JSON.stringify({ level, msg, ts: new Date().toISOString(), ...meta }) + '\n',
    );
  } else {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${level.toUpperCase()}] ${msg}`, meta ? meta : '');
  }
}

export const logger = {
  info: (msg: string, meta?: Meta) => write('info', msg, meta),
  warn: (msg: string, meta?: Meta) => write('warn', msg, meta),
  error: (msg: string, meta?: Meta) => write('error', msg, meta),
};
