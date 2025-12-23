import OpenAI from 'openai';
import type { LLMUsage } from '@repo/rag-types';
import type { LLMProviderStrategy, ModelPricing } from './types';

/**
 * GLM Provider Strategy
 * Implements LLM generation using Zhipu AI's GLM API (glm-4.6)
 */
export class GLMStrategy implements LLMProviderStrategy {
  private client: OpenAI;
  private readonly MODEL = 'glm-4.6';

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    });
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
      throw new Error('No response from GLM');
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
    return 'glm';
  }

  private calculateCost(
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  ): number {
    if (!usage) return 0;

    // Pricing per 1M tokens (USD)
    const pricing: Record<string, ModelPricing> = {
      'glm-4.6': { input: 0.005, output: 0.025 },
    };

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    const inputCost = ((usage.prompt_tokens || 0) * modelPricing.input) / 1_000_000;
    const outputCost = ((usage.completion_tokens || 0) * modelPricing.output) / 1_000_000;

    return inputCost + outputCost;
  }
}
