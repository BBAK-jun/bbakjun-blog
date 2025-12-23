import type { ChunkingOptions, Document, QdrantPoint, DocumentSource } from '@repo/rag-types';
import { generateDocumentId } from '@repo/rag-types';
import matter from 'gray-matter';
import { SemanticChunker } from './chunkers/semantic';

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
  collections?: string[];
  blobFiles?: BlobFileInfo[]; // 외부에서 BlobFiles 전달
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

    // Run ingestion in background
    this.runIngestion(jobId, options).catch(error => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        job.completedAt = new Date().toISOString();
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

      // Collect documents from various sources
      const documents = await this.collectDocuments(job, options);
      job.progress.total = documents.length;

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
   * Collect documents from all sources
   */
  private async collectDocuments(
    job: IngestionJob,
    options: IngestionOptions
  ): Promise<Document[]> {
    const documents: Document[] = [];

    try {
      // 1. Collect from Vercel Blob (MDX posts)
      job.progress.current = 'Collecting posts from Vercel Blob...';

      const blobFiles = options.blobFiles || [];
      const posts = this.parsePostsFromBlobFiles(blobFiles);

      for (const post of posts) {
        if (post.slug && post.content) {
          // Parse front matter
          const { data, content } = matter(post.content);

          const document: Document = {
            id: generateDocumentId('blob', post.slug),
            content,
            metadata: {
              title: data.title || post.slug,
              slug: `/blog/${post.slug}`,
              author: data.author || 'bbakjun',
              category: this.extractCategoryFromSlug(post.slug),
              tags: data.tags || [],
              publishedAt: data.date || new Date().toISOString(),
              wordCount: content.split(/\s+/).length,
              language: 'ko',
              source: 'blob' as DocumentSource,
              sourceUrl: post.frontMatter.sourceUrl || '',
              uploadedAt: post.frontMatter.uploadedAt || new Date().toISOString(),
              lastModified: post.frontMatter.uploadedAt || new Date().toISOString(),
            },
          };

          documents.push(document);
        }
      }

      // 2. Collect facts.md, context.md, FEATURE_SPEC.md if they exist
      job.progress.current = 'Collecting RAG documentation...';

      const ragDocs = ['facts.md', 'context.md', 'FEATURE_SPEC.md'];
      for (const docName of ragDocs) {
        try {
          // These files would be at the root of the project
          const content = await this.readProjectFile(docName);
          if (content) {
            const document: Document = {
              id: generateDocumentId('api', docName),
              content,
              metadata: {
                title: docName.replace('.md', '').toUpperCase(),
                slug: `/${docName}`,
                author: 'system',
                category: 'RAG',
                tags: ['documentation', 'rag'],
                publishedAt: new Date().toISOString(),
                wordCount: content.split(/\s+/).length,
                language: 'ko',
                source: 'api' as DocumentSource,
                uploadedAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
              },
            };

            documents.push(document);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️ Could not read ${docName}:`, message);
        }
      }

      console.log(`📚 Collected ${documents.length} documents for ingestion`);
      return documents;
    } catch (error) {
      console.error('❌ Failed to collect documents:', error);
      throw error;
    }
  }

  /**
   * Parse posts from blob files
   */
  private parsePostsFromBlobFiles(blobFiles: BlobFileInfo[]): PostWithFileInfo[] {
    const posts: PostWithFileInfo[] = [];

    for (const file of blobFiles) {
      // Only process markdown files
      if (!file.pathname.match(/\.(md|mdx)$/)) {
        continue;
      }

      // Skip hidden files
      if (file.pathname.includes('/.')) {
        continue;
      }

      // Convert pathname to slug
      let slug = file.pathname;
      slug = slug.replace(/\.(md|mdx)$/, '');
      if (slug.endsWith('/index')) {
        slug = slug.replace(/\/index$/, '');
      }

      // For now, we'll store the metadata but can't download content
      // The actual content download will happen when ingestPosts is called
      posts.push({
        slug,
        content: '', // Will be downloaded later
        frontMatter: {
          sourceUrl: file.url,
          uploadedAt: new Date().toISOString(),
        },
      });
    }

    return posts;
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
          await this.qdrantService.deletePoint(document.id);
        }

        // Chunk the document
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
   * Extract category from slug
   */
  private extractCategoryFromSlug(slug: string): string {
    const parts = slug.split('/');
    return parts[0]?.toUpperCase() || 'BLOG';
  }

  /**
   * Read file from project root
   */
  private async readProjectFile(filename: string): Promise<string | null> {
    try {
      // This would need to be implemented based on your environment
      // For now, return null
      return null;
    } catch (error) {
      return null;
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
