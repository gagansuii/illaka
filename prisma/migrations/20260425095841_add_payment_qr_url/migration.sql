/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PHYSICAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "LinkShareMode" AS ENUM ('IMMEDIATE', 'BEFORE_EVENT');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "eventType" "EventType" DEFAULT 'PHYSICAL',
ADD COLUMN     "linkShareMode" "LinkShareMode",
ADD COLUMN     "onlineLink" TEXT,
ADD COLUMN     "paymentQrUrl" TEXT,
ADD COLUMN     "shareToken" TEXT;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_eventId_userId_type_key" ON "ReminderLog"("eventId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Event_shareToken_key" ON "Event"("shareToken");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
