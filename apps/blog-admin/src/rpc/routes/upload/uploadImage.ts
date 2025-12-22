import { createRoute, Context } from '@hono/zod-openapi';
import { put } from '@vercel/blob';
import { verifyApiKeySync } from '../../../shared/lib/auth';
import { onBlobUpload } from '../../../lib/blob-cdc';
import {
  uploadImageRequestSchema,
  uploadImageResponseSchema,
  uploadErrorSchema,
} from '../../../contract/schemas/upload';
import { env } from '../../../env';
import type { AppType } from '../../../rpc';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

const requireApiKey = (authHeader?: string | null) => {
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey && verifyApiKeySync(apiKey);
};

/**
 * POST /api/rpc/upload/image - 이미지 파일 업로드
 * Legacy API key authentication
 */
export const uploadImageRoute = createRoute({
  method: 'post',
  path: '/api/rpc/uploadImage',
  summary: 'Upload image file',
  description: 'Upload image file to Vercel Blob (requires API key)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadImageRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: uploadImageResponseSchema,
        },
      },
      description: 'Successfully uploaded image file',
    },
    400: {
      content: {
        'application/json': {
          schema: uploadErrorSchema,
        },
      },
      description: 'Invalid request (missing file or wrong file type)',
    },
    401: {
      content: {
        'application/json': {
          schema: uploadErrorSchema,
        },
      },
      description: 'Unauthorized (invalid API key)',
    },
    500: {
      content: {
        'application/json': {
          schema: uploadErrorSchema,
        },
      },
      description: 'Internal server error',
    },
  },
});

export const uploadImageHandler = async (c: Context<AppType>) => {
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
