/**
 * 공유 Redis 클라이언트
 * 애플리케이션 전체에서 단일 인스턴스를 사용하여 연결을 재사용
 *
 * 장애 시 fail-fast 원칙:
 * - connectTimeout/commandTimeout을 짧게 잡아 연결 불능 상태에서
 *   요청이 오래 블로킹되지 않게 한다.
 * - circuit breaker: 연속 실패가 임계치를 넘으면 일정 시간 동안
 *   Redis 시도 자체를 건너뛰고 즉시 폴백(DB 직접 쿼리)한다.
 *   (과거 reconnect 지연 누적으로 요청당 ~6.5초가 걸렸던 사고 대응)
 */

import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

/** 연결 수립 타임아웃 (기본값 5초 → 장애 시 블로킹 최소화) */
const REDIS_CONNECT_TIMEOUT_MS = 2_000;
/** 소켓 읽기(커맨드) 타임아웃 */
const REDIS_SOCKET_TIMEOUT_MS = 5_000;
/** 재연결 최대 시도 횟수 */
const REDIS_MAX_RECONNECT_RETRIES = 2;
/** circuit breaker: 연속 실패 임계치 */
const REDIS_CIRCUIT_FAILURE_THRESHOLD = 2;
/** circuit breaker: 열린 상태 유지 시간 */
const REDIS_CIRCUIT_COOLDOWN_MS = 60_000;

let redisClient: RedisClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClient> | null = null;

// Circuit breaker 상태 (모듈 스코프 = 서버 인스턴스당)
let consecutiveRedisFailures = 0;
let redisCircuitOpenUntil = 0;

function isCircuitOpen(): boolean {
  return Date.now() < redisCircuitOpenUntil;
}

function markRedisFailure(): void {
  consecutiveRedisFailures += 1;
  if (consecutiveRedisFailures >= REDIS_CIRCUIT_FAILURE_THRESHOLD) {
    redisCircuitOpenUntil = Date.now() + REDIS_CIRCUIT_COOLDOWN_MS;
    console.warn(
      `[Cache] Redis unreachable (${consecutiveRedisFailures} consecutive failures) — ` +
        `circuit open for ${REDIS_CIRCUIT_COOLDOWN_MS / 1000}s, falling back to direct queries`
    );
  }
}

function markRedisSuccess(): void {
  consecutiveRedisFailures = 0;
  redisCircuitOpenUntil = 0;
}

/**
 * Redis 클라이언트 싱글톤 인스턴스 반환
 *
 * @returns 연결된 Redis 클라이언트
 * @throws REDIS_URL이 설정되지 않은 경우 에러 발생
 */
export async function getRedisClient(): Promise<RedisClient> {
  // 이미 연결된 인스턴스 반환
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // 연결 진행 중이면 같은 Promise 반환
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set. Redis caching is disabled.');
  }

  // 연결 시작
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
          socketTimeout: REDIS_SOCKET_TIMEOUT_MS,
          reconnectStrategy: retries => {
            if (retries > REDIS_MAX_RECONNECT_RETRIES) {
              return new Error(`Redis reconnection failed after ${retries} attempts`);
            }
            return Math.min(retries * 200, 1_000);
          },
        },
      });

      // 이벤트 리스너
      client.on('error', err => {
        console.error('Redis Client Error:', err.message);
      });

      client.on('connect', () => {
        console.log('Redis Client Connected');
      });

      client.on('reconnecting', () => {
        console.log('Redis Client Reconnecting...');
      });

      await client.connect();
      redisClient = client;
      isConnecting = false;
      return client;
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

/**
 * Redis 연결을 안전하게 종료
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    connectionPromise = null;
    isConnecting = false;
  }
}

/**
 * Redis가 사용 가능한지 확인
 *
 * circuit breaker가 열려 있으면 연결 시도 없이 즉시 false를 반환한다.
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (isCircuitOpen()) {
    return false;
  }

  try {
    const client = await getRedisClient();
    await client.ping();
    markRedisSuccess();
    return true;
  } catch {
    markRedisFailure();
    return false;
  }
}

/**
 * Redis를 사용하지 않는 noop 함수 (fallback용)
 */
export const noopRedis = {
  get: async () => null,
  set: async () => 'OK',
  del: async () => 0,
  keys: async () => [],
  expire: async () => 0,
  ping: async () => false,
  isOpen: false,
} as const;
