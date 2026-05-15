-- CreateTable VaSubscriptionPlan
CREATE TABLE "VaSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceInCents" INTEGER NOT NULL,
    "features" TEXT NOT NULL DEFAULT '[]',
    "badge" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable VaSubscription
CREATE TABLE "VaSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VaSubscriptionPlan_active_sortOrder_idx" ON "VaSubscriptionPlan"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "VaSubscription_userId_status_idx" ON "VaSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "VaSubscription_planId_idx" ON "VaSubscription"("planId");

-- AddForeignKey
ALTER TABLE "VaSubscription" ADD CONSTRAINT "VaSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VaSubscription" ADD CONSTRAINT "VaSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "VaSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
