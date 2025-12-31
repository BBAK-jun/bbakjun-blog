import { z } from 'zod';

// Embedding model types
export const EmbeddingModelSchema = z.enum([
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002',
  'embedding-2', // GLM embedding model v2
  'embedding-3', // GLM embedding model v3
  'BAAI/bge-m3', // SiliconFlow/Z.ai multilingual embedding model
  'BAAI/bge-large-zh-v1.5', // SiliconFlow/Z.ai Chinese embedding model
  'zephyr-embedding', // Z.ai embedding model
  'zephyr-embedding-large', // Z.ai large embedding model
]);
export type EmbeddingModel = z.infer<typeof EmbeddingModelSchema>;

// Embedding provider
export const EmbeddingProviderSchema = z.enum(['openai', 'glm']);
export type EmbeddingProvider = z.infer<typeof EmbeddingProviderSchema>;

// Embedding configuration
export const EmbeddingConfigSchema = z.object({
  provider: EmbeddingProviderSchema.default('openai'),
  model: EmbeddingModelSchema.default('text-embedding-3-small'),
  dimensions: z.number().default(1536),
  batchSize: z.number().default(100),
  maxTokens: z.number().default(8191),
});

export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

// Embedding record
export const EmbeddingSchema = z.object({
  id: z.string(),
  vector: z.array(z.number()),
  text: z.string(),
  model: EmbeddingModelSchema,
  provider: EmbeddingProviderSchema,
  dimensions: z.number(),
  tokenCount: z.number(),
  createdAt: z.string().datetime(),
  hash: z.string(), // For caching
});

export type Embedding = z.infer<typeof EmbeddingSchema>;

// Similarity result
export const SimilarityResultSchema = z.object({
  id: z.string(),
  score: z.number(),
  text: z.string(),
  documentId: z.string().optional(),
  metadata: z
    .object({
      title: z.string().optional(),
      slug: z.string().optional(),
      author: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      publishedAt: z.string().optional(),
      wordCount: z.number().optional(),
      language: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),
  position: z
    .object({
      start: z.number(),
      end: z.number(),
      charCount: z.number(),
    })
    .optional(),
});

export type SimilarityResult = z.infer<typeof SimilarityResultSchema>;

// Search parameters
export const SearchParamsSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  includeMetadata: z.boolean().default(true),
  filter: z.record(z.string(), z.unknown()).optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

// Generate hash for caching (Edge Runtime compatible)
export async function generateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
