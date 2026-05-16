-- CreateTable AiApiKey
CREATE TABLE "AiApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "baseUrl" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiApiKey_userId_idx" ON "AiApiKey"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AiApiKey_userId_provider_key" ON "AiApiKey"("userId", "provider");

-- AddForeignKey
ALTER TABLE "AiApiKey" ADD CONSTRAINT "AiApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
