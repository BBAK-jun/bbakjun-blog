-- CreateTable
CREATE TABLE "newsletter_broadcasts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sentAt" DATETIME,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSentSubscriberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_broadcasts_slug_key" ON "newsletter_broadcasts"("slug");

-- CreateIndex
CREATE INDEX "newsletter_broadcasts_status_idx" ON "newsletter_broadcasts"("status");

-- CreateIndex
CREATE INDEX "newsletter_broadcasts_createdAt_idx" ON "newsletter_broadcasts"("createdAt");