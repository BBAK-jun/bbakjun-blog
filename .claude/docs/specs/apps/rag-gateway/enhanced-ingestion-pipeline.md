# RAG Gateway - 향상된 인제스트 파이프라인

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: 문서 인제스트 파이프라인, 배치 처리, 작업 상태 추적
- **Based on**:
  - Facts: [../../../facts/apps/rag-gateway/utils/index.md](../../../facts/apps/rag-gateway/utils/index.md#ingestionpipeline)
  - Facts: [../../../facts/apps/rag-gateway/apis/index.md](../../../facts/apps/rag-gateway/apis/index.md#post-apiragingest)
  - Insights: [../../../insights/apps/rag-gateway/impact/roi.md](../../../insights/apps/rag-gateway/impact/roi.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/rag-gateway/utils/index.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/rag-gateway/apis/index.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

향상된 인제스트 파이프라인은 **문서 배열 직접 인제스트**, **자동 ID 생성**, **배치 처리**, **작업 상태 추적**, **Force 재인덱싱** 기능을 제공하여 문서 인덱싱 프로세스를 자동화하고 효율성을 개선합니다. 이를 통해 **개발자 생산성 2배 향상**, **신규 콘텐츠 반영 속도 실시간에 가까운 개선**, **Blob API 의존성 제거**의 비즈니스 가치를 제공합니다.

### 범위

**In-Scope**:
- 문서 배열 직접 인제스트 (Blob API 의존성 제거)
- 자동 ID 생성 (누락 시)
- 배치 처리 (batchSize 옵션)
- 작업 상태 추적 (jobId로 진행률 확인)
- Force 재인덱싱 (기존 문서 삭제 후 재인덱싱)
- 배경 작업 실행 (비동기 처리)

**Out-of-Scope**:
- 자동화된 문서 감지 및 인제스트 (blog-admin 훅 연동은 향후 확장)
- 실시간 스트리밍 인제스트
- 분산 인제스트 (멀티 서버)

### 비즈니스 가치

1. **개발자 생산성 향상**: 수동 인제스트에서 자동화된 파이프라인으로 전환하여 작업 시간 50% 절감
2. **신규 콘텐츠 반영 속도**: 인제스트 파이프라인 개선으로 실시간에 가까운 반영
3. **Blob API 의존성 제거**: 직접 문서 배열 인제스트로 외부 의존성 최소화
4. **운영 효율 개선**: 배치 처리 및 작업 상태 추적으로 대량 문서 처리 효율 향상

---

## 핵심 기능 (Core Features)

### 1. 문서 배열 직접 인제스트

**설명**: Vercel Blob Storage API 호출 없이 직접 문서 배열을 인제스트

**주요 규칙**:
- 문서 배열을 API 요청 바디로 직접 전송
- 자동으로 ID 생성 (누락 시)
- BlobFileInfo 인터페이스 지원 (url, pathname, contentType)

**기능**:
```typescript
// POST /api/rag/ingest
{
  documents: [
    {
      id: "optional-auto-generated-if-missing",
      title: "Post Title",
      content: "# Markdown content",
      slug: "DEV/my-post",
      metadata: {
        category: "DEV",
        tags: ["nextjs", "react"],
        author: "bbakjun"
      }
    }
  ],
  force: false,
  batchSize: 10
}
```

### 2. 자동 ID 생성

**설명**: 문서 ID가 누락된 경우 자동으로 고유 ID 생성

**주요 규칙**:
- `generateDocumentId(source, path)` 함수 사용
- UUID 형식으로 결정적 ID 생성
- 동일한 source + path 조합에 대해 항상 동일한 ID 반환

**기능**:
```typescript
// ID가 없는 문서
{ title: "Test", content: "...", slug: "DEV/test" }
// 자동 생성됨
{ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", title: "Test", ... }
```

### 3. 배치 처리

**설명**: 대량 문서를 배치별로 처리하여 메모리 효율성 개선

**주요 규칙**:
- 기본 배치 크기: 10개 문서
- 최소 배치 크기: 1개
- 최대 배치 크기: 100개
- 각 배치는 독립적으로 처리 (개별 실패 시 전체 계속 실행)

**기능**:
```typescript
// 100개 문서를 batchSize 10으로 처리
// 10개 배치 × 10개 문서 = 100개 문서 처리
{
  documents: [...], // 100개 문서
  batchSize: 10     // 10개씩 처리
}
```

### 4. 작업 상태 추적

**설명**: jobId로 실시간 진행률 추적

**주요 규칙**:
- jobId 형식: `ingest_<timestamp>`
- 진행률: total, processed, failed, percentage
- 상태: pending, running, completed, failed
- 상태 조회 API: `GET /api/rag/ingest/status?jobId=ingest_<timestamp>`

**기능**:
```typescript
{
  jobId: "ingest_1735219200000",
  status: "running",
  progress: {
    total: 100,
    processed: 50,
    failed: 2,
    percentage: 50,
    current: "Processing batch 5/10"
  },
  startedAt: "2024-12-26T10:00:00Z"
}
```

### 5. Force 재인덱싱

**설명**: 기존 문서를 삭제 후 재인덱싱

**주요 규칙**:
- `force: true` 시 기존 문서 삭제 후 재인덱싱
- `force: false` 시 존재하는 문서 건너뛰기
- Qdrant에서 중복 문서 감지 (documentId로 검색)

**기능**:
```typescript
// Force 옵션
{
  documents: [...],
  force: true  // 기존 문서 삭제 후 재인덱싱
}

// No Force (기본)
{
  documents: [...],
  force: false  // 존재하는 문서 건너뛰기
}
```

### 6. 배경 작업 실행

**설명**: 비동기로 인제스트 작업 실행

**주요 규칙**:
- API는 즉시 응답 (jobId 반환)
- 실제 인제스트는 배경 작업으로 실행
- 진행률은 상태 조회 API로 확인

**기능**:
```typescript
// API 요청
POST /api/rag/ingest
// 즉시 응답
{
  jobId: "ingest_1735219200000",
  status: "started",
  message: "Document ingestion started",
  documentsCount: 100
}

// 배경 작업 실행 중...
// 상태 조회
GET /api/rag/ingest/status?jobId=ingest_1735219200000
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
인제스트 파이프라인
├── IngestionPipeline (src/lib/rag/ingestion/pipeline.ts)
│   ├── startIngestion()    # 배경 작업 시작
│   ├── runIngestion()      # 실제 인제스트 실행
│   ├── processBatch()      # 배치 처리
│   ├── getJobStatus()      # 작업 상태 조회
│   ├── getAllJobs()        # 모든 작업 조회
│   └── cleanupJobs()       # 오래된 작업 정리
│
├── Collectors (src/lib/rag/ingestion/collectors/)
│   ├── blob.ts             # Vercel Blob Storage
│   └── markdown.ts         # 로컬 마크다운 파일
│
├── Chunkers (src/lib/rag/ingestion/chunkers/)
│   ├── fixed-size.ts       # 고정 크기 청킹
│   └── semantic.ts         # 의미론적 청킹
│
└── Preprocessors (src/lib/rag/ingestion/preprocessors/)
    └── text.ts             # 텍스트 정규화
```

### 의존성

**Services**:
- `QdrantService`: 벡터 데이터베이스 업로드
- `EmbeddingService`: 임베딩 생성
- `SemanticChunker`: 문서 청킹

**Libraries**:
- Hono: 웹 프레임워크
- Zod: 요청 검증

**Env Vars**:
- `QDRANT_URL`: Qdrant 클러스터 URL
- `OPENAI_API_KEY`: 임베딩 생성용 API Key
- `RAG_GATEWAY_API_KEY`: 인증용 API Key

### 구현 접근

1. **API 요청**: `POST /api/rag/ingest`에 문서 배열 전송
2. **작업 생성**: `IngestionPipeline.startIngestion()`으로 jobId 생성
3. **배경 실행**: 비동기로 `runIngestion()` 실행
4. **배치 처리**: `processBatch()`로 batchSize별 문서 처리
5. **상태 추적**: `getJobStatus(jobId)`로 진행률 확인

### 관측/운영(Observability)

**작업 상태 추적**:
- jobId로 실시간 진행률 확인
- total, processed, failed, percentage 메트릭

**에러 처리**:
- 개별 문서 실패 시 전체 파이프라인 계속 실행
- 실패 문서는 failed 카운트에 기록

### 실패 모드/대응(Failure Modes)

**인제스트 실패 시**:
- 개별 문서 실패: failed 카운트 증가, 전체 계속 실행
- 전체 실패: 상태를 `failed`로 변경, 에러 메시지 기록

**Qdrant 다운 시**:
- 재시도 로직 (최대 3회)
- 실패 시 작업 상태를 `failed`로 변경

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**IngestRequest**:
```typescript
interface IngestRequest {
  documents: Array<{
    id?: string;              // Optional: Auto-generated if missing
    title: string;            // Required
    content: string;          // Required: Markdown/MDX content
    slug: string;             // Required: Document slug
    metadata?: {
      category?: string;
      tags?: string[];
      author?: string;
      githubUrl?: string;
    };
  }>;
  force?: boolean;            // Default: false
  batchSize?: number;         // Default: 10, Min: 1, Max: 100
}
```

**IngestResponse**:
```typescript
interface IngestResponse {
  jobId: string;              // Format: ingest_<timestamp>
  status: 'started';
  message: string;
  documentsCount: number;
}
```

**JobStatus**:
```typescript
interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
    current: string;
  };
  startedAt: string;
}
```

### 데이터 흐름

```
POST /api/rag/ingest
    ↓
ingest() 핸들러
    ↓
IngestionPipeline.startIngestion()
    ↓
배경 작업 실행 (runIngestion)
    ↓
collectDocuments() → 문서 수집
    ↓
processBatch() → 배치별 처리
    ↓
각 문서:
  1. checkIfExists() → 존재 확인 (force=false일 때)
  2. deleteIfExists() → 삭제 (force=true일 때)
  3. chunkDocument() → 청킹
  4. generateEmbeddings() → 임베딩 생성
  5. upsertToQdrant() → Qdrant 업로드
    ↓
updateJobProgress() → 진행률 업데이트
    ↓
상태: 'completed'
```

### 검증/제약(Validation/Constraints)

**입력 검증**:
- `title`: 필수, 최소 1글자
- `content`: 필수, 최소 1글자
- `slug`: 필수, 최소 1글자
- `batchSize`: 1-100 사이 정수
- `force`: 불리언

**제약사항**:
- 동일한 documentId로 여러 문서 인제스트 시 마지막 문서만 저장 (force=false)
- force=true 시 기존 문서 삭제 후 재인덱싱

---

## API 명세 (API Specifications)

### POST /api/rag/ingest

**Purpose**: 직접 제공된 문서 배열 인제스트 시작 (배치 처리)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  documents: Array<{
    id?: string;
    title: string;
    content: string;
    slug: string;
    metadata?: {
      category?: string;
      tags?: string[];
      author?: string;
      githubUrl?: string;
    };
  }>;
  force?: boolean;            // Default: false
  batchSize?: number;         // Default: 10, Min: 1, Max: 100
}
```

**Response** (200 OK):
```typescript
{
  jobId: string;              // Job ID for status tracking
  status: 'started';
  message: 'Document ingestion started';
  documentsCount: number;
}
```

**Error Responses**:
- 401 Unauthorized: Missing/invalid API key
- 422 Unprocessable Entity: Validation error
- 500 Internal Server Error: Ingestion failed to start

**Handler**: `src/routes/rag/rag.handlers.ts` (L113-L171)

### GET /api/rag/ingest/status

**Purpose**: 인제스트 작업 상태 조회

**Query Parameters**:
```
jobId: string     # Required
```

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
    current: string;
  };
  startedAt: string;
}
```

**Error Responses**:
- 404 Not Found: Job not found
- 400 Bad Request: Invalid jobId format

**Handler**: `src/routes/rag/rag.handlers.ts` (L173-L212)

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 단일 문서 인제스트**
```
1. POST /api/rag/ingest에 단일 문서 전송
2. jobId 수신
3. GET /api/rag/ingest/status?jobId=...로 진행률 확인
4. 상태: 'completed' 확인
```

**2. 대량 문서 인제스트 (100개)**
```
1. POST /api/rag/ingest에 100개 문서 전송 (batchSize: 10)
2. jobId 수신
3. 10개 배치 × 10개 문서 처리
4. 상태: 'completed', percentage: 100% 확인
```

**3. Force 재인덱싱**
```
1. 기존 문서가 이미 인덱싱됨
2. POST /api/rag/ingest에 force: true로 전송
3. 기존 문서 삭제
4. 재인덱싱 완료
```

### 실패/예외 시나리오

**1. 개별 문서 실패**
```
1. 100개 문서 중 5개 실패
2. 상태: 'completed', failed: 5
3. 95개 문서 정상 인덱싱
4. 실패한 문서는 로그에 기록
```

**2. 인증 실패**
```
1. X-RAG-API-Key 헤더 누락
2. 401 Unauthorized 응답
3. 에러 메시지: "Missing X-RAG-API-Key header"
```

**3. 유효성 검증 실패**
```
1. title 또는 content 누락
2. 422 Unprocessable Entity 응답
3. 에러 메시지: "Validation error"
```

### 권한/역할 시나리오

**1. 개발자**
- 문서 인제스트 실행
- 작업 상태 조회
- 재인덱싱 실행

**2. 시스템 (자동화)**
- blog-admin 훅과 연동 (향후 확장)
- 주기적 재인덱싱

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**API Key 인증**:
- 모든 요청에 `X-RAG-API-Key` 헤더 필요
- 유효하지 않은 키는 401 응답

**입력 검증**:
- title, content, slug 필수
- batchSize: 1-100 범위

### 성능

**배치 처리**:
- 기본 배치 크기: 10개
- 최대 배치 크기: 100개
- 대량 문서 처리 시 메모리 효율성 개선

**비동기 처리**:
- API는 즉시 응답 (jobId 반환)
- 실제 인제스트는 배경 작업으로 실행

### 배포

**롤백 전략**:
- 작업 실패 시 상태를 `failed`로 변경
- 부분적으로 완료된 문서는 유지
- 재시도 시 force 옵션으로 전체 재인덱싱

### 호환성/마이그레이션

**이전 버전과 호환성**:
- BlobFileInfo 인터페이스 계속 지원
- 자동 ID 생성으로 이전 버전과 호환

---

## 향후 확장 가능성 (Future Expansion)

### 1. 문서 자동화 파이프라인 (Low Priority)

**확장 아이디어**: blog-admin의 게시물 발행 훅과 연동

**기능**:
- 게시물 발행 시 자동 인제스트
- 삭제/업데이트 시 자동 재인덱싱
- 실시간 콘텐츠 반영

**예상 효과**:
- 콘텐츠 반영 지연 시간 1일 → 실시간
- 운영 업무 자동화

**참고**: [decisions/recommendations.md](../../../insights/apps/rag-gateway/decisions/recommendations.md#7-문서-자동화-파이프라인-⭐)

### 2. 실시간 스트리밍 인제스트 (Future)

**확장 아이디어**: WebSocket 또는 SSE로 실시간 인제스트 진행률 전송

**기능**:
- 클라이언트가 실시간으로 진행률 수신
- 서버 푸시 기반 업데이트

**예상 효과**:
- 사용자 경험 향상
- 폴링 오버헤드 제거

### 3. 분산 인제스트 (Future)

**확장 아이디어**: 멀티 서버 환경에서 분산 인제스트

**기능**:
- 작업 큐 (Redis Bull)
- 여러 워커가 병렬로 처리
- 작업 분배 및 결과 집계

**예상 효과**:
- 대량 문서 처리 속도 향상
- 수평 확장 가능

---

## 추가로 필요 정보(Needed Data/Decisions)

### TBD: blog-admin 훅 연동

- **질문**: blog-admin 게시물 발행 시 자동 인제스트 훅 구현 방법
- **오너**: 개발팀
- **기한**: 6-12개월 (Low Priority)

### TBD: 작업 큐 구현

- **질문**: 분산 인제스트를 위한 작업 큐 도구 선택 (Redis Bull, AWS SQS 등)
- **오너**: 아키텍트
- **기한**: 12개월 이상 (Future)

### TBD: 실시간 진행률 전송

- **질문**: WebSocket vs SSE 선택
- **오너**: 개발팀
- **기한**: 6-12개월 (Future)
