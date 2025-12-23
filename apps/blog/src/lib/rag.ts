import { client } from './rpc'
import type { AppType } from 'blog-admin/rpc'

/**
 * RAG (Retrieval-Augmented Generation) client functions
 */

// Query blog content with RAG
export async function queryBlogContent(params: {
  query: string
  context?: string
  limit?: number
  filters?: {
    category?: string
    tags?: string[]
  }
}) {
  const response = await client.api.rpc.queryBlogContent.$post({
    json: {
      query: params.query,
      context: params.context,
      limit: params.limit || 5,
      filters: params.filters,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to query blog content')
  }

  return response.json()
}

// Search blog posts (semantic search)
export async function searchBlogPosts(params: {
  query: string
  limit?: number
  threshold?: number
  filters?: {
    category?: string
    tags?: string[]
  }
}) {
  const response = await client.api.rpc.searchBlogPosts.$post({
    json: {
      query: params.query,
      limit: params.limit || 10,
      threshold: params.threshold || 0.7,
      filters: params.filters,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to search blog posts')
  }

  return response.json()
}

// Type definitions
export interface RAGQueryResponse {
  answer: string
  sources: Array<{
    id: string
    title: string
    slug: string
    content: string
    score: number
    metadata?: Record<string, any>
  }>
  usage?: {
    model: string
    totalTokens: number
    promptTokens: number
    completionTokens: number
    cost?: number
  }
}

export interface SearchResponse {
  results: Array<{
    id: string
    title: string
    slug: string
    content: string
    score: number
    metadata?: Record<string, any>
  }>
  total: number
  queryTime: number
}