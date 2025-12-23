import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

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

// GET /api/documents - List documents
documentRoutes.get('/', async c => {
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  const _category = c.req.query('category');
  const _tags = c.req.query('tags')?.split(',');

  // TODO: Implement document listing
  // 1. Query Qdrant with pagination
  // 2. Apply filters
  // 3. Return metadata only

  return c.json({
    documents: [
      {
        id: 'doc_123',
        title: 'Sample Document',
        slug: '/blog/sample-post',
        metadata: {
          category: 'DEV',
          tags: ['typescript', 'rag'],
          author: 'bbakjun',
          publishedAt: '2024-12-22T00:00:00Z',
          wordCount: 1500,
          chunkCount: 5,
        },
      },
    ],
    pagination: {
      total: 1,
      limit,
      offset,
      hasMore: false,
    },
  });
});

// GET /api/documents/:id - Get document details
documentRoutes.get('/:id', async c => {
  const id = c.req.param('id');

  // TODO: Implement document retrieval
  // 1. Get document from Qdrant
  // 2. Include all chunks

  return c.json({
    id,
    title: 'Sample Document',
    slug: '/blog/sample-post',
    content: 'Full document content...',
    chunks: [
      {
        id: 'doc_123_chunk_0000',
        content: 'First chunk content...',
        position: 0,
      },
      {
        id: 'doc_123_chunk_0001',
        content: 'Second chunk content...',
        position: 1,
      },
    ],
    metadata: {
      category: 'DEV',
      tags: ['typescript', 'rag'],
      author: 'bbakjun',
      publishedAt: '2024-12-22T00:00:00Z',
      wordCount: 1500,
      chunkCount: 2,
      lastIndexed: '2024-12-22T00:05:00Z',
    },
  });
});

// POST /api/documents - Add document
documentRoutes.post('/', zValidator('json', createDocumentSchema), async c => {
  const { title, slug, metadata } = c.req.valid('json');

  // TODO: Implement document creation
  // 1. Generate deterministic ID
  // 2. Chunk the document
  // 3. Generate embeddings
  // 4. Store in Qdrant

  return c.json(
    {
      id: 'doc_' + Date.now(),
      title,
      slug: slug || '/blog/' + title.toLowerCase().replace(/\s+/g, '-'),
      status: 'indexed',
      chunksCreated: 5,
      metadata: {
        ...metadata,
        indexedAt: new Date().toISOString(),
      },
    },
    201
  );
});

// PUT /api/documents/:id - Update document
documentRoutes.put('/:id', zValidator('json', updateDocumentSchema), async c => {
  const id = c.req.param('id');

  // TODO: Implement document update
  // 1. Delete old chunks
  // 2. Process updated content
  // 3. Re-index

  return c.json({
    id,
    status: 'updated',
    chunksReindexed: 5,
    updatedAt: new Date().toISOString(),
  });
});

// DELETE /api/documents/:id - Delete document
documentRoutes.delete('/:id', async c => {
  const id = c.req.param('id');

  // TODO: Implement document deletion
  // 1. Delete all chunks
  // 2. Remove from Qdrant

  return c.json({
    id,
    status: 'deleted',
    chunksDeleted: 5,
    deletedAt: new Date().toISOString(),
  });
});

export { documentRoutes };
