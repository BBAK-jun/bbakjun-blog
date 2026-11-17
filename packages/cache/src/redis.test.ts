/**
 * redis.ts 유닛 테스트 — Redis 장애 시 fail-fast 동작 검증
 *
 * 배경: 운영에서 REDIS_URL이 접근 불가 상태가 되면 기존 reconnect 전략
 * (retries × 100ms, 최대 10회) 때문에 요청마다 ~6.5초가 블로킹되었다.
 * circuit breaker + 타임아웃으로 이를 방지한다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('redis', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

interface FakeClientOptions {
  connect?: () => Promise<void>;
  ping?: () => Promise<string>;
}

function makeFakeClient(options: FakeClientOptions = {}) {
  const client = {
    isOpen: false,
    on: vi.fn(),
    connect: vi.fn(async () => {
      await options.connect?.();
      client.isOpen = true;
    }),
    ping: vi.fn(async () => options.ping?.() ?? 'PONG'),
    quit: vi.fn(async () => {
      client.isOpen = false;
    }),
  };
  return client;
}

/** 모듈 상태(circuit breaker 포함)를 초기화하고 새로 로드 */
async function loadRedisModule() {
  vi.resetModules();
  return import('./redis');
}

describe('redis circuit breaker', () => {
  beforeEach(() => {
    createClientMock.mockReset();
    vi.stubEnv('REDIS_URL', 'redis://dead-host.example:6379');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('REDIS_URL이 없으면 에러 없이 false를 반환한다 (기존 동작 유지)', async () => {
    vi.stubEnv('REDIS_URL', '');
    const { isRedisAvailable } = await loadRedisModule();

    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('연속 실패 임계치(2회) 도달 후 circuit이 열리고, 이후 확인은 재시도 없이 즉시 false를 반환한다', async () => {
    createClientMock.mockImplementation(() =>
      makeFakeClient({ connect: () => Promise.reject(new Error('ECONNREFUSED')) })
    );
    const { isRedisAvailable } = await loadRedisModule();

    expect(await isRedisAvailable()).toBe(false);
    expect(await isRedisAvailable()).toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(2);

    // breaker open → 클라이언트 생성/연결 시도 없이 즉시 false
    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(2);
  });

  it('쿨다운(60초) 경과 후 다시 재시도한다', async () => {
    vi.useFakeTimers();
    createClientMock.mockImplementation(() =>
      makeFakeClient({ connect: () => Promise.reject(new Error('ETIMEDOUT')) })
    );
    const { isRedisAvailable } = await loadRedisModule();

    expect(await isRedisAvailable()).toBe(false);
    expect(await isRedisAvailable()).toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(2);

    // breaker open 상태
    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(2);

    // 60초 경과 → 재시도
    vi.setSystemTime(Date.now() + 60_001);
    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(3);
  });

  it('성공은 실패 카운트를 리셋한다 — 임계치 전에 성공이 끼면 breaker가 열리지 않는다', async () => {
    const failing = () => makeFakeClient({ connect: () => Promise.reject(new Error('ECONNREFUSED')) });
    const healthy = () => makeFakeClient();
    createClientMock.mockImplementation(failing);
    const { isRedisAvailable, closeRedisClient } = await loadRedisModule();
    expect(await isRedisAvailable()).toBe(false);

    // 성공 1회 → 카운트 리셋
    createClientMock.mockImplementation(healthy);
    expect(await isRedisAvailable()).toBe(true);
    await closeRedisClient();

    // 실패 1회 더 → 여전히 임계치(2) 미만 → breaker 미오픈
    createClientMock.mockImplementation(failing);
    expect(await isRedisAvailable()).toBe(false);

    // 다음 호출은 재시도해야 한다 (breaker 닫힘)
    expect(await isRedisAvailable()).toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(4);
  });

  it('연결은 되지만 ping이 실패해도 실패로 간주한다', async () => {
    let created: ReturnType<typeof makeFakeClient> | undefined;
    createClientMock.mockImplementation(() => {
      created = makeFakeClient({ ping: () => Promise.reject(new Error('ping timeout')) });
      return created;
    });
    const { isRedisAvailable } = await loadRedisModule();

    // 클라이언트는 재사용되므로 생성은 1회, ping이 2회 실패해야 breaker가 열린다
    await expect(isRedisAvailable()).resolves.toBe(false);
    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(created?.ping).toHaveBeenCalledTimes(2);

    // breaker open → ping 재시도 없이 즉시 false
    await expect(isRedisAvailable()).resolves.toBe(false);
    expect(created?.ping).toHaveBeenCalledTimes(2);
  });

  it('createClient에 fail-fast socket 타임아웃(connectTimeout/socketTimeout)을 전달한다', async () => {
    createClientMock.mockImplementation(() => makeFakeClient());
    const { isRedisAvailable } = await loadRedisModule();

    await expect(isRedisAvailable()).resolves.toBe(true);

    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        socket: expect.objectContaining({
          connectTimeout: 2_000,
          socketTimeout: 5_000,
        }),
      })
    );
  });

  it('reconnectStrategy는 최대 2회 재시도 후 포기한다 (무한 재연결 방지)', async () => {
    createClientMock.mockImplementation(() => makeFakeClient());
    const { isRedisAvailable } = await loadRedisModule();
    await expect(isRedisAvailable()).resolves.toBe(true);

    const call = createClientMock.mock.calls[0]?.[0] as { socket: { reconnectStrategy: (retries: number) => number | Error } };

    expect(call.socket.reconnectStrategy(0)).toBe(0); // 첫 재시도는 즉시
    expect(call.socket.reconnectStrategy(1)).toBe(200);
    expect(call.socket.reconnectStrategy(2)).toBe(400);
    expect(call.socket.reconnectStrategy(3)).toBeInstanceOf(Error);
  });
});
