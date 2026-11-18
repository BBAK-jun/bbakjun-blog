import { getCloudflareContext } from '@opennextjs/cloudflare';
import { setKvBindingResolver, type KvBinding } from '@repo/cache';

/**
 * Cloudflare Workers KV 바인딩을 @repo/cache 에 등록한다.
 *
 * KV 바인딩(`KV`)은 Workers 런타임에만 있다. Vercel·로컬 개발처럼 바인딩이 없는
 * 환경에서는 null을 돌려주고, @repo/cache 는 기존 Redis 경로로 폴백한다.
 * 이 모듈은 부수효과만 있고, rpc 앱(create-app)에서 import 되어 요청 처리 전에 실행된다.
 */
setKvBindingResolver(async () => {
  try {
    const context = await getCloudflareContext({ async: true });
    const binding = (context.env as Record<string, unknown> | undefined)?.KV;
    return (binding as KvBinding | undefined) ?? null;
  } catch {
    // Workers 컨텍스트 밖(Vercel·로컬)에서는 KV 바인딩이 없다.
    return null;
  }
});
