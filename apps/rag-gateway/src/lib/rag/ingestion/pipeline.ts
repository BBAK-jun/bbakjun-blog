import type { ChunkingOptions, Document, QdrantPoint, DocumentSource } from '../types';
import { generateDocumentId } from '../types';
import matter from 'gray-matter';
import { sendNotification, getNotificationConfig } from '@/lib/notifications';

// BlobFile 타입 정의 (외부에서 전달받을 파일 정보)
export interface BlobFileInfo {
  url: string;
  pathname: string;
  contentType: string | null;
}

// 게시글 메타데이터 및 컨텐츠
export interface PostWithFileInfo {
  slug: string;
  content: string;
  frontMatter: {
    title?: string;
    date?: string;
    description?: string;
    tags?: string[];
    author?: string;
    [key: string]: any;
  };
}

export interface IngestionOptions {
  force?: boolean;
  batchSize?: number;
  chunking?: ChunkingOptions;
  documents?: Document[]; // Direct documents to ingest
}

export interface IngestionProgress {
  total: number;
  processed: number;
  failed: number;
  percentage: number;
  current: string;
}

export interface IngestionJob {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: IngestionProgress;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export class IngestionPipeline {
  private jobs = new Map<string, IngestionJob>();
  private qdrantService: any; // Will be injected
  private embeddingService: any; // Will be injected

  constructor(qdrantService: any, embeddingService: any) {
    this.qdrantService = qdrantService;
    this.embeddingService = embeddingService;
  }

  /**
   * Start ingestion process
   */
  async startIngestion(options: IngestionOptions = {}): Promise<string> {
    const jobId = `ingest_${Date.now()}`;

    // Initialize job
    this.jobs.set(jobId, {
      id: jobId,
      status: 'running',
      progress: {
        total: 0,
        processed: 0,
        failed: 0,
        percentage: 0,
        current: 'Initializing...',
      },
      startedAt: new Date().toISOString(),
    });

    // Run ingestion in background with notification
    this.runIngestion(jobId, options)
      .then(async () => {
        // Job completed successfully - send notification
        const job = this.jobs.get(jobId);
        if (job) {
          const config = getNotificationConfig();
          if (config.slack || config.email) {
            await sendNotification(job, config).catch(err => {
              console.error('❌ Failed to send notification:', err);
            });
          }
        }
      })
      .catch(async error => {
        // Job failed - update status and send notification
        const job = this.jobs.get(jobId);
        if (job) {
          job.status = 'failed';
          job.error = error instanceof Error ? error.message : String(error);
          job.completedAt = new Date().toISOString();

          // Send failure notification
          const config = getNotificationConfig();
          if (config.slack || config.email) {
            await sendNotification(job, config).catch(err => {
              console.error('❌ Failed to send notification:', err);
            });
          }
        }
      });

    return jobId;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): IngestionJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Run the actual ingestion process
   */
  private async runIngestion(jobId: string, options: IngestionOptions): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    try {
      // Initialize Qdrant collection
      await this.qdrantService.initializeCollection();

      // Use provided documents or empty array
      const documents = options.documents || [];
      job.progress.total = documents.length;

      if (documents.length === 0) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.progress.current = 'No documents to process';
        return;
      }

      // Process documents in batches
      const batchSize = options.batchSize || 10;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        job.progress.current = `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`;

        await this.processBatch(batch, job, options);

        // Update progress
        job.progress.processed = Math.min(i + batchSize, documents.length);
        job.progress.percentage = Math.round((job.progress.processed / documents.length) * 100);
      }

      // Mark as completed
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.progress.current = 'Completed';
    } catch (error) {
      console.error('❌ Ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Process a batch of documents
   */
  private async processBatch(
    documents: Document[],
    job: IngestionJob,
    options: IngestionOptions
  ): Promise<void> {
    const points: QdrantPoint[] = [];

    for (const document of documents) {
      try {
        // Check if document already exists (unless force reindexing)
        if (!options.force) {
          const existing = await this.checkDocumentExists(document.id);
          if (existing) {
            console.log(`⏭️ Skipping ${document.id} (already indexed)`);
            continue;
          }
        }

        // Delete existing document if updating
        if (options.force) {
          await this.qdrantService.deletePoints({ documentId: document.id });
        }

        // Chunk the document
        const { SemanticChunker } = await import('./chunkers/semantic');
        const chunker = new SemanticChunker();
        const chunks = await chunker.chunk(document.content, options.chunking);

        // Generate embeddings for chunks
        const texts = chunks.map(c => c.content);
        const embeddings = await this.embeddingService.generateBatchEmbeddings(texts);

        // Create Qdrant points
        chunks.forEach((chunk, index) => {
          points.push({
            id: `${document.id}_${chunk.id}`,
            vector: embeddings[index],
            payload: {
              documentId: document.id,
              chunkIndex: index,
              content: chunk.content,
              metadata: document.metadata,
              position: chunk.metadata.position,
            },
          });
        });
      } catch (error) {
        console.error(`❌ Failed to process document ${document.id}:`, error);
        job.progress.failed++;
      }
    }

    // Upsert points to Qdrant
    if (points.length > 0) {
      await this.qdrantService.upsertPoints(points);
      console.log(`✅ Indexed ${points.length} chunks`);
    }
  }

  /**
   * Check if document exists in Qdrant
   */
  private async checkDocumentExists(documentId: string): Promise<boolean> {
    try {
      const count = await this.qdrantService.countPoints({
        documentId,
      });
      return count > 0;
    } catch (error) {
      console.error('❌ Failed to check document existence:', error);
      return false;
    }
  }

  /**
   * Get all jobs
   */
  getAllJobs(): IngestionJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Clean up old jobs
   */
  cleanupJobs(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    for (const [jobId, job] of this.jobs.entries()) {
      if (new Date(job.startedAt) < cutoff) {
        this.jobs.delete(jobId);
      }
    }
  }
}
