import type { AppRouteHandler } from '@/rpc/libs';
import { put } from '@vercel/blob';
import { verifyApiKeySync } from '@/shared/lib/auth';
import { onBlobUpload } from '@/shared/server/blob-cdc';
import { env } from '@/env';
import * as routes from './upload.routes';

const BLOB_TOKEN = env.BLOB_READ_WRITE_TOKEN;

const requireApiKey = (authHeader?: string | null) => {
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey && verifyApiKeySync(apiKey);
};

export const uploadMarkdown: AppRouteHandler<typeof routes.uploadMarkdown> = async (c) => {
  if (!BLOB_TOKEN) {
    return c.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not configured', message: 'Server configuration error' },
      500
    );
  }

  if (!requireApiKey(c.req.header('authorization'))) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or missing API key' }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const path = formData.get('path') as string | null;

  if (!file) {
    return c.json({ error: 'No file provided', message: 'File is required' }, 400);
  }

  if (!path?.trim()) {
    return c.json({ error: 'Path is required', message: 'Path parameter is required' }, 400);
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = ['.md', '.mdx'];

  const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(fileExtension.toLowerCase())) {
    const allowed = ALLOWED_EXTENSIONS.join(', ');
    return c.json(
      {
        error: 'Invalid file type. Allowed: ' + allowed,
        message: 'File type validation failed',
      },
      400
    );
  }

  if (file.size > MAX_SIZE) {
    return c.json(
      {
        error: 'File size exceeds ' + (MAX_SIZE / 1024 / 1024) + 'MB limit',
        message: 'File size validation failed',
      },
      400
    );
  }

  const sanitizedPath = path.trim().replace(/^\/+|\/+$/g, '');
  const pathname = sanitizedPath + fileExtension;

  const blob = await put(pathname, file, {
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
    c.get('logger')?.error({ error: cdcError }, 'CDC sync failed (non-critical)');
  }

  return c.json(
    {
      success: true,
      path: blob.pathname,
      url: blob.url,
      size: file.size,
    },
    200
  );
};

export const uploadImage: AppRouteHandler<typeof routes.uploadImage> = async (c) => {
  if (!BLOB_TOKEN) {
    return c.json(
      { error: 'BLOB_READ_WRITE_TOKEN is not configured', message: 'Server configuration error' },
      500
    );
  }

  if (!requireApiKey(c.req.header('authorization'))) {
    return c.json({ error: 'Unauthorized', message: 'Invalid or missing API key' }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  const pathname = formData.get('pathname') as string | null;

  if (!file) {
    return c.json({ error: 'No file provided', message: 'File is required' }, 400);
  }

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    const allowed = ALLOWED_TYPES.join(', ');
    return c.json(
      {
        error: 'Invalid file type. Allowed: ' + allowed,
        message: 'File type validation failed',
      },
      400
    );
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return c.json(
      {
        error: 'File size exceeds ' + (MAX_SIZE / 1024 / 1024) + 'MB limit',
        message: 'File size validation failed',
      },
      400
    );
  }

  const finalPathname = pathname || 'images/' + Date.now() + '-' + file.name;

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
    c.get('logger')?.error({ error: cdcError }, 'CDC sync failed (non-critical)');
  }

  return c.json(
    {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    },
    200
  );
};
