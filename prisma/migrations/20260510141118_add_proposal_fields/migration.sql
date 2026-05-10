-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobPostId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "coverLetter" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "biddingConnects" INTEGER NOT NULL DEFAULT 1,
    "bidAmount" REAL,
    "bidType" TEXT NOT NULL DEFAULT 'fixed',
    "timeline" INTEGER,
    "approach" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("applicantId", "biddingConnects", "coverLetter", "createdAt", "id", "jobPostId", "status", "updatedAt") SELECT "applicantId", "biddingConnects", "coverLetter", "createdAt", "id", "jobPostId", "status", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE INDEX "Application_applicantId_idx" ON "Application"("applicantId");
CREATE INDEX "Application_jobPostId_idx" ON "Application"("jobPostId");
CREATE UNIQUE INDEX "Application_jobPostId_applicantId_key" ON "Application"("jobPostId", "applicantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
