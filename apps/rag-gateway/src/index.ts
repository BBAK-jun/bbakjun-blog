import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { env } from './env';
import { getQdrantService } from './services/qdrant';
import { ragRoutes } from './routes/rag';
import { documentRoutes } from './routes/documents';
import { mcpRoutes } from './routes/mcp';
import { adminRoutes } from './routes/admin';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: env.ALLOWED_ORIGINS.split(','),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check endpoint
app.get('/health', c => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'rag-gateway',
    version: '0.1.0',
  });
});

// API Routes
app.route('/api/rag', ragRoutes);
app.route('/api/documents', documentRoutes);
app.route('/mcp', mcpRoutes);
app.route('/api/admin', adminRoutes);

// 404 handler
app.notFound(c => {
  return c.json(
    {
      error: 'Not Found',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    },
    500
  );
});

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

export default app;
