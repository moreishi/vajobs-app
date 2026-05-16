-- CreateTable
CREATE TABLE "ReferralMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "milestone" INTEGER NOT NULL,
    "bonus" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralMilestone_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReferralMilestone_referrerId_idx" ON "ReferralMilestone"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralMilestone_referrerId_milestone_key" ON "ReferralMilestone"("referrerId", "milestone");
