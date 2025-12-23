import OpenAI from 'openai';
import { env } from '../env';
import type {
  RAGQueryRequest,
  RAGQueryResponse,
  SourceReference,
  LLMUsage,
  QueryIntent,
} from '@repo/rag-types';

export class LLMService {
  private glmClient: OpenAI;

  constructor() {
    this.glmClient = new OpenAI({
      apiKey: env.GLM_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    });
  }

  /**
   * Generate RAG response
   */
  async generateRAGResponse(
    request: RAGQueryRequest,
    sources: SourceReference[]
  ): Promise<RAGQueryResponse> {
    const startTime = Date.now();
    const intent = request.intent || this.detectIntent(request.query);

    // Build context from sources
    const context = this.buildContext(sources, request.context);

    // Build prompt
    const prompt = this.buildRAGPrompt(request.query, context, intent);

    const response = await this.generateWithGLM(prompt, request.temperature);
    const queryTime = Date.now() - startTime;

    return {
      answer: response.content,
      sources: request.includeSources ? sources : [],
      usage: response.usage,
      intent,
      queryTime,
      model: 'glm-4.6',
    };
  }

  /**
   * Generate with GLM-4.6
   */
  private async generateWithGLM(
    prompt: string,
    temperature: number = 0.7
  ): Promise<{ content: string; usage: LLMUsage }> {
    const completion = await this.glmClient.chat.completions.create({
      model: 'glm-4.6',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 2000,
    });

    const choice = completion.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No response from GLM-4.6');
    }

    return {
      content: choice.message.content,
      usage: {
        model: 'glm-4.6',
        totalTokens: completion.usage?.total_tokens || 0,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        cost: this.calculateCost('glm-4.6', completion.usage),
      },
    };
  }

  /**
   * Build context from sources
   */
  private buildContext(sources: SourceReference[], additionalContext?: string): string {
    if (sources.length === 0 && !additionalContext) {
      return '';
    }

    let contextText = '';

    // Add additional context if provided
    if (additionalContext) {
      contextText += `추가 컨텍스트:\n${additionalContext}\n\n`;
    }

    // Add sources
    if (sources.length > 0) {
      contextText += '관련 문서:\n\n';

      sources.forEach((source, index) => {
        contextText += `[${index + 1}] ${source.title}\n`;
        contextText += `링크: ${source.slug}\n`;
        contextText += `내용: ${source.content}\n`;
        contextText += `유사도: ${(source.score * 100).toFixed(1)}%\n\n`;
      });
    }

    return contextText;
  }

  /**
   * Build RAG prompt based on intent
   */
  private buildRAGPrompt(query: string, context: string, intent: QueryIntent): string {
    const basePrompt = `당신은 DEV_BBAK 기술 블로그의 AI 어시스턴트입니다.
주어진 문서 컨텍스트를 바탕으로 사용자의 질문에 답변해주세요.

지침:
- 제공된 문서를 기반으로 답변하세요
- 문서에 없는 내용은 "제공된 문서에서 찾을 수 없습니다"라고 말하세요
- 한국어로 답변하세요
- 코드 예제가 있다면 포함하세요
- 정확하고 유용한 정보를 제공하세요
`;

    const intentSpecific = this.getIntentPrompt(intent);

    const fullPrompt = `${basePrompt}

${intentSpecific}

사용자 질문: ${query}

${context ? `\n참고 자료:\n${context}` : ''}

답변:`;

    return fullPrompt;
  }

  /**
   * Get intent-specific prompt instructions
   */
  private getIntentPrompt(intent: QueryIntent): string {
    const prompts = {
      search: '사용자가 정보를 검색하고 있습니다. 관련 내용을 찾아 설명해주세요.',
      explain: '개념이나 코드를 설명해달라는 요청입니다. 쉽고 명확하게 설명해주세요.',
      find_examples: '코드 예제를 찾고 있습니다. 실제 코드 예시를 제공해주세요.',
      compare: '두 개 이상의 항목을 비교하고 있습니다. 장단점을 비교해주세요.',
      how_to: '방법을 알려달라는 요청입니다. 단계별로 설명해주세요.',
      troubleshoot: '문제 해결을 요청합니다. 원인과 해결책을 제시해주세요.',
      best_practices: '모범 사례를 알려달라는 요청입니다. 권장사항을 알려주세요.',
    };

    return prompts[intent] || prompts.search;
  }

  /**
   * Detect query intent
   */
  private detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();

    if (
      lowerQuery.includes('설명') ||
      lowerQuery.includes('설명해') ||
      lowerQuery.includes('explain')
    ) {
      return 'explain';
    }
    if (
      lowerQuery.includes('예제') ||
      lowerQuery.includes('예시') ||
      lowerQuery.includes('example')
    ) {
      return 'find_examples';
    }
    if (
      lowerQuery.includes('비교') ||
      lowerQuery.includes('차이') ||
      lowerQuery.includes('compare')
    ) {
      return 'compare';
    }
    if (
      lowerQuery.includes('방법') ||
      lowerQuery.includes('어떻게') ||
      lowerQuery.includes('how to')
    ) {
      return 'how_to';
    }
    if (
      lowerQuery.includes('문제') ||
      lowerQuery.includes('에러') ||
      lowerQuery.includes('오류') ||
      lowerQuery.includes('troubleshoot')
    ) {
      return 'troubleshoot';
    }
    if (
      lowerQuery.includes('최적') ||
      lowerQuery.includes('추천') ||
      lowerQuery.includes('best practice')
    ) {
      return 'best_practices';
    }

    return 'search';
  }

  /**
   * Calculate cost (approximate)
   */
  private calculateCost(
    model: string,
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  ): number {
    if (!usage) return 0;

    // GLM-4.6 pricing (per 1M tokens)
    const pricing = {
      'glm-4.6': {
        input: 0.005,
        output: 0.025,
      },
    };

    const modelPricing = pricing[model as keyof typeof pricing];
    if (!modelPricing) return 0;

    const inputCost = ((usage.prompt_tokens || 0) * modelPricing.input) / 1000000;
    const outputCost = ((usage.completion_tokens || 0) * modelPricing.output) / 1000000;

    return inputCost + outputCost;
  }

  /**
   * Simple chat completion (non-RAG)
   */
  async chat(message: string, temperature: number = 0.7): Promise<string> {
    try {
      const completion = await this.glmClient.chat.completions.create({
        model: 'glm-4.6',
        messages: [{ role: 'user', content: message }],
        temperature,
        max_tokens: 1000,
      });

      return completion.choices[0]?.message?.content || '죄송합니다, 응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('❌ Chat failed:', error);
      throw new Error('Failed to generate chat response');
    }
  }
}

// Singleton instance
let llmService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmService) {
    llmService = new LLMService();
  }
  return llmService;
}
