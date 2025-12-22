import type {
  Chunk,
  ChunkingStrategy,
  ChunkingOptions,
  ChunkType
} from '@repo/rag-types'

/**
 * Semantic chunking strategy that tries to maintain semantic coherence
 * by splitting at natural boundaries like headings and paragraph breaks
 */
export class SemanticChunker implements ChunkingStrategy {
  name = 'semantic'

  async chunk(content: string, options?: ChunkingOptions): Promise<Chunk[]> {
    const opts = {
      maxSize: 500,
      minSize: 50,
      overlap: 50,
      type: 'semantic' as ChunkType,
      separators: ['\n\n', '\n', '. '],
      ...options
    }

    // First, split by major separators to preserve structure
    const sections = this.splitByStructure(content)

    // Then, further split sections that are too large
    const chunks: Chunk[] = []
    let chunkIndex = 0

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]

      if (section.text.length <= opts.maxSize) {
        // Section is small enough to be a single chunk
        chunks.push(this.createChunk(
          chunkIndex++,
          section.text,
          section.start,
          section.end,
          section.context,
          opts
        ))
      } else {
        // Section is too large, need to split further
        const subChunks = this.chunkSection(section, opts, chunkIndex)
        chunks.push(...subChunks)
        chunkIndex += subChunks.length
      }
    }

    return chunks
  }

  /**
   * Split content by structural elements (headings, lists, code blocks)
   */
  private splitByStructure(content: string): Array<{
    text: string
    start: number
    end: number
    context: any
  }> {
    const sections: Array<{ text: string; start: number; end: number; context: any }> = []

    // Regular expressions for different markdown elements
    const patterns = [
      { regex: /^#{1,6}\s.+$/gm, type: 'heading' },
      { regex: /^```[\s\S]*?```$/gm, type: 'code' },
      { regex: /^\s*[-*+]\s.+$/gm, type: 'list' },
      { regex: /^\s*\d+\.\s.+$/gm, type: 'numbered_list' },
    ]

    // Find all structural elements and their positions
    const elements: Array<{
      start: number
      end: number
      text: string
      type: string
    }> = []

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(content)) !== null) {
        elements.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: pattern.type,
        })
      }
    }

    // Sort by position
    elements.sort((a, b) => a.start - b.start)

    // Create sections based on elements
    let currentPos = 0

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]

      // Add text before this element if it exists
      if (element.start > currentPos) {
        const text = content.slice(currentPos, element.start).trim()
        if (text) {
          sections.push({
            text,
            start: currentPos,
            end: element.start,
            context: { type: 'paragraph' },
          })
        }
      }

      // Add the element itself
      sections.push({
        text: element.text,
        start: element.start,
        end: element.end,
        context: { type: element.type },
      })

      currentPos = element.end
    }

    // Add remaining text
    if (currentPos < content.length) {
      const text = content.slice(currentPos).trim()
      if (text) {
        sections.push({
          text,
          start: currentPos,
          end: content.length,
          context: { type: 'paragraph' },
        })
      }
    }

    return sections
  }

  /**
   * Chunk a section that's too large
   */
  private chunkSection(
    section: { text: string; start: number; end: number; context: any },
    opts: ChunkingOptions,
    startChunkIndex: number
  ): Chunk[] {
    const chunks: Chunk[] = []
    const text = section.text
    let currentPos = 0
    let chunkIndex = startChunkIndex

    while (currentPos < text.length) {
      // Calculate end position for this chunk
      let endPos = Math.min(currentPos + opts.maxSize, text.length)

      // If we're not at the end, try to find a good split point
      if (endPos < text.length) {
        // Look for sentence endings
        const sentenceEnd = text.lastIndexOf('. ', endPos)
        if (sentenceEnd > currentPos + opts.minSize) {
          endPos = sentenceEnd + 2 // Include the period and space
        } else {
          // Look for paragraph breaks
          const paragraphEnd = text.lastIndexOf('\n\n', endPos)
          if (paragraphEnd > currentPos + opts.minSize) {
            endPos = paragraphEnd + 2
          }
        }
      }

      // Extract chunk text
      const chunkText = text.slice(currentPos, endPos).trim()

      if (chunkText) {
        chunks.push(this.createChunk(
          chunkIndex,
          chunkText,
          section.start + currentPos,
          section.start + endPos,
          section.context,
          opts
        ))
        chunkIndex++
      }

      // Move to next position with overlap
      currentPos = Math.max(
        currentPos + 1,
        endPos - opts.overlap
      )
    }

    return chunks
  }

  /**
   * Create a chunk object
   */
  private createChunk(
    index: number,
    content: string,
    start: number,
    end: number,
    context: any,
    options: ChunkingOptions
  ): Chunk {
    // Estimate token count (rough approximation)
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
        context,
        tokenCount,
      },
    }
  }
}