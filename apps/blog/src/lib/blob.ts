import { cache } from 'react';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { client } from '@/shared/lib/rpc';
import type { BlobFileList, ReadPost } from '@repo/content';

async function fetchPostContent(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch post content: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function createCloudflarePostReader(files: BlobFileList): ReadPost {
  const urlsByPathname = new Map(files.map(file => [file.pathname, file.url]));

  return async pathname => {
    const fallbackUrl = urlsByPathname.get(pathname);

    try {
      const context = await getCloudflareContext({ async: true });
      const bucket = (
        context.env as typeof context.env & {
          CONTENT_BUCKET?: {
            get(key: string): Promise<{ text(): Promise<string> } | null>;
          };
        }
      ).CONTENT_BUCKET;

      if (bucket) {
        const object = await bucket.get(pathname);
        if (object) {
          return object.text();
        }
      }
    } catch {
      // Vercel/Node builds and local non-Workers execution use the fallback URL.
    }

    if (!fallbackUrl) {
      throw new Error(`Post content URL not found: ${pathname}`);
    }
    return fetchPostContent(fallbackUrl);
  };
}

/**
 * CDC 캐시에서 BlobFiles 가져오기
 * React.cache로 렌더링 컨텍스트 내에서 중복 호출 방지
 */
export const getBlobFiles = cache(async (): Promise<BlobFileList> => {
  try {
    const response = await client.rpc.getBlobFiles.$get({
      query: {},
    });

    if (!response.ok) {
      console.error('Failed to fetch blob files:', response.status);
      return [];
    }

    const { files } = await response.json();
    const blobFiles = files.map(f => ({
      url: f.url,
      pathname: f.pathname,
      contentType: f.contentType,
    })) as BlobFileList;

    blobFiles.readPost = createCloudflarePostReader(blobFiles);
    return blobFiles;
  } catch (error) {
    console.error('Error fetching blob files:', error);
    return [];
  }
});
