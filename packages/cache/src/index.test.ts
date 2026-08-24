/**
 * cachedQuery 폴백 동작 — Redis를 사용할 수 없을 때
 * 쿼리가 직접 실행되고 fromCache=false 여야 한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisModule = vi.hoisted(() => ({
  isRedisAvailable: vi.fn(),
}));

vi.mock('./redis', () => redisModule);

describe('cachedQuery fallback', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('Redis unavailable 시 쿼리를 직접 실행하고 fromCache=false를 반환한다', async () => {
    redisModule.isRedisAvailable.mockResolvedValue(false);
    const { cachedQuery } = await import('./index');

    const query = vi.fn(async () => ({ value: 42 }));
    const { data, fromCache } = await cachedQuery({ key: 'test:key', query });

    expect(data).toEqual({ value: 42 });
    expect(fromCache).toBe(false);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
