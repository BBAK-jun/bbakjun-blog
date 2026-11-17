import { del as deleteBlob, list as listBlobs, put as putBlob } from '@vercel/blob';
import type {
  ListObjectsResult,
  PutObjectOptions,
  Storage,
  StorageBody,
  StorageObject,
} from './types';

interface BlobStorageOptions {
  token?: string;
  publicBaseUrl?: string;
}

function bodySize(body: StorageBody): number {
  if (typeof body === 'string') return Buffer.byteLength(body, 'utf8');
  if (body instanceof Blob) return body.size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  return body.byteLength;
}

export function createBlobStorage(options: BlobStorageOptions): Storage {
  const { token, publicBaseUrl } = options;

  return {
    async putObject(pathname: string, body: StorageBody, putOptions: PutObjectOptions = {}) {
      const blob = await putBlob(pathname, body as Parameters<typeof putBlob>[1], {
        access: 'public',
        token,
        contentType: putOptions.contentType,
        addRandomSuffix: putOptions.addRandomSuffix ?? false,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: bodySize(body),
        uploadedAt: new Date(),
        contentType: putOptions.contentType,
      } satisfies StorageObject;
    },

    async deleteObject(pathnameOrUrl: string) {
      await deleteBlob(pathnameOrUrl, { token });
    },

    async listObjects(cursor?: string): Promise<ListObjectsResult> {
      const result = await listBlobs({ cursor, token });
      return {
        objects: result.blobs.map(blob => ({
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt,
          contentType: (blob as { contentType?: string }).contentType,
        })),
        cursor: result.cursor,
        hasMore: result.hasMore,
      };
    },

    async getObjectText(pathnameOrUrl: string) {
      const url = pathnameOrUrl.startsWith('http') ? pathnameOrUrl : this.publicUrl(pathnameOrUrl);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch storage object: ${response.status} ${response.statusText}`
        );
      }
      return response.text();
    },

    publicUrl(pathname: string) {
      if (!publicBaseUrl) return pathname;
      return `${publicBaseUrl.replace(/\/$/, '')}/${pathname
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/')}`;
    },
  };
}
