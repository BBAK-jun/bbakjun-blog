import { hc } from 'hono/client';
import type { AppType } from '@/rpc';

/**
 * RPC 클라이언트 - blog-admin 내부에서 RPC 호출을 위해 사용
 *
 * RPC는 /api/[...routes]로 매핑되므로 빈 기준 경로 사용
 * 예: client['/api/rpc/getRAGStats'].$get()
 */
export const client = hc<AppType>('');
