-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "hourlyRate" INTEGER,
    "experience" INTEGER,
    "availability" TEXT NOT NULL DEFAULT 'available',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "resumeUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("availability", "bio", "createdAt", "experience", "headline", "hourlyRate", "id", "isPublic", "resumeUrl", "skills", "updatedAt", "userId") SELECT "availability", "bio", "createdAt", "experience", "headline", "hourlyRate", "id", "isPublic", "resumeUrl", "skills", "updatedAt", "userId" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE INDEX "Profile_isPublic_idx" ON "Profile"("isPublic");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
