import { z } from 'zod'
import { DocumentFilterSchema } from './document'

// Query intent types
export const QueryIntentSchema = z.enum([
  'search',
  'explain',
  'find_examples',
  'compare',
  'how_to',
  'troubleshoot',
  'best_practices',
])
export type QueryIntent = z.infer<typeof QueryIntentSchema>

// RAG query request
export const RAGQueryRequestSchema = z.object({
  query: z.string().min(1),
  context: z.string().optional(),
  intent: QueryIntentSchema.optional(),
  filters: DocumentFilterSchema.optional(),
  limit: z.number().min(1).max(20).default(5),
  temperature: z.number().min(0).max(2).default(0.7),
  includeSources: z.boolean().default(true),
  stream: z.boolean().default(false),
})

export type RAGQueryRequest = z.infer<typeof RAGQueryRequestSchema>

// Source reference
export const SourceReferenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  score: z.number(),
  metadata: z.record(z.any()).optional(),
})

export type SourceReference = z.infer<typeof SourceReferenceSchema>

// LLM usage information
export const LLMUsageSchema = z.object({
  model: z.string(),
  totalTokens: z.number(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  cost: z.number().optional(),
})

export type LLMUsage = z.infer<typeof LLMUsageSchema>

// RAG query response
export const RAGQueryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(SourceReferenceSchema),
  usage: LLMUsageSchema.optional(),
  intent: QueryIntentSchema.optional(),
  queryTime: z.number().optional(), // ms
  model: z.string().optional(),
})

export type RAGQueryResponse = z.infer<typeof RAGQueryResponseSchema>

// Search only request (no LLM generation)
export const SearchRequestSchema = z.object({
  query: z.string().min(1),
  filters: DocumentFilterSchema.optional(),
  limit: z.number().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
  rerank: z.boolean().default(true),
})

export type SearchRequest = z.infer<typeof SearchRequestSchema>

// Search response
export const SearchResponseSchema = z.object({
  results: z.array(SourceReferenceSchema),
  total: z.number(),
  queryTime: z.number(), // ms
  hasMore: z.boolean().optional(),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>