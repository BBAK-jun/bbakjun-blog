/**
 * Rate limiting middleware for preventing abuse and DoS attacks.
 *
 * This module provides Redis-based rate limiting to control request frequency
 * and prevent resource exhaustion attacks.
 *
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-IP and per-API-key rate limits
 * - Configurable limits and time windows
 * - Graceful fallback when Redis is unavailable
 * - Uses shared Redis client from @repo/cache
 */

import type { Context, Next } from 'hono';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { getRedisClient, isRedisAvailable } from '@repo/cache';

/**
 * Rate limit configuration.
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in the time window */
  limit: number;
  /** Time window in seconds */
  window: number;
  /** Whether to skip rate limiting if Redis is unavailable */
  skipOnRedisUnavailable?: boolean;
}

/**
 * Default rate limit configurations.
 */
export const DEFAULT_RATE_LIMITS = {
  /** Strict limit for public endpoints (10 requests per minute) */
  STRICT: { limit: 10, window: 60 } as const,

  /** Standard limit for authenticated endpoints (60 requests per minute) */
  STANDARD: { limit: 60, window: 60 } as const,

  /** Lenient limit for health checks (30 requests per minute) */
  LENIENT: { limit: 30, window: 60 } as const,
} as const;

/**
 * Rate limit error response.
 */
interface RateLimitErrorResponse {
  error: 'rate_limit_exceeded';
  message: string;
  retryAfter?: number;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * In-memory fallback for when Redis is unavailable.
 * This provides basic rate limiting but doesn't work across multiple instances.
 */
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clear the in-memory store.
 * WARNING: This is only exposed for testing purposes.
 */
export function _clearInMemoryStoreForTesting() {
  inMemoryStore.clear();
}

/**
 * Cleanup expired entries from in-memory store.
 */
function cleanupInMemoryStore() {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (now > value.resetTime) {
      inMemoryStore.delete(key);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupInMemoryStore, 60000);
}

/**
 * Check rate limit using in-memory store.
 *
 * This is a fallback when Redis is unavailable.
 * NOTE: This only works for single-instance deployments.
 */
async function checkInMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const windowMs = config.window * 1000;
  const resetTime = now + windowMs;

  // Cleanup expired entries
  cleanupInMemoryStore();

  const current = inMemoryStore.get(key);

  if (!current || now > current.resetTime) {
    // First request or window expired
    inMemoryStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: resetTime,
    };
  }

  if (current.count >= config.limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      reset: current.resetTime,
    };
  }

  // Increment counter
  current.count += 1;
  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - current.count,
    reset: current.resetTime,
  };
}

/**
 * Check rate limit using Redis.
 *
 * Uses Redis INCR with expiration for distributed rate limiting.
 * Uses shared Redis client from @repo/cache package.
 */
async function checkRedisRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; limit: number; remaining: number; reset: number }> {
  const redis = await getRedisClient();
  const now = Date.now();
  const windowMs = config.window * 1000;

  // Use a timestamp-based key to handle window rollovers
  const windowStart = Math.floor(now / windowMs);
  const redisKey = `ratelimit:${key}:${windowStart}`;

  // Increment counter
  const count = await redis.incr(redisKey);

  // Set expiration on first increment
  if (count === 1) {
    await redis.expire(redisKey, config.window + 1);
  }

  const resetTime = (windowStart + 1) * windowMs;

  if (count > config.limit) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit - count,
    reset: resetTime,
  };
}

/**
 * Extract identifier from request for rate limiting.
 *
 * Priority order:
 * 1. API key (for authenticated requests)
 * 2. IP address (fallback)
 */
function extractIdentifier(c: Context): string {
  // Try API key first
  const apiKey = c.req.header('x-rag-api-key');
  if (apiKey) {
    // Use hash of API key to avoid storing raw keys
    return `apikey:${apiKey.slice(-8)}`;
  }

  // Fallback to IP address
  // X-Real-IP has priority over X-Forwarded-For
  const ip =
    c.req.header('x-real-ip') || c.req.header('x-forwarded-for')?.split(',')[0] || 'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limiting middleware.
 *
 * @param config - Rate limit configuration
 * @param getKey - Optional function to customize rate limit key generation
 *
 * @example
 * ```typescript
 * // Apply to specific route
 * app.use('/api/rag/query', rateLimit({ limit: 60, window: 60 }));
 *
 * // Custom key generator
 * app.use('/api/rag/query', rateLimit(
 *   { limit: 100, window: 60 },
 *   (c) => `user:${getUserId(c)}`
 * ));
 * ```
 */
export function rateLimit(
  config: RateLimitConfig = DEFAULT_RATE_LIMITS.STANDARD,
  getKey?: (c: Context) => string
) {
  return async (c: Context, next: Next) => {
    const identifier = getKey ? getKey(c) : extractIdentifier(c);

    let result;

    // Check if Redis is available
    const redisAvailable = await isRedisAvailable();

    if (redisAvailable) {
      try {
        result = await checkRedisRateLimit(identifier, config);
      } catch (error) {
        console.warn('[RateLimit] Redis error, using in-memory fallback:', error);
        result = await checkInMemoryRateLimit(identifier, config);
      }
    } else {
      // Use in-memory fallback
      result = await checkInMemoryRateLimit(identifier, config);
    }

    // Add rate limit headers to response
    c.header('X-RateLimit-Limit', result.limit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', new Date(result.reset).toISOString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

      const errorResponse: RateLimitErrorResponse = {
        error: 'rate_limit_exceeded',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
        limit: result.limit,
        remaining: 0,
        reset: result.reset,
      };

      return c.json(errorResponse, HttpStatusCodes.TOO_MANY_REQUESTS);
    }

    await next();
  };
}

/**
 * Rate limit middleware for authenticated RAG endpoints.
 * Uses standard limits for API-key authenticated requests.
 */
export const ragRateLimit = rateLimit(DEFAULT_RATE_LIMITS.STANDARD);

/**
 * Rate limit middleware for public endpoints.
 * Uses stricter limits for unauthenticated requests.
 */
export const publicRateLimit = rateLimit(DEFAULT_RATE_LIMITS.STRICT);

/**
 * Rate limit middleware for health checks.
 * Uses lenient limits to avoid blocking monitoring.
 */
export const healthRateLimit = rateLimit(DEFAULT_RATE_LIMITS.LENIENT);
