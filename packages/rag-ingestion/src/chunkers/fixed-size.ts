import type {
  Chunk,
  ChunkingStrategy,
  ChunkingOptions,
  ChunkType
} from '@repo/rag-types'

/**
 * Fixed-size chunking strategy that splits content into chunks of fixed size
 * with optional overlap
 */
export class FixedSizeChunker implements ChunkingStrategy {
  name = 'fixed_size'

  async chunk(content: string, options?: ChunkingOptions): Promise<Chunk[]> {
    const opts = {
      maxSize: 500,
      minSize: 50,
      overlap: 50,
      type: 'fixed' as ChunkType,
      separators: ['\n\n', '\n', '. '],
      ...options
    }

    const chunks: Chunk[] = []
    let currentPos = 0
    let chunkIndex = 0

    while (currentPos < content.length) {
      // Calculate end position
      let endPos = currentPos + opts.maxSize

      // Don't exceed content length
      if (endPos > content.length) {
        endPos = content.length
      }

      // Extract chunk
      let chunkText = content.slice(currentPos, endPos)

      // If we're not at the end and the chunk is too small, try to extend
      if (endPos < content.length && chunkText.length < opts.minSize) {
        // Find next separator
        const nextSeparatorPos = this.findNextSeparator(content, endPos, opts.separators)
        if (nextSeparatorPos > endPos && nextSeparatorPos <= currentPos + opts.maxSize * 1.5) {
          endPos = nextSeparatorPos
          chunkText = content.slice(currentPos, endPos)
        }
      }

      // Clean up the chunk
      chunkText = chunkText.trim()

      if (chunkText.length > 0) {
        chunks.push(this.createChunk(
          chunkIndex,
          chunkText,
          currentPos,
          currentPos + chunkText.length,
          opts
        ))
        chunkIndex++
      }

      // Move to next position with overlap
      currentPos = currentPos + chunkText.length - opts.overlap
      if (currentPos < 0) currentPos = 0
    }

    return chunks
  }

  /**
   * Find the next separator position
   */
  private findNextSeparator(
    content: string,
    startPos: number,
    separators: string[]
  ): number {
    let nextPos = content.length

    for (const separator of separators) {
      const pos = content.indexOf(separator, startPos)
      if (pos > 0 && pos < nextPos) {
        nextPos = pos + separator.length
      }
    }

    return nextPos
  }

  /**
   * Create a chunk object
   */
  private createChunk(
    index: number,
    content: string,
    start: number,
    end: number,
    options: ChunkingOptions
  ): Chunk {
    // Estimate token count
    const tokenCount = Math.ceil(content.length / 4)

    return {
      id: `chunk_${index.toString().padStart(4, '0')}`,
      content,
      metadata: {
        documentId: '', // Will be set by the pipeline
        chunkIndex: index,
        type: options.type,
        position: {
          start,
          end,
          charCount: content.length,
        },
        tokenCount,
      },
    }
  }
}