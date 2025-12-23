import { z } from 'zod';

// Chunk types
export const ChunkTypeSchema = z.enum(['semantic', 'fixed', 'paragraph', 'section']);
export type ChunkType = z.infer<typeof ChunkTypeSchema>;

// Chunk metadata
export const ChunkMetadataSchema = z.object({
  documentId: z.string(),
  chunkIndex: z.number(),
  type: ChunkTypeSchema,
  position: z.object({
    start: z.number(),
    end: z.number(),
    charCount: z.number(),
  }),
  context: z
    .object({
      before: z.string().optional(),
      after: z.string().optional(),
      headings: z.array(z.string()).optional(),
    })
    .optional(),
  tokenCount: z.number().optional(),
});

export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;

// Chunk schema
export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: ChunkMetadataSchema,
  embedding: z.array(z.number()).optional(),
});

export type Chunk = z.infer<typeof ChunkSchema>;

// Chunking strategies
export interface ChunkingStrategy {
  name: string;
  chunk(content: string, options?: ChunkingOptions): Promise<Chunk[]>;
}

export const ChunkingOptionsSchema = z.object({
  maxSize: z.number().default(500),
  minSize: z.number().default(50),
  overlap: z.number().default(50),
  type: ChunkTypeSchema.default('semantic'),
  separators: z.array(z.string()).default(['\n\n', '\n', '. ']),
});

export type ChunkingOptions = z.infer<typeof ChunkingOptionsSchema>;

// Predefined chunking strategies
export const CHUNKING_STRATEGIES = {
  SEMANTIC: 'semantic',
  FIXED_SIZE: 'fixed_size',
  PARAGRAPH: 'paragraph',
  SECTION: 'section',
} as const;
