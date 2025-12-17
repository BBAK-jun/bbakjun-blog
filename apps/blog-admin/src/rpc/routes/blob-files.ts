import { Hono } from 'hono';
import type { Context } from 'hono';
import {
  getCachedBlobFiles,
  needsSync,
  syncBlobToDatabase,
} from '../../lib/blob-cdc';
import type { RpcEnv } from '../env';
import { requireAdminSession, requireSession } from '../middleware/session';
import {
  adminBlobFilesQuerySchema,
  blobFilesErrorSchema,
  blobFilesQuerySchema,
  blobFilesResponseSchema,
} from '../../contract/schemas/blob-files';

const publicListHandler = async (c: Context<RpcEnv>) => {
  try {
    const parsed = blobFilesQuerySchema.safeParse({
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
      search: c.req.query('search') || undefined,
    });

    if (!parsed.success) {
      return c.json(
        blobFilesErrorSchema.parse({ error: parsed.error.issues[0].message }),
        400
      );
    }

    const { limit, offset, search: searchTerm } = parsed.data;
    const result = await getCachedBlobFiles({ limit, offset, searchTerm });

    // console.log(result)

    // return c.json(result)

    return c.json(blobFilesResponseSchema.parse(result));
  } catch (error) {
    console.error('Public blob files list error:', error);
    return c.json(
      blobFilesErrorSchema.parse({ error: 'Failed to fetch blob files' }),
      500
    );
  }
};

const adminListHandler = async (c: Context<RpcEnv>) => {
  try {
    const parsed = adminBlobFilesQuerySchema.safeParse({
      limit: c.req.query('limit'),
      offset: c.req.query('offset'),
      search: c.req.query('search') || undefined,
      autoSync: c.req.query('autoSync'),
    });

    if (!parsed.success) {
      return c.json(
        blobFilesErrorSchema.parse({ error: parsed.error.issues[0].message }),
        400
      );
    }

    const { limit, offset, search: searchTerm, autoSync } = parsed.data;

    if (autoSync && (await needsSync())) {
      console.log('🔄 Auto-syncing Blob files...');
      await syncBlobToDatabase();
    }

    const result = await getCachedBlobFiles({ limit, offset, searchTerm });

    // return c.json(result)

    return c.json(blobFilesResponseSchema.parse(result));
  } catch (error) {
    console.error('Blob files list error:', error);
    return c.json(
      blobFilesErrorSchema.parse({ error: 'Failed to fetch blob files' }),
      500
    );
  }
};

const syncHandler = async (c: Context<RpcEnv>) => {
  try {
    const stats = await syncBlobToDatabase();

    return c.json({
      message: 'Sync completed',
      stats,
    });
  } catch (error) {
    console.error('Blob sync error:', error);
    return c.json(
      blobFilesErrorSchema.parse({ error: 'Failed to sync blob files' }),
      500
    );
  }
};

export const adminBlobFilesRoutes = new Hono<RpcEnv>()
  .get('/', requireSession, adminListHandler)
  .post('/sync', requireAdminSession, syncHandler);

export const blobFilesRoutes = new Hono<RpcEnv>()
  .get('/', publicListHandler)
  .route('/admin', adminBlobFilesRoutes);

export const legacyPublicBlobFilesRoutes = new Hono<RpcEnv>().get(
  '/',
  publicListHandler
);

export const legacyAdminBlobFilesRoutes = new Hono<RpcEnv>()
  .get('/', requireSession, adminListHandler)
  .post('/', requireAdminSession, syncHandler)
  .post('/sync', requireAdminSession, syncHandler);
