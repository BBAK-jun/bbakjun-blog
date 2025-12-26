/**
 * Rate Limiting 미들웨어 테스트
 *
 * 요청 속도 제한 기능을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import {
  rateLimit,
  DEFAULT_RATE_LIMITS,
  ragRateLimit,
  healthRateLimit,
  _clearInMemoryStoreForTesting,
} from '@/middleware/rate-limit';
import * as HttpStatusCodes from 'stoker/http-status-codes';

// Mock @repo/cache Redis functions
vi.mock('@repo/cache', () => ({
  getRedisClient: vi.fn(),
  isRedisAvailable: vi.fn(),
}));

// Import mocked functions
import { getRedisClient, isRedisAvailable } from '@repo/cache';

// Mock Redis client
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  quit: vi.fn(),
  isOpen: true,
};

describe('Rate Limiting 미들웨어', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock behavior
    vi.mocked(isRedisAvailable).mockResolvedValue(true);
    vi.mocked(getRedisClient).mockResolvedValue(mockRedis as any);

    // Clear in-memory store between tests
    _clearInMemoryStoreForTesting();

    app = new Hono();
  });

  describe('Redis 기반 Rate Limiting', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('첫 요청은 허용되어야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');

      expect(response.status).toBe(HttpStatusCodes.OK);
    });

    it('rate limit 헤더를 추가해야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');

      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('limit 초과 시 429를 반환해야 함', async () => {
      // Mock: counter already at limit
      mockRedis.incr.mockResolvedValue(61);

      app.use('/test', rateLimit({ limit: 60, window: 60 }), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');

      expect(response.status).toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
      const json = await response.json();
      expect(json.error).toBe('rate_limit_exceeded');
    });

    it('limit 초과 시 retryAfter를 반환해야 함', async () => {
      const now = Date.now();
      const resetTime = now + 60000; // 1 minute from now

      mockRedis.incr.mockResolvedValue(61);

      app.use('/test', rateLimit({ limit: 60, window: 60 }), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');
      const json = (await response.json()) as { retryAfter?: number };

      expect(json.retryAfter).toBeDefined();
      expect(json.retryAfter).toBeGreaterThan(0);
      expect(json.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('In-Memory Fallback', () => {
    beforeEach(() => {
      // Redis unavailable
      vi.mocked(isRedisAvailable).mockResolvedValue(false);
    });

    it('Redis 없을 때 in-memory fallback을 사용해야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STRICT), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');
      expect(response.status).toBe(HttpStatusCodes.OK);
      expect(getRedisClient).not.toHaveBeenCalled();
    });

    it('in-memory도 제한을 초과하면 429를 반환해야 함', async () => {
      const limit = 5;
      app.use('/test', rateLimit({ limit, window: 60 }), async c => {
        return c.json({ message: 'Success' });
      });

      // Make requests up to limit
      for (let i = 0; i < limit; i++) {
        const response = await app.request('/test');
        expect(response.status).toBe(HttpStatusCodes.OK);
      }

      // Next request should be rate limited
      const response = await app.request('/test');
      expect(response.status).toBe(HttpStatusCodes.TOO_MANY_REQUESTS);
    });
  });

  describe('식별자 추출', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('API Key가 있으면 API Key를 식별자로 사용해야 함', async () => {
      const apiKey = 'test-key-abc123';

      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      await app.request('/test', {
        headers: { 'X-RAG-API-Key': apiKey },
      });

      // Check that Redis key uses API key (last 8 chars: 'y-abc123')
      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining('apikey:y-abc123'));
    });

    it('API Key가 없으면 IP 주소를 식별자로 사용해야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      await app.request('/test', {
        headers: { 'X-Forwarded-For': '192.168.1.1' },
      });

      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining('ip:192.168.1.1'));
    });

    it('X-Real-IP 헤더를 우선 사용해야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      await app.request('/test', {
        headers: {
          'X-Real-IP': '10.0.0.1',
          'X-Forwarded-For': '192.168.1.1',
        },
      });

      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining('ip:10.0.0.1'));
    });
  });

  describe('사전 정의된 Rate Limit 설정', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('STRICT 설정은 10회/분 제한이어야 함', async () => {
      expect(DEFAULT_RATE_LIMITS.STRICT.limit).toBe(10);
      expect(DEFAULT_RATE_LIMITS.STRICT.window).toBe(60);
    });

    it('STANDARD 설정은 60회/분 제한이어야 함', async () => {
      expect(DEFAULT_RATE_LIMITS.STANDARD.limit).toBe(60);
      expect(DEFAULT_RATE_LIMITS.STANDARD.window).toBe(60);
    });

    it('LENIENT 설정은 30회/분 제한이어야 함', async () => {
      expect(DEFAULT_RATE_LIMITS.LENIENT.limit).toBe(30);
      expect(DEFAULT_RATE_LIMITS.LENIENT.window).toBe(60);
    });

    it('ragRateLimit 미들웨어를 사용할 수 있어야 함', async () => {
      app.use('/rag', ragRateLimit, async c => {
        return c.json({ message: 'RAG endpoint' });
      });

      const response = await app.request('/rag', {
        headers: { 'X-RAG-API-Key': 'test-key' },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
    });

    it('healthRateLimit 미들웨어를 사용할 수 있어야 함', async () => {
      app.use('/health', healthRateLimit, async c => {
        return c.json({ status: 'healthy' });
      });

      const response = await app.request('/health');

      expect(response.status).toBe(HttpStatusCodes.OK);
    });
  });

  describe('커스텀 Key 생성', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('커스텀 getKey 함수로 식별자를 지정할 수 있어야 함', async () => {
      const customKey = 'user:123';

      app.use(
        '/test',
        rateLimit(DEFAULT_RATE_LIMITS.STANDARD, () => customKey),
        async c => {
          return c.json({ message: 'Success' });
        }
      );

      await app.request('/test');

      expect(mockRedis.incr).toHaveBeenCalledWith(expect.stringContaining(customKey));
    });
  });

  describe('Redis 에러 처리', () => {
    it('Redis 에러 시 in-memory fallback을 사용해야 함', async () => {
      vi.mocked(isRedisAvailable).mockResolvedValue(true);
      vi.mocked(getRedisClient).mockRejectedValue(new Error('Redis connection failed'));

      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STRICT), async c => {
        return c.json({ message: 'Success' });
      });

      const response = await app.request('/test');

      // Should fallback to in-memory and succeed
      expect(response.status).toBe(HttpStatusCodes.OK);
    });
  });

  describe('타임스탬프 기반 윈도우', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('Redis 키에 타임스탬프 윈도우가 포함되어야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ message: 'Success' });
      });

      await app.request('/test', {
        headers: { 'X-Real-IP': '192.168.1.1' },
      });

      const key = vi.mocked(mockRedis.incr).mock.calls[0][0];
      expect(key).toMatch(/ip:192\.168\.1\.1:\d+$/);
    });

    it('만료 시간이 윈도우 + 1초로 설정되어야 함', async () => {
      const window = 60;
      app.use('/test', rateLimit({ limit: 10, window }), async c => {
        return c.json({ message: 'Success' });
      });

      await app.request('/test');

      expect(mockRedis.expire).toHaveBeenCalledWith(expect.any(String), window + 1);
    });
  });

  describe('다양한 요청 타입', () => {
    beforeEach(() => {
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('POST 요청도 rate limiting되어야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ method: 'POST' });
      });

      const response = await app.request('/test', { method: 'POST' });

      expect(response.status).toBe(HttpStatusCodes.OK);
      expect(mockRedis.incr).toHaveBeenCalled();
    });

    it('GET 요청도 rate limiting되어야 함', async () => {
      app.use('/test', rateLimit(DEFAULT_RATE_LIMITS.STANDARD), async c => {
        return c.json({ method: 'GET' });
      });

      const response = await app.request('/test', { method: 'GET' });

      expect(response.status).toBe(HttpStatusCodes.OK);
      expect(mockRedis.incr).toHaveBeenCalled();
    });
  });
});
