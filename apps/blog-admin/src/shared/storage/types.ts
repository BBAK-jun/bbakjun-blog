export type StorageBody = string | Blob | ArrayBuffer | ArrayBufferView;

export interface StorageObject {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
}

export interface PutObjectOptions {
  contentType?: string;
  addRandomSuffix?: boolean;
}

export interface ListObjectsResult {
  objects: StorageObject[];
  cursor?: string;
  hasMore: boolean;
}

export interface Storage {
  putObject(
    pathname: string,
    body: StorageBody,
    options?: PutObjectOptions
  ): Promise<StorageObject>;
  deleteObject(pathnameOrUrl: string): Promise<void>;
  listObjects(cursor?: string): Promise<ListObjectsResult>;
  getObjectText(pathnameOrUrl: string): Promise<string>;
  publicUrl(pathname: string): string;
}

export interface R2ObjectLike {
  key: string;
  size: number;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
  };
}

export interface R2BucketLike {
  put(
    key: string,
    value: StorageBody,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<R2ObjectLike | null>;
  delete(key: string): Promise<void>;
  list(options?: { cursor?: string }): Promise<{
    objects: R2ObjectLike[];
    truncated: boolean;
    cursor?: string;
  }>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer> } | null>;
}
