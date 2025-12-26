/**
 * Security Headers 미들웨어 테스트
 *
 * 보안 헤더 추가 기능을 검증합니다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { apiSecurityHeaders, securityHeaders } from '@/middleware/security-headers';

describe('Security Headers 미들웨어', () => {
  let app: Hono;

  beforeEach(() => {
    // Set production mode
    process.env.NODE_ENV = 'production';

    app = new Hono();
    app.use('/test', apiSecurityHeaders, async c => {
      return c.json({ message: 'Success' });
    });
  });

  describe('apiSecurityHeaders (기본)', () => {
    it('Content-Security-Policy 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Content-Security-Policy')).toBe(
        "default-src 'none'; frame-ancestors 'none'"
      );
    });

    it('X-Frame-Options: DENY 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('X-Content-Type-Options: nosniff 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('X-XSS-Protection 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('Strict-Transport-Security 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      const hsts = response.headers.get('Strict-Transport-Security');
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });

    it('Referrer-Policy: no-referrer 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    });

    it('Permissions-Policy 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      const permissions = response.headers.get('Permissions-Policy');
      expect(permissions).toBeDefined();
      expect(permissions).toContain('geolocation=()');
      expect(permissions).toContain('microphone=()');
    });

    it('Cross-Origin-Opener-Policy 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    });

    it('Cross-Origin-Embedder-Policy 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Cross-Origin-Embedder-Policy')).toBe('require-corp');
    });

    it('Cross-Origin-Resource-Policy 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    });

    it('X-DNS-Prefetch-Control: off 헤더를 추가해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('X-DNS-Prefetch-Control')).toBe('off');
    });

    it('Server 헤더를 제거해야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('Server')).toBe('');
    });
  });

  describe('개발 모드', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';

      app = new Hono();
      app.use('/dev', apiSecurityHeaders, async c => {
        return c.json({ message: 'Dev' });
      });
    });

    it('개발 모드에서는 헤더를 추가하지 않아야 함', async () => {
      const response = await app.request('/dev');

      expect(response.headers.get('Content-Security-Policy')).toBeNull();
      expect(response.headers.get('X-Frame-Options')).toBeNull();
    });
  });

  describe('커스텀 설정', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      app = new Hono();
      app.use(
        '/custom',
        securityHeaders({
          csp: "default-src 'self'",
          frameOptions: 'SAMEORIGIN',
          hsts: false,
        }),
        async c => {
          return c.json({ message: 'Custom' });
        }
      );
    });

    it('커스텀 CSP를 적용할 수 있어야 함', async () => {
      const response = await app.request('/custom');

      expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'self'");
    });

    it('커스텀 X-Frame-Options를 적용할 수 있어야 함', async () => {
      const response = await app.request('/custom');

      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('HSTS를 비활성화할 수 있어야 함', async () => {
      const response = await app.request('/custom');

      expect(response.headers.get('Strict-Transport-Security')).toBeNull();
    });
  });

  describe('모든 라우트 적용', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      app = new Hono();
      app.use('*', apiSecurityHeaders);

      app.get('/api/test', async c => {
        return c.json({ message: 'Test' });
      });

      app.get('/api/other', async c => {
        return c.json({ message: 'Other' });
      });
    });

    it('모든 경로에 헤더가 적용되어야 함', async () => {
      const response1 = await app.request('/api/test');
      const response2 = await app.request('/api/other');

      expect(response1.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response2.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('헤더 조합', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';

      app = new Hono();
      app.use('/test', apiSecurityHeaders, async (c, next) => {
        // Add custom header before security headers
        c.header('X-Custom', 'custom-value');
        await next();
      });
    });

    it('다른 헤더와 함께 사용할 수 있어야 함', async () => {
      const response = await app.request('/test');

      expect(response.headers.get('X-Custom')).toBe('custom-value');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });
});
