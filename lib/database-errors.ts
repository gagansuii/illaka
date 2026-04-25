type DatabaseErrorDetails = {
  message: string;
  status: number;
};

const INVALID_CREDENTIALS = 'Authentication failed against database server';
const DATABASE_UNREACHABLE = "Can't reach database server";
const POSTGIS_MISSING = 'type "geography" does not exist';

export function getDatabaseErrorDetails(
  error: unknown,
  fallbackMessage = 'Database error'
): DatabaseErrorDetails {
  const message = error instanceof Error ? error.message : '';
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;

  if (code === 'P1000' || message.includes(INVALID_CREDENTIALS)) {
    if (process.env.DATABASE_URL?.includes('YOUR_PASSWORD')) {
      return {
        message:
          'Database credentials are invalid because DATABASE_URL in .env still contains the placeholder YOUR_PASSWORD. Replace it with your real PostgreSQL password and restart the dev server.',
        status: 503
      };
    }

    return {
      message:
        'Database credentials are invalid. Update DATABASE_URL in .env with the correct PostgreSQL username and password, then restart the dev server.',
      status: 503
    };
  }

  if (code === 'P1001' || message.includes(DATABASE_UNREACHABLE)) {
    return {
      message: 'PostgreSQL is not reachable on localhost:5432. Start the database server and try again.',
      status: 503
    };
  }

  if (code === 'P1003' || message.includes('does not exist on the database server')) {
    return {
      message:
        'The configured PostgreSQL database does not exist yet. Create ilaka_events and ilaka_shadow, then rerun Prisma migrations.',
      status: 503
    };
  }

  if (code === 'P2021' || message.includes('does not exist in the current database')) {
    return {
      message: 'Database tables are missing. Run `npx.cmd prisma migrate dev --name init` and try again.',
      status: 503
    };
  }

  if (message.includes(POSTGIS_MISSING) || message.includes('extension "postgis"')) {
    return {
      message: 'PostGIS is not enabled for ilaka_events. Run `CREATE EXTENSION IF NOT EXISTS postgis;` and try again.',
      status: 503
    };
  }

  return {
    message: fallbackMessage,
    status: 500
  };
}
