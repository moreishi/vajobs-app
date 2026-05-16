-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralReward_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralReward_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'guest',
    "connects" INTEGER NOT NULL DEFAULT 50,
    "lastConnectsReset" DATETIME,
    "emailVerified" DATETIME,
    "image" TEXT,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("connects", "createdAt", "email", "emailVerified", "id", "image", "lastConnectsReset", "name", "password", "role", "updatedAt") SELECT "connects", "createdAt", "email", "emailVerified", "id", "image", "lastConnectsReset", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE TABLE "new_VaSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VaSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VaSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VaSubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_VaSubscription" ("createdAt", "endDate", "id", "planId", "startDate", "status", "updatedAt", "userId") SELECT "createdAt", "endDate", "id", "planId", "startDate", "status", "updatedAt", "userId" FROM "VaSubscription";
DROP TABLE "VaSubscription";
ALTER TABLE "new_VaSubscription" RENAME TO "VaSubscription";
CREATE INDEX "VaSubscription_userId_status_idx" ON "VaSubscription"("userId", "status");
CREATE INDEX "VaSubscription_planId_idx" ON "VaSubscription"("planId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReferralReward_referrerId_idx" ON "ReferralReward"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralReward_refereeId_idx" ON "ReferralReward"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_referrerId_refereeId_key" ON "ReferralReward"("referrerId", "refereeId");
