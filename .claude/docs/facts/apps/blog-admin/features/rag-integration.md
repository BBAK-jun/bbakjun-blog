# RAG Integration Feature

- **Scope**: RAG Gateway 연동 및 블로그 콘텐츠 지능형 검색
- **Source of Truth**: Server Actions + Hono RPC Client
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## 메타데이터

```yaml
metadata:
  version: "1.0.0"
  created_at: "2025-12-31T00:00:00Z"
  last_verified: "2025-12-31T00:57:47Z"
  git_commit: "c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d"

  source_files:
    apps/blog-admin/src/app/actions/rag.ts:
      git_hash: "c0049e1"
      last_modified: "2025-12-31T00:00:00Z"
      source_exists: true
    apps/blog-admin/src/app/dashboard/rag/page.tsx:
      git_hash: "c0049e1"
      last_modified: "2025-12-31T00:00:00Z"
      source_exists: true
    apps/blog-admin/src/lib/rag.rpc.ts:
      git_hash: "c0049e1"
      source_exists: true
    apps/blog-admin/src/env.ts:
      git_hash: "c0049e1"
      source_exists: true

  deleted_files: []
```

## 개요

RAG(Retrieval-Augmented Generation) 통합은 블로그 관리자가 RAG Gateway를 통해 블로그 콘텐츠를 지능적으로 검색하고 질문에 답변할 수 있는 기능을 제공합니다.

## 아키텍처

```
Blog-Admin UI (/dashboard/rag)
    ↓
Server Actions (ragQuery, ragSearch, ragHealth)
    ↓ (Hono RPC Client)
RAG Gateway API (Hono)
    ↓
Qdrant Vector DB + LLM (OpenAI/GLM)
```

## 환경 변수

### RAG_GATEWAY_API_KEY

- **Purpose**: RAG Gateway 인증 키
- **Type**: String (required for Server Actions)
- **Location**: `src/env.ts`
- **Usage**: Server Action에서 API 요청 시 헤더에 포함
- **Security**: Server-only (클라이언트 노출 방지)

### NEXT_PUBLIC_RAG_GATEWAY_URL

- **Purpose**: RAG Gateway URL
- **Type**: String (URL)
- **Default**: `http://localhost:3002`
- **Location**: `src/env.ts`
- **Usage**: Hono RPC Client 생성 시

## Hono RPC Client

### ragClient

- **Location**: `src/lib/rag.rpc.ts`
- **Type**: Hono Client with type safety
- **Base URL**: `${env.NEXT_PUBLIC_RAG_GATEWAY_URL}/api`
- **Definition**:

```typescript
import { env } from '@/env';
import { RagGatewayApp } from '@apps/rag-gateway';
import { hc } from 'hono/client';

export const ragClient = hc<RagGatewayApp>(`${env.NEXT_PUBLIC_RAG_GATEWAY_URL}/api`);
```

- **Methods**:
  - `ragClient.rag.query.$post()` - RAG 쿼리
  - `ragClient.rag.search.$post()` - 벡터 검색
  - `ragClient.rag.health.$get()` - 헬스 체크

## Server Actions

### ragQuery(input)

- **Location**: `src/app/actions/rag.ts` (L27-L70)
- **Purpose**: RAG 쿼리 실행 (LLM 기반 답변)
- **Auth**: None (API key 포함)
- **Input Schema**:

```typescript
{
  query: string; // min 1
  temperature?: number; // 0-2, default 0.7
  limit?: number; // 1-20, default 5
  includeSources?: boolean; // default true
  collectionName?: string; // optional
}
```

- **Response**:

```typescript
{
  success: true;
  data: {
    answer: string; // LLM 생성 답변
    sources: Array<{
      id: string;
      title: string;
      slug: string;
      score: number;
      content: string;
    }>;
    queryTime: number; // ms
  };
}
```

- **Error Response**:

```typescript
{
  success: false;
  error: string; // Error message
}
```

- **Implementation**:
  1. Zod validation
  2. API request with `X-RAG-API-Key` header
  3. Response parsing
  4. Error handling

### ragSearch(input)

- **Location**: `src/app/actions/rag.ts` (L78-L121)
- **Purpose**: 벡터 검색만 수행 (LLM 미사용)
- **Input Schema**: Same as `ragQuery`
- **Response**: `{ success: true, data: { results: [...] } }`
- **Use Case**: 관련 문서 검색만 필요할 때

### ragHealth()

- **Location**: `src/app/actions/rag.ts` (L128-L155)
- **Purpose**: RAG Gateway 헬스 체크
- **Response**: `{ success: true, data: { status: 'ok', version: string } }`
- **Use Case**: RAG Gateway 연결 상태 확인

## UI Components

### RAG Query Page

- **Location**: `src/app/dashboard/rag/page.tsx`
- **Type**: Client Component
- **Features**:
  - 채팅형 UI (대화형)
  - 메시지 히스토리
  - Markdown 렌더링 (ReactMarkdown)
  - 소스 문서 표시
  - Temperature/limit 파라미터 조절
  - 로딩 상태
  - 에러 처리 (Toast)

#### Message Interface

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    slug: string;
    score: number;
  }>;
  timestamp: Date;
  queryTime?: number;
}
```

#### Form Schema

```typescript
{
  query: string; // min 1
  temperature: number; // 0-2
  limit: number; // 1-20
}
```

## RAG Gateway Endpoints

### POST /api/rag/query

- **Purpose**: RAG 쿼리 실행
- **Request**: `{ query, temperature, limit, includeSources, collectionName }`
- **Response**: `{ answer, sources, queryTime }`

### POST /api/rag/search

- **Purpose**: 벡터 검색
- **Request**: Same as query
- **Response**: `{ results: [...] }`

### GET /api/rag/health

- **Purpose**: 헬스 체크
- **Response**: `{ status, version }`

## Dependencies

- **hono/client**: Type-safe RPC client
- **@apps/rag-gateway**: RAG Gateway app type
- **zod**: Schema validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Zod integration
- **react-markdown**: Markdown rendering
- **sonner**: Toast notifications
- **lucide-react**: Icons

## Usage Flow

1. **관리자 접속**: `/dashboard/rag`
2. **질문 입력**: 채팅 입력창에 질문 입력
3. **파라미터 조절**: Temperature, Limit 설정 (선택)
4. **질문 전송**: `ragQuery()` Server Action 호출
5. **응답 표시**:
   - LLM 답변 (Markdown)
   - 소스 문서 리스트
   - 쿼리 시간
6. **대화 계속**: 메시지 히스토리에 추가

## Error Handling

- **Validation 실패**: Zod error + Toast
- **API 실패**: Error message + Toast
- **네트워크 오류**: Generic error message
- **타임아웃**: Request timeout handling

## Security

- **API Key 보호**: Server Action에서만 사용
- **인증 불필요**: 현재 공개 접근 (추후 인증 추가 예정)
- **Rate Limiting**: RAG Gateway에서 처리
- **Input Validation**: Zod 스키마

## Future Enhancements

- 스트리밍 응답 (Server-Sent Events)
- 채팅 히스토리 저장
- 프롬프트 템플릿
- 관리자 인증
- 쿼리 로그 저장
- 피드백 수집 (좋아요/싫어요)
