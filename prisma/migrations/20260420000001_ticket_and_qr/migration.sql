-- Add unique ticketId to RSVP for ticket generation
ALTER TABLE "RSVP" ADD COLUMN "ticketId" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE "RSVP" ADD CONSTRAINT "RSVP_ticketId_key" UNIQUE ("ticketId");

-- Add optional payment QR code URL to Event for organizer payment QR uploads
ALTER TABLE "Event" ADD COLUMN "paymentQrUrl" TEXT;
