/**
 * 배치 인제스트 통합 테스트
 *
 * POST /api/rag/ingest 엔드포인트의 전체 흐름을 검증합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import { IngestionPipeline } from '@/lib/rag/ingestion';
import type { AppType } from '@/index';

// Mock services
const mockQdrantService = {
  initializeCollection: vi.fn(),
  upsertPoints: vi.fn(),
  deletePoints: vi.fn(),
  countPoints: vi.fn(),
  scrollPoints: vi.fn(),
};

const mockEmbeddingService = {
  generateBatchEmbeddings: vi.fn(),
  getCacheStats: vi.fn(() => ({ size: 0, memoryEstimate: 0 })),
  clearCache: vi.fn(),
};

vi.mock('@/services/qdrant', () => ({
  getQdrantService: vi.fn(() => mockQdrantService),
}));

vi.mock('@/services/embedding', () => ({
  getEmbeddingService: vi.fn(() => mockEmbeddingService),
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

describe('배치 인제스트 통합 테스트 - POST /api/rag/ingest', () => {
  let app: AppType;
  const testApiKey = 'test-api-key-for-testing';

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up pipelines
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    // Note: Pipeline instances are created per request, so they're automatically cleaned up
  });

  describe('다중 문서 인제스트', () => {
    it('다중 문서 인제스트가 성공해야 함', async () => {
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const { default: ragRouter } = await import('@/routes/rag/rag.index');
      app.route('/api', ragRouter);

      const documents = [
        {
          title: 'Document 1',
          content: '# Document 1\n\nContent for document 1.',
          slug: 'facts/apps/blog-admin/apis',
          metadata: {
            category: 'facts/apps/blog-admin',
            tags: ['api', 'rpc'],
            author: 'claude-code',
          },
        },
        {
          title: 'Document 2',
          content: '# Document 2\n\nContent for document 2.',
          slug: 'facts/apps/blog-admin/config',
          metadata: {
            category: 'facts/apps/blog-admin',
            tags: ['config'],
            author: 'claude-code',
          },
        },
      ];

      const response = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents,
          batchSize: 2,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.jobId).toBeDefined();
      expect(data.jobId).toMatch(/^ingest_\d+$/);
      expect(data.status).toBe('started');
      expect(data.documentsCount).toBe(2);
      expect(data.message).toBe('Document ingestion started');

      // Background job이 시작되었는지 확인
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    it('단일 문서 인제스트가 성공해야 함', async () => {
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

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
              title: 'Single Document',
              content: 'Single document content',
              slug: 'facts/single',
              metadata: { category: 'facts' },
            },
          ],
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.documentsCount).toBe(1);
    });

    it('대량 문서 인제스트가 성공해야 함 (100개)', async () => {
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const { default: ragRouter } = await import('@/routes/rag/rag.index');
      app.route('/api', ragRouter);

      const documents = Array.from({ length: 100 }, (_, i) => ({
        title: `Document ${i}`,
        content: `Content ${i}`,
        slug: `facts/doc-${i}`,
        metadata: { category: 'facts' },
      }));

      const startTime = Date.now();

      const response = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents,
          batchSize: 50,
        }),
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.documentsCount).toBe(100);
      // 성능: 1초 이내에 응답 (background 작업이므로)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('force 옵션 통합 테스트', () => {
    it('force: true로 기존 문서를 재인덱싱해야 함', async () => {
      // 첫 번째 인제스트
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const { default: ragRouter } = await import('@/routes/rag/rag.index');
      app.route('/api', ragRouter);

      const documents = [
        {
          title: 'Document 1',
          content: 'Original content',
          slug: 'facts/doc-1',
          metadata: { category: 'facts' },
        },
      ];

      // 첫 번째 인제스트
      const response1 = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents,
          force: false,
        }),
      });

      expect(response1.status).toBe(200);
      const jobId1 = (await response1.json()).jobId;

      await new Promise(resolve => setTimeout(resolve, 200));

      // 두 번째 인제스트 (force: true)
      mockQdrantService.countPoints.mockResolvedValue(1); // 문서 존재

      const response2 = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents: [
            {
              title: 'Document 1 Updated',
              content: 'Updated content',
              slug: 'facts/doc-1',
              metadata: { category: 'facts' },
            },
          ],
          force: true,
        }),
      });

      expect(response2.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 200));

      // deletePoints가 호출되었는지 확인
      expect(mockQdrantService.deletePoints).toHaveBeenCalledWith({
        documentId: expect.any(String),
      });
    });

    it('force: false로 이미 인덱싱된 문서를 건너뛰어야 함', async () => {
      mockQdrantService.countPoints.mockResolvedValue(1); // 문서 존재
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

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
              title: 'Document 1',
              content: 'Content',
              slug: 'facts/doc-1',
              metadata: { category: 'facts' },
            },
          ],
          force: false,
        }),
      });

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 200));

      // 임베딩이 호출되지 않아야 함 (건너뜀)
      expect(mockEmbeddingService.generateBatchEmbeddings).not.toHaveBeenCalled();
    });
  });

  describe('batchSize 옵션 통합 테스트', () => {
    it('batchSize=1로 개별 처리해야 함', async () => {
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const { default: ragRouter } = await import('@/routes/rag/rag.index');
      app.route('/api', ragRouter);

      const documents = [
        { title: 'D1', content: 'C1', slug: 'd1', metadata: { category: 'test' } },
        { title: 'D2', content: 'C2', slug: 'd2', metadata: { category: 'test' } },
        { title: 'D3', content: 'C3', slug: 'd3', metadata: { category: 'test' } },
      ];

      const response = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents,
          batchSize: 1,
        }),
      });

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 300));

      // batchSize=1 이므로 upsertPoints가 3번 호출되어야 함
      expect(mockQdrantService.upsertPoints).toHaveBeenCalledTimes(3);
    });

    it('batchSize=10으로 배치 처리해야 함', async () => {
      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const { default: ragRouter } = await import('@/routes/rag/rag.index');
      app.route('/api', ragRouter);

      const documents = Array.from({ length: 25 }, (_, i) => ({
        title: `D${i}`,
        content: `C${i}`,
        slug: `d${i}`,
        metadata: { category: 'test' },
      }));

      const response = await app.request('/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RAG-API-Key': 'test-api-key-for-testing',
        },
        body: JSON.stringify({
          documents,
          batchSize: 10,
        }),
      });

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 500));

      // 25개 문서, batchSize=10 → 3개 배치
      expect(mockQdrantService.upsertPoints).toHaveBeenCalledTimes(3);
    });
  });
});

describe('배치 인제스트 통합 테스트 - GET /api/rag/ingest/status', () => {
  let app: AppType;
  const testApiKey = 'test-api-key-for-testing';

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('jobId로 진행률을 조회할 수 있어야 함', async () => {
    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    // 인제스트 시작
    const ingestResponse = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': testApiKey,
      },
      body: JSON.stringify({
        documents: [
          { title: 'Doc', content: 'Content', slug: 'test', metadata: { category: 'test' } },
        ],
      }),
    });

    const { jobId } = await ingestResponse.json();

    // 상태 조회
    const statusResponse = await app.request(`/api/rag/ingest/status?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': testApiKey,
      },
    });

    expect(statusResponse.status).toBe(200);
    const data = await statusResponse.json();

    expect(data.jobId).toBe(jobId);
    expect(['running', 'completed']).toContain(data.status);
    expect(data.progress).toBeDefined();
    expect(data.startedAt).toBeDefined();
  });

  it('완료된 job의 status가 completed여야 함', async () => {
    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    // 인제스트 시작
    const ingestResponse = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': testApiKey,
      },
      body: JSON.stringify({
        documents: [
          { title: 'Doc', content: 'Content', slug: 'test', metadata: { category: 'test' } },
        ],
      }),
    });

    const { jobId } = await ingestResponse.json();

    // 완료 대기
    await new Promise(resolve => setTimeout(resolve, 300));

    // 상태 조회
    const statusResponse = await app.request(`/api/rag/ingest/status?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': testApiKey,
      },
    });

    expect(statusResponse.status).toBe(200);
    const data = await statusResponse.json();

    expect(data.status).toBe('completed');
    expect(data.progress.percentage).toBe(100);
    expect(data.completedAt).toBeDefined();
  });

  it('진행 중인 job의 progress가 업데이트되어야 함', async () => {
    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);

    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    // 대량 문서로 진행률 확인
    const documents = Array.from({ length: 50 }, (_, i) => ({
      title: `Doc ${i}`,
      content: `Content ${i}`,
      slug: `doc-${i}`,
      metadata: { category: 'test' },
    }));

    const ingestResponse = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': testApiKey,
      },
      body: JSON.stringify({
        documents,
        batchSize: 10,
      }),
    });

    const { jobId } = await ingestResponse.json();

    // 진행 중 상태 조회
    await new Promise(resolve => setTimeout(resolve, 100));

    const statusResponse = await app.request(`/api/rag/ingest/status?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'X-RAG-API-Key': testApiKey,
      },
    });

    expect(statusResponse.status).toBe(200);
    const data = await statusResponse.json();

    expect(data.progress.total).toBe(50);
    expect(data.progress.processed).toBeGreaterThanOrEqual(0);
    expect(data.progress.percentage).toBeGreaterThanOrEqual(0);
    expect(data.progress.percentage).toBeLessThanOrEqual(100);
  });
});

describe('배치 인제스트 에러 처리', () => {
  let app: AppType;
  const testApiKey = 'test-api-key-for-testing';

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  it('잘못된 API Key로 401을 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': 'wrong-api-key',
      },
      body: JSON.stringify({
        documents: [],
      }),
    });

    expect(response.status).toBe(401);
  });

  it('필수 필드 누락 시 400을 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': testApiKey,
      },
      body: JSON.stringify({
        // documents 필드 누락
        force: false,
      }),
    });

    expect(response.status).toBe(422); // Zod validation returns 422
  });

  it('batchSize가 범위를 벗어나면 400을 반환해야 함', async () => {
    const { default: ragRouter } = await import('@/routes/rag/rag.index');
    app.route('/api', ragRouter);

    const response = await app.request('/api/rag/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RAG-API-Key': testApiKey,
      },
      body: JSON.stringify({
        documents: [],
        batchSize: 101, // 최대 100 초과
      }),
    });

    expect(response.status).toBe(422); // Zod validation returns 422
  });
});
