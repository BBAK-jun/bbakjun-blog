import { Hono } from 'hono';
import type { RpcEnv } from '../../env';
import { uploadMarkdownRoute, uploadMarkdownHandler } from './uploadMarkdown';
import { uploadImageRoute, uploadImageHandler } from './uploadImage';

/**
 * Legacy endpoints used by scripts
 * - POST `/api/admin/upload`
 * - POST `/api/admin/upload-image`
 */
export const legacyMarkdownUploadRoutes = new Hono<RpcEnv>().post('/', uploadMarkdownHandler);

export const legacyImageUploadRoutes = new Hono<RpcEnv>().post('/', uploadImageHandler);

// Export routes and handlers for OpenAPIHono
export { uploadMarkdownRoute, uploadMarkdownHandler, uploadImageRoute, uploadImageHandler };
