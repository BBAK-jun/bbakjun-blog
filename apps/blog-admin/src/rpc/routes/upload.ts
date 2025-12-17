import { Hono } from 'hono';
import type { Context } from 'hono';
import { put } from '@vercel/blob';
import { verifyApiKeySync } from '../../shared/lib/auth';
import { onBlobUpload } from '../../lib/blob-cdc';
import type { RpcEnv } from '../env';
import { env } from '../../env';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

const requireApiKey = (authHeader?: string | null) => {
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey && verifyApiKeySync(apiKey);
};

const handleMarkdownUpload = async (c: Context<RpcEnv>) => {
  try {
    if (!BLOB_TOKEN) {
      return c.json(
        { success: false, error: 'BLOB_READ_WRITE_TOKEN is not configured' },
        500
      );
    }

    if (!requireApiKey(c.req.header('authorization'))) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    if (!path?.trim()) {
      return c.json({ success: false, error: 'Path is required' }, 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_EXTENSIONS = ['.md', '.mdx'];

    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
      return c.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
        },
        400
      );
    }

    if (file.size > MAX_SIZE) {
      return c.json(
        {
          success: false,
          error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
        },
        400
      );
    }

    const sanitizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    const pathname = `${sanitizedPath}${fileExtension}`;

    const blob = await put(pathname, file, {
      access: 'public',
      token: BLOB_TOKEN,
    });

    return c.json({
      success: true,
      path: blob.pathname,
      url: blob.url,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload markdown error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      },
      500
    );
  }
};

const handleImageUpload = async (c: Context<RpcEnv>) => {
  try {
    if (!BLOB_TOKEN) {
      return c.json(
        { success: false, error: 'BLOB_READ_WRITE_TOKEN is not configured' },
        500
      );
    }

    if (!requireApiKey(c.req.header('authorization'))) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const pathname = formData.get('pathname') as string | null;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        },
        400
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json(
        {
          success: false,
          error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
        },
        400
      );
    }

    const finalPathname = pathname || `images/${Date.now()}-${file.name}`;

    const blob = await put(finalPathname, file, {
      access: 'public',
      token: BLOB_TOKEN,
      addRandomSuffix: false,
    });

    try {
      await onBlobUpload({
        url: blob.url,
        pathname: blob.pathname,
        size: file.size,
        uploadedAt: new Date(),
        contentType: file.type,
      });
    } catch (cdcError) {
      console.error('CDC sync failed (non-critical):', cdcError);
    }

    return c.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      500
    );
  }
};

/**
 * Markdown/image upload routes.
 * Legacy API key authentication is preserved for migration scripts.
 */
export const uploadRoutes = new Hono<RpcEnv>()
  .post('/markdown', handleMarkdownUpload)
  .post('/image', handleImageUpload);

/**
 * Legacy endpoints used by scripts
 * - POST `/api/admin/upload`
 * - POST `/api/admin/upload-image`
 */
export const legacyMarkdownUploadRoutes = new Hono<RpcEnv>().post(
  '/',
  handleMarkdownUpload
);

export const legacyImageUploadRoutes = new Hono<RpcEnv>().post(
  '/',
  handleImageUpload
);
