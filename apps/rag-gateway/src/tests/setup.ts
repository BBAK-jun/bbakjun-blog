/**
 * Test setup file for RAG Gateway tests.
 *
 * This file configures the test environment and sets up
 * any necessary test fixtures or mocks.
 */

import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.RAG_GATEWAY_API_KEY = 'test-api-key-for-testing';
process.env.QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test';
process.env.GLM_API_KEY = process.env.GLM_API_KEY || 'test-glm-key';
process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
process.env.EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'openai';

// Mock @repo/cache package (not used in rag-gateway but imported in some tests)
vi.mock('@repo/cache', () => ({
  cachedQuery: vi.fn(),
  invalidateCache: vi.fn(),
  CacheKeys: {
    blobFiles: vi.fn(() => 'mock-key'),
    blobFilesPattern: vi.fn(() => 'mock-pattern'),
  },
  cache: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));
