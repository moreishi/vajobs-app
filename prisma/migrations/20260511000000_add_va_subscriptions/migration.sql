-- Add badges column to Profile
ALTER TABLE Profile ADD COLUMN badges TEXT NOT NULL DEFAULT '[]';

-- CreateTable VaSubscriptionPlan
CREATE TABLE "VaSubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "features" TEXT NOT NULL DEFAULT '[]',
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable VaSubscription
CREATE TABLE "VaSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VaSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VaSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VaSubscriptionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VaSubscription_userId_status_idx" ON "VaSubscription"("userId", "status");
CREATE INDEX "VaSubscription_planId_idx" ON "VaSubscription"("planId");
CREATE INDEX "VaSubscriptionPlan_active_sortOrder_idx" ON "VaSubscriptionPlan"("active", "sortOrder");
