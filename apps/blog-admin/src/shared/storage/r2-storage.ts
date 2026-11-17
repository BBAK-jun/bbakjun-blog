import type {
  ListObjectsResult,
  PutObjectOptions,
  R2BucketLike,
  Storage,
  StorageBody,
  StorageObject,
} from './types';

interface R2StorageOptions {
  bucket: R2BucketLike;
  publicBaseUrl: string;
}

function storageBodySize(body: StorageBody): number {
  if (typeof body === 'string') return new TextEncoder().encode(body).byteLength;
  if (body instanceof Blob) return body.size;
  if (body instanceof ArrayBuffer) return body.byteLength;
  return body.byteLength;
}

export function createR2Storage(options: R2StorageOptions): Storage {
  const { bucket, publicBaseUrl } = options;

  return {
    async putObject(pathname: string, body: StorageBody, putOptions: PutObjectOptions = {}) {
      const object = await bucket.put(pathname, body, {
        httpMetadata: { contentType: putOptions.contentType },
      });

      return {
        url: publicUrl(publicBaseUrl, pathname),
        pathname,
        size: object?.size ?? storageBodySize(body),
        uploadedAt: object?.uploaded ?? new Date(),
        contentType: object?.httpMetadata?.contentType ?? putOptions.contentType,
      } satisfies StorageObject;
    },

    async deleteObject(pathnameOrUrl: string) {
      await bucket.delete(pathnameFromUrl(pathnameOrUrl, publicBaseUrl));
    },

    async listObjects(cursor?: string): Promise<ListObjectsResult> {
      const result = await bucket.list(cursor ? { cursor } : undefined);
      return {
        objects: result.objects.map(object => ({
          url: publicUrl(publicBaseUrl, object.key),
          pathname: object.key,
          size: object.size,
          uploadedAt: object.uploaded,
          contentType: object.httpMetadata?.contentType,
        })),
        cursor: result.cursor,
        hasMore: result.truncated,
      };
    },

    async getObjectText(pathnameOrUrl: string) {
      const object = await bucket.get(pathnameFromUrl(pathnameOrUrl, publicBaseUrl));
      if (!object) {
        throw new Error(`Storage object not found: ${pathnameOrUrl}`);
      }
      return new TextDecoder().decode(await object.arrayBuffer());
    },

    publicUrl(pathname: string) {
      return publicUrl(publicBaseUrl, pathname);
    },
  };
}

function publicUrl(baseUrl: string, pathname: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${pathname
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')}`;
}

function pathnameFromUrl(pathnameOrUrl: string, baseUrl: string): string {
  if (!pathnameOrUrl.startsWith('http')) return pathnameOrUrl;

  const url = new URL(pathnameOrUrl);
  const base = new URL(`${baseUrl.replace(/\/$/, '')}/`);
  if (url.origin !== base.origin) {
    throw new Error(`Storage URL belongs to another provider: ${pathnameOrUrl}`);
  }

  return url.pathname
    .replace(/^\//, '')
    .split('/')
    .map(segment => decodeURIComponent(segment))
    .join('/');
}
