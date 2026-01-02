/**
 * Blob Storage CDC (Change Data Capture) - Server Only
 * Vercel Blob list API 호출을 최소화하기 위한 캐싱 레이어
 */

import { list } from '@vercel/blob';
import { prisma } from '../lib/db';
import { env } from '@/env';
import { invalidateCache, CacheKeys } from '@repo/cache';

/**
 * 업로드 이력 기록 (훅)
 * @param params - 이력 기록 파라미터
 */
export async function recordUploadHistory(params: {
  actionType: 'CREATE' | 'UPDATE' | 'DELETE';
  pathname: string;
  fileUrl?: string;
  fileSize?: number;
  contentType?: string;
  uploadedBy: string;
}) {
  try {
    await prisma.uploadHistory.create({
      data: {
        actionType: params.actionType,
        pathname: params.pathname,
        fileUrl: params.fileUrl || null,
        fileSize: params.fileSize ? BigInt(params.fileSize) : null,
        contentType: params.contentType || null,
        uploadedBy: params.uploadedBy,
      },
    });
    console.log(`[UploadHistory] Recorded ${params.actionType}: ${params.pathname} by ${params.uploadedBy}`);
  } catch (error) {
    console.error('[UploadHistory] Failed to record history:', error);
    throw error;
  }
}

/**
 * Blob 파일 목록을 DB와 동기화
 * - 새로운 파일: DB에 추가
 * - 삭제된 파일: isDeleted = true로 표시
 * - 기존 파일: lastChecked 업데이트
 */
export async function syncBlobToDatabase() {
  console.log('🔄 Starting Blob CDC sync...');

  try {
    // Vercel Blob에서 실제 파일 목록 가져오기
    const { blobs } = await list();
    console.log(`📦 Found ${blobs.length} files in Vercel Blob`);

    // DB의 현재 파일 목록
    const dbFiles = await prisma.blobFile.findMany({
      where: { isDeleted: false },
    });

    const dbFileUrlsSet = new Set(dbFiles.map(f => f.url));
    const blobUrlsSet = new Set(blobs.map(b => b.url));

    // 1. 새로운 파일 추가
    const newBlobs = blobs.filter(b => !dbFileUrlsSet.has(b.url));
    if (newBlobs.length > 0) {
      console.log(`➕ Adding ${newBlobs.length} new files to DB`);
      await prisma.blobFile.createMany({
        data: newBlobs.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: BigInt(blob.size),
          uploadedAt: blob.uploadedAt,
          contentType: (blob as any).contentType || null,
        })),
        skipDuplicates: true,
      });
    }

    // 2. 삭제된 파일 표시
    const deletedUrls = dbFiles.filter(f => !blobUrlsSet.has(f.url)).map(f => f.url);

    if (deletedUrls.length > 0) {
      console.log(`🗑️  Marking ${deletedUrls.length} files as deleted`);
      await prisma.blobFile.updateMany({
        where: { url: { in: deletedUrls } },
        data: { isDeleted: true, lastChecked: new Date() },
      });
    }

    // 3. 기존 파일의 lastChecked 업데이트
    const existingUrls = blobs.filter(b => dbFileUrlsSet.has(b.url)).map(b => b.url);

    if (existingUrls.length > 0) {
      await prisma.blobFile.updateMany({
        where: { url: { in: existingUrls } },
        data: { lastChecked: new Date() },
      });
    }

    console.log('✅ Blob CDC sync completed');

    return {
      total: blobs.length,
      added: newBlobs.length,
      deleted: deletedUrls.length,
      existing: existingUrls.length,
    };
  } catch (error) {
    console.error('❌ Blob CDC sync failed:', error);
    throw error;
  }
}

/**
 * DB에서 캐시된 파일 목록 가져오기
 * @param options - 필터 옵션
 */
export async function getCachedBlobFiles(options?: {
  limit?: number;
  offset?: number;
  searchTerm?: string;
}) {
  const { limit = 100, offset = 0, searchTerm } = options || {};

  const where = {
    isDeleted: false,
    ...(searchTerm && {
      pathname: { contains: searchTerm, mode: 'insensitive' as const },
    }),
  };

  const [files, total] = await Promise.all([
    prisma.blobFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.blobFile.count({ where }),
  ]);

  return {
    files: files.map(f => ({
      ...f,
      size: Number(f.size), // BigInt to Number for JSON
    })),
    total,
    hasMore: offset + files.length < total,
  };
}

/**
 * 파일 업로드 시 DB에 추가 (훅)
 */
export async function onBlobUpload(
  blob: {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
    contentType?: string;
    uploadedBy?: string;
  },
  options?: {
    actionType?: 'CREATE' | 'UPDATE'; // 추가: action type
  }
) {
  const { actionType = 'CREATE' } = options || {};

  // 기존 파일 확인 (CREATE vs UPDATE 판단)
  const existingFile = await prisma.blobFile.findUnique({
    where: { pathname: blob.pathname },
  });

  const finalActionType = existingFile ? 'UPDATE' : actionType;

  // Upsert 수행
  const result = await prisma.blobFile.upsert({
    where: { pathname: blob.pathname },
    create: {
      url: blob.url,
      pathname: blob.pathname,
      size: BigInt(blob.size),
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
      uploadedBy: blob.uploadedBy,
    },
    update: {
      url: blob.url, // URL은 재업로드 시 변경될 수 있음
      size: BigInt(blob.size),
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
      lastChecked: new Date(),
      isDeleted: false, // 재업로드 시 복구
      uploadedBy: blob.uploadedBy, // 업로더 정보 업데이트
    },
  });

  // 캐시 무효화 (비차단)
  invalidateCache(CacheKeys.blobFilesPattern()).catch(err => {
    console.warn('[BlobCDC] Failed to invalidate cache after upload:', err);
  });

  // 이력 기록 (uploadedBy가 있는 경우)
  if (blob.uploadedBy) {
    recordUploadHistory({
      actionType: finalActionType,
      pathname: blob.pathname,
      fileUrl: blob.url,
      fileSize: blob.size,
      contentType: blob.contentType,
      uploadedBy: blob.uploadedBy,
    }).catch(err => {
      console.warn('[UploadHistory] Failed to record history:', err);
    });
  }

  return result;
}

/**
 * 파일 삭제 시 DB에서 표시 (훅)
 */
export async function onBlobDelete(pathname: string, uploadedBy?: string) {
  // 기존 파일 정보 가져오기
  const file = await prisma.blobFile.findUnique({
    where: { pathname },
  });

  // Soft delete 수행
  const result = await prisma.blobFile.update({
    where: { pathname },
    data: {
      isDeleted: true,
      lastChecked: new Date(),
    },
  });

  // 캐시 무효화 (비차단)
  invalidateCache(CacheKeys.blobFilesPattern()).catch(err => {
    console.warn('[BlobCDC] Failed to invalidate cache after delete:', err);
  });

  // 이력 기록
  if (uploadedBy && file) {
    recordUploadHistory({
      actionType: 'DELETE',
      pathname,
      fileUrl: file.url,
      fileSize: Number(file.size),
      contentType: file.contentType || undefined,
      uploadedBy,
    }).catch(err => {
      console.warn('[UploadHistory] Failed to record history:', err);
    });
  }

  return result;
}

/**
 * 마지막 동기화 시간 확인
 */
export async function getLastSyncTime() {
  const lastFile = await prisma.blobFile.findFirst({
    orderBy: { lastChecked: 'desc' },
    select: { lastChecked: true },
  });

  return lastFile?.lastChecked || null;
}

/**
 * 동기화가 필요한지 확인 (설정된 간격 경과 시)
 */
export async function needsSync() {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;

  const syncIntervalMs = env.BLOB_SYNC_INTERVAL_MINUTES * 60 * 1000;
  const syncThreshold = new Date(Date.now() - syncIntervalMs);
  return lastSync < syncThreshold;
}

/**
 * 업로드 이력 조회
 */
export async function getUploadHistory(options?: {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  actionType?: 'CREATE' | 'UPDATE' | 'DELETE';
}) {
  const { limit = 50, offset = 0, searchTerm, actionType } = options || {};

  const where = {
    ...(searchTerm && {
      pathname: { contains: searchTerm, mode: 'insensitive' as const },
    }),
    ...(actionType && { actionType }),
  };

  const [history, total] = await Promise.all([
    prisma.uploadHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.uploadHistory.count({ where }),
  ]);

  return {
    history: history.map(h => ({
      ...h,
      fileSize: h.fileSize ? Number(h.fileSize) : null,
    })),
    total,
    hasMore: offset + history.length < total,
  };
}
