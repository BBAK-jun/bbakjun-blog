/**
 * RAG Handlers 테스트
 *
 * ingest, ingestStatus 핸들러를 검증합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { IngestionPipeline } from '@/lib/rag/ingestion';
import type { AppType } from '@/index';

// Mock services
vi.mock('@/services/qdrant', () => ({
  getQdrantService: vi.fn(() => ({
    initializeCollection: vi.fn(),
    upsertPoints: vi.fn(),
    deletePoints: vi.fn(),
    countPoints: vi.fn(),
  })),
}));

vi.mock('@/services/embedding', () => ({
  getEmbeddingService: vi.fn(() => ({
    generateBatchEmbeddings: vi.fn().mockResolvedValue([new Array(1536).fill(0.1)]),
    getCacheStats: vi.fn(() => ({ size: 0, memoryEstimate: 0 })),
    clearCache: vi.fn(),
  })),
}));

vi.mock('@/lib/rag/ingestion/chunkers/semantic', () => ({
  SemanticChunker: vi.fn().mockImplementation(() => ({
    chunk: vi.fn().mockResolvedValue([
      {
        id: 'chunk-1',
        content: 'Test chunk content',
        metadata: {
          position: { start: 0, end: 20, charCount: 20 },
          wordCount: 4,
        },
      },
    ]),
  })),
}));

// Mock IngestionPipeline
vi.mock('@/lib/rag/ingestion', () => ({
  IngestionPipeline: vi.fn().mockImplementation(() => ({
    startIngestion: vi.fn().mockResolvedValue('test-job-id'),
    getJobStatus: vi.fn(),
    getAllJobs: vi.fn(() => []),
    cleanupJobs: vi.fn(),
  })),
}));

describe('RAG Handlers - ingest()', () => {
  let app: AppType;

  beforeEach(() => {
    // Dynamic import to get the app
    app = new Hono();
    vi.clearAllMocks();
  });

  it('documents 배열을 받아 IngestionPipeline을 시작해야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockStartIngestion = vi.fn().mockResolvedValue('test-job-id-123');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: mockStartIngestion,
      getJobStatus: vi.fn(),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [
          {
            title: 'Test Doc',
            content: '# Test Content\n\nThis is a test.',
            slug: 'facts/test/doc',
            metadata: {
              category: 'facts/test',
              tags: ['test', 'demo'],
              author: 'claude-code',
            },
          },
        ],
        force: false,
        batchSize: 10,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.jobId).toBe('test-job-id-123');
    expect(data.status).toBe('started');
    expect(data.documentsCount).toBe(1);

    // IngestionPipeline이 올바른 인자로 호출되었는지 확인
    expect(mockStartIngestion).toHaveBeenCalledWith(
      expect.objectContaining({
        force: false,
        batchSize: 10,
        documents: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: '# Test Content\n\nThis is a test.',
            metadata: expect.objectContaining({
              title: 'Test Doc',
              slug: 'facts/test/doc',
              category: 'facts/test',
              tags: ['test', 'demo'],
              author: 'claude-code',
            }),
          }),
        ]),
      })
    );
  });

  it('빈 documents 배열로 처리되어야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockStartIngestion = vi.fn().mockResolvedValue('empty-job-id');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: mockStartIngestion,
      getJobStatus: vi.fn(),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [],
        force: false,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.jobId).toBe('empty-job-id');
    expect(data.documentsCount).toBe(0);
  });

  it('force와 batchSize 옵션을 전달해야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockStartIngestion = vi.fn().mockResolvedValue('test-job-id');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: mockStartIngestion,
      getJobStatus: vi.fn(),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [
          {
            title: 'Test',
            content: 'Test content',
            slug: 'test/doc',
            metadata: { category: 'test' },
          },
        ],
        force: true,
        batchSize: 50,
      }),
    });

    expect(response.status).toBe(200);

    // options에 force와 batchSize가 포함되어 있는지 확인
    expect(mockStartIngestion).toHaveBeenCalledWith(
      expect.objectContaining({
        force: true,
        batchSize: 50,
      })
    );
  });

  it('document.id가 없으면 자동 생성되어야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockStartIngestion = vi.fn().mockResolvedValue('test-job-id');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: mockStartIngestion,
      getJobStatus: vi.fn(),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [
          {
            // id 없음
            title: 'Test Doc',
            content: 'Test content',
            slug: 'facts/test/doc',
            metadata: { category: 'facts/test' },
          },
        ],
      }),
    });

    expect(response.status).toBe(200);

    // document.id가 자동 생성되었는지 확인
    const callArgs = vi.mocked(mockStartIngestion).mock.calls[0][0];
    expect(callArgs.documents[0].id).toBeDefined();
    expect(callArgs.documents[0].id).toMatch(/^[a-f0-9-]{36}$/); // UUID 형식
  });

  it('QdrantService와 EmbeddingService가 주입되어야 함', async () => {
    const { getQdrantService } = await import('@/services/qdrant');
    const { getEmbeddingService } = await import('@/services/embedding');
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');

    const mockQdrant = { initializeCollection: vi.fn() };
    const mockEmbedding = { generateBatchEmbeddings: vi.fn() };

    vi.mocked(getQdrantService).mockReturnValue(mockQdrant);
    vi.mocked(getEmbeddingService).mockReturnValue(mockEmbedding);

    const mockStartIngestion = vi.fn().mockResolvedValue('test-job-id');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: mockStartIngestion,
      getJobStatus: vi.fn(),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [
          {
            title: 'Test',
            content: 'Test',
            slug: 'test',
            metadata: { category: 'test' },
          },
        ],
      }),
    });

    expect(response.status).toBe(200);

    // IngestionPipeline이 올바른 서비스로 생성되었는지 확인
    expect(IngestionPipeline).toHaveBeenCalledWith(mockQdrant, mockEmbedding);
  });

  it('필수 필드가 누락되면 400 에러를 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    // title 누락
    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
      body: JSON.stringify({
        documents: [
          {
            // title 없음
            content: 'Test',
            slug: 'test',
            metadata: { category: 'test' },
          },
        ],
      }),
    });

    expect(response.status).toBe(422); // Zod validation returns 422
  });

  it('인증 없이 401 Unauthorized를 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // X-RAG-API-Key 없음
      },
      body: JSON.stringify({
        documents: [],
      }),
    });

    expect(response.status).toBe(401);
  });
});

describe('RAG Handlers - ingestStatus()', () => {
  let app: AppType;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('jobId로 job 상태를 조회할 수 있어야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockJob = {
      id: 'test-job-id',
      status: 'running' as const,
      progress: {
        total: 100,
        processed: 50,
        failed: 0,
        percentage: 50,
        current: 'Processing batch 5/10',
      },
      startedAt: new Date().toISOString(),
    };

    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: vi.fn(),
      getJobStatus: vi.fn().mockReturnValue(mockJob),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=test-job-id', {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.jobId).toBe('test-job-id');
    expect(data.status).toBe('running');
    expect(data.progress.total).toBe(100);
    expect(data.progress.processed).toBe(50);
    expect(data.progress.percentage).toBe(50);
  });

  it('존재하지 않는 jobId로 404를 반환해야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: vi.fn(),
      getJobStatus: vi.fn().mockReturnValue(null), // job 없음
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=non-existent', {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(404);
    const data = await response.json();

    expect(data.error).toBe('Job not found');
  });

  it('jobId 파라미터가 없으면 400 Bad Request를 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status', {
      // jobId 없음
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(422); // Zod validation returns 422
  });

  it('jobId 파라미터가 빈 문자열이면 400 Bad Request를 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=', {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(422); // Zod validation returns 422
  });

  it('completed 상태의 job을 조회할 수 있어야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockJob = {
      id: 'completed-job-id',
      status: 'completed' as const,
      progress: {
        total: 100,
        processed: 100,
        failed: 0,
        percentage: 100,
        current: 'Completed',
      },
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: vi.fn(),
      getJobStatus: vi.fn().mockReturnValue(mockJob),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=completed-job-id', {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe('completed');
    expect(data.completedAt).toBeDefined();
    expect(data.progress.percentage).toBe(100);
  });

  it('failed 상태의 job을 조회할 수 있어야 함', async () => {
    const { IngestionPipeline } = await import('@/lib/rag/ingestion');
    const mockJob = {
      id: 'failed-job-id',
      status: 'failed' as const,
      progress: {
        total: 100,
        processed: 50,
        failed: 1,
        percentage: 50,
        current: 'Failed to process document',
      },
      startedAt: new Date().toISOString(),
      error: 'Embedding API timeout',
    };

    vi.mocked(IngestionPipeline).mockImplementation(() => ({
      startIngestion: vi.fn(),
      getJobStatus: vi.fn().mockReturnValue(mockJob),
      getAllJobs: vi.fn(() => []),
      cleanupJobs: vi.fn(),
    }));

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=failed-job-id', {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': 'test-api-key-for-testing',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.status).toBe('failed');
    expect(data.error).toBe('Embedding API timeout');
  });

  it('인증 없이 401 Unauthorized를 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest/status?jobId=test', {
      method: 'GET',
      // X-RAG-API-Key 없음
    });

    expect(response.status).toBe(401);
  });
});
