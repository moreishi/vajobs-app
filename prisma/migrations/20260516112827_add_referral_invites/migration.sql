-- CreateTable
CREATE TABLE "ReferralInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "refereeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferralInvite_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReferralInvite_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ReferralInvite_referrerId_idx" ON "ReferralInvite"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralInvite_email_idx" ON "ReferralInvite"("email");
