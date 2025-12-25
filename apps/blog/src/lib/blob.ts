import { cache } from 'react';
import { client } from '@/shared/lib/rpc';
import type { BlobFileInfo } from '@repo/content';

/**
 * CDC 캐시에서 BlobFiles 가져오기
 * React.cache로 렌더링 컨텍스트 내에서 중복 호출 방지
 */
export const getBlobFiles = cache(async (): Promise<BlobFileInfo[]> => {
  try {
    const response = await client.rpc.getBlobFiles.$get({
      query: {},
    });

    if (!response.ok) {
      console.error('Failed to fetch blob files:', response.status);
      return [];
    }

    const { files } = await response.json();
    return files.map(f => ({
      url: f.url,
      pathname: f.pathname,
      contentType: f.contentType,
    }));
  } catch (error) {
    // 빌드 타임이나 서버가 없을 때 에러 처리
    console.error('Error fetching blob files:', error);
    return [];
  }
});
