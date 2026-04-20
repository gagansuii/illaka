-- Add unique ticketId to RSVP for ticket generation (idempotent)
ALTER TABLE "RSVP" ADD COLUMN IF NOT EXISTS "ticketId" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'RSVP_ticketId_key' AND table_name = 'RSVP'
  ) THEN
    ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_ticketId_key" UNIQUE ("ticketId");
  END IF;
END $$;

-- Add optional payment QR code URL to Event for organizer payment QR uploads (idempotent)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "paymentQrUrl" TEXT;
