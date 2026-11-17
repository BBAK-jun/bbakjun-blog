import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';

// 워크스페이스 패키지(@repo/*)를 먼저 빌드한 다음 prisma generate + Next 빌드를 돌린다.
// 각 패키지의 package.json 이 dist/ 를 exports 하므로, 선행 빌드 없이 `next build`만 돌리면
// CI에서 module not found 가 난다. (Vercel 빌드는 기존 build 스크립트를 그대로 쓴다)
export default {
  ...defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
  }),
  buildCommand: 'pnpm run build:cf',
};
