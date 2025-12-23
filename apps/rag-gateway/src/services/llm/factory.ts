import { env } from '../../env';
import type { LLMProviderStrategy } from './types';
import { OpenAIStrategy } from './openai.strategy';
import { GLMStrategy } from './glm.strategy';

/**
 * LLM Provider Factory
 * Creates and caches LLM provider strategies
 */
export class LLMProviderFactory {
  private static strategies: Map<string, LLMProviderStrategy> = new Map();

  /**
   * Create or retrieve a cached strategy for the given provider
   */
  static createStrategy(provider: string): LLMProviderStrategy {
    // Check if strategy already exists
    const cached = this.strategies.get(provider);
    if (cached) {
      return cached;
    }

    let strategy: LLMProviderStrategy;

    switch (provider) {
      case 'glm':
        if (!env.GLM_API_KEY) {
          throw new Error('GLM_API_KEY is required for glm provider');
        }
        strategy = new GLMStrategy(env.GLM_API_KEY);
        break;

      case 'openai':
      default:
        strategy = new OpenAIStrategy(env.OPENAI_API_KEY);
        break;
    }

    // Cache the strategy for reuse
    this.strategies.set(provider, strategy);
    return strategy;
  }

  /**
   * Clear all cached strategies
   */
  static clearCache(): void {
    this.strategies.clear();
  }

  /**
   * Get list of available provider names
   */
  static getAvailableProviders(): string[] {
    return ['openai', 'glm'];
  }
}
