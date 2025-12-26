import { env } from '@/env';
import { RagGatewayApp } from '@apps/rag-gateway/rpc';
import { hc } from 'hono/client';

export const ragClient = hc<RagGatewayApp>(`${env.NEXT_PUBLIC_RAG_GATEWAY_URL}/api`);
