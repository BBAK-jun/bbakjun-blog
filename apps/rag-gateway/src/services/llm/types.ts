import type { LLMUsage } from '../../lib/rag/types';

/**
 * LLM Provider Strategy Interface
 * Defines the contract for all LLM provider implementations
 */
export interface LLMProviderStrategy {
  /**
   * Generate completion for RAG response
   */
  generateRAGCompletion(
    prompt: string,
    temperature: number
  ): Promise<{ content: string; usage: LLMUsage; model: string }>;

  /**
   * Generate simple chat completion
   */
  generateChatCompletion(message: string, temperature: number): Promise<string>;

  /**
   * Get provider name
   */
  getProviderName(): string;
}

/**
 * Pricing configuration for LLM models
 */
export interface ModelPricing {
  input: number; // Cost per 1M input tokens (USD)
  output: number; // Cost per 1M output tokens (USD)
}
