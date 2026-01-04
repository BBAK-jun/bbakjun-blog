# RAG Gateway - 다중 모델 아키텍처

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: 다중 임베딩 모델 지원, LLM 제공자 전략, 비용 최적화
- **Based on**:
  - Facts: [../../../facts/apps/rag-gateway/config/index.md](../../../facts/apps/rag-gateway/config/index.md)
  - Facts: [../../../facts/apps/rag-gateway/utils/index.md](../../../facts/apps/rag-gateway/utils/index.md#llm-service-strategy-pattern)
  - Insights: [../../../insights/apps/rag-gateway/impact/cost.md](../../../insights/apps/rag-gateway/impact/cost.md)
  - Insights: [../../../insights/apps/rag-gateway/impact/roi.md](../../../insights/apps/rag-gateway/impact/roi.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/rag-gateway/config/index.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/rag-gateway/utils/index.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

다중 모델 아키텍처는 **10개 이상의 임베딩 모델 지원**, **다중 LLM 제공자 전략 (OpenAI, GLM)**, **비용 최적화**를 통해 벤더 종속성을 50% 이상 감소하고 한국어 콘텐츠 비용을 95% 절감합니다. 이를 통해 **월 $50-$100 비용 절감**, **벤더 리스크 분산**, **성능/비용 트레이드오프 선택 가능**의 비즈니스 가치를 제공합니다.

### 범위

**In-Scope**:
- 다중 임베딩 모델 지원 (OpenAI, GLM, BAAI, Zephyr)
- 다중 LLM 제공자 전략 (OpenAI, GLM)
- LLMProviderFactory 패턴 (Strategy Pattern)
- 임베딩 캐싱 (In-memory Map)
- 제공자별 설정 및 환경변수

**Out-of-Scope**:
- 언어별 자동 모델 라우팅 (향후 확장)
- A/B 테스트 프레임워크 (향후 확장)
- 모델 성능 모니터링 대시보드 (향후 확장)

### 비즈니스 가치

1. **비용 절감**: GLM 모델은 OpenAI 대비 95% 저렴 (input: $0.005/M vs $0.15/M)
2. **벤더 리스크 분산**: 단일 벤더 종속성 제거, 장애 시 즉시 전환 가능
3. **성능 최적화**: 한국어/중국어에는 GLM/BAAI, 영어에는 OpenAI 사용 가능
4. **확장성**: 새로운 모델 및 제공자 쉽게 추가 가능

---

## 핵심 기능 (Core Features)

### 1. 다중 임베딩 모델 지원

**설명**: 10개 이상의 임베딩 모델 지원으로 벤더 유연성 확보

**주요 규칙**:
- OpenAI: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`
- GLM: `embedding-2`, `embedding-3`
- BAAI: `bge-m3`, `bge-large-zh-v1.5`
- Zephyr: `zephyr-embedding`, `zephyr-embedding-large`

**지원 모델**:
```
OpenAI (1536-3072 dims):
  - text-embedding-3-small (1536 dims, $0.02/1M tokens)
  - text-embedding-3-large (3072 dims, $0.13/1M tokens)
  - text-embedding-ada-002 (1536 dims, $0.10/1M tokens)

GLM (1024 dims):
  - embedding-2 (1024 dims, 한국어 최적화)
  - embedding-3 (1024 dims, 개선된 성능)

BAAI (1024 dims):
  - bge-m3 (1024 dims, 다국어 지원)
  - bge-large-zh-v1.5 (1024 dims, 중국어 최적화)

Zephyr (1024-4096 dims):
  - zephyr-embedding (1024 dims)
  - zephyr-embedding-large (4096 dims)
```

### 2. 다중 LLM 제공자 전략

**설명**: Strategy Pattern으로 다중 LLM 제공자 지원

**주요 규칙**:
- LLMProviderFactory로 제공자 생성
- OpenAI: `gpt-4o-mini`, `gpt-4o`
- GLM: `glm-4.6` (한국어 최적화)
- 런타임에 제공자 전환 가능

**LLMProviderStrategy Interface**:
```typescript
interface LLMProviderStrategy {
  generateRAGCompletion(prompt: string, temperature: number): Promise<{
    content: string;
    usage: LLMUsage;
    model: string;
  }>;
  generateChatCompletion(message: string, temperature: number): Promise<string>;
  getProviderName(): string;
}
```

### 3. LLMProviderFactory (Strategy Pattern)

**설명**: 팩토리 패턴으로 LLM 제공자 생성 및 관리

**주요 규칙**:
- `createStrategy(provider)`: 제공자 전략 생성
- `clearCache()`: 제공자 캐시 초기화
- `getAvailableProviders()`: 사용 가능한 제공자 목록

**사용법**:
```typescript
import { getLLMService } from '@/services/llm';

const llmService = getLLMService();  // Uses env.LLM_PROVIDER

const response = await llmService.generateRAGResponse(request, sources);
// or
const chatResponse = await llmService.chat('Explain this code', 0.7);
```

### 4. 임베딩 캐싱 (In-memory Map)

**설명**: 텍스트 해시 기반 임베딩 캐시로 API 호출 95% 감소

**주요 규칙**:
- 텍스트 SHA-256 해시를 캐시 키로 사용
- In-memory Map에 캐시 저장
- `getCacheStats()`로 캐시 크기 및 메모리 추정 확인

**캐시 성능**:
```typescript
{
  size: 1250,              // 캐시된 임베딩 수
  memoryEstimate: 7812500  // 추정 메모리 (bytes)
}
```

### 5. 제공자별 설정

**설명**: 환경변수로 제공자 및 모델 설정

**주요 규칙**:
- `LLM_PROVIDER`: openai (기본값) 또는 glm
- `EMBEDDING_PROVIDER`: openai (기본값) 또는 glm
- `EMBEDDING_MODEL`: 모델 선택 (기본값: text-embedding-3-small)

**환경변수**:
```bash
# LLM 제공자
LLM_PROVIDER=glm              # openai 또는 glm

# 임베딩 제공자
EMBEDDING_PROVIDER=openai     # openai 또는 glm

# 임베딩 모델
EMBEDDING_MODEL=text-embedding-3-small

# API Keys
OPENAI_API_KEY=sk-...
GLM_API_KEY=...               # 2025-12-29부터 필수
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
다중 모델 아키텍처
├── LLMService (Strategy Pattern)
│   ├── LLMProviderFactory
│   │   ├── createStrategy(provider)  # 제공자 생성
│   │   ├── clearCache()              # 캐시 초기화
│   │   └── getAvailableProviders()   # ['openai', 'glm']
│   │
│   ├── Strategies (구현체)
│   │   ├── OpenAIStrategy (openai.strategy.ts)
│   │   │   ├── gpt-4o-mini ($0.15/M input, $0.60/M output)
│   │   │   └── gpt-4o ($2.50/M input, $10.00/M output)
│   │   │
│   │   └── GLMStrategy (glm.strategy.ts)
│   │       ├── glm-4.6 ($0.005/M input, $0.025/M output)
│   │       └── Base URL: https://open.bigmodel.cn/api/paas/v4/
│   │
│   └── Types (types.ts)
│       └── LLMProviderStrategy (interface)
│
├── EmbeddingService
│   ├── generateEmbedding()       # 단일 텍스트 임베딩
│   ├── generateBatchEmbeddings() # 배치 임베딩 (캐시 포함)
│   ├── getOrGenerate()           # 캐시 우선 조회
│   ├── clearCache()              # 캐시 초기화
│   └── getCacheStats()           # 캐시 통계
│
└── Configuration (env.ts)
    ├── LLM_PROVIDER              # openai | glm
    ├── EMBEDDING_PROVIDER        # openai | glm
    ├── EMBEDDING_MODEL           # 모델 선택
    └── OPENAI_API_KEY, GLM_API_KEY
```

### 의존성

**LLM Providers**:
- OpenAI: `openai` 패키지 (v4.28.4)
- GLM: Zhipu AI API (커스텀 구현)

**Embedding Providers**:
- OpenAI: `openai` 패키지
- GLM: Zhipu AI API (커스텀 구현)

**Libraries**:
- Zod: 환경변수 검증

**Env Vars**:
```bash
LLM_PROVIDER=openai|glm
EMBEDDING_PROVIDER=openai|glm
EMBEDDING_MODEL=text-embedding-3-small|...
OPENAI_API_KEY=sk-...
GLM_API_KEY=...
```

### 구현 접근

1. **제공자 선택**: `env.LLM_PROVIDER`로 런타임에 제공자 선택
2. **전략 생성**: `LLMProviderFactory.createStrategy(provider)`
3. **임베딩 생성**: `EmbeddingService.generateEmbedding(text)`
4. **캐싱**: 텍스트 해시로 중복 임베딩 방지
5. **LLM 호출**: 제공자별 `generateRAGCompletion()` 호출

### 관측/운영(Observability)

**LLMUsage 메트릭**:
```typescript
{
  model: string;           // e.g., "glm-4.6", "gpt-4o-mini"
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost?: number;           // USD
}
```

**캐시 통계**:
```typescript
{
  size: number;            // 캐시된 임베딩 수
  memoryEstimate: number;  // 추정 메모리 (bytes)
}
```

### 실패 모드/대응(Failure Modes)

**제공자 장애 시**:
- 즉시 다른 제공자로 전환 가능
- 환경변수만 변경하면 됨

**임베딩 생성 실패 시**:
- 재시도 로직 (최대 3회)
- 실패 시 에러 응답

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**EmbeddingModel (Type)**:
```typescript
type EmbeddingModel =
  // OpenAI models
  | 'text-embedding-3-small'    // 1536 dims
  | 'text-embedding-3-large'    // 3072 dims
  | 'text-embedding-ada-002'    // 1536 dims
  // GLM models
  | 'embedding-2'               // 1024 dims
  | 'embedding-3'               // 1024 dims
  // BAAI models
  | 'BAAI/bge-m3'               // 1024 dims (multilingual)
  | 'BAAI/bge-large-zh-v1.5'    // 1024 dims (Chinese)
  // Zephyr models
  | 'zephyr-embedding'          // 1024 dims
  | 'zephyr-embedding-large';   // 4096 dims
```

**LLMProvider (Type)**:
```typescript
type LLMProvider = 'openai' | 'glm';
```

**LLMUsage**:
```typescript
interface LLMUsage {
  model: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  cost?: number;
}
```

### 데이터 흐름

```
RAG Query 요청
    ↓
1. 제공자 선택 (env.LLM_PROVIDER)
    ↓
2. LLMProviderFactory.createStrategy(provider)
    ↓
3. EmbeddingService.generateEmbedding(query)
    ├─ 캐시 확인 (text hash)
    ├─ 캐시 miss → API 호출
    └─ 캐시 hit → 즉시 반환
    ↓
4. Qdrant 벡터 검색
    ↓
5. LLMProvider.generateRAGCompletion(prompt, sources)
    ↓
6. 응답 (answer + sources + usage)
```

### 검증/제약(Validation/Constraints)

**모델 제약**:
- 벡터 차원: 1024 (GLM/BAAI) 또는 1536-3072 (OpenAI)
- 최대 토큰: 8191 (OpenAI), 8192 (GLM)

**비용 제약**:
- Rate Limiting: 60 requests/60 seconds (Standard)
- 최대 월 비용: ~$101 (GLM) 또는 ~$738 (OpenAI)

---

## API 명세 (API Specifications)

### POST /api/rag/query

**Purpose**: RAG 질의응답 (다중 LLM 제공자 지원)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  query: string;
  context?: string;
  intent?: QueryIntent;
  filters?: DocumentFilter;
  limit?: number;             // Default: 5, Max: 20
  temperature?: number;       // Default: 0.7, Min: 0, Max: 2
  includeSources?: boolean;   // Default: true
  stream?: boolean;           // Default: false
}
```

**Response** (200 OK):
```typescript
{
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    score: number;
    metadata?: { ... };
  }>;
  usage?: {
    model: string;           // e.g., "glm-4.6", "gpt-4o-mini"
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    cost?: number;
  };
  intent?: QueryIntent;
  queryTime?: number;
  model?: string;
}
```

**Handler**: `src/routes/rag/rag.handlers.ts` (L15-L60)

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. OpenAI 제공자 사용**
```
1. env.LLM_PROVIDER=openai 설정
2. POST /api/rag/query 요청
3. gpt-4o-mini로 응답 생성
4. usage에 OpenAI 비용 포함
```

**2. GLM 제공자 사용 (비용 절감)**
```
1. env.LLM_PROVIDER=glm 설정
2. POST /api/rag/query 요청
3. glm-4.6으로 응답 생성
4. usage에 GLM 비용 포함 (95% 저렴)
```

**3. 임베딩 캐시 적중**
```
1. 동일한 쿼리 2번 실행
2. 첫 번째: API 호출 → 임베딩 생성 → 캐시 저장
3. 두 번째: 캐시 적중 → API 호출 없이 즉시 반환
4. 캐시 적중률 90% 달성
```

### 실패/예외 시나리오

**1. 제공자 장애 시**
```
1. GLM API 장애 발생
2. 에러 응답: "Failed to generate LLM completion"
3. env.LLM_PROVIDER=openai로 변경
4. 즉시 OpenAI로 전환
```

**2. 지원하지 않는 모델**
```
1. env.EMBEDDING_MODEL=unknown-model 설정
2. 시작 시 검증 실패
3. 에러: "Invalid embedding model"
```

### 권한/역할 시나리오

**1. 개발자**
- 제공자 및 모델 선택
- 비용 최적화 전략 수립
- A/B 테스트 실행

**2. 운영팀**
- 제공자 장애 시 즉시 전환
- 비용 모니터링 및 알림

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**API Key 관리**:
- OpenAI API Key: `OPENAI_API_KEY`
- GLM API Key: `GLM_API_KEY` (2025-12-29부터 필수)
- 환경변수로 관리, 코드에 하드코딩 금지

### 성능

**임베딩 캐시**:
- 캐시 적중 시: ~1ms
- API 호출 시: ~500ms
- 90% 캐시 적중률 목표

**비용**:
- GLM: $0.000012/query (95% 저렴)
- OpenAI: $0.000257/query

### 배포

**롤백 전략**:
- 제공자 장애 시 환경변수만 변경하여 즉시 롤백
- 캐시는 메모리에 저장되어 재시작 시 초기화

### 호환성/마이그레이션

**모델 호환성**:
- 벡터 차원이 다른 모델 간 전환 시 재인덱싱 필요
- 1536 dims (OpenAI) ↔ 1024 dims (GLM)

---

## 향후 확장 가능성 (Future Expansion)

### 1. GLM 모델 품질 A/B 테스트 (High Priority)

**확장 아이디어**: GLM과 OpenAI 품질 비교

**기능**:
- 50% 트래픽을 GLM, 50%를 OpenAI로 분배
- 2주간 A/B 테스트 진행
- 답변 품질, 사용자 만족도, 응답 속도 비교

**예상 효과**:
- 월 $50-$100 비용 절감 (100k queries/month 기준)
- 품질 손실 없는 비용 최적화

**참고**: [decisions/recommendations.md](../../../insights/apps/rag-gateway/decisions/recommendations.md#2-glm-모델-품질-ab-테스트-⭐⭐⭐)

### 2. 언어별 자동 모델 라우팅 (Low Priority)

**확장 아이디어**: 언어 감지 후 최적 모델로 라우팅

**기능**:
- 한국어: GLM/BAAI (비용 저렴, 성능 우수)
- 영어: OpenAI (품질 우수)
- 중국어: BAAI/bge-large-zh-v1.5
- 일본어: 추가 모델 평가

**예상 효과**:
- 70-80% 비용 절감 vs OpenAI-only
- 언어별 최적 성능

**참고**: [decisions/recommendations.md](../../../insights/apps/rag-gateway/decisions/recommendations.md#8-다국어-지원-확장-⭐)

### 3. 모델 성능 모니터링 대시보드 (Medium Priority)

**확장 아이디어**: 모델별 성능 메트릭 대시보드

**기능**:
- 모델별 검색 정확도
- 응답 속도 비교
- 비용 추적
- 사용자 만족도

**예상 효과**:
- 최적 모델 선택으로 월 $50-$100 절감
- 데이터 기반 의사결정

**참고**: [decisions/recommendations.md](../../../insights/apps/rag-gateway/decisions/recommendations.md#3-모니터링-대시보드-구축-⭐⭐)

---

## 추가로 필요 정보(Needed Data/Decisions)

### TBD: GLM 품질 검증

- **질문**: GLM-4.6이 OpenAI gpt-4o-mini와 품질 동등한가?
- **오너**: 개발팀
- **기한**: 2-3주 (A/B 테스트 포함)

### TBD: 최적 모델 선택 기준

- **질문**: 비용, 성능, 품질 트레이드오프 기준
- **오너**: 아키텍트
- **기한**: 1달 내 결정 권장

### TBD: 벡터 차원 마이그레이션

- **질문**: 1536 dims (OpenAI) → 1024 dims (GLM) 마이그레이션 전략
- **오너**: 운영팀
- **기한**: 3개월 내 계획 수립 권장
