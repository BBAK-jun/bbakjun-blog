import { describe, expect, it } from 'vitest';
import { createR2Storage } from '@/shared/storage/r2-storage';
import type { R2BucketLike, R2ObjectLike } from '@/shared/storage/types';

class FakeBucket implements R2BucketLike {
  readonly deleted: string[] = [];
  readonly puts: string[] = [];
  private readonly pages: Array<{ objects: R2ObjectLike[]; truncated: boolean; cursor?: string }>;

  constructor(pages: Array<{ objects: R2ObjectLike[]; truncated: boolean; cursor?: string }>) {
    this.pages = pages;
  }

  async put(key: string) {
    this.puts.push(key);
    return {
      key,
      size: 5,
      uploaded: new Date('2026-11-17T00:00:00.000Z'),
      httpMetadata: { contentType: 'text/plain' },
    };
  }

  async delete(key: string) {
    this.deleted.push(key);
  }

  async list(options?: { cursor?: string }) {
    return this.pages[options?.cursor ? 1 : 0];
  }

  async get() {
    return {
      arrayBuffer: async () => new TextEncoder().encode('hello').buffer,
    };
  }
}

describe('R2 storage', () => {
  it('writes objects and returns a public URL with metadata', async () => {
    const bucket = new FakeBucket([{ objects: [], truncated: false }]);
    const storage = createR2Storage({ bucket, publicBaseUrl: 'https://cdn.example.com/' });

    const object = await storage.putObject('posts/hello world.md', 'hello', {
      contentType: 'text/markdown',
    });

    expect(bucket.puts).toEqual(['posts/hello world.md']);
    expect(object.url).toBe('https://cdn.example.com/posts/hello%20world.md');
    expect(object.pathname).toBe('posts/hello world.md');
    expect(object.contentType).toBe('text/plain');
  });

  it('deletes an object from either its pathname or public URL', async () => {
    const bucket = new FakeBucket([{ objects: [], truncated: false }]);
    const storage = createR2Storage({ bucket, publicBaseUrl: 'https://cdn.example.com' });

    await storage.deleteObject('https://cdn.example.com/images/photo%20one.png');

    expect(bucket.deleted).toEqual(['images/photo one.png']);
  });

  it('follows list cursors and maps objects to public URLs', async () => {
    const bucket = new FakeBucket([
      {
        objects: [
          {
            key: 'posts/one.md',
            size: 10,
            uploaded: new Date('2026-11-17T00:00:00.000Z'),
          },
        ],
        truncated: true,
        cursor: 'next-page',
      },
      {
        objects: [
          {
            key: 'posts/two.md',
            size: 20,
            uploaded: new Date('2026-11-17T00:01:00.000Z'),
          },
        ],
        truncated: false,
      },
    ]);
    const storage = createR2Storage({ bucket, publicBaseUrl: 'https://cdn.example.com' });

    const first = await storage.listObjects();
    const second = await storage.listObjects(first.cursor);

    expect(first.hasMore).toBe(true);
    expect(first.cursor).toBe('next-page');
    expect(second.hasMore).toBe(false);
    expect([...first.objects, ...second.objects].map(object => object.url)).toEqual([
      'https://cdn.example.com/posts/one.md',
      'https://cdn.example.com/posts/two.md',
    ]);
  });

  it('reads object text from the R2 body', async () => {
    const bucket = new FakeBucket([{ objects: [], truncated: false }]);
    const storage = createR2Storage({ bucket, publicBaseUrl: 'https://cdn.example.com' });

    await expect(storage.getObjectText('posts/hello.md')).resolves.toBe('hello');
  });
});
