import OpenAI from 'openai'
import { env } from '../env'
import type {
  Embedding,
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingModel
} from '@repo/rag-types'
import { generateTextHash } from '@repo/rag-types'

export class EmbeddingService {
  private openaiClient: OpenAI
  private cache: Map<string, number[]> = new Map()
  private config: EmbeddingConfig

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      provider: 'openai',
      model: 'text-embedding-3-small',
      dimensions: 1536,
      batchSize: 100,
      maxTokens: 8191,
      ...config,
    }

    // Initialize OpenAI client (used for embeddings)
    this.openaiClient = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const hash = generateTextHash(text)

    // Check cache first
    if (this.cache.has(hash)) {
      return this.cache.get(hash)!
    }

    try {
      const response = await this.openaiClient.embeddings.create({
        model: this.config.model,
        input: text,
        dimensions: this.config.dimensions,
      })

      const embedding = response.data[0].embedding

      // Cache the result
      this.cache.set(hash, embedding)

      return embedding
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error)
      throw new Error(`Embedding generation failed: ${error}`)
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = []
    const batchSize = this.config.batchSize

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      // Check cache for each text in batch
      const uncachedTexts: string[] = []
      const uncachedIndices: number[] = []

      batch.forEach((text, idx) => {
        const hash = generateTextHash(text)
        if (this.cache.has(hash)) {
          embeddings[i + idx] = this.cache.get(hash)!
        } else {
          uncachedTexts.push(text)
          uncachedIndices.push(idx)
        }
      })

      // Generate embeddings for uncached texts
      if (uncachedTexts.length > 0) {
        try {
          const response = await this.openaiClient.embeddings.create({
            model: this.config.model,
            input: uncachedTexts,
            dimensions: this.config.dimensions,
          })

          response.data.forEach((embedding, idx) => {
            const originalIdx = i + uncachedIndices[idx]
            const vector = embedding.embedding

            embeddings[originalIdx] = vector

            // Cache the result
            const hash = generateTextHash(uncachedTexts[idx])
            this.cache.set(hash, vector)
          })
        } catch (error) {
          console.error('❌ Failed to generate batch embeddings:', error)
          throw new Error(`Batch embedding generation failed: ${error}`)
        }
      }
    }

    return embeddings
  }

  /**
   * Create embedding record
   */
  async createEmbedding(
    text: string,
    metadata?: Partial<Omit<Embedding, 'id' | 'vector' | 'text' | 'hash'>>
  ): Promise<Embedding> {
    const vector = await this.generateEmbedding(text)
    const hash = generateTextHash(text)

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
    }
  }

  /**
   * Get embedding from cache or generate new one
   */
  async getOrGenerate(text: string): Promise<number[]> {
    const hash = generateTextHash(text)

    if (this.cache.has(hash)) {
      return this.cache.get(hash)!
    }

    return this.generateEmbedding(text)
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have same dimensions')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      norm1 += embedding1[i] * embedding1[i]
      norm2 += embedding2[i] * embedding2[i]
    }

    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)

    if (norm1 === 0 || norm2 === 0) {
      return 0
    }

    return dotProduct / (norm1 * norm2)
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
    }))

    return similarities
      .filter(s => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English/Korean mix
    return Math.ceil(text.length / 4)
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; memoryEstimate: number } {
    const size = this.cache.size
    // Rough memory estimation: each vector is 1536 floats * 4 bytes + overhead
    const memoryEstimate = size * (1536 * 4 + 100)

    return { size, memoryEstimate }
  }

  /**
   * Validate embedding dimensions
   */
  validateDimensions(embedding: number[]): boolean {
    return embedding.length === this.config.dimensions
  }

  /**
   * Average multiple embeddings
   */
  averageEmbeddings(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
      throw new Error('Cannot average empty embeddings list')
    }

    const dimensions = embeddings[0].length
    const averaged = new Array(dimensions).fill(0)

    for (const embedding of embeddings) {
      if (embedding.length !== dimensions) {
        throw new Error('All embeddings must have same dimensions')
      }

      for (let i = 0; i < dimensions; i++) {
        averaged[i] += embedding[i]
      }
    }

    for (let i = 0; i < dimensions; i++) {
      averaged[i] /= embeddings.length
    }

    return averaged
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null

export function getEmbeddingService(config?: Partial<EmbeddingConfig>): EmbeddingService {
  if (!embeddingService) {
    embeddingService = new EmbeddingService(config)
  }
  return embeddingService
}