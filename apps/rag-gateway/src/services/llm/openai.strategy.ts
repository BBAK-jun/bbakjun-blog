import OpenAI from 'openai';
import type { LLMUsage } from '../../lib/rag/types';
import type { LLMProviderStrategy, ModelPricing } from './types';

/**
 * OpenAI Provider Strategy
 * Implements LLM generation using OpenAI's API (gpt-4o-mini)
 */
export class OpenAIStrategy implements LLMProviderStrategy {
  private client: OpenAI;
  private readonly MODEL = 'gpt-4o-mini';

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateRAGCompletion(
    prompt: string,
    temperature: number
  ): Promise<{ content: string; usage: LLMUsage; model: string }> {
    const completion = await this.client.chat.completions.create({
      model: this.MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2000,
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    return {
      content: choice.message.content,
      model: this.MODEL,
      usage: {
        model: this.MODEL,
        totalTokens: completion.usage?.total_tokens || 0,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        cost: this.calculateCost(this.MODEL, completion.usage),
      },
    };
  }

  async generateChatCompletion(message: string, temperature: number): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.MODEL,
      messages: [{ role: 'user', content: message }],
      temperature,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || '죄송합니다, 응답을 생성할 수 없습니다.';
  }

  getProviderName(): string {
    return 'openai';
  }

  private calculateCost(
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  ): number {
    if (!usage) return 0;

    // Pricing per 1M tokens (USD)
    const pricing: Record<string, ModelPricing> = {
      'gpt-4o-mini': { input: 0.15, output: 0.6 },
      'gpt-4o': { input: 2.5, output: 10 },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    const inputCost = ((usage.prompt_tokens || 0) * modelPricing.input) / 1_000_000;
    const outputCost = ((usage.completion_tokens || 0) * modelPricing.output) / 1_000_000;

    return inputCost + outputCost;
  }
}
