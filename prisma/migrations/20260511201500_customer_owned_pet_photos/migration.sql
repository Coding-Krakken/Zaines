-- AlterTable
ALTER TABLE "pet_photos"
ADD COLUMN "userId" TEXT;

-- Backfill existing photos to their booking owner
UPDATE "pet_photos" AS p
SET "userId" = b."userId"
FROM "bookings" AS b
WHERE p."bookingId" = b."id";

-- Enforce customer ownership after backfill
ALTER TABLE "pet_photos"
ALTER COLUMN "userId" SET NOT NULL;

-- Make booking optional for account-level photos
ALTER TABLE "pet_photos"
ALTER COLUMN "bookingId" DROP NOT NULL;

-- Update booking foreign key delete behavior for optional linkage
ALTER TABLE "pet_photos"
DROP CONSTRAINT "pet_photos_bookingId_fkey";

ALTER TABLE "pet_photos"
ADD CONSTRAINT "pet_photos_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "bookings"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Add user foreign key
ALTER TABLE "pet_photos"
ADD CONSTRAINT "pet_photos_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "pet_photos_userId_idx" ON "pet_photos"("userId");

-- CreateIndex
CREATE INDEX "pet_photos_userId_uploadedAt_idx" ON "pet_photos"("userId", "uploadedAt");
