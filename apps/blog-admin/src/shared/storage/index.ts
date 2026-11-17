import { env } from '@/env';
import type { StorageObject } from './types';
import { createBlobStorage } from './blob-storage';

export type {
  ListObjectsResult,
  PutObjectOptions,
  R2BucketLike,
  Storage,
  StorageBody,
  StorageObject,
} from './types';
export { createBlobStorage } from './blob-storage';
export { createR2Storage } from './r2-storage';

/**
 * Vercel Blob remains the default provider until R2 bindings are explicitly wired.
 */
export const storage = createBlobStorage({
  token: env.BLOB_READ_WRITE_TOKEN,
});

export async function listAllStorageObjects(): Promise<StorageObject[]> {
  const objects: StorageObject[] = [];
  let cursor: string | undefined;

  do {
    const page = await storage.listObjects(cursor);
    objects.push(...page.objects);
    if (!page.hasMore || !page.cursor) break;
    cursor = page.cursor;
  } while (cursor);

  return objects;
}
