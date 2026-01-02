-- CreateTable
CREATE TABLE "upload_history" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" BIGINT,
    "contentType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upload_history_pathname_idx" ON "upload_history"("pathname");

-- CreateIndex
CREATE INDEX "upload_history_createdAt_idx" ON "upload_history"("createdAt");

-- CreateIndex
CREATE INDEX "upload_history_actionType_idx" ON "upload_history"("actionType");
