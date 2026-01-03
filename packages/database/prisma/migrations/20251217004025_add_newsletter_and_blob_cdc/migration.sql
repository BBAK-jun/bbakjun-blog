-- CreateTable
CREATE TABLE "blob_files" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "contentType" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT,

    CONSTRAINT "blob_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blob_files_url_key" ON "blob_files"("url");

-- CreateIndex
CREATE INDEX "blob_files_pathname_idx" ON "blob_files"("pathname");

-- CreateIndex
CREATE INDEX "blob_files_uploadedAt_idx" ON "blob_files"("uploadedAt");

-- CreateIndex
CREATE INDEX "blob_files_isDeleted_idx" ON "blob_files"("isDeleted");
