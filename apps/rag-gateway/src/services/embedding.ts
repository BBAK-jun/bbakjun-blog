import type { Embedding, EmbeddingConfig, EmbeddingModel } from '../lib/rag/types';
import { generateTextHash, type IEmbeddingService } from '../lib/rag/types';
import OpenAI from 'openai';
import { env } from '../env';

// Model configurations
const EMBEDDING_MODELS: Record<EmbeddingModel, { dimensions: number; maxTokens: number }> = {
  // OpenAI models
  'text-embedding-3-small': { dimensions: 1536, maxTokens: 8191 },
  'text-embedding-3-large': { dimensions: 3072, maxTokens: 8191 },
  'text-embedding-ada-002': { dimensions: 1536, maxTokens: 8191 },
  // GLM models
  'embedding-2': { dimensions: 1024, maxTokens: 8192 },
  'embedding-3': { dimensions: 1024, maxTokens: 8192 },
  // SiliconFlow models (Korean/multilingual)
  'BAAI/bge-m3': { dimensions: 1024, maxTokens: 8192 },
  'BAAI/bge-large-zh-v1.5': { dimensions: 1024, maxTokens: 8192 },
  'zephyr-embedding': { dimensions: 1024, maxTokens: 8192 },
  'zephyr-embedding-large': { dimensions: 1024, maxTokens: 8192 },
};

// Retry configuration for rate limiting
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 60000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    if ('status' in error && error.status === 429) return true;
    if ('message' in error && typeof error.message === 'string') {
      return error.message.includes('429') || error.message.includes('rate limit');
    }
  }
  return false;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(INITIAL_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
      console.warn(
        `Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
      );
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

export class EmbeddingService implements IEmbeddingService {
  private openaiClient: OpenAI;
  private siliconflowClient: OpenAI;
  private cache: Map<string, number[]> = new Map();
  private config: EmbeddingConfig;

  constructor(config?: Partial<EmbeddingConfig>) {
    const provider = config?.provider || env.EMBEDDING_PROVIDER;
    const model = config?.model || env.EMBEDDING_MODEL;

    // Get model configuration
    const modelConfig = EMBEDDING_MODELS[model as keyof typeof EMBEDDING_MODELS] || {
      dimensions: 1536,
      maxTokens: 8191,
    };

    this.config = {
      provider,
      model,
      dimensions: modelConfig.dimensions,
      batchSize: 50,
      maxTokens: modelConfig.maxTokens,
      ...config,
    };

    // Initialize OpenAI client
    this.openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
      maxRetries: 0, // We handle retries manually
    });

    // Initialize SiliconFlow client (uses OpenAI-compatible API)
    this.siliconflowClient = new OpenAI({
      apiKey: env.SILICONFLOW_API_KEY || '',
      baseURL: 'https://api.siliconflow.cn/v1',
      maxRetries: 0,
    });
  }

  /**
   * Get the appropriate client based on provider
   */
  private getClient(): OpenAI {
    if (this.config.provider === 'siliconflow') {
      return this.siliconflowClient;
    }
    return this.openaiClient;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const hash = generateTextHash(text);

    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    return retryWithBackoff(async () => {
      const client = this.getClient();
      const response = await client.embeddings.create({
        model: this.config.model,
        input: text,
      });

      const embedding = response.data[0].embedding;

      // Validate dimensions
      if (embedding.length !== this.config.dimensions) {
        console.warn(
          `Embedding dimension mismatch: expected ${this.config.dimensions}, got ${embedding.length}`
        );
      }

      // Cache the result
      this.cache.set(hash, embedding);

      return embedding;
    });
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const batchSize = this.config.batchSize;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Check cache for each text in batch
      const uncachedTexts: string[] = [];
      const uncachedIndices: number[] = [];

      batch.forEach((text, idx) => {
        const hash = generateTextHash(text);
        if (this.cache.has(hash)) {
          embeddings[i + idx] = this.cache.get(hash)!;
        } else {
          uncachedTexts.push(text);
          uncachedIndices.push(idx);
        }
      });

      // Generate embeddings for uncached texts
      if (uncachedTexts.length > 0) {
        const client = this.getClient();
        const response = await retryWithBackoff(async () => {
          return await client.embeddings.create({
            model: this.config.model,
            input: uncachedTexts,
          });
        });

        response.data.forEach((embedding, idx) => {
          const originalIdx = i + uncachedIndices[idx];
          const vector = embedding.embedding;

          embeddings[originalIdx] = vector;

          // Cache the result
          const hash = generateTextHash(uncachedTexts[idx]);
          this.cache.set(hash, vector);
        });
      }
    }

    return embeddings;
  }

  /**
   * Create embedding record
   */
  async createEmbedding(
    text: string,
    metadata?: Partial<Omit<Embedding, 'id' | 'vector' | 'text' | 'hash'>>
  ): Promise<Embedding> {
    const vector = await this.generateEmbedding(text);
    const hash = generateTextHash(text);

    return {
      id: `emb_${hash}`,
      vector,
      text,
      model: this.config.model,
      provider: this.config.provider,
      dimensions: this.config.dimensions,
      tokenCount: this.estimateTokens(text),
      createdAt: new Date().toISOString(),
      hash,
      ...metadata,
    };
  }

  /**
   * Get embedding from cache or generate new one
   */
  async getOrGenerate(text: string): Promise<number[]> {
    const hash = generateTextHash(text);

    if (this.cache.has(hash)) {
      return this.cache.get(hash)!;
    }

    return this.generateEmbedding(text);
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  /**
   * Find most similar embeddings
   */
  findSimilar(
    queryEmbedding: number[],
    candidateEmbeddings: number[][],
    threshold: number = 0.7
  ): { index: number; score: number }[] {
    const similarities = candidateEmbeddings.map((embedding, index) => ({
      index,
      score: this.calculateSimilarity(queryEmbedding, embedding),
    }));

    return similarities.filter(s => s.score >= threshold).sort((a, b) => b.score - a.score);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English/Korean mix
    return Math.ceil(text.length / 4);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryEstimate: number } {
    const size = this.cache.size;
    const dimensions = this.config.dimensions;
    // Rough memory estimation: each vector is dimensions * 4 bytes + overhead
    const memoryEstimate = size * (dimensions * 4 + 100);

    return { size, memoryEstimate };
  }

  /**
   * Validate embedding dimensions
   */
  validateDimensions(embedding: number[]): boolean {
    return embedding.length === this.config.dimensions;
  }

  /**
   * Average multiple embeddings
   */
  averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty embeddings list');
    }

    const dimensions = embeddings[0].length;
    const averaged = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      if (embedding.length !== dimensions) {
        throw new Error('All embeddings must have same dimensions');
      }

      for (let i = 0; i < dimensions; i++) {
        averaged[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      averaged[i] /= embeddings.length;
    }

    return averaged;
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService {
  if (!embeddingService) {
    embeddingService = new EmbeddingService(config);
  }
  return embeddingService;
}
