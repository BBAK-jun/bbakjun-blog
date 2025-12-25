import type { AppRouteHandler } from '@/rpc/libs';
import { getCachedBlobFiles, needsSync, syncBlobToDatabase } from '@/shared/server/blob-cdc';
import * as routes from './blob-files.routes';

export const getBlobFiles: AppRouteHandler<typeof routes.getBlobFiles> = async c => {
  const { limit, offset, search: searchTerm } = c.req.valid('query');
  const result = await getCachedBlobFiles({ limit, offset, searchTerm });
  return c.json(result, 200);
};

export const getBlobFilesAdmin: AppRouteHandler<typeof routes.getBlobFilesAdmin> = async c => {
  const { limit, offset, search: searchTerm, autoSync } = c.req.valid('query');

  if (autoSync && (await needsSync())) {
    c.get('logger')?.info('Auto-syncing Blob files...');
    await syncBlobToDatabase();
  }

  const result = await getCachedBlobFiles({ limit, offset, searchTerm });
  return c.json(result, 200);
};

export const syncBlobFiles: AppRouteHandler<typeof routes.syncBlobFiles> = async c => {
  const stats = await syncBlobToDatabase();
  return c.json(
    {
      message: 'Sync completed',
      stats,
    },
    200
  );
};
