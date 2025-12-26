/**
 * 공유 Redis 클라이언트
 * 애플리케이션 전체에서 단일 인스턴스를 사용하여 연결을 재사용
 */

import { createClient } from 'redis';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClient> | null = null;

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
    throw new Error(
      'REDIS_URL environment variable is not set. Redis caching is disabled.'
    );
  }

  // 연결 시작
  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            // 재연결 전략: 최대 10회 시도, 지수 백오프
            if (retries > 10) {
              console.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            const delay = Math.min(retries * 100, 3000);
            console.log(`Redis reconnecting... attempt ${retries + 1}, delay ${delay}ms`);
            return delay;
          },
        },
      });

      // 이벤트 리스너
      client.on('error', (err) => {
        console.error('Redis Client Error:', err);
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
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch {
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
