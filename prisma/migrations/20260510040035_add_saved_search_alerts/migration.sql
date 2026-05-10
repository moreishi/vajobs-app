-- CreateTable
CREATE TABLE "SavedSearchAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'jobs',
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastMatchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearchAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SavedSearchAlert_userId_idx" ON "SavedSearchAlert"("userId");

-- CreateIndex
CREATE INDEX "SavedSearchAlert_type_active_idx" ON "SavedSearchAlert"("type", "active");
