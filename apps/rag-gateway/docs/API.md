# RAG API 문서

RAG Gateway의 REST API 엔드포인트 설명입니다.

## 기본 정보

- **Base URL**: `http://localhost:3002`
- **Content-Type**: `application/json`

---

## RAG Query API

문서를 검색하고 LLM으로 답변을 생성합니다.

### `POST /api/rag/query`

**Request Body:**

```typescript
{
  "query": string,      // 검색 질문
  "filters?: {          // 필터링 조건 (선택)
    "category?: string",
    "tags?: string[],
    "author?: string"
  },
  "limit?: number       // 반환할 문서 수 (기본값: 5)
}
```

**Response:**

```typescript
{
  "answer": string,     // LLM이 생성한 답변
  "sources": [          // 참조한 문서 목록
    {
      "id": string,
      "title": string,
      "slug": string,
      "content": string,    // 관련 내용 발췌
      "score": number,      // 유사도 점수 (0-1)
      "metadata": {
        "title": string,
        "slug": string,
        "category": string,
        "tags": string[],
        ...
      }
    }
  ],
  "usage": {
    "model": string,      // 사용된 LLM 모델
    "totalTokens": number,
    "promptTokens": number,
    "completionTokens": number,
    "cost": number        // 추정 비용 (USD)
  },
  "intent": string,      // 질문 의도 분류
  "queryTime": number,   // 처리 시간 (ms)
  "model": string        // 사용된 모델명
}
```

**Example:**

```bash
curl -X POST http://localhost:3002/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Vercel Blob CDC는 어떻게 작동하나요?",
    "topK": 5
  }'
```

---

## Search API

LLM 생성 없이 문서 검색만 수행합니다.

### `POST /api/rag/search`

**Request Body:**

```typescript
{
  "query": string,
  "limit?: number",       // 기본값: 10
  "threshold?: number",   // 유사도 임계값 (기본값: 0.7)
  "rerank?: boolean",     // 재정렬 여부 (기본값: true)
  "filters?": DocumentFilter
}
```

**Response:**

```typescript
{
  "results": SourceReference[],
  "total": number,
  "queryTime": number
}
```

---

## Documents API

### 문서 목록 조회

### `GET /api/documents`

**Query Parameters:**

| 파라미터   | 타입   | 설명                  | 기본값 |
| ---------- | ------ | --------------------- | ------ |
| `limit`    | number | 페이지당 결과 수      | 20     |
| `offset`   | number | 건너뛸 결과 수        | 0      |
| `search`   | string | 검색어 (제목/내용)    | -      |
| `category` | string | 카테고리 필터         | -      |
| `tags`     | string | 태그 필터 (콤마 구분) | -      |

**Response:**

```typescript
{
  "documents": [
    {
      "id": string,
      "title": string,
      "slug": string,
      "metadata": DocumentMetadata
    }
  ],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "hasMore": boolean
  }
}
```

### 문서 조회

### `GET /api/documents/:id`

**Response:**

```typescript
{
  "id": string,
  "title": string,
  "slug": string,
  "content": string,        // 전체 내용
  "metadata": DocumentMetadata,
  "chunks": [               // 청크 목록
    {
      "id": string,
      "content": string,
      "position": {
        "start": number,
        "end": number,
        "charCount": number
      }
    }
  ],
  "stats": {
    "chunkCount": number
  }
}
```

### 문서 인덱싱

### `POST /api/documents`

**Request Body:**

```typescript
{
  "id": string,             // 문서 ID (생략 시 자동 생성)
  "content": string,        // 마크다운 내용
  "metadata": {
    "title": string,
    "slug": string,
    "author": string,
    "category": string,
    "tags": string[],
    "publishedAt": string,   // ISO 8601 datetime
    "wordCount": number,
    "language": string,
    "source": "blob" | "upload" | "api" | "scraper",
    "sourceUrl"?: string
  }
}
```

**Response:**

```typescript
{
  "success": true,
  "document": {
    "id": string,
    "title": string,
    "chunkCount": number,
    "embeddingModel": string,
    "embeddingDimensions": number
  }
}
```

### 문서 재인덱싱

### `PUT /api/documents/:id`

기존 문서의 내용을 업데이트하고 재인덱싱합니다.

**Request Body:**

```typescript
{
  "content": string,        // 새로운 내용
  "metadata?: DocumentMetadata  // 선택적 메타데이터 업데이트
}
```

### 문서 삭제

### `DELETE /api/documents/:id`

문서와 모든 청크를 삭제합니다.

**Response:**

```typescript
{
  "success": true,
  "chunksDeleted": number
}
```

---

## Health Check

### `GET /api/health`

서비스 상태를 확인합니다.

**Response:**

```typescript
{
  "status": "ok",
  "services": {
    "qdrant": boolean,
    "embedding": boolean,
    "llm": boolean
  },
  "version": string
}
```

---

## 에러 응답

에러 발생 시 다음 형식으로 응답합니다:

```typescript
{
  "error": string,          // 에러 유형
  "message": string,        // 에러 메시지
  "details?: string         // 상세 정보
}
```

**상태 코드:**

| 코드 | 설명                    |
| ---- | ----------------------- |
| 400  | 잘못된 요청             |
| 404  | 문서를 찾을 수 없음     |
| 429  | Rate Limit (임베딩 API) |
| 500  | 서버 내부 오류          |

---

## 필터링 옵션

### DocumentFilter

```typescript
{
  "documentId?: string",    // 특정 문서 ID
  "category?: string",      // 카테고리 (예: "facts/apps/blog-admin")
  "tags?: string[]",        // 태그 (OR 조건)
  "author?: string",        // 저자
  "source?: string",        // 출처
  "dateRange?: {            // 날짜 범위
    "start?: string",       // ISO 8601 datetime
    "end?: string"          // ISO 8601 datetime
  }
}
```

### 카테고리 예시

```
facts/apps/blog-admin    # 기술적 사실
insights/apps/blog-admin  # 통찰/분석
specs/index.md            # 명세서
```

### 태그 예시

```
nextjs, react, typescript, deployment, testing
```
