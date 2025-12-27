/**
 * 인증 미들웨어 테스트
 *
 * API Key 인증 기능을 검증합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { verifyAuth } from '@/middleware/auth';
import * as HttpStatusCodes from 'stoker/http-status-codes';

// Mock env
vi.mock('@/env', () => ({
  env: {
    RAG_GATEWAY_API_KEY: 'test-api-key-12345',
  },
}));

describe('인증 미들웨어 - verifyAuth', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use('/protected', verifyAuth, async c => {
      return c.json({ message: 'Success' }, HttpStatusCodes.OK);
    });

    app.use('/public', async c => {
      return c.json({ message: 'Public' }, HttpStatusCodes.OK);
    });
  });

  describe('인증 성공', () => {
    it('유효한 API Key로 인증되어야 함', async () => {
      const response = await app.request('/protected', {
        method: 'GET',
        headers: {
          'X-RAG-API-Key': 'test-api-key-12345',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
      const json = (await response.json()) as { message: string };
      expect(json.message).toBe('Success');
    });

    it('대소문자를 구분하지 않아야 함 (헤더 이름)', async () => {
      const response = await app.request('/protected', {
        method: 'GET',
        headers: {
          'x-rag-api-key': 'test-api-key-12345', // 소문자 헤더
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
    });
  });

  describe('인증 실패', () => {
    it('API Key가 없으면 401을 반환해야 함', async () => {
      const response = await app.request('/protected', {
        method: 'GET',
      });

      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      const json = (await response.json()) as { error: string; message: string };
      expect(json.error).toBe('Unauthorized');
      expect(json.message).toContain('Missing X-RAG-API-Key');
    });

    it('잘못된 API Key면 401을 반환해야 함', async () => {
      const response = await app.request('/protected', {
        method: 'GET',
        headers: {
          'X-RAG-API-Key': 'wrong-api-key',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      const json = (await response.json()) as { error: string; message: string };
      expect(json.error).toBe('Unauthorized');
      expect(json.message).toContain('Invalid API key');
    });

    it('빈 API Key 문자열이면 401을 반환해야 함', async () => {
      const response = await app.request('/protected', {
        method: 'GET',
        headers: {
          'X-RAG-API-Key': '',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });
  });

  describe('다른 HTTP 메서드', () => {
    it('POST 요청도 인증되어야 함', async () => {
      app.use('/post', verifyAuth, async c => {
        return c.json({ method: 'POST' }, HttpStatusCodes.OK);
      });

      const response = await app.request('/post', {
        method: 'POST',
        headers: {
          'X-RAG-API-Key': 'test-api-key-12345',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
    });

    it('PUT 요청도 인증되어야 함', async () => {
      app.use('/put', verifyAuth, async c => {
        return c.json({ method: 'PUT' }, HttpStatusCodes.OK);
      });

      const response = await app.request('/put', {
        method: 'PUT',
        headers: {
          'X-RAG-API-Key': 'test-api-key-12345',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
    });

    it('DELETE 요청도 인증되어야 함', async () => {
      app.use('/delete', verifyAuth, async c => {
        return c.json({ method: 'DELETE' }, HttpStatusCodes.OK);
      });

      const response = await app.request('/delete', {
        method: 'DELETE',
        headers: {
          'X-RAG-API-Key': 'test-api-key-12345',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
    });
  });

  describe('미들웨어 체이닝', () => {
    it('다른 미들웨어와 함께 작동해야 함', async () => {
      app.use('/chained', async (c, next) => {
        // 다른 미들웨어에서 헤더 추가
        c.header('X-Custom-Header', 'test');
        await next();
      });

      app.use('/chained', verifyAuth, async c => {
        return c.json({ message: 'Success' }, HttpStatusCodes.OK);
      });

      const response = await app.request('/chained', {
        method: 'GET',
        headers: {
          'X-RAG-API-Key': 'test-api-key-12345',
        },
      });

      expect(response.status).toBe(HttpStatusCodes.OK);
      expect(response.headers.get('X-Custom-Header')).toBe('test');
    });

    it('인증 실패 시 다음 미들웨어를 실행하지 않아야 함', async () => {
      let nextCalled = false;

      app.use('/check-next', verifyAuth, async (c, next) => {
        nextCalled = true;
        await next();
      });

      app.use('/check-next', async c => {
        return c.json({ message: 'Should not reach' }, HttpStatusCodes.OK);
      });

      const response = await app.request('/check-next', {
        method: 'GET',
        // No API key
      });

      expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(nextCalled).toBe(false);
    });
  });
});
