# Multi-LLM Strategy - 기능 명세서

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현 - OpenAI, GLM 지원)
- **Scope**: 다중 LLM 제공자 전략 (OpenAI GPT-4o-mini, GLM-4.6)
- **Based on**:
  - Facts: ../../facts/apps/rag-gateway/
  - Insights: ../../insights/apps/rag-gateway/
- **Last Verified**: 2024-12-26
- **Repo Ref**: bbakjun-blog monorepo

---

## 개요 (Overview)

### 목적 (Purpose)

Multi-LLM Strategy는 비용 최적화와 품질 균형을 위해 OpenAI와 GLM 두 제공자 중 선택하여 RAG 응답을 생성하는 유연한 전략을 제공합니다.

### 범위 (Scope)

**In-Scope**:
- **OpenAI GPT-4o-mini**: 기본, 고품질
- **GLM-4.6**: 한국어 최적화, 저비용 (97% 절감)
- **Strategy Pattern**: 공통 인터페이스로 제공자 추상화
- **Factory Pattern**: 환경 변수 기반 제공자 선택

**Out-of-Scope**:
- 자동 언어 감지 및 라우팅 - 추후 확장 가능
- 하이브리드 접근 (여러 제공자 병렬) - 추후 확장 가능
- 사용자별 제공자 선택 - 추후 확장 가능

### 비즈니스 가치 (Business Value)

- **비용 절감**: GLM-4.6으로 한국어 콘텐츠 비용 97% 절감
- **품질 보장**: OpenAI GPT-4o-mini로 영어/복잡한 질문에 고품질 응답
- **유연성**: 제공자 간 전환 (환경 변수만 변경)
- **리스크 관리**: 제공자 다운 시 fallback 옵션

---

## 핵심 기능 (Core Features)

### 1. Strategy Pattern Implementation (전략 패턴 구현)

**설명**: `LLMProviderStrategy` 인터페이스로 제공자 간 공통 API를 제공합니다.

**주요 규칙**:
- **인터페이스**: `generateRAGCompletion()`, `generateChatCompletion()`, `getProviderName()`
- **구현**: `OpenAIStrategy`, `GLMStrategy`
- **Factory**: `LLMProviderFactory.createStrategy(provider)`

**기술 구현**:
```typescript
// src/services/llm/types.ts
interface LLMProviderStrategy {
  generateRAGCompletion(
    prompt: string,
    temperature: number
  ): Promise<{
    content: string;
    usage: LLMUsage;
    model: string;
  }>;

  generateChatCompletion(
    message: string,
    temperature: number
  ): Promise<string>;

  getProviderName(): string;
}
```

### 2. OpenAI GPT-4o-mini Integration

**설명**: OpenAI GPT-4o-mini를 사용하여 고품질 응답을 생성합니다.

**주요 규칙**:
- **모델**: gpt-4o-mini
- **최대 토큰**: 2000
- **온도**: 0-2 (기본 0.7)
- **비용**: $0.15/M 입력, $0.60/M 출력

**System Prompt**:
```
You are a helpful technical blog assistant for DEV_BBAK blog.
Answer the user's question based on the provided blog content.
Use Korean for Korean queries and English for English queries.
Cite your sources with [Source: title] format.
```

**기술 구현**:
```typescript
// src/services/llm/openai.strategy.ts
class OpenAIStrategy implements LLMProviderStrategy {
  async generateRAGCompletion(prompt: string, temperature: number) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: 2000,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        model: 'gpt-4o-mini',
        totalTokens: response.usage?.total_tokens || 0,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
      },
      model: 'gpt-4o-mini',
    };
  }

  getProviderName(): string {
    return 'openai';
  }
}
```

### 3. GLM-4.6 Integration (Zhipu AI)

**설명**: Zhipu AI GLM-4.6을 사용하여 저비용 한국어 최적화 응답을 생성합니다.

**주요 규칙**:
- **모델**: glm-4.6
- **Base URL**: https://open.bigmodel.cn/api/paas/v4/
- **최대 토큰**: 2000
- **비용**: $0.005/M 입력, $0.025/M 출력 (97% 저렴)

**비용 비교**:
| 항목 | OpenAI | GLM | 절감률 |
|------|--------|-----|-------|
| 입력 비용 | $0.15/M | $0.005/M | 96.7% |
| 출력 비용 | $0.60/M | $0.025/M | 95.8% |
| 총 100k 쿼리 | $29/월 | $3/월 | **89.7%** |

**기술 구현**:
```typescript
// src/services/llm/glm.strategy.ts
class GLMStrategy implements LLMProviderStrategy {
  private client: OpenAI;
  private model = 'glm-4.6';

  constructor() {
    this.client = new OpenAI({
      apiKey: env.GLM_API_KEY,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4/',
    });
  }

  async generateRAGCompletion(prompt: string, temperature: number) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: 2000,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        model: this.model,
        totalTokens: response.usage?.total_tokens || 0,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
      },
      model: this.model,
    };
  }

  getProviderName(): string {
    return 'glm';
  }
}
```

### 4. Factory Pattern (Factory Pattern)

**설명**: 환경 변수 기반으로 제공자 전략을 생성합니다.

**주요 규칙**:
- **환경 변수**: `LLM_PROVIDER` (openai | glm)
- **기본값**: openai
- **캐싱**: Singleton 패턴으로 인스턴스 재사용

**기술 구현**:
```typescript
// src/services/llm/factory.ts
class LLMProviderFactory {
  static createStrategy(provider: string): LLMProviderStrategy {
    switch (provider) {
      case 'openai':
        return new OpenAIStrategy();
      case 'glm':
        return new GLMStrategy();
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  }

  static getAvailableProviders(): string[] {
    return ['openai', 'glm'];
  }

  static clearCache(): void {
    // Clear singleton instances
  }
}
```

### 5. LLM Service Integration (LLM 서비스 통합)

**설명**: QueryProcessor와 통합하여 RAG 응답을 생성합니다.

**주요 규칙**:
- **의존성 주입**: QueryProcessor에 LLMService 주입
- **프롬프트 구성**: Query + Sources → RAG Prompt
- **응답 파싱**: Content + Usage 추출

**기술 구현**:
```typescript
// src/services/llm/index.ts
export function getLLMService(): LLMService {
  const provider = env.LLM_PROVIDER || 'openai';
  const strategy = LLMProviderFactory.createStrategy(provider);
  return new LLMService(strategy);
}

// src/lib/rag/core/query.ts
class QueryProcessor {
  constructor(
    private qdrantService: IQdrantService,
    private embeddingService: IEmbeddingService,
    private llmService: ILLMService | null
  ) {}

  async processRAGQuery(request: RAGQueryRequest) {
    // ... retrieve documents ...

    if (this.llmService) {
      const response = await this.llmService.generateRAGResponse(
        request,
        sources
      );
      return response;
    }

    // Search-only fallback
    return { sources };
  }
}
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요 (Architecture Overview)

```
Environment Variable (LLM_PROVIDER)
  ↓
LLMProviderFactory.createStrategy()
  ├─ 'openai' → OpenAIStrategy
  └─ 'glm' → GLMStrategy
  ↓
LLMService (Singleton)
  └─ Holds strategy instance
  ↓
QueryProcessor.processRAGQuery()
  ├─ Retrieve documents (Qdrant)
  ├─ Format prompt (query + sources)
  └─ llmService.generateRAGResponse()
      ├─ strategy.generateRAGCompletion()
      │   ├─ API call (OpenAI or Zhipu AI)
      │   └─ Parse response
      └─ Return RAGQueryResponse
```

### 의존성 (Dependencies)

**Services**:
- `OpenAI`: 4.28.4 (두 제공자 모두 사용)
- `GLM`: Zhipu AI API (OpenAI 클라이언트 호환)

**Core Logic**:
- `LLMProviderFactory`: src/services/llm/factory.ts
- `OpenAIStrategy`: src/services/llm/openai.strategy.ts
- `GLMStrategy`: src/services/llm/glm.strategy.ts
- `LLMService`: src/services/llm/index.ts

**Env Vars**:
```typescript
// Required
OPENAI_API_KEY: string
LLM_PROVIDER?: 'openai' | 'glm'  // Default: 'openai'

// Optional (for GLM)
GLM_API_KEY?: string              // Required if LLM_PROVIDER='glm'
```

### 구현 접근 (Implementation Approach)

**제공자 전환**:
```bash
# OpenAI (default)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# GLM (cost optimization)
LLM_PROVIDER=glm
GLM_API_KEY=your-glm-key
```

**코드 변경 없음**: 환경 변수만으로 제공자 전환

### 관측/운영 (Observability)

**Logging (Pino)**:
- 제공자 선택 로그
- API 호출 시간
- 토큰 사용량
- 비용 추정

**Metrics (추적)**:
- 제공자별 쿼리 수
- 평균 응답 시간
- 토큰 효율 (tokens/query)
- 비용/쿼리

### 실패 모드/대응 (Failure Modes)

| 실패 모드 | 영향 | 대응 |
|-----------|------|------|
| OpenAI API 다운 | 응답 생성 불가 | GLM fallback (구현 필요) |
| GLM API 다운 | 응답 생성 불가 | OpenAI fallback (구현 필요) |
| API Key 만료 | 401 Unauthorized | 키 순환 |
| Rate limit 초과 | 429 Too Many Requests | 재시도 (지수 백오프) |

---

## 데이터 구조 (Data Structure)

### 모델/스키마 (Models/Schemas)

**LLMUsage**:
```typescript
interface LLMUsage {
  model: string;             // e.g., "gpt-4o-mini", "glm-4.6"
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost?: number;             // USD
}
```

**RAGQueryResponse**:
```typescript
interface RAGQueryResponse {
  answer: string;
  sources: SourceReference[];
  usage?: LLMUsage;
  intent?: QueryIntent;
  queryTime?: number;
  model?: string;            // LLM 모델명
}
```

### 비용 계산 (Cost Calculation)

**OpenAI GPT-4o-mini**:
- 입력: $0.15 / 1M tokens
- 출력: $0.60 / 1M tokens
- 500 입력 + 300 출력 = 800 tokens
- 비용: (500 × $0.15 + 300 × $0.60) / 1M = **$0.000255/query**

**GLM-4.6**:
- 입력: $0.005 / 1M tokens
- 출력: $0.025 / 1M tokens
- 500 입력 + 300 출력 = 800 tokens
- 비용: (500 × $0.005 + 300 × $0.025) / 1M = **$0.00001/query**

**절감**: $0.000255 - $0.00001 = **$0.000245/query (96.1% 절감)**

---

## API 명세 (API Specifications)

### LLM Provider Selection

**환경 변수**:
```
LLM_PROVIDER=openai  # or 'glm'
```

**API 요청**:
```bash
curl -X POST http://localhost:3002/api/rag/query \
  -H "X-RAG-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Next.js 배포 방법",
    "limit": 5
  }'
```

**응답** (OpenAI):
```json
{
  "answer": "Next.js를 Vercel에 배포하는 방법은...",
  "sources": [...],
  "usage": {
    "model": "gpt-4o-mini",
    "totalTokens": 823,
    "promptTokens": 523,
    "completionTokens": 300,
    "cost": 0.000255
  },
  "model": "gpt-4.6-mini"
}
```

**응답** (GLM):
```json
{
  "answer": "Next.js를 Vercel에 배포하는 방법은...",
  "sources": [...],
  "usage": {
    "model": "glm-4.6",
    "totalTokens": 823,
    "promptTokens": 523,
    "completionTokens": 300,
    "cost": 0.00001
  },
  "model": "glm-4.6"
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**Scenario 1: OpenAI 사용 (기본)**

```
1. 환경 변수: LLM_PROVIDER=openai
2. 팩토리: OpenAIStrategy 생성
3. QueryProcessor:
   - 문서 검색 (Qdrant)
   - 프롬프트 구성
   - OpenAI API 호출
4. 응답: 고품질 답변 (gpt-4o-mini)
5. 비용: ~$0.000255/query
```

**Scenario 2: GLM 사용 (비용 최적화)**

```
1. 환경 변수: LLM_PROVIDER=glm
2. 팩토리: GLMStrategy 생성
3. QueryProcessor:
   - 문서 검색 (Qdrant)
   - 프롬프트 구성
   - Zhipu AI API 호출
4. 응답: 한국어 최적화 답변 (glm-4.6)
5. 비용: ~$0.00001/query (97% 절감)
```

**Scenario 3: 제공자 전환 (마이그레이션)**

```
1. 초기 배포: OpenAI (품질 확인)
2. A/B 테스트: OpenAI vs GLM 응답 품질 비교
3. GLM 품질 양호 → 환경 변수만 변경
4. 배포: `LLM_PROVIDER=glm`
5. 모니터링: 사용자 피드백, 비용 절감 확인
```

### 실패/예외 시나리오

**Scenario 1: API Key 누락**

```
1. 환경 변수: LLM_PROVIDER=glm
2. GLM_API_KEY 설정 안 됨
3. GLMStrategy 생성: API Key 에러
4. 응답: 500 Internal Server Error
{
  "error": "LLM provider initialization failed",
  "message": "GLM_API_KEY is required when LLM_PROVIDER='glm'"
}
```

**Scenario 2: 잘못된 제공자**

```
1. 환경 변수: LLM_PROVIDER=invalid
2. 팩토리: Unknown provider 에러
3. 응답: 500 Internal Server Error
{
  "error": "Unknown LLM provider",
  "message": "Unknown LLM provider: invalid. Available: openai, glm"
}
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

**API Key 관리**:
- 환경 변수 보호 (Vercel dashboard)
- 키 순환 주기 (30일 권장)
- 키 유출 시 즉시 교체

**Rate Limiting**:
- OpenAI: RPM/TPM 제한
- GLM: RPM/TPM 제한
- 클라이언트 측 재시도 로직

### 성능 (Performance)

**목표 지표**:
- 평균 응답 시간: <2초
  - OpenAI: ~1500ms
  - GLM: ~2000ms
- P95 응답 시간: <3초

**비용 최적화**:
- GLM 사용 시 97% 비용 절감
- 배치 처리 (다중 쿼리)
- 응답 캐싱 (Redis)

### 배포 (Deployment)

**환경 변수**:
```bash
# OpenAI (default)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...

# GLM (cost optimization)
LLM_PROVIDER=glm
GLM_API_KEY=your-glm-key
```

**롤백**:
- 제공자 간 전환 (환경 변수만)
- A/B 테스트 후 결정

### 호환성/마이그레이션 (Compatibility/Migration)

**제공자 전환**:
- OpenAI → GLM: 환경 변수만 변경
- GLM → OpenAI: 환경 변수만 변경
- 코드 변경 불필요

---

## 향후 확장 가능성 (Future Expansion)

### 1. 자동 언어 감지 및 라우팅 (Auto Language Routing)

**구현 계획**:
- 쿼리 언어 감지 (Korean vs English)
- 한국어 → GLM
- 영어 → OpenAI
- 예상 비용 절감: ~70%

### 2. 하이브리드 접근 (Hybrid Approach)

**구현 계획**:
- 병렬 호출 (OpenAI + GLM)
- 품질 비교
- 더 좋은 응답 선택
- 예상 비용 증가: 2x

### 3. 사용자별 제공자 선택 (User-specific Provider)

**구현 계획**:
- 사용자 설정 저장
- 무료 사용자: GLM
- 프리미엄 사용자: OpenAI

### 4. Fallback 메커니즘 (Automatic Fallback)

**구현 계획**:
- 제공자 다운 시 자동 전환
- 재시도 로직
- 건강 상태 모니터링

### 5. 비용 예산 (Cost Budgeting)

**구현 계획**:
- 일일/월간 예산 설정
- 예산 초과 시 자동 전환 (OpenAI → GLM)
- 알림 (Slack, Email)

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD (결정/데이터 필요 항목)

1. **GLM 품질 A/B 테스트**
   - 질문: GLM-4.6이 OpenAI GPT-4o-mini와 동등한 품질을 제공하는가?
   - 필요: 양쪽 응답 비교
   - 메트릭: 사용자 만족도, 출처 클릭률
   - 오너: TBD
   - 기한: 프로덕션 배포 전

2. **자동 언어 라우팅 규칙**
   - 질문: 어떤 언어를 어떤 제공자에 할당할 것인가?
   - 옵션: 한국어 → GLM, 영어 → OpenAI
   - 오너: TBD

3. **Fallback 전략**
   - 질문: 제공자 다운 시 어떻게 대응할 것인가?
   - 옵션: 자동 전환, 에러 반환, 큐잉
   - 오너: TBD

4. **비용 예산 설정**
   - 질문: 월간 예상 한도는 얼마인가?
   - 현재: $45-100 고정 + 변수
   - 오너: TBD

5. **사용자 피드백 수집**
   - 질문: 응답 품질을 어떻게 측정할 것인가?
   - 옵션: Thumbs up/down, "신고하기" 버튼
   - 오너: TBD

---

## 참고 문헌 (References)

- [Facts: LLM Models](../../facts/apps/rag-gateway/config/index.md#llm-models)
- [Facts: Utilities & Services](../../facts/apps/rag-gateway/utils/index.md#llm-service-strategy-pattern)
- [Insights: ROI Analysis](../../insights/apps/rag-gateway/impact/roi.md)
- [Insights: Cost Analysis](../../insights/apps/rag-gateway/impact/cost.md)
