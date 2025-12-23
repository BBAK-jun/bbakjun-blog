import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getQdrantService } from '../../services/qdrant';
import { getEmbeddingService } from '../../services/embedding';
import { SemanticChunker } from '@repo/rag-ingestion';
import {
  generateDocumentId,
  generateChunkId,
  DocumentSourceSchema,
  type DocumentFilter,
  type DocumentMetadata,
} from '@repo/rag-types';
import matter from 'gray-matter';

const documentRoutes = new Hono();

// Document schemas
const createDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  slug: z.string().optional(),
  metadata: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
      source: DocumentSourceSchema.optional(),
    })
    .optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  metadata: z
    .object({
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
      publishedAt: z.string().datetime().optional(),
    })
    .optional(),
});

// Helper function to extract category from slug
function extractCategoryFromSlug(slug: string): string {
  const parts = slug.split('/').filter(p => p);
  // First non-empty part is usually the category
  return parts[0]?.toUpperCase() || 'BLOG';
}

// GET /api/documents - List documents
documentRoutes.get('/', async c => {
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = parseInt(c.req.query('offset') || '0');
  const category = c.req.query('category');
  const tags = c.req.query('tags')?.split(',');
  const author = c.req.query('author');

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

    return c.json({
      documents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: result.nextPageOffset !== undefined,
      },
    });
  } catch (error) {
    console.error('❌ Failed to list documents:', error);
    return c.json({ error: 'Failed to list documents', details: String(error) }, 500);
  }
});

// GET /api/documents/:id - Get document details
documentRoutes.get('/:id', async c => {
  const id = c.req.param('id');

  try {
    const qdrantService = getQdrantService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get all chunks for this document
    const result = await qdrantService.scrollPoints(filter, 100);

    if (result.points.length === 0) {
      return c.json({ error: 'Document not found' }, 404);
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

    return c.json({
      id,
      title: (metadata.title as string) || '',
      slug: (metadata.slug as string) || '',
      chunks,
      metadata: {
        ...metadata,
        chunkCount: chunks.length,
        lastIndexed: metadata.lastModified,
      },
    });
  } catch (error) {
    console.error('❌ Failed to get document:', error);
    return c.json({ error: 'Failed to get document', details: String(error) }, 500);
  }
});

// POST /api/documents - Add document
documentRoutes.post('/', zValidator('json', createDocumentSchema), async c => {
  const { title, content, slug, metadata: inputMetadata } = c.req.valid('json');

  try {
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Generate deterministic ID from slug or title
    const docSlug = slug || `/blog/${title.toLowerCase().replace(/\s+/g, '-')}`;
    const docId = generateDocumentId('upload', docSlug);

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
    const points = chunks.map((chunk, index) => ({
      id: generateChunkId(docId, index),
      vector: embeddings[index],
      payload: {
        documentId: docId,
        chunkIndex: index,
        content: chunk.content,
        metadata,
        position: chunk.metadata.position,
      },
    }));

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
        status: 'indexed',
        chunksCreated: chunks.length,
        metadata: {
          ...metadata,
          indexedAt: new Date().toISOString(),
        },
      },
      201
    );
  } catch (error) {
    console.error('❌ Failed to create document:', error);
    return c.json({ error: 'Failed to create document', details: String(error) }, 500);
  }
});

// PUT /api/documents/:id - Update document
documentRoutes.put('/:id', zValidator('json', updateDocumentSchema), async c => {
  const id = c.req.param('id');
  const { title, content, metadata: inputMetadata } = c.req.valid('json');

  try {
    const qdrantService = getQdrantService();
    const embeddingService = getEmbeddingService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get existing document
    const result = await qdrantService.scrollPoints(filter, 100);

    if (result.points.length === 0) {
      return c.json({ error: 'Document not found' }, 404);
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
    const points = chunksToIndex.map((chunk, index) => ({
      id: generateChunkId(id, index),
      vector: embeddings[index],
      payload: {
        documentId: id,
        chunkIndex: index,
        content: chunk.content,
        metadata: updatedMetadata as DocumentMetadata,
        position: chunk.position,
      },
    }));

    await qdrantService.upsertPoints(points);

    return c.json({
      id,
      status: 'updated',
      chunksReindexed: chunksToIndex.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to update document:', error);
    return c.json({ error: 'Failed to update document', details: String(error) }, 500);
  }
});

// DELETE /api/documents/:id - Delete document
documentRoutes.delete('/:id', async c => {
  const id = c.req.param('id');

  try {
    const qdrantService = getQdrantService();

    // Build filter for documentId using DocumentFilter type
    const filter: DocumentFilter = { documentId: id };

    // Get chunk count before deletion
    const count = await qdrantService.countPoints(filter);

    if (count === 0) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Delete all chunks
    await qdrantService.deletePoints(filter);

    return c.json({
      id,
      status: 'deleted',
      chunksDeleted: count,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to delete document:', error);
    return c.json({ error: 'Failed to delete document', details: String(error) }, 500);
  }
});

export { documentRoutes };
