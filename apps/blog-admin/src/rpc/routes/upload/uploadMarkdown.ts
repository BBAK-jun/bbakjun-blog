import { createRoute } from '@hono/zod-openapi';
import { put } from '@vercel/blob';
import { verifyApiKeySync } from '../../../shared/lib/auth';
import { onBlobUpload } from '../../../shared/server/blob-cdc';
import {
  uploadMarkdownRequestSchema,
  uploadMarkdownResponseSchema,
  uploadErrorSchema,
} from '../../../shared/api/upload';
import { env } from '../../../shared/config/env';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

const requireApiKey = (authHeader?: string | null) => {
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey && verifyApiKeySync(apiKey);
};

/**
 * POST /api/rpc/upload/markdown - Markdown 파일 업로드
 * Legacy API key authentication
 */
export const uploadMarkdownRoute = createRoute({
  method: 'post',
  path: '/api/rpc/uploadMarkdown',
  summary: 'Upload markdown file',
  description: 'Upload markdown file to Vercel Blob (requires API key)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: uploadMarkdownRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: uploadMarkdownResponseSchema,
        },
      },
      description: 'Successfully uploaded markdown file',
    },
    400: {
      content: {
        'application/json': {
          schema: uploadErrorSchema,
        },
      },
      description: 'Invalid request (missing file, path, or wrong file type)',
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

export const uploadMarkdownHandler = async (c: any) => {
  try {
    if (!BLOB_TOKEN) {
      return c.json({ success: false, error: 'BLOB_READ_WRITE_TOKEN is not configured' }, 500);
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

    // CDC: DB에 파일 정보 저장
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
