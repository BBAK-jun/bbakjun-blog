# MCP Integration - 기능 명세서

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: Model Context Protocol (MCP) 도구 통합
- **Based on**:
  - Facts: ../../facts/apps/rag-gateway/
  - Insights: ../../insights/apps/rag-gateway/
- **Last Verified**: 2024-12-26
- **Repo Ref**: bbakjun-blog monorepo

---

## 개요 (Overview)

### 목적 (Purpose)

MCP Integration은 AI 모델이 블로그 콘텐츠와 상호작용할 수 있는 표준화된 도구 세트를 제공합니다. Model Context Protocol (MCP)을 구현하여 AI 어시스턴트가 블로그 게시물을 검색하고, 코드를 설명하고, 예제를 찾을 수 있습니다.

### 범위 (Scope)

**In-Scope**:
- **도구 목록**: GET /api/mcp/tools
- **도구 실행**: POST /api/mcp/invoke
- **코드 설명**: POST /api/mcp/explain
- **4가지 도구**:
  1. `search_blog`: 블로그 게시물 검색
  2. `explain_code`: 코드 설명
  3. `find_examples`: 기술별 코드 예제 찾기
  4. `get_related_posts`: 관련 게시물 가져오기

**Out-of-Scope**:
- MCP 서버로서의 외부 노출 (현재 내부 전용)
- 양방향 스트리밍 - 추후 확장 가능
- 도구 간 종속성 관리 - 추후 확장 가능

### 비즈니스 가치 (Business Value)

- **AI 어시스턴트 통합**: Claude, ChatGPT 등이 블로그 콘텐츠 활용 가능
- **콘텐츠 발견**: AI가 관련 게시물을 찾아 사용자에게 추천
- **자동화된 지원**: 자주 묻는 질문에 AI가 답변
- **표준화**: MCP 표준을 따르는 다양한 AI 모델과 호환

---

## 핵심 기능 (Core Features)

### 1. MCP 도구 목록 (Tool Discovery)

**설명**: 사용 가능한 MCP 도구 목록을 제공합니다.

**주요 규칙**:
- **엔드포인트**: GET /api/mcp/tools
- **인증**: 불필요 (공개)
- **응답 형식**: MCP 표준 준수

**도구 정의**:
```typescript
// src/routes/mcp/mcp.handlers.ts
const AVAILABLE_MCP_TOOLS = [
  {
    name: 'search_blog',
    description: 'Search blog posts for relevant information',
    parameters: {
      query: { type: 'string', description: 'Search query' },
      limit: { type: 'number', default: 10, description: 'Max results' }
    }
  },
  {
    name: 'explain_code',
    description: 'Explain code snippets from the blog',
    parameters: {
      code: { type: 'string', description: 'Code to explain' },
      language: { type: 'string', description: 'Programming language' }
    }
  },
  {
    name: 'find_examples',
    description: 'Find code examples for specific technologies',
    parameters: {
      technology: { type: 'string', description: 'Technology name' },
      limit: { type: 'number', default: 5 }
    }
  },
  {
    name: 'get_related_posts',
    description: 'Get posts related to a specific topic',
    parameters: {
      topic: { type: 'string', description: 'Topic keyword' },
      limit: { type: 'number', default: 5 }
    }
  }
];
```

### 2. search_blog 도구

**설명**: 블로그 게시물에서 관련 정보를 검색합니다.

**주요 규칙**:
- **입력**: query (string), limit (number, 기본 10)
- **동작**: Qdrant 시맨틱 검색
- **출력**: 관련 게시물 목록 (제목, 슬러그, 발췌 내용)

**구현**:
```typescript
// src/routes/mcp/mcp.handlers.ts: invokeSearchBlog()
async function invokeSearchBlog(args: { query: string; limit?: number }) {
  const queryVector = await embeddingService.generateEmbedding(args.query);
  const results = await qdrantService.search(queryVector, {
    limit: args.limit || 10,
    threshold: 0.7,
  });

  return {
    content: results.map(r => ({
      type: 'text',
      text: `# ${r.metadata?.title}\n${r.text}\n[Source: /blog/${r.slug}]`
    }))
  };
}
```

### 3. explain_code 도구

**설명**: 블로그의 코드 스니펫을 설명합니다.

**주요 규칙**:
- **입력**: code (string), language (string, optional)
- **동작**: 코드와 관련된 게시물 검색 → LLM으로 설명 생성
- **출력**: 코드 설명 + 관련 게시물

**구현**:
```typescript
// src/routes/mcp/mcp.handlers.ts: invokeExplainCode()
async function invokeExplainCode(args: { code: string; language?: string }) {
  // 1. 코드에서 키워드 추출
  const concepts = extractConceptsFromCode(args.code);

  // 2. 관련 게시물 검색
  const searchQuery = concepts.join(' ');
  const sources = await searchRelatedContent(searchQuery);

  // 3. LLM으로 설명 생성
  const explanation = await llmService.generateRAGResponse({
    query: `Explain this code:\n\`\`\`${args.language || ''}\n${args.code}\n\`\`\``,
    sources
  });

  return {
    content: [{
      type: 'text',
      text: explanation.answer + '\n\nSources: ' + explanation.sources.map(s => s.title).join(', ')
    }]
  };
}
```

### 4. find_examples 도구

**설명**: 특정 기술과 관련된 코드 예제를 찾습니다.

**주요 규칙**:
- **입력**: technology (string), limit (number, 기본 5)
- **동작**: 기술 이름으로 검색 + 코드 블록 필터링
- **출력**: 코드 예제 목록

**구현**:
```typescript
// src/routes/mcp/mcp.handlers.ts: invokeFindExamples()
async function invokeFindExamples(args: { technology: string; limit?: number }) {
  const query = `${args.technology} examples code snippet`;
  const results = await qdrantService.search(
    await embeddingService.generateEmbedding(query),
    { limit: args.limit || 5, threshold: 0.6 }
  );

  // 코드 블록 추출
  const examples = results.flatMap(r => extractCodeBlocks(r.text));

  return {
    content: examples.map(ex => ({
      type: 'text',
      text: `Example for ${args.technology}:\n\`\`\`\n${ex.code}\n\`\`\`\nFrom: ${ex.source}`
    }))
  };
}
```

### 5. get_related_posts 도구

**설명**: 특정 주제와 관련된 게시물을 가져옵니다.

**주요 규칙**:
- **입력**: topic (string), limit (number, 기본 5)
- **동작**: 주제 키워드로 검색
- **출력**: 관련 게시물 목록

**구현**:
```typescript
// src/routes/mcp/mcp.handlers.ts: invokeGetRelatedPosts()
async function invokeGetRelatedPosts(args: { topic: string; limit?: number }) {
  const query = `${args.topic} tutorial guide`;
  const results = await qdrantService.search(
    await embeddingService.generateEmbedding(query),
    { limit: args.limit || 5, threshold: 0.7 }
  );

  return {
    content: results.map(r => ({
      type: 'text',
      text: `## ${r.metadata?.title}\n${r.metadata?.description}\n[Read more](/blog/${r.slug})`
    }))
  };
}
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요 (Architecture Overview)

```
AI Model (Claude, ChatGPT, etc.)
  ↓
MCP Client (Standard Protocol)
  ↓
GET /api/mcp/tools (Tool Discovery)
  ↓
POST /api/mcp/invoke (Tool Execution)
  ↓
MCP Handler Router
  ├─ search_blog → Qdrant Search
  ├─ explain_code → Qdrant + LLM
  ├─ find_examples → Qdrant + Code Extraction
  └─ get_related_posts → Qdrant Search
  ↓
MCP Response (Standard Format)
  ↓
AI Model
```

### 의존성 (Dependencies)

**Services**:
- `QdrantService`: @qdrant/js-client-rest (벡터 검색)
- `EmbeddingService`: openai (임베딩 생성)
- `LLMService`: openai/glm (설명 생성)

**Core Logic**:
- MCP Handlers: src/routes/mcp/mcp.handlers.ts
- MCP Routes: src/routes/mcp/mcp.routes.ts

**Env Vars**:
```typescript
// Required
QDRANT_URL: string
OPENAI_API_KEY: string
RAG_GATEWAY_API_KEY: string

// Optional
EMBEDDING_PROVIDER?: 'openai' | 'siliconflow'
LLM_PROVIDER?: 'openai' | 'glm'
```

### 구현 접근 (Implementation Approach)

**MCP 표준 준수**:
```typescript
// MCP Response Format
interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}
```

**도구 실행 흐름**:
```typescript
// src/routes/mcp/mcp.handlers.ts: handlers.invokeTool()
export async function invokeTool(c: Context) {
  const { tool, arguments: args, context } = await c.req.json();

  switch (tool) {
    case 'search_blog':
      return await invokeSearchBlog(args);
    case 'explain_code':
      return await invokeExplainCode(args);
    case 'find_examples':
      return await invokeFindExamples(args);
    case 'get_related_posts':
      return await invokeGetRelatedPosts(args);
    default:
      return c.json({ error: 'Unknown tool', tool }, 400);
  }
}
```

### 관측/운영 (Observability)

**Logging (Pino)**:
- 도구 호출 로그 (tool, args)
- 실행 시간
- 결과 수
- 에러 로그

**Metrics (추적)**:
- 도구별 호출 빈도
- 평균 실행 시간
- 검색 결과 수
- LLM 토큰 사용량

### 실패 모드/대응 (Failure Modes)

| 실패 모드 | 영향 | 대응 |
|-----------|------|------|
| Qdrant 다운 | 검색 불가 | 503 Service Unavailable |
| 임베딩 API 실패 | 도구 실행 불가 | 500 Internal Server Error |
| LLM API 실패 | 설명 생성 불가 | 소스만 반환 (fallback) |
| 잘못된 도구 이름 | 400 Bad Request | 명시적 에러 메시지 |

---

## 데이터 구조 (Data Structure)

### 모델/스키마 (Models/Schemas)

**MCP Tool Definition**:
```typescript
interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, {
    type: string;
    description?: string;
    default?: any;
  }>;
}
```

**MCP Invoke Request**:
```typescript
interface MCPInvokeRequest {
  tool: string;                    // Tool name
  arguments: Record<string, unknown>;
  context?: {
    conversationId?: string;
    userId?: string;
  };
}
```

**MCP Response**:
```typescript
interface MCPResponse {
  content: Array<{
    type: string;                  // 'text', 'image', etc.
    text: string;
  }>;
  isError?: boolean;
}
```

---

## API 명세 (API Specifications)

### GET /api/mcp/tools

**목적**: 사용 가능한 MCP 도구 목록 조회

**Auth**: 불필요 (공개)

**Response** (200 OK):
```json
{
  "tools": [
    {
      "name": "search_blog",
      "description": "Search blog posts for relevant information",
      "parameters": {
        "query": { "type": "string", "description": "Search query" },
        "limit": { "type": "number", "default": 10 }
      }
    },
    {
      "name": "explain_code",
      "description": "Explain code snippets from the blog",
      "parameters": {
        "code": { "type": "string", "description": "Code to explain" },
        "language": { "type": "string", "description": "Programming language" }
      }
    },
    {
      "name": "find_examples",
      "description": "Find code examples for specific technologies",
      "parameters": {
        "technology": { "type": "string", "description": "Technology name" },
        "limit": { "type": "number", "default": 5 }
      }
    },
    {
      "name": "get_related_posts",
      "description": "Get posts related to a specific topic",
      "parameters": {
        "topic": { "type": "string", "description": "Topic keyword" },
        "limit": { "type": "number", "default": 5 }
      }
    }
  ],
  "protocol": "mcp",
  "version": "1.0.0"
}
```

### POST /api/mcp/invoke

**목적**: MCP 도구 실행

**Auth**: 불필요 (공개)

**Request**:
```json
{
  "tool": "search_blog",
  "arguments": {
    "query": "Next.js 배포 방법",
    "limit": 5
  },
  "context": {
    "conversationId": "conv-123",
    "userId": "user-456"
  }
}
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "type": "text",
      "text": "# Next.js Deployment Guide\nVercel에 배포하는 방법은...\n[Source: /blog/DEV/nextjs-deployment]"
    },
    {
      "type": "text",
      "text": "# Deploying Next.js to AWS\nAWS S3 + CloudFront 배포...\n[Source: /blog/DEV/nextjs-aws]"
    }
  ],
  "isError": false
}
```

### POST /api/mcp/explain

**목적**: 코드/쿼리 설명 생성

**Auth**: 불필요

**Request**:
```json
{
  "query": "useState와 useEffect의 차이는?",
  "code": "const [count, setCount] = useState(0);\nuseEffect(() => { ... }, []);",
  "context": "React hooks learning"
}
```

**Response** (200 OK):
```json
{
  "query": "useState와 useEffect의 차이는?",
  "explanation": "useState는 상태를 관리하는 훅이고, useEffect는 사이드 이펙트를 처리하는 훅입니다...",
  "sources": [
    {
      "title": "React Hooks 완벽 가이드",
      "slug": "REACT/react-hooks-guide",
      "excerpt": "useState는 함수 컴포넌트에서 상태를 관리..."
    }
  ],
  "relatedCode": [
    {
      "language": "typescript",
      "code": "const [count, setCount] = useState(0);",
      "explanation": "useState를 사용하여 count 상태를 선언했습니다."
    }
  ]
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**Scenario 1: AI 어시스턴트가 블로그 검색**

```
1. 사용자 (Claude): "Next.js 배포 방법 알려줘"
2. Claude: MCP Tool Discovery → GET /api/mcp/tools
3. Claude: search_blog 도구 선택
4. POST /api/mcp/invoke
{
  "tool": "search_blog",
  "arguments": { "query": "NextJS deployment", "limit": 5 }
}
5. RAG Gateway:
   - 임베딩 생성
   - Qdrant 검색
   - 결과 포맷팅
6. 응답: 관련 게시물 5개
7. Claude: 사용자에게 답변 생성 (출처 포함)
```

**Scenario 2: 코드 설명 요청**

```
1. 사용자: "이 코드 설명해줘"
2. 코드 제공: useState 예시
3. Claude: explain_code 도구 호출
4. POST /api/mcp/invoke
{
  "tool": "explain_code",
  "arguments": { "code": "const [count, setCount] = useState(0);", "language": "react" }
}
5. RAG Gateway:
   - 코드에서 개념 추출 (useState, React state)
   - 관련 게시물 검색
   - LLM으로 설명 생성
6. 응답: 코드 설명 + 관련 게시물
```

**Scenario 3: 기술별 예제 찾기**

```
1. 사용자: "TypeScript utility type examples 보여줘"
2. Claude: find_examples 도구 호출
3. POST /api/mcp/invoke
{
  "tool": "find_examples",
  "arguments": { "technology": "TypeScript utility types", "limit": 5 }
}
4. RAG Gateway:
   - 검색: "TypeScript utility types examples code"
   - 코드 블록 추출
5. 응답: 코드 예제 목록
```

### 실패/예외 시나리오

**Scenario 1: 잘못된 도구 이름**

```
1. POST /api/mcp/invoke
{
  "tool": "invalid_tool",
  "arguments": {}
}
2. 응답: 400 Bad Request
{
  "error": "Unknown tool",
  "tool": "invalid_tool",
  "availableTools": ["search_blog", "explain_code", "find_examples", "get_related_posts"]
}
```

**Scenario 2: Qdrant 다운**

```
1. POST /api/mcp/invoke
{
  "tool": "search_blog",
  "arguments": { "query": "test" }
}
2. Qdrant 연결 실패
3. 응답: 503 Service Unavailable
{
  "error": "Service Unavailable",
  "message": "Vector database is currently unavailable"
}
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

**공개 엔드포인트**:
- 현재 인증 불필요
- 추후 API Key 추가 고려

**코드 실행**:
- 코드를 실행하지 않고 설명만 제공
- 안전한 코드 블록 추출

### 성능 (Performance)

**목표 지표**:
- 도구 실행 시간: <3초
  - 검색: ~500ms
  - 설명 생성: ~2000ms

**최적화**:
- 임베딩 캐싱
- 검색 결과 캐싱

### 배포 (Deployment)

**내부 전용**:
- 현재 blog-admin 내부에서만 사용
- 추후 공개 MCP 서버 고려

---

## 향후 확장 가능성 (Future Expansion)

### 1. 공개 MCP 서버 (Public MCP Server)

**구현 계획**:
- 인증 추가 (API Key)
- 속도 제한 (Rate limiting)
- 도구 사용량 추적

### 2. 스트리밍 응답 (Streaming Responses)

**구현 계획**:
- Server-Sent Events (SSE)
- 실시간 응답 전송

### 3. 도구 간 종속성 (Tool Dependencies)

**구현 계획**:
- 도구 체이닝 (explain_code → search_blog)
- 컨텍스트 공유

### 4. 사용자별 도구 (User-specific Tools)

**구현 계획**:
- 사용자 검색 기록
- 개인화된 추천

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD (결정/데이터 필요 항목)

1. **공개 여부**
   - 질문: MCP 엔드포인트를 공개할 것인가?
   - 현재: 내부 전용
   - 오너: TBD

2. **인증 방식**
   - 질문: MCP 인증을 어떻게 구현할 것인가?
   - 옵션: API Key, OAuth, JWT
   - 오너: TBD

3. **도구 추가**
   - 질문: 어떤 추가 도구가 필요한가?
   - 옵션: summarize, translate, categorize
   - 오너: TBD

4. **비용 모델**
   - 질문: MCP 사용에 대해 비용을 청구할 것인가?
   - 옵션: 무료, 종량제, 구독
   - 오너: TBD

---

## 참고 문헌 (References)

- [Facts: MCP Routes](../../facts/apps/rag-gateway/pages/routes.md#mcp-routes-apimcp)
- [Facts: MCP Tools](../../facts/apps/rag-gateway/utils/index.md#mcp-tools)
- [Insights: Executive Summary](../../insights/apps/rag-gateway/exec/summary.md)
