import { createSearchParamsCache, parseAsString } from 'nuqs/server';

// 블로그 검색 쿼리 파라미터 정의
export const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(''),
});
