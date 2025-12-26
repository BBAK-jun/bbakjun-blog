/**
 * Test setup file for RAG Gateway tests.
 *
 * This file configures the test environment and sets up
 * any necessary test fixtures or mocks.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.RAG_GATEWAY_API_KEY = 'test-api-key-for-testing';
process.env.QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test';
process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';
process.env.EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'openai';
