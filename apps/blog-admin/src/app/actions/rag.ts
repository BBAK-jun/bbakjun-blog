'use server';

import { env } from '@/env';
import { ragClient } from '@/lib/rag.rpc';
import { z } from 'zod';
import type { InferResponseType } from 'hono/client';

const RAGQuerySchema = z.object({
  query: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0.7),
  limit: z.number().min(1).max(20).default(5),
  includeSources: z.boolean().default(true),
  collectionName: z.string().optional(),
});

export type RAGQueryInput = z.infer<typeof RAGQuerySchema>;

/**
 * Server Action for RAG query
 *
 * This action runs on the server side and includes the API key in the request,
 * preventing the API key from being exposed to the client.
 *
 * @param input - RAG query parameters
 * @returns RAG query response with answer and sources
 */
export async function ragQuery(
  input: RAGQueryInput
): Promise<
  | { success: true; data: InferResponseType<typeof ragClient.rag.query.$post, 200> }
  | { success: false; error: string }
> {
  try {
    // Validate input
    const validatedInput = RAGQuerySchema.parse(input);

    // Make authenticated request to RAG Gateway
    const response = await ragClient.rag.query.$post(
      {
        json: validatedInput,
      },
      {
        headers: {
          'X-RAG-API-Key': env.RAG_GATEWAY_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to fetch RAG response',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('RAG query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server Action for RAG search (documents only, no LLM)
 *
 * @param input - RAG search parameters
 * @returns Search results with relevant documents
 */
export async function ragSearch(
  input: RAGQueryInput
): Promise<
  | { success: true; data: InferResponseType<typeof ragClient.rag.search.$post, 200> }
  | { success: false; error: string }
> {
  try {
    // Validate input
    const validatedInput = RAGQuerySchema.parse(input);

    // Make authenticated request to RAG Gateway
    const response = await ragClient.rag.search.$post(
      {
        json: validatedInput,
      },
      {
        headers: {
          'X-RAG-API-Key': env.RAG_GATEWAY_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to fetch RAG search results',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('RAG search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Server Action for RAG health check
 *
 * @returns Health status of RAG Gateway
 */
export async function ragHealth(): Promise<
  | { success: true; data: InferResponseType<typeof ragClient.rag.health.$get, 200> }
  | { success: false; error: string }
> {
  try {
    const response = await ragClient.rag.health.$get();

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to fetch health status',
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('RAG health check error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
