import { serve } from '@hono/node-server';
import { env } from './env';
import { getQdrantService } from './services/qdrant';
import app from './app';

import type { RagGatewayApp } from './app';

// Initialize Qdrant collection before starting server
async function startServer() {
  try {
    const qdrantService = getQdrantService();
    await qdrantService.initializeCollection();
    console.log(`✅ Qdrant collection initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant collection:', error);
    // Continue anyway - collection might already exist
  }

  console.log(`🚀 RAG Gateway server running on port ${env.PORT}`);
  serve({ fetch: app.fetch, port: env.PORT });
}

startServer();

export type RagGatewayClient = RagGatewayApp;

export default app;
