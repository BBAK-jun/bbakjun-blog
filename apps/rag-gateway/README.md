# RAG Gateway

RAG(Retrieval-Augmented Generation) 기반 블로그 검색 및 질의응답 API 서비스입니다. GLM-4.6 LLM과 Qdrant 벡터 데이터베이스를 활용하여 의미론적 검색과 컨텍스트 인식형 응답을 제공합니다.

## 프로젝트 개요 (Project Overview)

RAG Gateway는 DEV_BBAK 블로그의 콘텐츠를 지능적으로 검색하고 질문에 답변하기 위한 중앙 API 서비스입니다.

**핵심 특징:**

- GLM-4.6 기반 RAG 질의응답 시스템
- Qdrant 벡터 데이터베이스를 활용한 의미론적 검색
- MCP (Model Context Protocol) 도구 통합
- 캐싱 최적화된 임베딩 서비스
- 타입 안전한 API 설계 (Zod + OpenAPI)

**기술 스택:**

- **Web Framework**: Hono 4.6.5
- **Validation**: Zod 3.23.8 + @hono/zod-openapi
- **LLM**: GLM-4.6 (OpenAI SDK)
- **Vector DB**: Qdrant 1.3.1
- **Cache**: Redis (선택사항)
- **Language**: TypeScript

## 주요 기능 (Key Features)

### 1. RAG 질의응답 (`/api/rag/query`)

사용자 질문과 관련된 블로그 콘텐츠를 검색하고 GLM-4.6을 활용하여 컨텍스트 인식형 답변을 생성합니다.

**특징:**

- 의미론적 벡터 검색 (상위 K개 문서)
- LLM 기반 자연어 응답 생성
- 쿼리 캐싱 (Redis)으로 성능 최적화

### 2. 의미론적 검색 (`/api/rag/search`)

LLM 응답 없이 순수 의미론적 검색만 수행합니다.

**특징:**

- 벡터 유사도 기반 검색
- 관련성 점수 반환
- 빠른 응답 속도

### 3. 문서 수집 (`/api/rag/ingest`)

블로그 콘텐츠를 벡터화하여 Qdrant에 저장합니다.

**특징:**

- 자동 임베딩 생성
- 배치 처리 지원
- 수집 상태 추적

### 4. MCP 도구 통합 (`/mcp`)

MCP 프로토콜을 통해 다양한 도구를 제공합니다.

**제공 도구:**

- `search_blog`: 블로그 게시물 검색
- `explain_code`: 코드 설명
- `find_examples`: 코드 예제 찾기
- `get_related_posts`: 관련 게시물 가져오기

### 5. 관리자 기능 (`/api/admin`)

시스템 모니터링 및 관리 기능을 제공합니다.

**기능:**

- 사용 통계 (TODO)
- 시스템 로그 (TODO)
- 재인덱싱 (TODO)
- 캐시 관리 (TODO)

## 아키텍처 (Architecture)

```
┌─────────────────┐
│   Client App    │
│  (Blog/Admin)   │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────────────────────────────────────┐
│              RAG Gateway (Hono)                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ RAG Routes  │  │ MCP Routes  │  │  Admin  │ │
│  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │
│         │                │              │       │
│  ┌──────▼────────────────▼──────────────▼──────┐│
│  │              Service Layer                  ││
│  ├──────────┬──────────┬──────────┬───────────┤│
│  │   LLM    │ Qdrant   │ Embedding│  Cache    ││
│  │ Service  │ Service  │ Service  │  (Redis)  ││
│  └────┬─────┴────┬─────┴────┬─────┴─────┬─────┘│
└───────┼──────────┼──────────┼────────────┼──────┘
        │          │          │            │
        ↓          ↓          ↓            ↓
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ GLM-4.6 │ │ Qdrant  │ │ GLM API │ │ Redis   │
   │  API    │ │ Vector  │ │Embed API│ │ Cache   │
   └─────────┘ │   DB    │ └─────────┘ └─────────┘
               └─────────┘
```

### 서비스 구성

**LLMService** (`src/services/llm.ts`)

- GLM-4.6 기반 응답 생성
- RAG 파이프라인 연계
- Max Tokens: 2000

**QdrantService** (`src/services/qdrant.ts`)

- 벡터 데이터베이스 연산
- Collection: `blog_documents`
- Dimension: 1536
- Distance Metric: Cosine

**EmbeddingService** (`src/services/embedding.ts`)

- 텍스트 임베딩 생성
- Provider: GLM
- Model: text-embedding-3-small
- Dimension: 1024
- Redis 캐싱 지원

## 시작하기 (Getting Started)

### 사전 요구사항

- Node.js 18+
- pnpm 8+
- Qdrant 인스턴스 (로컬 또는 클라우드)
- GLM API Key

### 설치

```bash
# 의존성 설치
pnpm install

# 패키지 빌드 (워크스페이스 의존성)
pnpm build
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# 서버 설정
NODE_ENV=development
PORT=3002

# GLM API (필수)
GLM_API_KEY=your_glm_api_key_here

# Qdrant (필수)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key  # 선택사항 (로컬 개발 시 불필요)

# Redis (선택사항 - 캐싱용)
REDIS_URL=redis://localhost:6379

# CORS 설정
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 실행

```bash
# 개발 모드 (핫 리로드)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

서비스가 기동되면 http://localhost:3002 에서 접근할 수 있습니다.

### 헬스 체크

```bash
curl http://localhost:3002/health
# {"status":"ok","timestamp":"2025-12-23T..."}
```

## API 엔드포인트 (API Endpoints)

### 루트 엔드포인트

#### `GET /health`

서비스 상태 확인

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-23T10:00:00Z"
}
```

---

### RAG 엔드포인트 (`/api/rag`)

#### `POST /api/rag/query`

RAG 기반 질의응답 수행

**Request:**

```json
{
  "query": "Next.js의 ISR 기능은 어떻게 작동하나요?",
  "topK": 5,
  "minScore": 0.7
}
```

**Response:**

```json
{
  "answer": "Next.js의 ISR(Incremental Static Regeneration)은...",
  "sources": [
    {
      "id": "doc_123",
      "title": "Next.js ISR 가이드",
      "url": "/blog/nextjs-isr",
      "score": 0.92,
      "snippet": "ISR은 정적 생성의 성능과..."
    }
  ],
  "query": "Next.js의 ISR 기능은 어떻게 작동하나요?",
  "timestamp": "2025-12-23T10:00:00Z"
}
```

#### `POST /api/rag/search`

의미론적 검색만 수행 (LLM 응답 없음)

**Request:**

```json
{
  "query": "TypeScript 타입 추론",
  "topK": 10,
  "minScore": 0.6
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "doc_456",
      "title": "TypeScript 타입 시스템",
      "url": "/blog/typescript-types",
      "score": 0.88
    }
  ],
  "query": "TypeScript 타입 추론",
  "total": 1
}
```

#### `POST /api/rag/ingest`

문서 수집 트리거

**Request:**

```json
{
  "force": false
}
```

**Response:**

```json
{
  "jobId": "ingest_20251223_100000",
  "status": "started",
  "message": "문서 수집이 시작되었습니다."
}
```

#### `GET /api/rag/ingest/status`

수집 상태 확인

**Query Parameters:**

- `jobId` (optional): 특정 작업 ID

**Response:**

```json
{
  "status": "completed",
  "progress": 100,
  "processed": 150,
  "failed": 0,
  "startedAt": "2025-12-23T10:00:00Z",
  "completedAt": "2025-12-23T10:05:00Z"
}
```

#### `GET /api/rag/health`

RAG 서비스 상태 확인

**Response:**

```json
{
  "status": "healthy",
  "services": {
    "qdrant": "connected",
    "glm": "connected",
    "redis": "connected"
  }
}
```

---

### 문서 엔드포인트 (`/api/documents`)

> 현재 TODO 상태입니다.

- `GET /api/documents` - 문서 목록 조회
- `GET /api/documents/:id` - 문서 상세 조회
- `POST /api/documents` - 문서 추가
- `PUT /api/documents/:id` - 문서 수정
- `DELETE /api/documents/:id` - 문서 삭제

---

### MCP 엔드포인트 (`/mcp`)

#### `GET /mcp/tools`

사용 가능한 MCP 도구 목록

**Response:**

```json
{
  "tools": [
    {
      "name": "search_blog",
      "description": "블로그 게시물 검색",
      "parameters": {
        "query": "string",
        "topK": "number"
      }
    },
    {
      "name": "explain_code",
      "description": "코드 설명",
      "parameters": {
        "code": "string",
        "language": "string"
      }
    }
  ]
}
```

#### `POST /mcp/invoke`

MCP 도구 실행

**Request:**

```json
{
  "tool": "search_blog",
  "parameters": {
    "query": "React Hooks 사용법",
    "topK": 5
  }
}
```

**Response:**

```json
{
  "result": [
    {
      "title": "React Hooks 완전 정복",
      "url": "/blog/react-hooks",
      "snippet": "React Hooks는..."
    }
  ],
  "tool": "search_blog"
}
```

#### `POST /mcp/explain`

코드 설명 또는 질의 (TODO)

---

### 관리자 엔드포인트 (`/api/admin`)

> 현재 TODO 상태입니다.

- `GET /api/admin/stats` - 사용 통계
- `GET /api/admin/logs` - 시스템 로그
- `POST /api/admin/reindex` - 전체 재인덱싱
- `GET /api/admin/reindex/:jobId` - 재인덱싱 상태
- `DELETE /api/admin/cache` - 캐시 삭제
- `GET /api/admin/health` - 상세 상태 확인

## 환경 변수 (Environment Variables)

### Server Variables

| 변수 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `NODE_ENV` | string | No | `development` | 실행 모드 (`development\|production\|test`) |
| `PORT` | number | No | `3002` | 서비스 포트 |
| `GLM_API_KEY` | string | **Yes** | - | GLM API 키 |
| `QDRANT_URL` | string | **Yes** | - | Qdrant URL |
| `QDRANT_API_KEY` | string | No | - | Qdrant API 키 (클라우드 시 필요) |
| `REDIS_URL` | string | No | - | Redis URL (캐싱용, 선택사항) |
| `ALLOWED_ORIGINS` | string | No | `localhost:3000,3001` | CORS 허용 오리진 |

### Client Variables

| 변수 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `NEXT_PUBLIC_RAG_URL` | string | **Yes** | RAG Gateway 공개 URL |

## 개발 명령어 (Development Commands)

```bash
# 개발 서버 실행 (핫 리로드)
pnpm dev

# 의존성 빌드
pnpm predev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 테스트
pnpm test
```

## 패키지 구조 (Package Structure)

```
apps/rag-gateway/
├── src/
│   ├── index.ts              # 엔트리 포인트 (Hono 앱)
│   ├── env.ts                # 환경 변수 설정 (t3-env)
│   ├── routes/               # API 라우트
│   │   ├── rag.ts            # RAG 엔드포인트
│   │   ├── documents.ts      # 문서 관리 (TODO)
│   │   ├── mcp.ts            # MCP 도구
│   │   └── admin.ts          # 관리자 기능 (TODO)
│   └── services/             # 비즈니스 로직
│       ├── llm.ts            # GLM-4.6 LLM 서비스
│       ├── qdrant.ts         # Qdrant 벡터 DB 서비스
│       └── embedding.ts      # 임베딩 생성 서비스
├── package.json
├── tsconfig.json
├── tsup.config.ts            # 빌드 설정
└── README.md                 # 이 파일
```

## 워크스페이스 의존성 (Workspace Dependencies)

```json
{
  "@repo/rag-core": "workspace:*",      // RAG 코어 유틸리티
  "@repo/rag-ingestion": "workspace:*", // 문서 수집 파이프라인
  "@repo/rag-types": "workspace:*"      // 공유 타입 정의
}
```

## GLM-4.6 설정

**Base URL:** `https://open.bigmodel.cn/api/paas/v4/`

**Model:** `glm-4.6`

**Configuration:**

```typescript
{
  model: "glm-4.6",
  maxTokens: 2000,
  temperature: 0.7
}
```

## Qdrant 설정

**Collection:** `blog_documents`

**Configuration:**

```typescript
{
  vectors: {
    size: 1536,        // 임베딩 차원
    distance: "Cosine" // 유사도 메트릭
  }
}
```

## 임베딩 설정

**Provider:** GLM

**Model:** `text-embedding-3-small`

**Configuration:**

```typescript
{
  dimensions: 1024,
  batchSize: 100,
  maxTokens: 8191
}
```

## CORS 설정

기본적으로 다음 오리진에서의 요청을 허용합니다:

- `http://localhost:3000` (Blog App)
- `http://localhost:3001` (Admin App)

`ALLOWED_ORIGINS` 환경 변수로 커스터마이즈 가능합니다.

## 에러 처리

모든 엔드포인트는 표준 HTTP 상태 코드와 함께 에러 응답을 반환합니다:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "잘못된 요청입니다.",
    "details": {}
  }
}
```

**공통 에러 코드:**

- `400 Bad Request`: 잘못된 요청 파라미터
- `401 Unauthorized`: 인증 실패
- `429 Too Many Requests`: Rate limiting
- `500 Internal Server Error`: 서버 에러
- `503 Service Unavailable`: 서비스 연결 실패

## 라이선스

MIT

## 기여

이 프로젝트는 DEV_BBAK 블로그의 일부입니다. 개선 사항은 PR로 환영합니다!
