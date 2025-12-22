import type {
  RAGQueryRequest,
  RAGQueryResponse,
  SearchRequest,
  SearchResponse,
  SourceReference,
  DocumentFilter
} from '@repo/rag-types'

export interface QueryProcessorOptions {
  maxResults?: number
  similarityThreshold?: number
  enableReranking?: boolean
}

export class QueryProcessor {
  private qdrantService: any
  private embeddingService: any
  private llmService: any
  private options: QueryProcessorOptions

  constructor(
    qdrantService: any,
    embeddingService: any,
    llmService: any,
    options: QueryProcessorOptions = {}
  ) {
    this.qdrantService = qdrantService
    this.embeddingService = embeddingService
    this.llmService = llmService
    this.options = {
      maxResults: 10,
      similarityThreshold: 0.7,
      enableReranking: true,
      ...options,
    }
  }

  /**
   * Process RAG query with LLM generation
   */
  async processRAGQuery(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    const startTime = Date.now()

    try {
      // 1. Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(request.query)

      // 2. Retrieve relevant documents
      const sources = await this.retrieveDocuments(
        queryEmbedding,
        request.filters,
        request.limit
      )

      // 3. Generate response with LLM
      const response = await this.llmService.generateRAGResponse(request, sources)

      // 4. Add timing information
      response.queryTime = Date.now() - startTime

      return response

    } catch (error) {
      console.error('❌ Failed to process RAG query:', error)
      throw new Error(`Query processing failed: ${error.message}`)
    }
  }

  /**
   * Search documents without LLM generation
   */
  async searchDocuments(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now()

    try {
      // 1. Generate query embedding
      const queryEmbedding = await this.embeddingService.generateEmbedding(request.query)

      // 2. Search Qdrant
      const results = await this.qdrantService.search(queryEmbedding, {
        limit: request.limit,
        threshold: request.threshold,
        filter: request.filters,
      })

      // 3. Rerank if enabled
      let finalResults = results
      if (request.rerank && this.options.enableReranking) {
        finalResults = await this.rerankResults(request.query, results)
      }

      // 4. Format as source references
      const sources = finalResults.map(result => ({
        id: result.id,
        title: result.metadata?.title || 'Untitled',
        slug: result.metadata?.slug || '/',
        content: this.extractSnippet(result.text, 200),
        score: result.score,
        metadata: result.metadata,
      }))

      const queryTime = Date.now() - startTime

      return {
        results: sources,
        total: sources.length,
        queryTime,
      }

    } catch (error) {
      console.error('❌ Failed to search documents:', error)
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  /**
   * Retrieve documents from Qdrant
   */
  private async retrieveDocuments(
    queryEmbedding: number[],
    filters?: DocumentFilter,
    limit: number = 5
  ): Promise<SourceReference[]> {
    // Search for similar chunks
    const results = await this.qdrantService.search(queryEmbedding, {
      limit: limit * 2, // Get more to potentially merge chunks
      threshold: this.options.similarityThreshold,
      filter: filters,
    })

    // Group chunks by document
    const documentGroups = this.groupChunksByDocument(results)

    // Rerank documents if enabled
    if (this.options.enableReranking) {
      return await this.rerankAndFormatDocuments(documentGroups, limit)
    }

    // Format without reranking
    return this.formatDocumentGroups(documentGroups, limit)
  }

  /**
   * Group search results by document
   */
  private groupChunksByDocument(results: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>()

    for (const result of results) {
      const documentId = result.metadata?.documentId
      if (documentId) {
        if (!groups.has(documentId)) {
          groups.set(documentId, [])
        }
        groups.get(documentId)!.push(result)
      }
    }

    return groups
  }

  /**
   * Rerank and format document groups
   */
  private async rerankAndFormatDocuments(
    documentGroups: Map<string, any[]>,
    limit: number
  ): Promise<SourceReference[]> {
    // Calculate document scores by aggregating chunk scores
    const documentScores = new Map<string, number>()

    for (const [documentId, chunks] of documentGroups.entries()) {
      // Weight chunks by position and score
      let totalScore = 0
      let totalWeight = 0

      for (const chunk of chunks) {
        const position = chunk.position?.charCount || 0
        const weight = Math.max(1, 10 - Math.log10(position + 1)) // Earlier chunks get higher weight
        totalScore += chunk.score * weight
        totalWeight += weight
      }

      documentScores.set(documentId, totalScore / totalWeight)
    }

    // Sort documents by score
    const sortedDocuments = Array.from(documentGroups.entries())
      .sort(([, a], [, b]) => {
        const scoreA = documentScores.get(a[0]) || 0
        const scoreB = documentScores.get(b[0]) || 0
        return scoreB - scoreA
      })
      .slice(0, limit)

    // Format as source references
    const sources: SourceReference[] = []

    for (const [documentId, chunks] of sortedDocuments) {
      const topChunk = chunks[0]
      const score = documentScores.get(documentId) || 0

      sources.push({
        id: documentId,
        title: topChunk.metadata?.title || 'Untitled',
        slug: topChunk.metadata?.slug || '/',
        content: this.extractRelevantContent(chunks),
        score,
        metadata: topChunk.metadata,
      })
    }

    return sources
  }

  /**
   * Format document groups without reranking
   */
  private formatDocumentGroups(
    documentGroups: Map<string, any[]>,
    limit: number
  ): SourceReference[] {
    const sources: SourceReference[] = []
    let count = 0

    for (const [documentId, chunks] of documentGroups.entries()) {
      if (count >= limit) break

      const topChunk = chunks[0]
      const maxScore = Math.max(...chunks.map(c => c.score))

      sources.push({
        id: documentId,
        title: topChunk.metadata?.title || 'Untitled',
        slug: topChunk.metadata?.slug || '/',
        content: this.extractRelevantContent(chunks),
        score: maxScore,
        metadata: topChunk.metadata,
      })

      count++
    }

    return sources
  }

  /**
   * Extract relevant content from multiple chunks
   */
  private extractRelevantContent(chunks: any[]): string {
    // Sort chunks by score and position
    const sortedChunks = chunks.sort((a, b) => {
      // First by score (descending)
      const scoreDiff = b.score - a.score
      if (Math.abs(scoreDiff) > 0.1) {
        return scoreDiff
      }
      // Then by position (ascending)
      return (a.position?.start || 0) - (b.position?.start || 0)
    })

    // Take top chunks and create a coherent excerpt
    const topChunks = sortedChunks.slice(0, 3)
    const contentParts = topChunks.map(c => c.text)

    // Combine with ellipsis if needed
    let combined = contentParts.join(' ... ')

    // Limit length
    if (combined.length > 500) {
      combined = combined.substring(0, 497) + '...'
    }

    return combined
  }

  /**
   * Extract text snippet
   */
  private extractSnippet(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Rerank search results (simplified version)
   */
  private async rerankResults(query: string, results: any[]): Promise<any[]> {
    // In a production system, you might use a cross-encoder model
    // For now, we'll do a simple text-based reranking

    const queryWords = query.toLowerCase().split(/\s+/)

    return results.map(result => ({
      ...result,
      score: this.calculateTextSimilarity(queryWords, result.text.toLowerCase()),
    })).sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate text similarity (simplified)
   */
  private calculateTextSimilarity(queryWords: string[], text: string): number {
    const textWords = text.split(/\s+/)
    const commonWords = queryWords.filter(word => textWords.includes(word))

    // Simple Jaccard similarity
    const intersection = commonWords.length
    const union = new Set([...queryWords, ...textWords]).size

    return intersection / union
  }

  /**
   * Get query suggestions based on partial input
   */
  async getQuerySuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    // This could be implemented using search history or document analysis
    // For now, return empty array
    return []
  }

  /**
   * Get related documents for a given document
   */
  async getRelatedDocuments(documentId: string, limit: number = 3): Promise<SourceReference[]> {
    try {
      // Get document content to find similar
      const documentPoints = await this.qdrantService.scrollPoints(
        undefined,
        1,
        undefined,
        { documentId }
      )

      if (documentPoints.points.length === 0) {
        return []
      }

      const document = documentPoints.points[0]

      // Use document content as query to find similar documents
      const results = await this.qdrantService.search(
        document.vector || [0], // Would need to store vector
        {
          limit: limit + 1,
          threshold: 0.5,
        }
      )

      // Filter out the original document
      const filteredResults = results.filter(r => r.metadata?.documentId !== documentId)

      return filteredResults.slice(0, limit).map(result => ({
        id: result.metadata?.documentId || result.id,
        title: result.metadata?.title || 'Untitled',
        slug: result.metadata?.slug || '/',
        content: this.extractSnippet(result.text, 200),
        score: result.score,
        metadata: result.metadata,
      }))

    } catch (error) {
      console.error('❌ Failed to get related documents:', error)
      return []
    }
  }
}