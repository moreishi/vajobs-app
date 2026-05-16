-- AlterTable: Add expiresAt column to JobPost
ALTER TABLE "JobPost" ADD COLUMN "expiresAt" TIMESTAMP(3);
