/**
 * Cloudflare Workers KV 백엔드
 *
 * 배경: workerd(Cloudflare Workers)에서 node-redis가 소켓을 매달아 두면
 * 요청이 "Worker's code had hung"으로 취소되고, admin RPC 가 500을 냈다.
 * KV는 Workers 런타임 안의 바인딩이라 네트워크 홉이 없고 Workers Paid 플랜에
 * 포함되어 추가 비용이 없다.
 *
 * KV 바인딩은 Workers 런타임에만 존재하므로, 앱이 `setKvBindingResolver()`로
 * 바인딩을 꺼내는 함수를 등록한다. 등록이 없거나 바인딩이 없으면(Vercel·로컬 개발)
 * 기존 Redis 경로를 그대로 사용한다.
 */

/** KV `list()` 응답 (필요한 필드만) */
export interface KvListResult {
  keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
  list_complete: boolean;
  cursor?: string;
}

/** Cloudflare Workers KV 바인딩 중 이 패키지가 쓰는 부분집합 */
export interface KvBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<KvListResult>;
}

export type KvBindingResolver = () =>
  | KvBinding
  | null
  | undefined
  | Promise<KvBinding | null | undefined>;

let resolver: KvBindingResolver | null = null;
let cachedBinding: KvBinding | null = null;

/**
 * KV 바인딩 리졸버 등록 (Workers 런타임에서 앱이 호출)
 *
 * @example
 * ```ts
 * setKvBindingResolver(async () => {
 *   const ctx = await getCloudflareContext({ async: true });
 *   return (ctx.env as { KV?: KvBinding }).KV ?? null;
 * });
 * ```
 */
export function setKvBindingResolver(nextResolver: KvBindingResolver | null): void {
  resolver = nextResolver;
  cachedBinding = null;
}

function isKvBinding(value: unknown): value is KvBinding {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<KvBinding>;
  return (
    typeof candidate.get === 'function' &&
    typeof candidate.put === 'function' &&
    typeof candidate.delete === 'function' &&
    typeof candidate.list === 'function'
  );
}

/**
 * KV 바인딩 반환. 바인딩이 없으면 null (Redis 폴백 경로로 내려간다)
 *
 * 실패는 캐시하지 않는다 — 리졸버가 붙기 전에 호출되었다면 다음 요청에서 재시도한다.
 */
export async function getKvBinding(): Promise<KvBinding | null> {
  if (cachedBinding) return cachedBinding;
  if (!resolver) return null;

  try {
    const binding = await resolver();
    if (isKvBinding(binding)) {
      cachedBinding = binding;
      return binding;
    }
  } catch {
    // Workers 컨텍스트 밖(Vercel·로컬)에서는 바인딩이 없다.
  }

  return null;
}

/** KV 백엔드 사용 가능 여부 */
export async function isKvAvailable(): Promise<boolean> {
  return (await getKvBinding()) !== null;
}

/**
 * prefix로 모든 키 이름을 모은다 (KV list 커서 순회)
 */
export async function listAllKvKeys(
  binding: KvBinding,
  prefix: string,
  pageLimit = 1000
): Promise<string[]> {
  const names: string[] = [];
  let cursor: string | undefined;

  do {
    const page = await binding.list({ prefix, cursor, limit: pageLimit });
    for (const key of page.keys ?? []) {
      names.push(key.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return names;
}

/** 전체 삭제/조회 시 KV 요청을 적당한 크기로 나눈다 */
export function chunk<T>(items: T[], size = 50): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
