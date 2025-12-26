import type { AppRouteHandler } from '@/rpc/libs';
import { getCachedBlobFiles, needsSync, syncBlobToDatabase } from '@/shared/server/blob-cdc';
import { cachedQuery, CacheKeys, invalidateCache } from '@repo/cache';
import * as routes from './blob-files.routes';

export const getBlobFiles: AppRouteHandler<typeof routes.getBlobFiles> = async c => {
  const { limit, offset, search: searchTerm } = c.req.valid('query');

  const cacheKey = CacheKeys.blobFiles({ limit, offset, search: searchTerm });

  const { data: result } = await cachedQuery({
    key: cacheKey,
    query: () => getCachedBlobFiles({ limit, offset, searchTerm }),
    ttl: 300, // 5분
  });

  return c.json(result, 200);
};

export const getBlobFilesAdmin: AppRouteHandler<typeof routes.getBlobFilesAdmin> = async c => {
  const { limit, offset, search: searchTerm, autoSync } = c.req.valid('query');

  if (autoSync && (await needsSync())) {
    c.get('logger')?.info('Auto-syncing Blob files...');
    await syncBlobToDatabase();

    // Sync 후 캐시 무효화
    await invalidateCache(CacheKeys.blobFilesPattern());
  }

  const cacheKey = CacheKeys.blobFiles({ limit, offset, search: searchTerm });

  const { data: result } = await cachedQuery({
    key: cacheKey,
    query: () => getCachedBlobFiles({ limit, offset, searchTerm }),
    ttl: 300, // 5분
  });

  return c.json(result, 200);
};

export const syncBlobFiles: AppRouteHandler<typeof routes.syncBlobFiles> = async c => {
  const stats = await syncBlobToDatabase();

  // Sync 후 모든 blob-files 캐시 무효화
  await invalidateCache(CacheKeys.blobFilesPattern());

  return c.json(
    {
      message: 'Sync completed',
      stats,
    },
    200
  );
};
