import { pinoLogger } from 'hono-pino';
import pino from 'pino';
import pretty from 'pino-pretty';
import { env } from '@/env';

/**
 * Cloudflare Workers(workerd)에서는 pino 기본 stdout 목적지(sonic-boom)가
 * `fs.write(fd, string, 'utf8', cb)` 시그니처로 호출해
 * `The "offset" argument must be of type number` 로 터진다.
 * 프로덕션(Workers 포함)에서는 console 로 직접 쓰는 목적지를 사용한다.
 */
const consoleDestination = {
  write(msg: string) {
    console.log(msg.trimEnd());
  },
};

export function logger() {
  const level = env.LOG_LEVEL || 'info';

  return pinoLogger({
    pino:
      env.NODE_ENV === 'production'
        ? pino({ level }, consoleDestination)
        : pino({ level }, pretty()),
  });
}
