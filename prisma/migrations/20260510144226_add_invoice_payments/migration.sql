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
    "invoiceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PaymentOrder_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PaymentOrder" ("completedAt", "connectsAmount", "createdAt", "currency", "description", "id", "invoiceId", "planId", "priceInCents", "provider", "providerOrderId", "providerSessionId", "status", "type", "updatedAt", "userId") SELECT "completedAt", "connectsAmount", "createdAt", "currency", "description", "id", "invoiceId", "planId", "priceInCents", "provider", "providerOrderId", "providerSessionId", "status", "type", "updatedAt", "userId" FROM "PaymentOrder";
DROP TABLE "PaymentOrder";
ALTER TABLE "new_PaymentOrder" RENAME TO "PaymentOrder";
CREATE INDEX "PaymentOrder_userId_idx" ON "PaymentOrder"("userId");
CREATE INDEX "PaymentOrder_providerSessionId_idx" ON "PaymentOrder"("providerSessionId");
CREATE INDEX "PaymentOrder_status_idx" ON "PaymentOrder"("status");
CREATE INDEX "PaymentOrder_type_status_idx" ON "PaymentOrder"("type", "status");
CREATE INDEX "PaymentOrder_invoiceId_idx" ON "PaymentOrder"("invoiceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
