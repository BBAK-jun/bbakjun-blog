/**
 * IngestionPipeline 단위 테스트
 *
 * 문서 배치 인제스트 파이프라인의 핵심 로직을 검증합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IngestionPipeline, type IngestionOptions } from '@/lib/rag/ingestion/pipeline';

// Mock services
const mockQdrantService = {
  initializeCollection: vi.fn(),
  upsertPoints: vi.fn(),
  deletePoints: vi.fn(),
  countPoints: vi.fn(),
};

const mockEmbeddingService = {
  generateBatchEmbeddings: vi.fn(),
};

// Mock SemanticChunker
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

describe('IngestionPipeline - startIngestion()', () => {
  let pipeline: IngestionPipeline;

  beforeEach(() => {
    pipeline = new IngestionPipeline(mockQdrantService, mockEmbeddingService);
    vi.clearAllMocks();
    // Reset all mock implementations to default (resolved value)
    mockQdrantService.upsertPoints.mockResolvedValue(undefined);
    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);
  });

  afterEach(() => {
    pipeline.cleanupJobs(0); // Clean up all jobs after each test
  });

  describe('빈 documents 배열 처리', () => {
    it('빈 documents 배열로 인제스트 시 completed 상태로 완료되어야 함', async () => {
      const options: IngestionOptions = {
        documents: [],
      };

      const jobId = await pipeline.startIngestion(options);

      // Background 작업 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      const job = pipeline.getJobStatus(jobId);
      expect(job).toBeDefined();
      expect(job?.status).toBe('completed');
      expect(job?.progress.total).toBe(0);
      expect(job?.progress.current).toBe('No documents to process');
    });

    it('빈 documents 배열일 때 Qdrant 초기화만 수행해야 함', async () => {
      const options: IngestionOptions = {
        documents: [],
      };

      await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockQdrantService.initializeCollection).toHaveBeenCalledTimes(1);
      expect(mockEmbeddingService.generateBatchEmbeddings).not.toHaveBeenCalled();
      expect(mockQdrantService.upsertPoints).not.toHaveBeenCalled();
    });
  });

  describe('documents 배열 배치 처리', () => {
    it('documents 배열로 batch 처리를 수행해야 함', async () => {
      const documents = [
        {
          id: 'doc-1',
          content: 'Test content 1',
          metadata: {
            title: 'Doc 1',
            slug: 'doc-1',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
        {
          id: 'doc-2',
          content: 'Test content 2',
          metadata: {
            title: 'Doc 2',
            slug: 'doc-2',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ];

      const options: IngestionOptions = {
        documents,
        batchSize: 2,
      };

      mockQdrantService.countPoints.mockResolvedValue(0); // 문서 없음
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const jobId = await pipeline.startIngestion(options);

      // Background 작업 완료 대기
      await new Promise(resolve => setTimeout(resolve, 200));

      const job = pipeline.getJobStatus(jobId);
      expect(job?.status).toBe('completed');
      expect(job?.progress.total).toBe(2);
      expect(job?.progress.processed).toBe(2);
      expect(mockQdrantService.upsertPoints).toHaveBeenCalled();
    });

    it('batchSize별로 문서를 나누어 처리해야 함', async () => {
      const documents = Array.from({ length: 5 }, (_, i) => ({
        id: `doc-${i}`,
        content: `Content ${i}`,
        metadata: {
          title: `Doc ${i}`,
          slug: `doc-${i}`,
          author: 'test',
          category: 'test',
          tags: [],
          publishedAt: new Date().toISOString(),
          wordCount: 10,
          language: 'ko',
          source: 'upload' as const,
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      }));

      const options: IngestionOptions = {
        documents,
        batchSize: 2,
      };

      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const jobId = await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 300));

      // batchSize=2 이므로 3개 배치 (2 + 2 + 1)
      expect(mockEmbeddingService.generateBatchEmbeddings).toHaveBeenCalledTimes(5); // 5개 문서
      expect(mockQdrantService.upsertPoints).toHaveBeenCalledTimes(3); // 3개 배치
    });
  });

  describe('force 옵션 동작', () => {
    beforeEach(() => {
      mockQdrantService.countPoints.mockResolvedValue(1); // 문서 존재
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);
    });

    it('force: true 시 기존 문서를 삭제 후 재인덱싱해야 함', async () => {
      const documents = [
        {
          id: 'doc-1',
          content: 'Updated content',
          metadata: {
            title: 'Doc 1',
            slug: 'doc-1',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ];

      const options: IngestionOptions = {
        documents,
        force: true,
        batchSize: 10,
      };

      const jobId = await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockQdrantService.deletePoints).toHaveBeenCalledWith({
        documentId: 'doc-1',
      });
      expect(mockEmbeddingService.generateBatchEmbeddings).toHaveBeenCalled();
    });

    it('force: false 시 이미 존재하는 문서는 건너뛰어야 함', async () => {
      const documents = [
        {
          id: 'doc-1',
          content: 'Content',
          metadata: {
            title: 'Doc 1',
            slug: 'doc-1',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ];

      const options: IngestionOptions = {
        documents,
        force: false,
        batchSize: 10,
      };

      const jobId = await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockQdrantService.deletePoints).not.toHaveBeenCalled();
      expect(mockEmbeddingService.generateBatchEmbeddings).not.toHaveBeenCalled();
    });
  });

  describe('개별 문서 실패 처리', () => {
    it('개별 문서 실패 시 전체 작업이 계속되어야 함', async () => {
      const documents = [
        {
          id: 'doc-1',
          content: 'Content 1',
          metadata: {
            title: 'Doc 1',
            slug: 'doc-1',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
        {
          id: 'doc-2',
          content: 'Content 2',
          metadata: {
            title: 'Doc 2',
            slug: 'doc-2',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ];

      const options: IngestionOptions = {
        documents,
        batchSize: 10,
      };

      // 첫 번째 문서는 성공, 두 번째 문서는 임베딩 실패
      mockQdrantService.countPoints
        .mockResolvedValueOnce(0) // doc-1 없음
        .mockResolvedValueOnce(0); // doc-2 없음

      mockEmbeddingService.generateBatchEmbeddings
        .mockResolvedValueOnce([new Array(1536).fill(0.1)]) // doc-1 성공
        .mockRejectedValueOnce(new Error('Embedding failed')); // doc-2 실패

      const jobId = await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 300));

      const job = pipeline.getJobStatus(jobId);
      expect(job?.progress.failed).toBe(1);
      expect(job?.progress.processed).toBe(2); // 두 문서 모두 시도 (doc-1 성공, doc-2 실패)
    });

    it('Qdrant upsert 실패 시 job이 failed 상태가 되어야 함', async () => {
      const documents = [
        {
          id: 'doc-1',
          content: 'Content 1',
          metadata: {
            title: 'Doc 1',
            slug: 'doc-1',
            author: 'test',
            category: 'test',
            tags: [],
            publishedAt: new Date().toISOString(),
            wordCount: 10,
            language: 'ko',
            source: 'upload' as const,
            uploadedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          },
        },
      ];

      const options: IngestionOptions = {
        documents,
        batchSize: 10,
      };

      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);
      mockQdrantService.upsertPoints.mockRejectedValue(
        new Error('Qdrant connection failed')
      );

      const jobId = await pipeline.startIngestion(options);
      await new Promise(resolve => setTimeout(resolve, 300));

      const job = pipeline.getJobStatus(jobId);
      expect(job?.status).toBe('failed');
      expect(job?.error).toBeDefined();
    });
  });

  describe('진행률 업데이트', () => {
    it('진행률(progress)가 올바르게 업데이트되어야 함', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `doc-${i}`,
        content: `Content ${i}`,
        metadata: {
          title: `Doc ${i}`,
          slug: `doc-${i}`,
          author: 'test',
          category: 'test',
          tags: [],
          publishedAt: new Date().toISOString(),
          wordCount: 10,
          language: 'ko',
          source: 'upload' as const,
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      }));

      const options: IngestionOptions = {
        documents,
        batchSize: 3,
      };

      mockQdrantService.countPoints.mockResolvedValue(0);
      mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
        new Array(1536).fill(0.1),
      ]);

      const jobId = await pipeline.startIngestion(options);

      // 중간 진행률 확인
      await new Promise(resolve => setTimeout(resolve, 100));
      const midJob = pipeline.getJobStatus(jobId);
      expect(midJob?.progress.total).toBe(10);

      // 완료 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      const finalJob = pipeline.getJobStatus(jobId);
      expect(finalJob?.status).toBe('completed');
      expect(finalJob?.progress.percentage).toBe(100);
      expect(finalJob?.progress.current).toBe('Completed');
    });
  });
});

describe('IngestionPipeline - getJobStatus()', () => {
  let pipeline: IngestionPipeline;

  beforeEach(() => {
    pipeline = new IngestionPipeline(mockQdrantService, mockEmbeddingService);
    vi.clearAllMocks();
    // Reset all mock implementations to default (resolved value)
    mockQdrantService.upsertPoints.mockResolvedValue(undefined);
    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);
  });

  afterEach(() => {
    pipeline.cleanupJobs(0);
  });

  it('존재하는 jobId로 상태 조회를 해야 함', async () => {
    const options: IngestionOptions = {
      documents: [],
    };

    const jobId = await pipeline.startIngestion(options);
    await new Promise(resolve => setTimeout(resolve, 100));

    const job = pipeline.getJobStatus(jobId);
    expect(job).toBeDefined();
    expect(job?.id).toBe(jobId);
  });

  it('존재하지 않는 jobId로 null을 반환해야 함', () => {
    const job = pipeline.getJobStatus('non-existent-job-id');
    expect(job).toBeNull();
  });

  it('job.status가 running → completed로 변경되어야 함', async () => {
    const documents = [
      {
        id: 'doc-1',
        content: 'Content',
        metadata: {
          title: 'Doc 1',
          slug: 'doc-1',
          author: 'test',
          category: 'test',
          tags: [],
          publishedAt: new Date().toISOString(),
          wordCount: 10,
          language: 'ko',
          source: 'upload' as const,
          uploadedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        },
      },
    ];

    const options: IngestionOptions = {
      documents,
      batchSize: 10,
    };

    mockQdrantService.countPoints.mockResolvedValue(0);
    mockEmbeddingService.generateBatchEmbeddings.mockResolvedValue([
      new Array(1536).fill(0.1),
    ]);

    const jobId = await pipeline.startIngestion(options);

    // 초기 상태: running
    let job = pipeline.getJobStatus(jobId);
    expect(job?.status).toBe('running');

    // 완료 대기
    await new Promise(resolve => setTimeout(resolve, 200));

    // 최종 상태: completed
    job = pipeline.getJobStatus(jobId);
    expect(job?.status).toBe('completed');
    expect(job?.completedAt).toBeDefined();
  });
});

describe('IngestionPipeline - cleanupJobs()', () => {
  it('오래된 job을 삭제해야 함 (기본 24시간)', async () => {
    const pipeline = new IngestionPipeline(mockQdrantService, mockEmbeddingService);

    // Job 생성
    await pipeline.startIngestion({ documents: [] });
    await new Promise(resolve => setTimeout(resolve, 100));

    const jobsBefore = pipeline.getAllJobs();
    expect(jobsBefore.length).toBeGreaterThan(0);

    // 0시간 기준으로 정리 (모든 job 삭제)
    pipeline.cleanupJobs(0);

    const jobsAfter = pipeline.getAllJobs();
    expect(jobsAfter.length).toBe(0);
  });

  it('youngerThanHours로 기준을 조정할 수 있어야 함', async () => {
    const pipeline = new IngestionPipeline(mockQdrantService, mockEmbeddingService);

    await pipeline.startIngestion({ documents: [] });
    await new Promise(resolve => setTimeout(resolve, 100));

    // 1시간 이내의 job은 유지
    pipeline.cleanupJobs(1);

    const jobs = pipeline.getAllJobs();
    expect(jobs.length).toBeGreaterThan(0);
  });
});

describe('IngestionPipeline - getAllJobs()', () => {
  it('모든 job 목록을 반환해야 함', async () => {
    const pipeline = new IngestionPipeline(mockQdrantService, mockEmbeddingService);

    // 이전 테스트의 job 정리
    pipeline.cleanupJobs(0);

    // 3개 job 생성
    const jobIds = await Promise.all([
      pipeline.startIngestion({ documents: [] }),
      pipeline.startIngestion({ documents: [] }),
      pipeline.startIngestion({ documents: [] }),
    ]);

    // 빈 documents는 즉시 완료되므로 짧게 대기
    await new Promise(resolve => setTimeout(resolve, 50));

    const jobs = pipeline.getAllJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(3);

    // jobId 확인
    const returnedIds = jobs.map(j => j.id);
    for (const jobId of jobIds) {
      expect(returnedIds).toContain(jobId);
    }

    pipeline.cleanupJobs(0);
  });
});
