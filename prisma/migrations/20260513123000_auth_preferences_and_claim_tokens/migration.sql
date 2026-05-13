-- AlterTable
ALTER TABLE "users"
ADD COLUMN "bookingStatusEmailsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "productUpdatesEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketingEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "booking_claim_tokens" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "claimedAt" TIMESTAMP(3),
  "claimedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "booking_claim_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_claim_tokens_token_key" ON "booking_claim_tokens"("token");

-- CreateIndex
CREATE INDEX "booking_claim_tokens_bookingId_idx" ON "booking_claim_tokens"("bookingId");

-- CreateIndex
CREATE INDEX "booking_claim_tokens_email_idx" ON "booking_claim_tokens"("email");

-- CreateIndex
CREATE INDEX "booking_claim_tokens_expiresAt_idx" ON "booking_claim_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "booking_claim_tokens"
ADD CONSTRAINT "booking_claim_tokens_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_claim_tokens"
ADD CONSTRAINT "booking_claim_tokens_claimedByUserId_fkey"
FOREIGN KEY ("claimedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
