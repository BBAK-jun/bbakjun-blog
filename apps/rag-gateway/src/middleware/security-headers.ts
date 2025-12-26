/**
 * Security headers middleware for hardening HTTP responses.
 *
 * This module adds security-related HTTP headers to prevent common
 * web vulnerabilities and attacks.
 *
 * References:
 * - OWASP Secure Headers: https://owasp.org/www-project-secure-headers/
 * - MDN HTTP Headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 */

import type { Context, Next } from 'hono';

/**
 * Security header configuration.
 */
export interface SecurityHeadersConfig {
  /** Content Security Policy */
  csp?: string;
  /** X-Frame-Options value */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  /** X-Content-Type-Options */
  noSniff?: boolean;
  /** X-XSS-Protection */
  xssProtection?: boolean;
  /** Strict-Transport-Security */
  hsts?: boolean;
  /** HSTS max-age in seconds */
  hstsMaxAge?: number;
  /** HSTS includeSubDomains */
  hstsIncludeSubDomains?: boolean;
  /** HSTS preload */
  hstsPreload?: boolean;
  /** Referrer-Policy */
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  /** Permissions-Policy */
  permissionsPolicy?: string;
  /** Cross-Origin-Opener-Policy */
  coop?: string;
  /** Cross-Origin-Embedder-Policy */
  coep?: string;
  /** Cross-Origin-Resource-Policy */
  corp?: 'same-origin' | 'same-site' | 'cross-origin';
}

/**
 * Default security headers configuration.
 *
 * These defaults provide strong security for an API-only service.
 */
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  // Content Security Policy - restrict resources API can load
  // Since this is an API, we use a restrictive policy
  csp: "default-src 'none'; frame-ancestors 'none'",

  // Prevent clickjacking
  frameOptions: 'DENY',

  // Prevent MIME type sniffing
  noSniff: true,

  // Enable browser XSS filter (legacy, but still useful)
  xssProtection: true,

  // HSTS - enforce HTTPS for 1 year
  hsts: true,
  hstsMaxAge: 31536000,
  hstsIncludeSubDomains: true,
  hstsPreload: true,

  // Referrer Policy - don't send referrer for cross-origin requests
  referrerPolicy: 'no-referrer',

  // Permissions Policy - disable all features (API doesn't need them)
  permissionsPolicy:
    'geolocation=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), ' +
    'payment=(), usb=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), ' +
    'clipboard-write=(), encryption-media=(), focus-without-user-activation=(), ' +
    'hid=(), interest-cohort=(), lazyload=(), local-fonts=(), oversized-images=(), ' +
    'publickey-credentials-get=(), sync-xhr=(), xr-spatial-tracking=()',

  // Cross-Origin isolation
  coop: 'same-origin',
  coep: 'require-corp',

  // Cross-Origin-Resource-Policy - restrict resource access
  corp: 'same-origin',
};

/**
 * Apply security headers to response.
 *
 * This middleware adds security headers to all responses.
 * Headers are only added in production or when explicitly enabled.
 *
 * @param config - Security headers configuration
 * @param options - Additional options
 *
 * @example
 * ```typescript
 * // Use defaults
 * app.use('*', securityHeaders());
 *
 * // Custom configuration
 * app.use('*', securityHeaders({
 *   csp: "default-src 'self'",
 *   frameOptions: 'SAMEORIGIN'
 * }));
 *
 * // Always apply (even in development)
 * app.use('*', securityHeaders(DEFAULT_SECURITY_HEADERS, {
 *   skipDevelopment: false
 * }));
 * ```
 */
export function securityHeaders(
  config: SecurityHeadersConfig = DEFAULT_SECURITY_HEADERS,
  options: { skipDevelopment?: boolean } = {}
) {
  const { skipDevelopment = true } = options;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return async (c: Context, next: Next) => {
    // Skip in development if enabled
    if (skipDevelopment && isDevelopment) {
      await next();
      return;
    }

    await next();

    // Content Security Policy
    if (config.csp) {
      c.header('Content-Security-Policy', config.csp);
    }

    // X-Frame-Options - prevent clickjacking
    if (config.frameOptions) {
      c.header('X-Frame-Options', config.frameOptions);
    }

    // X-Content-Type-Options - prevent MIME sniffing
    if (config.noSniff) {
      c.header('X-Content-Type-Options', 'nosniff');
    }

    // X-XSS-Protection - enable browser XSS filter
    if (config.xssProtection) {
      c.header('X-XSS-Protection', '1; mode=block');
    }

    // Strict-Transport-Security - enforce HTTPS
    if (config.hsts) {
      const maxAge = config.hstsMaxAge ?? 31536000;
      const directives = [`max-age=${maxAge}`];

      if (config.hstsIncludeSubDomains) {
        directives.push('includeSubDomains');
      }

      if (config.hstsPreload) {
        directives.push('preload');
      }

      c.header('Strict-Transport-Security', directives.join('; '));
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      c.header('Referrer-Policy', config.referrerPolicy);
    }

    // Permissions-Policy
    if (config.permissionsPolicy) {
      c.header('Permissions-Policy', config.permissionsPolicy);
    }

    // Cross-Origin-Opener-Policy
    if (config.coop) {
      c.header('Cross-Origin-Opener-Policy', config.coop);
    }

    // Cross-Origin-Embedder-Policy
    if (config.coep) {
      c.header('Cross-Origin-Embedder-Policy', config.coep);
    }

    // Cross-Origin-Resource-Policy
    if (config.corp) {
      c.header('Cross-Origin-Resource-Policy', config.corp);
    }

    // Additional security headers
    c.header('X-DNS-Prefetch-Control', 'off');
    c.header('X-Download-Options', 'noopen');
    c.header('X-Permitted-Cross-Domain-Policies', 'none');
    c.header('Server', ''); // Hide server information
  };
}

/**
 * API-specific security headers middleware.
 *
 * Preconfigured for API-only services with restrictive defaults.
 */
export const apiSecurityHeaders = securityHeaders(DEFAULT_SECURITY_HEADERS);

/**
 * Development-friendly security headers.
 *
 * Allows frame embedding for local development.
 */
export const devSecurityHeaders = securityHeaders({
  ...DEFAULT_SECURITY_HEADERS,
  frameOptions: 'SAMEORIGIN',
  csp: "default-src 'self'; frame-ancestors 'self'",
});

/**
 * Apply security headers only to specific routes.
 *
 * @param routes - Route patterns to apply headers to
 * @param config - Security headers configuration
 *
 * @example
 * ```typescript
 * // Apply only to /api routes
 * app.use('/api/*', securityHeadersForRoutes(['/api']));
 * ```
 */
export function securityHeadersForRoutes(
  routes: string[],
  config: SecurityHeadersConfig = DEFAULT_SECURITY_HEADERS
) {
  const middleware = securityHeaders(config);

  return async (c: Context, next: Next) => {
    // Check if current path matches any route pattern
    const matches = routes.some(route => {
      // Simple wildcard matching
      const pattern = route.replace(/\*/g, '.*');
      return new RegExp(`^${pattern}`).test(c.req.path);
    });

    if (matches) {
      return middleware(c, next);
    }

    await next();
  };
}
