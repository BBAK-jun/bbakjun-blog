import type {
  RAGQueryRequest,
  RAGQueryResponse,
  SourceReference,
  ILLMService,
} from '@repo/rag-types';
import { env } from '../../env';
import type { LLMProviderStrategy } from './types';
import { LLMProviderFactory } from './factory';
import { buildContext, buildRAGPrompt, detectIntent } from './prompt';

/**
 * LLM Service (Facade)
 * Main entry point for LLM operations using strategy pattern
 */
export class LLMService implements ILLMService {
  private strategy: LLMProviderStrategy;

  constructor(provider?: string) {
    const selectedProvider = provider || env.LLM_PROVIDER;
    this.strategy = LLMProviderFactory.createStrategy(selectedProvider);
  }

  /**
   * Generate RAG response
   */
  async generateRAGResponse(
    request: RAGQueryRequest,
    sources: SourceReference[]
  ): Promise<RAGQueryResponse> {
    const startTime = Date.now();
    const intent = request.intent || detectIntent(request.query);

    // Build context from sources
    const context = buildContext(sources, request.context);

    // Build prompt
    const prompt = buildRAGPrompt(request.query, context, intent);

    // Delegate to strategy
    const response = await this.strategy.generateRAGCompletion(prompt, request.temperature);

    const queryTime = Date.now() - startTime;

    return {
      answer: response.content,
      sources: request.includeSources ? sources : [],
      usage: response.usage,
      intent,
      queryTime,
      model: response.model,
    };
  }

  /**
   * Simple chat completion (non-RAG)
   */
  async chat(message: string, temperature: number = 0.7): Promise<string> {
    try {
      return await this.strategy.generateChatCompletion(message, temperature);
    } catch (error) {
      console.error('❌ Chat failed:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
  }
  return llmService;
}

// Re-export types and factory for external use
export { LLMProviderFactory };
export type { LLMProviderStrategy };
export type { ModelPricing } from './types';
