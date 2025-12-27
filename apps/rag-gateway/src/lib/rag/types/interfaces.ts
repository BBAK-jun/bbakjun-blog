import type {
  DocumentFilter,
  Embedding,
  QdrantPoint,
  RAGQueryRequest,
  RAGQueryResponse,
  SearchParams,
  SimilarityResult,
  SourceReference,
} from './index';

// =============================================================================
// Qdrant Service Interface
// =============================================================================

export interface IQdrantService {
  /**
   * Initialize the collection if it doesn't exist
   */
  initializeCollection(): Promise<void>;

  /**
   * Upsert points (documents) to the collection
   */
  upsertPoints(points: QdrantPoint[]): Promise<void>;

  /**
   * Search for similar documents
   */
  search(queryVector: number[], params?: Partial<SearchParams>): Promise<SimilarityResult[]>;

  /**
   * Delete points by filter
   */
  deletePoints(filter: DocumentFilter): Promise<void>;

  /**
   * Delete point by ID
   */
  deletePoint(pointId: string): Promise<void>;

  /**
   * Delete all points from the collection
   * WARNING: This is a destructive operation
   */
  deleteAllPoints(): Promise<number>;

  /**
   * Get collection info
   */
  getCollectionInfo(): Promise<{
    name: string;
    vectorsCount: number;
    segmentsCount: number;
    diskDataSize: number;
    ramDataSize: number;
    config: Record<string, unknown>;
  }>;

  /**
   * Scroll through points with pagination
   */
  scrollPoints(
    filter?: DocumentFilter,
    limit?: number,
    offset?: { point_id: string }
  ): Promise<{
    points: Array<{ id: string; [key: string]: unknown }>;
    nextPageOffset?: string;
  }>;

  /**
   * Count points matching filter
   */
  countPoints(filter?: DocumentFilter): Promise<number>;

  /**
   * Health check for Qdrant
   */
  healthCheck(): Promise<boolean>;
}

// =============================================================================
// Embedding Service Interface
// =============================================================================

export interface IEmbeddingService {
  /**
   * Generate embedding for a single text
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts in batches
   */
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Create embedding record
   */
  createEmbedding(
    text: string,
    metadata?: Partial<Omit<Embedding, 'id' | 'vector' | 'text' | 'hash'>>
  ): Promise<Embedding>;

  /**
   * Get embedding from cache or generate new one
   */
  getOrGenerate(text: string): Promise<number[]>;

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number;

  /**
   * Clear cache
   */
  clearCache(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryEstimate: number };

  /**
   * Validate embedding dimensions
   */
  validateDimensions(embedding: number[]): boolean;
}

// =============================================================================
// LLM Service Interface
// =============================================================================

export interface ILLMService {
  /**
   * Generate RAG response
   */
  generateRAGResponse(
    request: RAGQueryRequest,
    sources: SourceReference[]
  ): Promise<RAGQueryResponse>;

  /**
   * Simple chat completion (non-RAG)
   */
  chat(message: string, temperature?: number): Promise<string>;
}
