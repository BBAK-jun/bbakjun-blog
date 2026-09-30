import { cache } from 'react';
import { client } from '@/shared/lib/rpc';
import type { BlobFileInfo } from '@repo/content';

/**
 * CDC 캐시에서 BlobFiles 가져오기
 * React.cache로 렌더링 컨텍스트 내에서 중복 호출 방지
 *
 * Fail-safe: CDC 호출 실패 시 빈 배열 대신 마지막 성공 응답을 재사용한다.
 * 빈 배열을 ISR이 캐싱하면 목록 페이지가 통째로 비워지는 사고(2026-09-27)를 막기 위함.
 * 프로세스 메모리 캐시라 서버리스 인스턴스 단위로만 유지된다(완벽하진 않지만 빈 목록보다는 낫다).
 */
const lastGoodFiles: { files: BlobFileInfo[] | null; at: number } = { files: null, at: 0 };

// 마지막 정상 응답의 최대 재사용 시간 (12시간)
const LAST_GOOD_TTL_MS = 12 * 60 * 60 * 1000;

export const getBlobFiles = cache(async (): Promise<BlobFileInfo[]> => {
  try {
    const response = await client.rpc.getBlobFiles.$get({
      query: {},
    });

    if (!response.ok) {
      console.error('Failed to fetch blob files:', response.status);
      return lastGood(lastGoodFiles);
    }

    const { files } = await response.json();
    const mapped = files.map(f => ({
      url: f.url,
      pathname: f.pathname,
      contentType: f.contentType,
    }));

    if (mapped.length > 0) {
      lastGoodFiles.files = mapped;
      lastGoodFiles.at = Date.now();
    } else if (lastGoodFiles.files) {
      // CDC가 빈 목록을 반환한 경우에도 마지막 정상 데이터 유지
      console.warn('CDC returned empty file list; serving last good list');
      return lastGood(lastGoodFiles);
    }

    return mapped;
  } catch (error) {
    // 빌드 타임이나 서버가 없을 때 에러 처리
    console.error('Error fetching blob files:', error);
    return lastGood(lastGoodFiles);
  }
});

function lastGood(store: { files: BlobFileInfo[] | null; at: number }): BlobFileInfo[] {
  if (store.files && Date.now() - store.at < LAST_GOOD_TTL_MS) {
    return store.files;
  }
  return [];
}
