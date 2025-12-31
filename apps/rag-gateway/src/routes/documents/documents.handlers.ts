import { AppRouteHandler } from '@/libs';
import { getQdrantService } from '@/services/qdrant';
import { getEmbeddingService } from '@/services/embedding';
import { SemanticChunker } from '../../lib/rag/ingestion';
import {
  generateDocumentId,
  generateChunkId,
  type DocumentFilter,
  type DocumentMetadata,
} from '../../lib/rag/types';
import matter from 'gray-matter';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import * as routes from './documents.routes';

// Helper function to extract category from slug
function extractCategoryFromSlug(slug: string): string {
  const parts = slug.split('/').filter(p => p);
  // First non-empty part is usually the category
  return parts[0]?.toUpperCase() || 'BLOG';
}

export const listDocuments: AppRouteHandler<typeof routes.listDocuments> = async c => {
  const limit = Math.min(parseInt(c.req.valid('query').limit || '20'), 100);
  const offset = parseInt(c.req.valid('query').offset || '0');
  const category = c.req.valid('query').category;
  const tags = c.req.valid('query').tags?.split(',');
  const author = c.req.valid('query').author;

  try {
    const qdrantService = getQdrantService();

    // Build filter
    const mustConditions: Array<Record<string, unknown>> = [];

    if (category) {
      mustConditions.push({
        key: 'metadata.category',
        match: { value: category },
      });
    }

    if (author) {
      mustConditions.push({
        key: 'metadata.author',
        match: { value: author },
      });
    }

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        mustConditions.push({
          key: 'metadata.tags',
          match: { value: tag },
        });
      }
    }

    // Build Qdrant filter
    const filter: Record<string, unknown> = {};
    if (mustConditions.length > 0) {
      filter.must = mustConditions;
    }

    // Get chunks from Qdrant (with offset for pagination)
    const offsetPoint = offset > 0 ? { point_id: `${offset}` } : undefined;

    // Directly use Qdrant client's scroll with filter
    const result = await qdrantService.scrollPoints(
      Object.keys(filter).length > 0 ? filter : undefined,
      limit,
      offsetPoint
    );

    // Group chunks by document and extract document metadata
    const documents: Array<{
      id: string;
      title: string;
      slug: string;
      metadata: Record<string, unknown>;
    }> = [];
    const processedDocIds = new Set<string>();

    for (const chunk of result.points) {
      const docId = chunk.documentId as string;
      if (!processedDocIds.has(docId)) {
        const metadata = chunk.metadata as Record<string, unknown>;
        documents.push({
          id: docId,
          title: (metadata.title as string) || '',
          slug: (metadata.slug as string) || '',
          metadata,
        });
        processedDocIds.add(docId);
      }
    }

    // Get total count
    const total = await qdrantService.countPoints(
      Object.keys(filter).length > 0 ? filter : undefined
    );

    return c.json(
      {
        documents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: result.nextPageOffset !== undefined,
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to list documents:', error);
    return c.json(
      {
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getDocument: AppRouteHandler<typeof routes.getDocument> = async c => {
  const { id } = c.req.valid('param');

  try {
    const qdrantService = getQdrantService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get all chunks for this document
    const result = await qdrantService.scrollPoints(filter, 100);

    if (result.points.length === 0) {
      return c.json(
        {
          error: 'Document not found',
          message: '',
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Sort chunks by position
    const sortedChunks = result.points.sort((a, b) => {
      const aPos = (a.position as { start: number })?.start ?? 0;
      const bPos = (b.position as { start: number })?.start ?? 0;
      return aPos - bPos;
    });

    // Get document metadata from first chunk
    const firstChunk = sortedChunks[0];
    const metadata = firstChunk.metadata as Record<string, unknown>;

    // Reconstruct chunks
    const chunks = sortedChunks.map((chunk, index) => ({
      id: chunk.id,
      content: chunk.content as string,
      position: (chunk.position as { start: number })?.start ?? index,
    }));

    return c.json(
      {
        id,
        title: (metadata.title as string) || '',
        slug: (metadata.slug as string) || '',
        chunks,
        metadata: {
          ...metadata,
          chunkCount: chunks.length,
          lastIndexed: metadata.lastModified,
        },
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to get document:', error);
    return c.json(
      {
        error: 'Failed to get document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const createDocument: AppRouteHandler<typeof routes.createDocument> = async c => {
  const { title, content, slug, metadata: inputMetadata } = c.req.valid('json');

  try {
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Generate deterministic ID from slug or title
    const docSlug = slug || `/blog/${title.toLowerCase().replace(/\s+/g, '-')}`;
    const docId = await generateDocumentId('upload', docSlug);

    // Parse content for front matter
    let parsedContent = content;
    let frontMatter: Record<string, unknown> = {};

    try {
      const { data, content: markdownContent } = matter(content);
      parsedContent = markdownContent;
      frontMatter = data;
    } catch {
      // Content doesn't have front matter, use as-is
    }

    // Build metadata with proper types
    const metadata: {
      title: string;
      slug: string;
      author: string;
      category: string;
      tags: string[];
      publishedAt: string;
      wordCount: number;
      language: string;
      source: 'blob' | 'upload' | 'api' | 'scraper';
      uploadedAt: string;
      lastModified: string;
    } = {
      title: title,
      slug: docSlug,
      author: (inputMetadata?.author as string) || (frontMatter.author as string) || 'unknown',
      category:
        inputMetadata?.category ||
        (frontMatter.category as string) ||
        extractCategoryFromSlug(docSlug),
      tags: (inputMetadata?.tags as string[]) || (frontMatter.tags as string[]) || [],
      publishedAt:
        inputMetadata?.publishedAt || (frontMatter.date as string) || new Date().toISOString(),
      wordCount: parsedContent.split(/\s+/).length,
      language: 'ko',
      source: inputMetadata?.source || ('upload' as const),
      uploadedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    // Chunk the document
    const chunker = new SemanticChunker();
    const chunks = await chunker.chunk(parsedContent);

    // Generate embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    // Create Qdrant points
    const points = await Promise.all(
      chunks.map(async (chunk, index) => ({
        id: await generateChunkId(docId, index),
        vector: embeddings[index],
        payload: {
        documentId: docId,
        chunkIndex: index,
        content: chunk.content,
        metadata,
        position: chunk.metadata.position,
      },
    }))
    );

    // Check if document exists and delete if updating
    const existingFilter: DocumentFilter = { documentId: docId };
    const existingCount = await qdrantService.countPoints(existingFilter);
    if (existingCount > 0) {
      await qdrantService.deletePoints(existingFilter);
    }

    // Insert points
    await qdrantService.upsertPoints(points);

    return c.json(
      {
        id: docId,
        title: metadata.title,
        slug: metadata.slug,
        status: 'indexed' as const,
        chunksCreated: chunks.length,
        metadata: {
          ...metadata,
          indexedAt: new Date().toISOString(),
        },
      },
      HttpStatusCodes.CREATED
    );
  } catch (error) {
    console.error('❌ Failed to create document:', error);
    return c.json(
      {
        error: 'Failed to create document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const updateDocument: AppRouteHandler<typeof routes.updateDocument> = async c => {
  const { id } = c.req.valid('param');
  const { title, content, metadata: inputMetadata } = c.req.valid('json');

  try {
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get existing document
    const result = await qdrantService.scrollPoints(filter, 100);

    if (result.points.length === 0) {
      return c.json(
        {
          error: 'Document not found',
          message: '',
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Get existing metadata from first chunk
    const firstChunk = result.points[0];
    const existingMetadata = firstChunk.metadata as Record<string, unknown>;

    // Merge metadata - existingMetadata already has all required fields
    const updatedMetadata: Record<string, unknown> = {
      ...existingMetadata,
      ...(inputMetadata || {}),
      lastModified: new Date().toISOString(),
    };

    // If title is provided, add it to metadata
    if (title) {
      updatedMetadata.title = title;
    }

    let chunksToIndex: Array<{ content: string; position?: { start: number; end: number } }> = [];

    // If content provided, re-chunk
    if (content) {
      const chunker = new SemanticChunker();
      const chunks = await chunker.chunk(content);
      chunksToIndex = chunks.map(c => ({
        content: c.content,
        position: c.metadata.position,
      }));
      updatedMetadata.wordCount = content.split(/\s+/).length;
    } else {
      // Keep existing chunks structure
      const sortedChunks = result.points.sort((a, b) => {
        const aPos = (a.position as { start: number })?.start ?? 0;
        const bPos = (b.position as { start: number })?.start ?? 0;
        return aPos - bPos;
      });
      chunksToIndex = sortedChunks.map(chunk => ({
        content: chunk.content as string,
        position: chunk.position as { start: number; end: number },
      }));
    }

    // Generate embeddings
    const texts = chunksToIndex.map(c => c.content);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    // Delete old chunks
    await qdrantService.deletePoints(filter);

    // Create new points with merged metadata
    const points = await Promise.all(
      chunksToIndex.map(async (chunk, index) => ({
        id: await generateChunkId(id, index),
        vector: embeddings[index],
        payload: {
        documentId: id,
        chunkIndex: index,
        content: chunk.content,
        metadata: updatedMetadata as DocumentMetadata,
        position: chunk.position,
      },
    }))
    );

    await qdrantService.upsertPoints(points);

    return c.json(
      {
        id,
        status: 'updated' as const,
        chunksReindexed: chunksToIndex.length,
        updatedAt: new Date().toISOString(),
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to update document:', error);
    return c.json(
      {
        error: 'Failed to update document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const deleteDocument: AppRouteHandler<typeof routes.deleteDocument> = async c => {
  const { id } = c.req.valid('param');

  try {
    const qdrantService = getQdrantService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get chunk count before deletion
    const count = await qdrantService.countPoints(filter);

    if (count === 0) {
      return c.json(
        {
          error: 'Document not found',
          message: '',
        },
        HttpStatusCodes.NOT_FOUND
      );
    }

    // Delete all chunks
    await qdrantService.deletePoints(filter);

    return c.json(
      {
        id,
        status: 'deleted' as const,
        chunksDeleted: count,
        deletedAt: new Date().toISOString(),
      },
      HttpStatusCodes.OK
    );
  } catch (error) {
    console.error('❌ Failed to delete document:', error);
    return c.json(
      {
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
