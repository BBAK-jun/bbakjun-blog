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

Document Ingestion Pipeline은 블로그 콘텐츠(MDX 파일)를 Vercel Blob Storage에서 수집하여 의미론적 청크로 분할하고, 임베딩을 생성한 후 Qdrant 벡터 데이터베이스에 인덱싱하는 end-to-end 파이프라인을 제공합니다.

### 범위 (Scope)

**In-Scope**:
- Vercel Blob Storage에서 MDX 파일 수집 (Hono RPC via blog-admin CDC)
- 의미론적 청킹 (Semantic Chunking)
- 임베딩 생성 (OpenAI/SiliconFlow)
- Qdrant 벡터 인덱싱
- 배치 처리 및 진행률 추적
- 증분 업데이트 (변경된 문서만)

**Out-of-Scope**:
- 실시간 파일 시스템 감시 (FSWatcher) - 추후 확장 가능
- 웹 스크래핑 (Web Scraper) - 추후 확장 가능
- 자동 요약 생성 - 추후 확장 가능

### 비즈니스 가치 (Business Value)

- **자동화**: 수동으로 문서를 추가할 필요 없음 (Blob 업로드 시 자동 인제스트)
- **신선도**: 최신 콘텐츠로 검색 결과 유지
- **비용 절감**: Vercel Blob API 호출 99% 감소 (CDC 통합)
- **품질**: 의미론적 청킹으로 문맥 보존

---

## 핵심 기능 (Core Features)

### 1. Vercel Blob Storage 수집 (Blob Collection)

**설명**: Blog-admin의 CDC 캐시에서 MDX 파일 목록을 가져와 다운로드합니다.

**주요 규칙**:
- **Hono RPC 경로**: `{BLOG_ADMIN_URL}/api/rpc/blob-files`
- **파일 필터링**: `.md` 및 `.mdx` 확장자만
- **다운로드**: 병렬로 Blob URL에서 콘텐츠 다운로드
- **메타데이터 추출**: Front Matter (YAML) 파싱

**기술 구현**:
```typescript
// src/lib/rag/ingestion/pipeline.ts: IngestionPipeline.collectDocuments()
const response = await fetch(`${env.BLOG_ADMIN_URL}/api/rpc/blob-files`, {
  query: { search: 'posts/', limit: 1000 }
});
const { files } = await response.json();

// MDX 파일만 필터링
const mdxFiles = files.filter(f =>
  f.pathname.endsWith('.md') || f.pathname.endsWith('.mdx')
);
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

**청킹 예시**:
```
# 제목 1
내용 1...

## 제목 2
내용 2...

[분할 지점]

### 제목 2.1
내용 3...
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

**기술 구현**:
```typescript
// src/services/embedding.ts: EmbeddingService.generateBatchEmbeddings()
const batches = chunkArray(texts, batchSize);
for (const batch of batches) {
  const vectors = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: batch,
  });
  // Cache results
  vectors.forEach((v, i) => {
    const hash = generateTextHash(batch[i]);
    this.cache.set(hash, v.embedding);
  });
}
```

### 4. Qdrant 인덱싱 (Vector Indexing)

**설명**: 청크와 임베딩을 Qdrant 컬렉션에 upsert합니다.

**주요 규칙**:
- **컬렉션**: `blog_documents`
- **벡터 크기**: 1536 (text-embedding-3-small) 또는 1024 (BAAI/bge-m3)
- **거리 메트릭**: Cosine
- **페이로드 저장**: 디스크 (on_disk_payload: true)
- **색인된 필드**: documentId, category, tags, author, source, publishedAt

**Qdrant Point 구조**:
```typescript
{
  id: string;              // UUID (chunk ID)
  vector: number[];        // Embedding vector
  payload: {
    documentId: string;    // Parent document ID
    chunkIndex: number;    // Chunk position in document
    content: string;       // Chunk text
    metadata: DocumentMetadata;
    position?: {
      start: number;       // Start offset in document
      end: number;         // End offset in document
    };
  };
}
```

### 5. 배치 처리 (Batch Processing)

**설명**: 대용량 문서를 처리하기 위해 배치로 나누어 진행률을 추적합니다.

**주요 규칙**:
- **배치 크기**: 기본 10개 문서 (최소 1, 최대 100)
- **진행률 추적**: In-memory Map (jobId → job status)
- **병렬 처리**: 배치 내 문서 병렬 처리
- **에러 처리**: 개별 문서 실패 시 전체 작업 계속

**Job Status**:
```typescript
{
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
    current: string;        // Current operation description
  };
  startedAt: string;
  completedAt?: string;
  errors?: Array<{
    documentId: string;
    error: string;
    timestamp: string;
  }>;
}
```

### 6. 증분 업데이트 (Incremental Updates)

**설명**: 변경되지 않은 문서는 건너뛰고, 변경된 문서만 재인덱싱합니다.

**주요 규칙**:
- **존재 확인**: `documentId`로 Qdrant에서 기존 청크 확인
- **강제 재인덱싱**: `force: true` 옵션으로 전체 재인덱싱
- **업데이트 전략**:
  - 존재하지 않음: upsert
  - 존재 + force=false: skip
  - 존재 + force=true: delete + upsert

**구현**:
```typescript
// src/lib/rag/ingestion/pipeline.ts: IngestionPipeline.runIngestion()
for (const batch of batches) {
  for (const doc of batch) {
    const exists = await qdrantService.countPoints({
      documentId: doc.id
    });

    if (exists > 0 && !config.force) {
      continue; // Skip unchanged documents
    }

    if (exists > 0 && config.force) {
      await qdrantService.deletePoints({ documentId: doc.id });
    }

    // Chunk, embed, upsert
    await this.processDocument(doc);
  }
}
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요 (Architecture Overview)

```
POST /api/rag/ingest
  ↓
Auth + Rate Limit (P0, P2)
  ↓
Input Validation (batchSize: 1-100)
  ↓
IngestionPipeline.startIngestion()
  ├─ 1. Initialize Qdrant Collection
  │   └─ QdrantService.initializeCollection()
  ├─ 2. Collect Documents
  │   ├─ Fetch from blog-admin RPC (CDC)
  │   ├─ Filter MDX files
  │   └─ Download content from Blob URLs
  ├─ 3. Process in Batches
  │   ├─ For each batch:
  │   │   ├─ Check if exists (skip if !force)
  │   │   ├─ Delete existing (if force)
  │   │   ├─ SemanticChunker.chunk()
  │   │   ├─ EmbeddingService.generateBatchEmbeddings()
  │   │   └─ QdrantService.upsertPoints()
  │   └─ Update job progress
  └─ 4. Return Job ID
  ↓
GET /api/rag/ingest/status?jobId={id}
  ↓
Return Job Status
```

### 의존성 (Dependencies)

**Services**:
- `QdrantService`: @qdrant/js-client-rest 1.15.1
- `EmbeddingService`: openai 4.28.4 (또는 SiliconFlow)

**Core Logic**:
- `IngestionPipeline`: src/lib/rag/ingestion/pipeline.ts
- `SemanticChunker`: src/lib/rag/ingestion/chunkers/semantic.ts
- `BlobCollector`: src/lib/rag/ingestion/collectors/blob.ts (내부 사용)

**Env Vars**:
```typescript
// Required
QDRANT_URL: string
OPENAI_API_KEY: string
RAG_GATEWAY_API_KEY: string
BLOG_ADMIN_URL: string

// Optional
QDRANT_API_KEY?: string
SILICONFLOW_API_KEY?: string
EMBEDDING_PROVIDER?: 'openai' | 'siliconflow'
EMBEDDING_MODEL?: EmbeddingModel
```

### 구현 접근 (Implementation Approach)

**IngestionPipeline Usage**:
```typescript
// src/routes/rag/rag.handlers.ts: handlers.ingest()
const pipeline = new IngestionPipeline(qdrantService, embeddingService);

const jobId = await pipeline.startIngestion({
  force: false,
  batchSize: 10,
  blobFiles: fetchedFiles,
});

return { jobId, status: 'started', filesCount: fetchedFiles.length };
```

**SemanticChunker Usage**:
```typescript
// src/lib/rag/ingestion/chunkers/semantic.ts
const chunker = new SemanticChunker();
const chunks = await chunker.chunk(document.content, {
  maxSize: 1200,
  minSize: 100,
  overlap: 200,
  respectStructure: true,
});
```

### 관측/운영 (Observability)

**Logging (Pino)**:
- 인제스트 작업 시작/종료
- 배치 처리 진행률
- 청킹 결과 (청크 수)
- 임베딩 생성 시간
- Qdrant upsert 결과
- 에러 로그

**Metrics (추적)**:
- 총 문서 수
- 처리된 문서 수
- 실패한 문서 수
- 총 청크 수
- 평균 청크 크기
- 인제스트 시간

**Health Checks**:
- GET /api/admin/stats (시스템 통계)
- GET /api/admin/health (컴포넌트 상태)

### 실패 모드/대응 (Failure Modes)

| 실패 모드 | 영향 | 대응 |
|-----------|------|------|
| Blog-admin RPC 실패 | 파일 수집 불가 | 500 Internal Server Error, 재시도 로직 |
| Blob 다운로드 실패 | 일부 문서 누락 | 개별 문서 에러 기록, 계속 진행 |
| 임베딩 API 실패 | 청킹 불가 | 재시도 (지수 백오프), 최대 3회 |
| Qdrant upsert 실패 | 인덱싱 불가 | 재시도, 실패 시 에러 기록 |
| 메모리 부족 (대용량) | OOM | 배치 크기 줄이기 |

---

## 데이터 구조 (Data Structure)

### 모델/스키마 (Models/Schemas)

**BlobFileInfo** (입력):
```typescript
interface BlobFileInfo {
  url: string;              // Blob URL for download
  pathname: string;          // File path (e.g., "posts/DEV/my-post.mdx")
  contentType: string | null;
}
```

**Document** (내부):
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

**Chunk** (출력):
```typescript
interface Chunk {
  id: string;               // UUID (from generateChunkId)
  content: string;
  metadata: {
    position: {
      start: number;        // Start offset in document
      end: number;          // End offset in document
      charCount: number;
    };
    wordCount: number;
  };
}
```

**QdrantPoint** (인덱싱):
```typescript
interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    documentId: string;
    chunkIndex: number;
    content: string;
    metadata: DocumentMetadata;
    position?: {
      start: number;
      end: number;
    };
  };
}
```

### 데이터 흐름 (Data Flow)

```
Vercel Blob Storage (Source)
  ↓
Blog-Admin CDC Cache (Hono RPC)
  ├─ GET /api/rpc/blob-files
  └─ Filter MDX files
  ↓
IngestionPipeline.collectDocuments()
  ├─ Download content from Blob URLs
  ├─ Parse front matter (YAML)
  └─ Extract metadata
  ↓
IngestionPipeline.runIngestion()
  ├─ For each batch:
  │   ├─ Check if exists (Qdrant)
  │   ├─ Delete existing (if force)
  │   ├─ SemanticChunker.chunk()
  │   │   └─ Split into chunks (1200 chars, 200 overlap)
  │   ├─ EmbeddingService.generateBatchEmbeddings()
  │   │   └─ Generate vectors (OpenAI/SiliconFlow)
  │   └─ QdrantService.upsertPoints()
  │       └─ Index vectors + metadata
  └─ Update job progress
  ↓
Qdrant Collection (Indexed)
```

### 검증/제약 (Validation/Constraints)

**Input Limits**:
- 배치 크기: 최소 1, 최대 100 (기본 10)
- 파일 크기: 제한 없음 (but, 청킹으로 분할)
- 청크 크기: 최소 100, 최대 1200자 (기본)

**ID 생성**:
- `documentId`: UUID (from `generateDocumentId(source, path)`)
- `chunkId`: UUID (from `generateChunkId(docId, position)`)
- Deterministic: 동일 입력에 대해 동일 ID

---

## API 명세 (API Specifications)

### POST /api/rag/ingest

**목적**: 블로그 콘텐츠 인제스트 시작

**Auth**: `X-RAG-API-Key` 헤더 필수 (P0)

**Rate Limit**: 60 requests/minute (P2)

**Request**:
```json
{
  "force": false,
  "batchSize": 10,
  "collections": ["blog_documents"]
}
```

**Response** (200 OK):
```json
{
  "jobId": "ingest-1234567890",
  "status": "started",
  "message": "Ingestion job started",
  "filesCount": 150
}
```

### GET /api/rag/ingest/status

**목적**: 인제스트 작업 상태 조회

**Auth**: `X-RAG-API-Key` 헤더 필수

**Rate Limit**: 60 requests/minute

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
    "total": 150,
    "processed": 75,
    "failed": 2,
    "percentage": 50,
    "current": "Processing batch 8/15"
  },
  "startedAt": "2024-12-26T10:00:00Z"
}
```

**Completed Status**:
```json
{
  "jobId": "ingest-1234567890",
  "status": "completed",
  "progress": {
    "total": 150,
    "processed": 148,
    "failed": 2,
    "percentage": 100,
    "current": "Ingestion completed"
  },
  "startedAt": "2024-12-26T10:00:00Z",
  "completedAt": "2024-12-26T10:05:30Z",
  "errors": [
    {
      "documentId": "doc-123",
      "error": "Failed to download blob content",
      "timestamp": "2024-12-26T10:02:15Z"
    }
  ]
}
```

### POST /api/admin/reindex

**목적**: 재인덱싱 작업 시작 (강제 전체 재인덱싱)

**Auth**: 내부 전용 (blog-admin에서 호출)

**Request**:
```json
{
  "force": true,
  "batchSize": 10,
  "collections": ["blog_documents"]
}
```

**Response** (200 OK):
```json
{
  "jobId": "reindex-1234567890",
  "status": "started",
  "config": {
    "force": true,
    "batchSize": 10,
    "collections": ["blog_documents"]
  },
  "estimatedTime": "~5 minutes"
}
```

### GET /api/admin/reindex/{jobId}

**목적**: 재인덱싱 작업 상태 조회

**Response** (200 OK):
```json
{
  "jobId": "reindex-1234567890",
  "status": "running",
  "progress": {
    "total": 150,
    "processed": 50,
    "failed": 0,
    "percentage": 33.3
  },
  "startedAt": "2024-12-26T10:00:00Z",
  "errors": []
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**Scenario 1: 초기 인제스트 (First-time Ingestion)**

```
1. 관리자: POST /api/rag/ingest
2. IngestionPipeline:
   - Qdrant 컬렉션 생성 (blog_documents)
   - Blog-admin RPC에서 150개 MDX 파일 목록 가져오기
   - 배치 처리 시작 (10개/배치)
   - 각 배치:
     - MDX 파일 다운로드
     - Front Matter 파싱
     - Semantic Chunker로 청킹 (평균 20청크/문서)
     - 임베딩 생성 (OpenAI text-embedding-3-small)
     - Qdrant에 upsert (3000 벡터)
   - 진행률 업데이트
3. 완료: status = 'completed', processed = 150, failed = 0
4. 총 인제스트 시간: ~5분
```

**Scenario 2: 증분 업데이트 (Incremental Update)**

```
1. 새 게시물 업로드: Vercel Blob에 5개 새 MDX 파일
2. POST /api/rag/ingest (force: false)
3. IngestionPipeline:
   - 기존 150개 문서 확인 → skip
   - 새 5개 문서만 처리:
     - 청킹 (100청크)
     - 임베딩 생성
     - Qdrant upsert
4. 완료: status = 'completed', processed = 5, failed = 0
5. 총 인제스트 시간: ~30초
```

**Scenario 3: 강제 재인덱싱 (Force Reindex)**

```
1. 임베딩 모델 변경: OpenAI → SiliconFlow
2. POST /api/admin/reindex (force: true)
3. IngestionPipeline:
   - 기존 150개 문서 삭제 (Qdrant)
   - 전체 재처리:
     - 청킹 (3000청크)
     - 새 임베딩 모델로 생성 (BAAI/bge-m3)
     - Qdrant upsert
4. 완료: status = 'completed', processed = 150, failed = 0
5. 총 인제스트 시간: ~5분
```

### 실패/예외 시나리오

**Scenario 1: Blob 다운로드 실패**

```
1. 인제스트 시작
2. 배치 처리 중 1개 파일 다운로드 실패
3. 에러 기록: { documentId: 'doc-123', error: 'Failed to download' }
4. 나머지 파일 계속 처리
5. 완료: processed = 149, failed = 1
6. 응답: 에러 목록 포함
```

**Scenario 2: 임베딩 API Rate Limit**

```
1. 대량 배치 처리 (100개 문서)
2. 임베딩 API: 429 Too Many Requests
3. 재시도 (지수 백오프):
   - 1초 후 재시도 → 실패
   - 2초 후 재시도 → 실패
   - 4초 후 재시도 → 성공
4. 계속 처리
```

**Scenario 3: Qdrant 연결 실패**

```
1. 인제스트 시작
2. Qdrant upsert 시 연결 실패
3. 3회 재시료 후 실패
4. 에러 기록
5. Job status: 'failed'
6. 응답: 500 Internal Server Error
{
  "error": "Failed to upsert points to Qdrant",
  "message": "Connection refused"
}
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

**Blob Access**:
- Blog-admin RPC는 인증 필요 없음 (내부 통신)
- Blob URL은 만료 기간 없음 (Vercel Blob 설정)
- Front Matter에 민감 정보 포함 주의

**API Keys**:
- OpenAI API Key: 환경 변수 보호
- SiliconFlow API Key: 선택사항

### 성능 (Performance)

**목표 지표**:
- 문서 1개 처리 시간: ~2초
  - 다운로드: ~200ms
  - 청킹: ~100ms
  - 임베딩: ~1500ms (20청크)
  - Qdrant upsert: ~200ms
- 전체 인제스트 (150문서): ~5분

**최적화**:
- 배치 처리 (병렬 다운로드)
- 임베딩 캐싱
- Qdrant 배치 upsert (최대 1000포인트/요청)

### 배포 (Deployment)

**Vercel 배포**:
- Serverless Functions 제한 시간 고려 (최대 60초)
- 대용량 인제스트 시 전용 서버 권장

**롤백**:
- 이전 Qdrant 스냅샷으로 복원
- 컬렉션 재생성 (`force: true`)

### 호환성/마이그레이션 (Compatibility/Migration)

**임베딩 모델 변경**:
- text-embedding-3-small (1536차원) → BAAI/bge-m3 (1024차원)
- Qdrant 컬렉션 재생성 필요
- 전체 재인덱싱 (`POST /api/admin/reindex`)

**청킹 파라미터 변경**:
- 기존 청크 삭제 필요
- 전체 재인덱싱

---

## 향후 확장 가능성 (Future Expansion)

### 1. 실시간 파일 감시 (Real-time File Watching)

**구현 계획**:
- FSWatcher 또는 Webhook
- Blob 업로드 시 자동 인제스트 트리거
- CDC 후킹 (blog-admin의 `onBlobUpload`)

**이점**: 콘텐츠 신선도 개선

### 2. 웹 스크래핑 (Web Scraping)

**구현 계획**:
- Puppeteer/Playwright
- URL → Markdown 변환
- 자동 인제스트

### 3. 자동 요약 생성 (Auto-summarization)

**구현 계획**:
- LLM으로 문서 요약 생성
- 요약을 별도 청크로 인덱싱
- 검색 결과에 요약 표시

### 4. 멀티모달 인제스트 (Multimodal Ingestion)

**구현 계획**:
- 이미지 임베딩 (CLIP)
- 오디오 전사 (Whisper)
- PDF 텍스트 추출

### 5. 증분 학습 (Incremental Learning)

**구현 계획**:
- 사용자 피드백 수집
- 관련성 점수 업데이트
- 검색 결과 재정렬

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD (결정/데이터 필요 항목)

1. **인제스트 주기**
   - 질문: 자동 인제스트 주기는?
   - 현재: 수동 트리거만
   - 옵션: 매시간, 매일, 주간
   - 오너: TBD

2. **청킹 파라미터 최적화**
   - 질문: 현재 1200/200이 최적인가?
   - 필요: 검색 품질 A/B 테스트
   - 오너: TBD

3. **대용량 처리 전략**
   - 질문: 10,000+ 게시물 처리 시간은?
   - 현재: ~5분/150게시물
   - 필요: 스트레스 테스트
   - 오너: TBD

4. **에러 알림**
   - 질문: 인제스트 실패 시 어떻게 알릴 것인가?
   - 옵션: Slack, Email, Dashboard
   - 오너: TBD

5. **임베딩 모델 마이그레이션**
   - 질문: 언제 BAAI/bge-m3로 전환할 것인가?
   - 필요: 품질 A/B 테스트
   - 오너: TBD

---

## 참고 문헌 (References)

- [Facts: RAG Gateway Overview](../../facts/apps/rag-gateway/index.md)
- [Facts: API Endpoints](../../facts/apps/rag-gateway/apis/index.md)
- [Facts: Schemas & Types](../../facts/apps/rag-gateway/schemas/index.md)
- [Facts: Utilities & Services](../../facts/apps/rag-gateway/utils/index.md)
- [Insights: Executive Summary](../../insights/apps/rag-gateway/exec/summary.md)
- [Insights: Cost Analysis](../../insights/apps/rag-gateway/impact/cost.md)
