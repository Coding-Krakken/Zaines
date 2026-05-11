-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "revenueRecognitionMethod" TEXT,
ADD COLUMN "recognitionStatus" TEXT,
ADD COLUMN "servicePeriodStart" TIMESTAMP(3),
ADD COLUMN "servicePeriodEnd" TIMESTAMP(3),
ADD COLUMN "deferredRevenueAmount" DOUBLE PRECISION,
ADD COLUMN "recognizedRevenueAmount" DOUBLE PRECISION,
ADD COLUMN "taxTreatment" TEXT,
ADD COLUMN "passthroughFeeAmount" DOUBLE PRECISION,
ADD COLUMN "exclusionReason" TEXT,
ADD COLUMN "recognitionImportedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "payments_recognitionStatus_idx" ON "payments"("recognitionStatus");

-- CreateIndex
CREATE INDEX "payments_servicePeriodStart_idx" ON "payments"("servicePeriodStart");

-- CreateIndex
CREATE INDEX "payments_servicePeriodEnd_idx" ON "payments"("servicePeriodEnd");
