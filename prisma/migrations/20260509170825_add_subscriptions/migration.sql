-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMonths" INTEGER NOT NULL,
    "priceInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "connectsPerPeriod" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClientSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "cancelledAt" DATETIME,
    "paymentOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClientSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientSubscription_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "PaymentOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PaymentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'connects',
    "connectsAmount" INTEGER,
    "priceInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "provider" TEXT NOT NULL,
    "providerSessionId" TEXT,
    "providerOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "planId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentOrder" ("completedAt", "connectsAmount", "createdAt", "currency", "id", "priceInCents", "provider", "providerOrderId", "providerSessionId", "status", "updatedAt", "userId") SELECT "completedAt", "connectsAmount", "createdAt", "currency", "id", "priceInCents", "provider", "providerOrderId", "providerSessionId", "status", "updatedAt", "userId" FROM "PaymentOrder";
DROP TABLE "PaymentOrder";
ALTER TABLE "new_PaymentOrder" RENAME TO "PaymentOrder";
CREATE INDEX "PaymentOrder_userId_idx" ON "PaymentOrder"("userId");
CREATE INDEX "PaymentOrder_providerSessionId_idx" ON "PaymentOrder"("providerSessionId");
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");
CREATE INDEX "PaymentOrder_type_status_idx" ON "PaymentOrder"("type", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SubscriptionPlan_active_sortOrder_idx" ON "SubscriptionPlan"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSubscription_paymentOrderId_key" ON "ClientSubscription"("paymentOrderId");

-- CreateIndex
CREATE INDEX "ClientSubscription_userId_status_idx" ON "ClientSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "ClientSubscription_currentPeriodEnd_idx" ON "ClientSubscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "ClientSubscription_status_autoRenew_idx" ON "ClientSubscription"("status", "autoRenew");
