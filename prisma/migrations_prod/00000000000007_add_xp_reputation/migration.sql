ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "XpTransaction_userId_idx" ON "XpTransaction"("userId");
CREATE INDEX "XpTransaction_createdAt_idx" ON "XpTransaction"("createdAt");
