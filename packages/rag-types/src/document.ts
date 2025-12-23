import { z } from 'zod';

// Document source types
export const DocumentSourceSchema = z.enum(['blob', 'upload', 'api', 'scraper']);
export type DocumentSource = z.infer<typeof DocumentSourceSchema>;

// Document metadata schema
export const DocumentMetadataSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  author: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().datetime().optional(),
  wordCount: z.number().optional(),
  language: z.string().default('ko'),
  source: DocumentSourceSchema,
  sourceUrl: z.string().url().optional(),
  uploadedAt: z.string().datetime(),
  lastModified: z.string().datetime(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

// Document schema
export const DocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: DocumentMetadataSchema,
  chunks: z.array(z.string()).optional(), // chunk IDs
  indexedAt: z.string().datetime().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// Qdrant point structure
export const QdrantPointSchema = z.object({
  id: z.string(),
  vector: z.array(z.number()),
  payload: z.object({
    documentId: z.string(),
    chunkIndex: z.number(),
    content: z.string(),
    metadata: DocumentMetadataSchema,
    position: z
      .object({
        start: z.number(),
        end: z.number(),
      })
      .optional(),
  }),
});

export type QdrantPoint = z.infer<typeof QdrantPointSchema>;

// Document filter schema
export const DocumentFilterSchema = z.object({
  documentId: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  dateRange: z
    .object({
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    .optional(),
  source: DocumentSourceSchema.optional(),
});

export type DocumentFilter = z.infer<typeof DocumentFilterSchema>;

// Deterministic ID generation
export function generateDocumentId(source: string, path: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(`${source}:${path}`).digest('hex');
  // Return UUID format (first 32 chars of hash, formatted as UUID)
  const hashPart = hash.substring(0, 32);
  return `${hashPart.substring(0, 8)}-${hashPart.substring(8, 12)}-${hashPart.substring(12, 16)}-${hashPart.substring(16, 20)}-${hashPart.substring(20, 32)}`;
}

export function generateChunkId(docId: string, position: number): string {
  const crypto = require('crypto');
  // Use docId + position to generate a deterministic UUID
  const hash = crypto.createHash('sha256').update(`${docId}:${position}`).digest('hex');
  const hashPart = hash.substring(0, 32);
  return `${hashPart.substring(0, 8)}-${hashPart.substring(8, 12)}-${hashPart.substring(12, 16)}-${hashPart.substring(16, 20)}-${hashPart.substring(20, 32)}`;
}
