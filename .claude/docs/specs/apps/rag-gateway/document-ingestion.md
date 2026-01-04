# Document Ingestion Pipeline - 기능 명세서

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: 문서 수집, 청킹, 임베딩 생성, Qdrant 인덱싱
- **Based on**:
  - Facts: ../../facts/apps/rag-gateway/
  - Insights: ../../insights/apps/rag-gateway/
- **Last Verified**: 2024-12-26
- **Repo Ref**: bbakjun-blog monorepo

---

## 개요 (Overview)

### 목적 (Purpose)

Document Ingestion Pipeline은 `.claude/docs` 디렉토리에 있는 기술 문서(Facts, Insights, Specs)를 수집하여 의미론적 청크로 분할하고, 임베딩을 생성한 후 Qdrant 벡터 데이터베이스에 인덱싱합니다. 이는 RAG 시스템이 코드베이스의 구조와 기능에 대한 정확한 답변을 생성할 수 있도록 하는 **SSOT (Single Source of Truth)** 역할을 합니다.

### 범위 (Scope)

**In-Scope**:
- `.claude/docs` 디렉토리에서 Markdown 파일 수집
- 의미론적 청킹 (Semantic Chunking)
- 임베딩 생성 (OpenAI/SiliconFlow)
- Qdrant 벡터 인덱싱
- `POST /api/documents`를 통한 직접 문서 업로드

**Out-of-Scope**:
- Vercel Blob Storage에서 블로그 포스트 수집 (제거됨)
- 실시간 파일 시스템 감시 (FSWatcher)
- 웹 스크래핑 (Web Scraper)

### 비즈니스 가치 (Business Value)

- **SSOT 유지**: `.claude/docs`가 코드베이스의 유일한 진실 공급원
- **자동화**: 수동으로 문서를 추가할 필요 없음
- **품질**: 의미론적 청킹으로 문맥 보존
- **정확성**: 코드베이스에 기반한 Fact/Insight/Spec 생성

---

## 핵심 기능 (Core Features)

### 1. 문서 수집 (Document Collection)

**설명**: `.claude/docs` 디렉토리에서 Markdown 파일을 수집합니다.

**주요 규칙**:
- **디렉토리 구조**:
  ```
  .claude/docs/
  ├── facts/apps/<app>/     # 코드베이스 기술적 사실
  ├── insights/apps/<app>/  # 비즈니스 컨텍스트/분석
  └── specs/apps/<app>/     # 기능 명세서
  ```
- **파일 필터링**: `.md` 확장자만
- **카테고리 추출**: 경로에서 카테고리 추출 (예: `facts/apps/blog-admin/apis`)

**기술 구현**:
```typescript
// scripts/ingest-claude-docs.ts
const docsPath = join(ROOT_DIR, '.claude/docs');
const files = getMarkdownFiles(docsPath);

for (const file of files) {
  await fetch(`${RAG_GATEWAY_URL}/api/documents`, {
    method: 'POST',
    body: JSON.stringify({
      title: frontMatter.title || file.title,
      content: markdownContent,
      metadata: {
        slug: file.path.replace('.claude/docs/', '').replace('.md', ''),
        category: file.category,
        source: 'upload',
      },
    }),
  });
}
```

### 2. 의미론적 청킹 (Semantic Chunking)

**설명**: 문서 구조(제목, 코드 블록, 목록)를 존중하며 문맥을 보존하는 방식으로 청킹합니다.

**주요 규칙**:
- **최대 크기**: 1200자 (기본)
- **최소 크기**: 100자 (기본)
- **중복(Overlap)**: 200자 (기본)
- **구조 존중**: 제목, 코드 블록, 목록 경계에서 분할

**청킹 전략**:
```typescript
// src/lib/rag/ingestion/chunkers/semantic.ts
interface ChunkingOptions {
  maxSize?: number;          // Default: 1200
  minSize?: number;          // Default: 100
  overlap?: number;          // Default: 200
  respectStructure?: boolean; // Default: true
}
```

### 3. 임베딩 생성 (Embedding Generation)

**설명**: 각 청크에 대해 임베딩 벡터를 생성합니다.

**주요 규칙**:
- **제공자**: OpenAI (text-embedding-3-small) 또는 SiliconFlow (BAAI/bge-m3)
- **배치 처리**: 기본 50개 청크/배치
- **캐싱**: 텍스트 해시(SHA-256) → 벡터 Map
- **재시도**: 지수 백오프 (최대 3회)

**임베딩 모델**:
| 모델 | 차원 | 최대 토큰 | 용도 |
|------|------|-----------|------|
| text-embedding-3-small | 1536 | 8191 | 기본 (OpenAI) |
| BAAI/bge-m3 | 1024 | 8192 | 다국어/한국어 (SiliconFlow) |

### 4. Qdrant 인덱싱 (Vector Indexing)

**설명**: 청크와 임베딩을 Qdrant 컬렉션에 upsert합니다.

**주요 규칙**:
- **컬렉션**: `blog_documents`
- **벡터 크기**: 1536 (text-embedding-3-small) 또는 1024 (BAAI/bge-m3)
- **거리 메트릭**: Cosine
- **페이로드 저장**: 디스크 (on_disk_payload: true)

---

## API 명세 (API Specifications)

### POST /api/documents

**목적**: 문서 직접 인덱싱

**Request**:
```json
{
  "title": "문서 제목",
  "content": "마크다운 내용",
  "slug": "facts/apps/blog-admin/apis",
  "metadata": {
    "githubUrl": "https://github.com/...",
    "category": "facts/apps/blog-admin",
    "tags": ["api", "rpc"],
    "author": "claude-code",
    "description": "문서 설명",
    "source": "upload"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "doc-uuid",
  "title": "문서 제목",
  "slug": "facts/apps/blog-admin/apis",
  "status": "indexed",
  "chunksCreated": 15,
  "metadata": {
    "indexedAt": "2024-12-26T10:00:00Z"
  }
}
```

### GET /api/documents

**목적**: 인덱싱된 문서 목록 조회

**Query Parameters**:
- `limit`: 최대 100 (기본 20)
- `offset`: 기본 0
- `category`: 필터링할 카테고리
- `tags`: 쉼표로 구분된 태그
- `author`: 필터링할 작성자

**Response** (200 OK):
```json
{
  "documents": [
    {
      "id": "doc-uuid",
      "title": "문서 제목",
      "slug": "facts/apps/blog-admin/apis",
      "metadata": { ... }
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**Scenario 1: 초기 인제스트 - 배치 방식 권장 (First-time Ingestion - Batch)**

```
1. 개발자: 스크립트 실행
   node scripts/ingest-claude-docs.ts
2. 스크립트:
   - .claude/docs에서 100개 Markdown 파일 스캔
   - POST /api/rag/ingest로 한 번에 전송 (배치)
   - 각 문서:
     - Semantic Chunker로 청킹 (평균 15청크/문서)
     - 임베딩 생성 (OpenAI text-embedding-3-small)
     - Qdrant에 upsert (1500 벡터)
3. 완료: 100개 문서 인덱싱 완료
4. 총 인제스트 시간: ~2분
```

**Scenario 2: 단일 문서 업데이트**

```
1. 문서 수정: .claude/docs/facts/apps/blog-admin/apis/index.md
2. POST /api/documents (단일 문서)
3. RAG Gateway:
   - 기존 문서 삭제 (documentId로 식별)
   - 새로운 청킹 및 임베딩
   - Qdrant upsert
4. 완료: 문서 업데이트됨
```

**Scenario 3: 배치 인제스트 상태 조회**

```
1. POST /api/rag/ingest 응답: { jobId: "ingest_1234567890" }
2. GET /api/rag/ingest/status?jobId=ingest_1234567890
3. 응답:
   {
     "jobId": "ingest_1234567890",
     "status": "running",
     "progress": { "total": 100, "processed": 50, "percentage": 50 }
   }
```

---

## API 명세 (API Specifications)

### POST /api/rag/ingest

**목적**: 다중 문서 배치 인제스트 (권장)

**Auth**: `X-RAG-API-Key` 헤더 필수

**Rate Limit**: 60 requests/minute

**Request**:
```json
{
  "documents": [
    {
      "title": "API Endpoints",
      "content": "# API Endpoints\n\n...",
      "slug": "facts/apps/blog-admin/apis",
      "metadata": {
        "category": "facts/apps/blog-admin",
        "tags": ["api", "rpc"],
        "author": "claude-code",
        "description": "API endpoints documentation"
      }
    }
  ],
  "force": false,
  "batchSize": 10
}
```

**Response** (200 OK):
```json
{
  "jobId": "ingest-1234567890",
  "status": "started",
  "message": "Document ingestion started",
  "documentsCount": 100
}
```

### GET /api/rag/ingest/status

**목적**: 배치 인제스트 상태 조회

**Auth**: `X-RAG-API-Key` 헤더 필수

**Query Parameters**:
```
jobId: string     # Required
```

**Response** (200 OK):
```json
{
  "jobId": "ingest-1234567890",
  "status": "running",
  "progress": {
    "total": 100,
    "processed": 50,
    "failed": 2,
    "percentage": 50,
    "current": "Processing batch 6/10"
  },
  "startedAt": "2024-12-26T10:00:00Z"
}
```

---

## 데이터 흐름 (Data Flow)

### 단일 문서 인제스트

```
.claude/docs/ (SSOT)
  ↓
POST /api/documents
  ↓
RAG Gateway
  ├─ SemanticChunker.chunk()
  ├─ EmbeddingService.generateBatchEmbeddings()
  └─ QdrantService.upsertPoints()
  ↓
Qdrant Collection (Indexed)
```

### 배치 문서 인제스트 (권장)

```
.claude/docs/ (SSOT)
  ↓
scripts/ingest-claude-docs.ts
  ├─ 파일 스캔 (재귀)
  ├─ Front Matter 파싱
  └─ POST /api/rag/ingest (배치)
  ↓
RAG Gateway (POST /api/rag/ingest)
  ├─ IngestionPipeline.startIngestion()
  ├─ 배치 처리 (batchSize = 10)
  ├─ SemanticChunker.chunk()
  ├─ EmbeddingService.generateBatchEmbeddings()
  └─ QdrantService.upsertPoints()
  ↓
Qdrant Collection (Indexed)
```

---

## 데이터 구조 (Data Structure)

### 모델/스키마 (Models/Schemas)

**Document** (입력):
```typescript
interface Document {
  id: string;               // UUID (from generateDocumentId)
  content: string;          // Markdown content
  metadata: DocumentMetadata;
}

interface DocumentMetadata {
  title: string;
  slug?: string;
  author?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
  wordCount?: number;
  language: string;         // Default: 'ko'
  source: DocumentSource;
  sourceUrl?: string;
  uploadedAt: string;
  lastModified: string;
}
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### RAG 목적 (RAG Purpose)

RAG Gateway의 진짜 목적은 **`.claude/docs` 문서들을 기반으로 Fact/Insight/Spec을 생성하는 것**입니다.

- **데이터 소스**: `.claude/docs` (SSOT)
- **목적**: 코드베이스에 대한 정확한 기술적 답변
- **사용처**: GitHub Actions 자동 문서 업데이트

### 제거된 기능 (Removed Features)

다음 기능들은 제거되었습니다:
- ❌ Vercel Blob Storage에서 블로그 포스트 수집
- ❌ Blog-Admin RPC blob-files 엔드포인트 호출
- ❌ `POST /api/admin/reindex` 엔드포인트

### 인제스트 방식 비교

| 방식 | 엔드포인트 | 용도 |
|------|-----------|------|
| 단일 문서 | `POST /api/documents` | 개별 문서 업데이트 |
| 배치 문서 | `POST /api/rag/ingest` | 대량 인제스트 (권장) |

---

## 참고 문헌 (References)

- [Facts: RAG Gateway Overview](../../facts/apps/rag-gateway/index.md)
- [Facts: API Endpoints](../../facts/apps/rag-gateway/apis/index.md)
- [Insights: Executive Summary](../../insights/apps/rag-gateway/exec/summary.md)
- [Script: ingest-claude-docs.ts](../../../apps/rag-gateway/scripts/ingest-claude-docs.ts)
