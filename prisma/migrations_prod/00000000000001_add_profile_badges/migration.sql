-- Add badges column to Profile table
ALTER TABLE "Profile" ADD COLUMN "badges" TEXT NOT NULL DEFAULT '[]';
