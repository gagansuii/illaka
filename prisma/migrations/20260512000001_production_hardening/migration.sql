-- Production hardening migration
-- Adds: PaymentStatus/PaymentReason enums, soft-delete on Event,
--       composite index on (visibility, startTime)

-- ── Payment ENUMs ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('created', 'authorized', 'captured', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentReason" AS ENUM ('subscription', 'hosting_fee', 'promotion');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Convert Payment.status from TEXT to enum (safe: only known values exist)
ALTER TABLE "Payment"
  ALTER COLUMN "status" TYPE "PaymentStatus"
  USING COALESCE("status"::"PaymentStatus", 'created'::"PaymentStatus");

ALTER TABLE "Payment"
  ALTER COLUMN "status" SET DEFAULT 'created'::"PaymentStatus";

-- Convert Payment.reason from TEXT to enum
ALTER TABLE "Payment"
  ALTER COLUMN "reason" TYPE "PaymentReason"
  USING "reason"::"PaymentReason";

-- ── Event: soft delete ────────────────────────────────────────────────────────

ALTER TABLE "Event"
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "Event_visibility_startTime_idx"
  ON "Event"("visibility", "startTime");

CREATE INDEX IF NOT EXISTS "Event_deletedAt_idx"
  ON "Event"("deletedAt");
