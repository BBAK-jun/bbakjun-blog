# Vector Search Integration - 기능 명세서

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: Qdrant 벡터 데이터베이스 통합 (시맨틱 검색, 인덱싱)
- **Based on**:
  - Facts: ../../facts/apps/rag-gateway/
  - Insights: ../../insights/apps/rag-gateway/
- **Last Verified**: 2024-12-26
- **Repo Ref**: bbakjun-blog monorepo

---

## 개요 (Overview)

### 목적 (Purpose)

Vector Search Integration은 Qdrant 벡터 데이터베이스를 사용하여 블로그 콘텐츠의 의미론적 검색을 제공합니다. 키워드 매칭이 아닌 벡터 유사도를 기반으로 관련 문서를 찾아냅니다.

### 범위 (Scope)

**In-Scope**:
- **Qdrant Client**: @qdrant/js-client-rest 1.15.1
- **Collection 관리**: blog_documents 컬렉션 생성/삭제
- **Vector Search**: Cosine similarity 기반 검색
- **Filtering**: Payload 필터링 (category, tags, author, source, publishedAt)
- **CRUD Operations**: Upsert, Search, Delete, Scroll, Count
- **Health Checks**: 연결 상태 모니터링

**Out-of-Scope**:
- 하이브리드 검색 (Vector + Keyword) - 추후 확장 가능
- 재정렬 (Reranking) - 별도 모듈로 구현됨
- 멀티벡터 검색 (다른 임베딩 모델) - 추후 확장 가능

### 비즈니스 가치 (Business Value)

- **의미론적 검색**: 키워드와 상관없이 의미로 검색 (3-5x 개선)
- **빠른 검색**: 밀리초 단위 응답 시간
- **확장 가능성**: 수백만 문서 처리 가능
- **비용 효율**: 한 번 설정 후 추가 비용 없음 (Qdrant Cloud 1GB)

---

## 핵심 기능 (Core Features)

### 1. Qdrant Client Setup (클라이언트 설정)

**설명**: Qdrant 클라우드 또는 셀프 호스팅 인스턴스에 연결합니다.

**주요 규칙**:
- **Singleton 패턴**: 단일 인스턴스 재사용
- **연결**: 환경 변수 `QDRANT_URL` (필수), `QDRANT_API_KEY` (선택)
- **클라이언트**: @qdrant/js-client-rest

**기술 구현**:
```typescript
// src/services/qdrant.ts
let qdrantServiceInstance: QdrantService | null = null;

export function getQdrantService(): QdrantService {
  if (!qdrantServiceInstance) {
    qdrantServiceInstance = new QdrantService();
  }
  return qdrantServiceInstance;
}

class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: env.QDRANT_URL,
      apiKey: env.QDRANT_API_KEY,
    });
  }
}
```

### 2. Collection Management (컬렉션 관리)

**설명**: `blog_documents` 컬렉션을 생성하고 설정합니다.

**주요 규칙**:
- **컬렉션명**: `blog_documents`
- **벡터 크기**: 1536 (text-embedding-3-small) 또는 1024 (BAAI/bge-m3)
- **거리 메트릭**: Cosine
- **온디스크 페이로드**: true (디스크에 저장)
- **복제 요인**: 1

**Collection Config**:
```typescript
// src/services/qdrant.ts: initializeCollection()
const collectionConfig: CreateCollection = {
  collection_name: this.collectionName,
  vectors: {
    size: 1536,                    // text-embedding-3-small
    distance: 'Cosine',
  },
  optimizers_config: {
    default_segment_number: 2,
    max_segment_size: 200000,
    memmap_threshold: 50000,
  },
  replication_factor: 1,
  write_consistency_factor: 1,
  on_disk_payload: true,           // Store payload on disk
};
```

### 3. Payload Indexing (페이로드 인덱싱)

**설명**: 자주 필터링하는 필드에 인덱스를 생성합니다.

**인덱스된 필드**:
```typescript
// src/services/qdrant.ts: initializeCollection()
const indexedFields = [
  { name: 'documentId', field_schema: 'keyword' },
  { name: 'metadata.category', field_schema: 'keyword' },
  { name: 'metadata.tags', field_schema: 'keyword' },
  { name: 'metadata.author', field_schema: 'keyword' },
  { name: 'metadata.source', field_schema: 'keyword' },
  { name: 'metadata.publishedAt', field_schema: 'datetime' },
];
```

**이점**:
- 필터링 성능 향상
- 정확한 일치 필터 (keyword)
- 날짜 범위 필터 (datetime)

### 4. Vector Similarity Search (벡터 유사도 검색)

**설명**: 쿼리 벡터와 가장 유사한 청크를 검색합니다.

**주요 규칙**:
- **검색 방법**: 검색 벡터와 포인트 간 Cosine similarity
- **유사도 임계값**: 기본 0.7 (최소 0, 최대 1)
- **최대 결과**: 기본 10개 (최대 100개)
- **필터링**: Payload 필터 지원

**기술 구현**:
```typescript
// src/services/qdrant.ts: search()
async search(queryVector: number[], params?: Partial<SearchParams>) {
  const results = await this.client.search(this.collectionName, {
    vector: queryVector,
    limit: params?.limit || 10,
    score_threshold: params?.threshold || 0.7,
    with_payload: params?.includeMetadata !== false,
    filter: this.buildFilter(params?.filter),
  });

  return results.map(r => ({
    id: r.id as string,
    score: r.score,
    text: r.payload?.content as string,
    documentId: r.payload?.documentId as string,
    metadata: r.payload?.metadata as DocumentMetadata,
    position: r.payload?.position as { start: number; end: number };
  }));
}
```

### 5. Upsert Points (포인트 upsert)

**설명**: 벡터와 페이로드를 Qdrant에 upsert합니다 (삽입 또는 업데이트).

**주요 규칙**:
- **ID**: UUID (chunk ID)
- **벡터**: 임베딩 벡터
- **페이로드**: content, documentId, chunkIndex, metadata, position
- **배치 처리**: 최대 1000포인트/요청

**기술 구현**:
```typescript
// src/services/qdrant.ts: upsertPoints()
async upsertPoints(points: QdrantPoint[]) {
  const batch = points.map(p => ({
    id: p.id,
    vector: p.vector,
    payload: p.payload,
  }));

  await this.client.upsert(this.collectionName, {
    wait: true,
    points: batch,
  });
}
```

### 6. Delete Operations (삭제 작업)

**설명**: 필터 또는 ID로 포인트를 삭제합니다.

**주요 규칙**:
- **필터 삭제**: `documentId`, `category`, `tags` 등으로 일괄 삭제
- **ID 삭제**: 단일 포인트 삭제

**기술 구현**:
```typescript
// src/services/qdrant.ts: deletePoints()
async deletePoints(filter: DocumentFilter) {
  await this.client.delete(this.collectionName, {
    filter: this.buildFilter(filter),
  });
}

async deletePoint(pointId: string) {
  await this.client.delete(this.collectionName, {
    points: [pointId],
  });
}
```

### 7. Scroll & Count (스크롤 및 카운트)

**설명**: 페이지네이션된 포인트 검색 및 카운팅을 제공합니다.

**주요 규칙**:
- **Scroll**: offset 기반 페이지네이션
- **Count**: 필터링된 포인트 수

**기술 구현**:
```typescript
// src/services/qdrant.ts: scrollPoints()
async scrollPoints(filter?: DocumentFilter, limit = 100, offset?) {
  const results = await this.client.scroll(this.collectionName, {
    limit,
    offset,
    with_payload: true,
    filter: this.buildFilter(filter),
  });

  return {
    points: results.points.map(p => ({ /* ... */ })),
    nextPageOffset: results.next_page_offset,
  };
}

async countPoints(filter?: DocumentFilter) {
  const result = await this.client.count(this.collectionName, {
    filter: this.buildFilter(filter),
  });

  return result.count;
}
```

### 8. Health Check (헬스 체크)

**설명**: Qdrant 연결 상태를 확인합니다.

**주요 규칙**:
- **Ping**: Qdrant 서버 연결 확인
- **Collection Info**: 컬렉션 존재 확인
- **Response**: boolean

**기술 구현**:
```typescript
// src/services/qdrant.ts: healthCheck()
async healthCheck(): Promise<boolean> {
  try {
    await this.client.getCollections();
    const collections = await this.client.getCollection(this.collectionName);
    return collections.status === 'ok';
  } catch {
    return false;
  }
}
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요 (Architecture Overview)

```
QueryProcessor / IngestionPipeline
  ↓
QdrantService (Singleton)
  ├─ QdrantClient (@qdrant/js-client-rest)
  ├─ Collection: blog_documents
  └─ Operations:
      ├─ initializeCollection()
      ├─ upsertPoints()
      ├─ search()
      ├─ deletePoints()
      ├─ scrollPoints()
      ├─ countPoints()
      └─ healthCheck()
  ↓
Qdrant Cloud / Self-hosted
  ├─ Vectors: 1536 dims (Cosine)
  ├─ Payloads: On-disk
  └─ Indexes: documentId, category, tags, author, source, publishedAt
```

### 의존성 (Dependencies)

**Library**:
- `@qdrant/js-client-rest`: 1.15.1

**Core Logic**:
- `QdrantService`: src/services/qdrant.ts

**Env Vars**:
```typescript
// Required
QDRANT_URL: string              // Qdrant cluster URL

// Optional
QDRANT_API_KEY?: string         // Qdrant API key (if required)
```

### 구현 접근 (Implementation Approach)

**Singleton Pattern**:
```typescript
// src/services/qdrant.ts
let qdrantServiceInstance: QdrantService | null = null;

export function getQdrantService(): QdrantService {
  if (!qdrantServiceInstance) {
    qdrantServiceInstance = new QdrantService();
    await qdrantServiceInstance.initializeCollection();
  }
  return qdrantServiceInstance;
}
```

**Filter Building**:
```typescript
// src/services/qdrant.ts: buildFilter()
private buildFilter(filter?: DocumentFilter) {
  if (!filter) return undefined;

  const conditions: Filter[] = [];

  if (filter.documentId) {
    conditions.push({ must: [{ key: 'documentId', match: { value: filter.documentId } }] });
  }

  if (filter.category) {
    conditions.push({ must: [{ key: 'metadata.category', match: { value: filter.category } }] });
  }

  if (filter.tags?.length) {
    conditions.push({ must: [{ key: 'metadata.tags', match: { any: filter.tags } }] });
  }

  // ... (other filters)

  return conditions.length > 0 ? { and: conditions.flatMap(c => c.must || []) } : undefined;
}
```

### 관측/운영 (Observability)

**Logging (Pino)**:
- Collection 생성/삭제
- Upsert 결과 (포인트 수)
- 검색 결과 (수, 유사도 점수)
- 삭제 결과 (포인트 수)
- Health check 결과

**Metrics (추적)**:
- 평균 검색 시간
- 총 포인트 수
- Collection 크기
- 인덱스 효율

### 실패 모드/대응 (Failure Modes)

| 실패 모드 | 영향 | 대응 |
|-----------|------|------|
| Qdrant 다운 | 검색 불가 | 503 Service Unavailable, 재시도 로직 |
| Collection 없음 | upsert/search 실패 | 자동 생성 (initializeCollection) |
| 포인트 ID 중복 | upsert 실패 | upsert는 자동 업데이트 |
| 메모리 부족 | 검색 지연 | on_disk_payload=true로 완화 |

---

## 데이터 구조 (Data Structure)

### 모델/스키마 (Models/Schemas)

**QdrantPoint**:
```typescript
interface QdrantPoint {
  id: string;                       // UUID (chunk ID)
  vector: number[];                 // Embedding vector
  payload: {
    documentId: string;             // Parent document ID
    chunkIndex: number;             // Chunk position in document
    content: string;                // Chunk text
    metadata: DocumentMetadata;
    position?: {
      start: number;                // Start offset in document
      end: number;                  // End offset in document
    };
  };
}
```

**SearchParams**:
```typescript
interface SearchParams {
  limit?: number;                   // Default: 10
  threshold?: number;               // Similarity threshold (0-1)
  filter?: DocumentFilter;          // Payload filter
  includeMetadata?: boolean;        // Default: true
}
```

**SimilarityResult**:
```typescript
interface SimilarityResult {
  id: string;                       // Point ID
  score: number;                    // Similarity score (0-1)
  text: string;                     // Content
  documentId?: string;              // Document ID
  metadata?: DocumentMetadata;      // Payload metadata
  position?: {
    start: number;
    end: number;
    charCount: number;
  };
}
```

**CollectionInfo**:
```typescript
interface CollectionInfo {
  status: 'ok' | 'error';
  vectors_count: number;
  indexed_vectors_count: number;
  points_count: number;
  segments_count: number;
  config: {
    params: {
      vector_size: number;
      distance: 'Cosine';
    };
  };
}
```

---

## API 명세 (API Specifications)

Qdrant 직접 호출이 아닌 RAG Gateway를 통한 간접 호출입니다.

### Vector Search (via POST /api/rag/search)

**Request**:
```json
{
  "query": "Next.js 배포 방법",
  "filters": {
    "category": "DEV"
  },
  "limit": 10,
  "threshold": 0.7,
  "rerank": true
}
```

**Response** (200 OK):
```json
{
  "results": [
    {
      "id": "chunk-123",
      "title": "Next.js Deployment Guide",
      "slug": "DEV/nextjs-deployment",
      "content": "Vercel에 배포하는 방법은...",
      "score": 0.92,
      "metadata": {
        "title": "Next.js Deployment Guide",
        "category": "DEV",
        "tags": ["nextjs", "deployment"],
        "author": "bbakjun"
      }
    }
  ],
  "total": 15,
  "queryTime": 145,
  "hasMore": true
}
```

### Collection Stats (via GET /api/admin/stats)

**Response** (200 OK):
```json
{
  "documents": {
    "total": 150,
    "indexed": 3000,
    "failed": 2,
    "categories": {
      "DEV": 50,
      "REACT": 30,
      "JS": 40,
      "STUDY": 20,
      "TIL": 10
    }
  },
  "performance": {
    "qdrant": {
      "avgSearchTime": 145,
      "totalCollections": 1,
      "totalVectors": 3000
    }
  }
}
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**Scenario 1: 시맨틱 검색**

```
1. 사용자: "NextJS deployment" (영어)
2. QueryProcessor:
   - 임베딩 생성: "NextJS deployment" → Vector[1536]
   - QdrantService.search(vector)
3. Qdrant:
   - Cosine similarity 계산
   - 상위 10개 청크 반환
4. 응답:
   - "Next.js 배포 가이드" (score: 0.92) - 한국어지만 의미가 유사함
   - "Deploying to Vercel" (score: 0.89)
   - "AWS 배포 방법" (score: 0.76)
```

**Scenario 2: 필터링된 검색**

```
1. 사용자: "React hooks" + filter.category = "REACT"
2. QueryProcessor:
   - 임베딩 생성
   - QdrantService.search(vector, { filter: { category: 'REACT' } })
3. Qdrant:
   - 벡터 유사도 검색
   - Payload 필터링 (metadata.category == "REACT")
4. 응답: REACT 카테고리의 React hooks 관련 게시물만
```

**Scenario 3: 태그 필터링**

```
1. 사용자: "state management" + filter.tags = ["redux", "zustand"]
2. QueryProcessor:
   - 임베딩 생성
   - QdrantService.search(vector, { filter: { tags: ["redux", "zustand"] } })
3. Qdrant:
   - 벡터 유사도 검색
   - Payload 필터링 (metadata.tags any ["redux", "zustand"])
4. 응답: Redux 또는 Zustand 태그가 있는 게시물
```

### 실패/예외 시나리오

**Scenario 1: Qdrant 다운**

```
1. Qdrant 서비스 다운
2. QueryProcessor:
   - QdrantService.search() → Connection error
3. 응답: 503 Service Unavailable
{
  "error": "Service Unavailable",
  "message": "Vector database is currently unavailable"
}
```

**Scenario 2: 낮은 유사도 임계값**

```
1. 사용자: "완전히 관련 없는 질문"
2. QueryProcessor:
   - 임베딩 생성
   - QdrantService.search(vector, { threshold: 0.7 })
3. Qdrant:
   - 모든 결과가 score < 0.7
4. 응답: 빈 결과
{
  "results": [],
  "total": 0,
  "queryTime": 120
}
```

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 성능 (Performance)

**목표 지표**:
- 평균 검색 시간: <200ms
- P95 검색 시간: <500ms
- 최대 포인트 수: 1M+ (Qdrant Cloud 1GB)

**최적화**:
- 인덱스 생성 (자주 필터링하는 필드)
- 온디스크 페이로드 (메모리 절약)
- 배치 upsert (최대 1000포인트/요청)

### 스토리지 (Storage)

**용량 추정**:
- 1청크 ≈ 1,200자 ≈ 3KB (벡터 + 페이로드)
- 1GB ≈ 340,000청크
- 100게시물 × 20청크/게시물 = 2,000청크 ≈ 6MB
- **결론**: 1GB 티어는 ~10,000+ 게시물에 충분

### 비용 (Cost)

**Qdrant Cloud**:
- 1GB Starter: $25-50/월
- 최대 340,000청크
- 초과 시 $0.10/1K 포인트/월 (추정)

### 마이그레이션 (Migration)

**임베딩 모델 변경**:
- text-embedding-3-small (1536차원) → BAAI/bge-m3 (1024차원)
- **컬렉션 재생성 필요**:
  ```typescript
  await qdrantService.deleteCollection();
  await qdrantService.initializeCollection();  // New vector size
  await reindexAllDocuments();
  ```

---

## 향후 확장 가능성 (Future Expansion)

### 1. 하이브리드 검색 (Hybrid Search)

**구현 계획**:
- 벡터 검색 + 키워드 검색 (BM25)
- Reciprocal Rank Fusion (RRF)으로 결과 병합
- 예상 개선: 10-20% 재현율

### 2. 멀티벡터 검색 (Multi-Vector Search)

**구현 계획**:
- 다른 임베딩 모델로 여러 벡터 저장
- 쿼리 시 가장 적합한 벡터 선택
- 예: title_vector, content_vector

### 3. 재정렬 (Reranking)

**구현 계획**:
- 검색 결과 후처리
- Cross-encoder로 재정렬
- 예상 개선: 5-10% 정확도

### 4. HNSW 최적화 (HNSW Tuning)

**구현 계획**:
- HNSW 파라미터 튜닝 (M, ef_construction)
- 검색 속도 vs 정확도 trade-off
- 예상 개선: 20-30% 검색 속도

### 5. 분산 검색 (Distributed Search)

**구현 계획**:
- Qdrant 클러스터링
- 샤딩 (Sharding)
- 복제 (Replication)

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD (결정/데이터 필요 항목)

1. **임베딩 모델 마이그레이션**
   - 질문: 언제 BAAI/bge-m3로 전환할 것인가?
   - 필요: 품질 A/B 테스트
   - 오너: TBD

2. **HNSW 파라미터 튜닝**
   - 질문: 현재 기본값이 최적인가?
   - 필요: 벤치마킹
   - 오너: TBD

3. **스토리지 확장**
   - 질문: 1GB를 초과하면 어떻게 할 것인가?
   - 옵션: 업그레이드, 데이터 보관 정책
   - 오너: TBD

4. **백업 전략**
   - 질문: Qdrant 스냅샷을 얼마나 자주 찍을 것인가?
   - 옵션: 매일, 주간, 월간
   - 오너: TBD

---

## 참고 문헌 (References)

- [Facts: Qdrant Service](../../facts/apps/rag-gateway/utils/index.md#qdrantservice)
- [Facts: Configuration](../../facts/apps/rag-gateway/config/index.md#qdrant-configuration)
- [Insights: Executive Summary](../../insights/apps/rag-gateway/exec/summary.md)
- [Insights: Customer Impact](../../insights/apps/rag-gateway/impact/customer.md)
