// Runs once when the Next.js server starts (not per-request).
// Applies any pending schema changes using the existing pooler connection
// so we never need `prisma migrate deploy` to succeed during Vercel build.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { prisma } = await import('@/lib/prisma');

  const run = (sql: string) =>
    prisma.$executeRawUnsafe(sql).catch(() => null);

  try {
    // ── Enums ──────────────────────────────────────────────────────────────
    await run(`CREATE TYPE "EventType" AS ENUM ('PHYSICAL', 'ONLINE')`);
    await run(`CREATE TYPE "LinkShareMode" AS ENUM ('IMMEDIATE', 'BEFORE_EVENT')`);
    await run(`CREATE TYPE "PaymentStatus" AS ENUM ('created', 'authorized', 'captured', 'refunded', 'failed')`);
    await run(`CREATE TYPE "PaymentReason" AS ENUM ('subscription', 'hosting_fee', 'promotion')`);

    // ── Payment column upgrades (TEXT → ENUM; safe via explicit USING cast) ─
    await run(`
      ALTER TABLE "Payment"
        ALTER COLUMN "status" TYPE "PaymentStatus"
        USING COALESCE("status"::"PaymentStatus", 'created'::"PaymentStatus")
    `);
    await run(`
      ALTER TABLE "Payment"
        ALTER COLUMN "reason" TYPE "PaymentReason"
        USING "reason"::"PaymentReason"
    `);

    // ── Event columns ──────────────────────────────────────────────────────
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "ticketPrice"   INTEGER`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "paymentQrUrl"  TEXT`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "address"       TEXT`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "shareToken"    TEXT`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "eventType"     "EventType" DEFAULT 'PHYSICAL'`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "onlineLink"    TEXT`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "linkShareMode" "LinkShareMode"`);

    // ── RSVP columns ───────────────────────────────────────────────────────
    await run(`ALTER TABLE "RSVP" ADD COLUMN IF NOT EXISTS "ticketId" TEXT NOT NULL DEFAULT gen_random_uuid()::text`);

    // ── User columns ──────────────────────────────────────────────────────
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false`);

    // ── Event soft-delete column ───────────────────────────────────────────
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)`);

    // ── Composite indexes for feed and dashboard queries ───────────────────
    await run(`CREATE INDEX IF NOT EXISTS "Event_visibility_startTime_idx"   ON "Event"("visibility", "startTime")`);
    await run(`CREATE INDEX IF NOT EXISTS "Event_visibility_endTime_idx"     ON "Event"("visibility", "endTime")`);
    await run(`CREATE INDEX IF NOT EXISTS "Event_organizerId_startTime_idx"  ON "Event"("organizerId", "startTime")`);
    await run(`CREATE INDEX IF NOT EXISTS "Payment_userId_status_idx"        ON "Payment"("userId", "status")`);
    await run(`CREATE INDEX IF NOT EXISTS "ReminderLog_eventId_idx"          ON "ReminderLog"("eventId")`);
    await run(`CREATE INDEX IF NOT EXISTS "ReminderLog_userId_idx"           ON "ReminderLog"("userId")`);

    // ── Unique indexes ─────────────────────────────────────────────────────
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "Event_shareToken_key" ON "Event"("shareToken")`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "RSVP_ticketId_key"    ON "RSVP"("ticketId")`);

    // ── EmailVerificationToken ─────────────────────────────────────────────
    await run(`
      CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
        "id"        TEXT         NOT NULL,
        "userId"    TEXT         NOT NULL,
        "token"     TEXT         NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "used"      BOOLEAN      NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
      )
    `);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token")`);
    await run(`CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`);
    await run(`
      ALTER TABLE "EmailVerificationToken"
        ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    // ── PasswordResetToken ─────────────────────────────────────────────────
    await run(`
      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
        "id"        TEXT        NOT NULL,
        "userId"    TEXT        NOT NULL,
        "token"     TEXT        NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "used"      BOOLEAN     NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
      )
    `);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token")`);
    await run(`CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`);
    await run(`
      ALTER TABLE "PasswordResetToken"
        ADD CONSTRAINT "PasswordResetToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    // ── ReminderLog ────────────────────────────────────────────────────────
    await run(`
      CREATE TABLE IF NOT EXISTS "ReminderLog" (
        "id"      TEXT        NOT NULL,
        "eventId" TEXT        NOT NULL,
        "userId"  TEXT        NOT NULL,
        "type"    TEXT        NOT NULL,
        "sentAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
      )
    `);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "ReminderLog_eventId_userId_type_key" ON "ReminderLog"("eventId", "userId", "type")`);
    await run(`
      ALTER TABLE "ReminderLog"
        ADD CONSTRAINT "ReminderLog_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "Event"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await run(`
      ALTER TABLE "ReminderLog"
        ADD CONSTRAINT "ReminderLog_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);

    // ── ApiKey ─────────────────────────────────────────────────────────────
    await run(`
      CREATE TABLE IF NOT EXISTS "ApiKey" (
        "id"         TEXT         NOT NULL,
        "userId"     TEXT         NOT NULL,
        "name"       TEXT         NOT NULL,
        "keyHash"    TEXT         NOT NULL,
        "prefix"     TEXT         NOT NULL,
        "lastUsedAt" TIMESTAMP(3),
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
      )
    `);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash")`);
    await run(`CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId")`);
    await run(`
      ALTER TABLE "ApiKey"
        ADD CONSTRAINT "ApiKey_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);

    console.log('[schema-sync] done');
  } catch (e) {
    console.error('[schema-sync] unexpected error:', e);
  }
}
