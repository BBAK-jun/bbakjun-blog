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

// Deterministic ID generation (Edge Runtime compatible)
export async function generateDocumentId(source: string, path: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${source}:${path}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  // Return UUID format (first 32 chars of hash, formatted as UUID)
  const hashPart = hash.substring(0, 32);
  return `${hashPart.substring(0, 8)}-${hashPart.substring(8, 12)}-${hashPart.substring(12, 16)}-${hashPart.substring(16, 20)}-${hashPart.substring(20, 32)}`;
}

export async function generateChunkId(docId: string, position: number): Promise<string> {
  // Use docId + position to generate a deterministic UUID
  const encoder = new TextEncoder();
  const data = encoder.encode(`${docId}:${position}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const hashPart = hash.substring(0, 32);
  return `${hashPart.substring(0, 8)}-${hashPart.substring(8, 12)}-${hashPart.substring(12, 16)}-${hashPart.substring(16, 20)}-${hashPart.substring(20, 32)}`;
}
