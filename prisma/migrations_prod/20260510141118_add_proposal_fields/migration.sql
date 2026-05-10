-- AlterTable
ALTER TABLE "Application" ADD COLUMN "bidAmount" DOUBLE PRECISION;
ALTER TABLE "Application" ADD COLUMN "bidType" TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE "Application" ADD COLUMN "timeline" INTEGER;
ALTER TABLE "Application" ADD COLUMN "approach" TEXT;
