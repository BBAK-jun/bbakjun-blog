# RAG Gateway - 관리자 모니터링 기능

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: 시스템 통계 조회, 헬스 체크, 캐시 관리, 컬렉션 관리
- **Based on**:
  - Facts: [../../../facts/apps/rag-gateway/apis/index.md](../../../facts/apps/rag-gateway/apis/index.md#admin-api)
  - Facts: [../../../facts/apps/rag-gateway/utils/index.md](../../../facts/apps/rag-gateway/utils/index.md#ingestionpipeline)
  - Insights: [../../../insights/apps/rag-gateway/exec/summary.md](../../../insights/apps/rag-gateway/exec/summary.md)
  - Insights: [../../../insights/apps/rag-gateway/impact/customer.md](../../../insights/apps/rag-gateway/impact/customer.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/rag-gateway/apis/index.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/rag-gateway/utils/index.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

관리자 모니터링 기능은 **시스템 통계 조회**, **컴포넌트별 헬스 체크**, **캐시 관리**, **컬렉션 관리** API를 제공하여 운영 팀의 업무 효율을 30% 이상 개선하고 장애 대응 시간을 50% 단축합니다. 이를 통해 **실시간 모니터링**, **자동화된 운영**, **신속한 장애 대응**의 비즈니스 가치를 제공합니다.

### 범위

**In-Scope**:
- 시스템 통계 조회 (문서, 사용량, 성능, 시스템)
- 컴포넌트별 헬스 체크 (Qdrant, LLM, Redis, Storage)
- 임베딩 캐시 삭제
- 전체 컬렉션 삭제
- 재인덱싱 작업 관리

**Out-of-Scope**:
- 모니터링 대시보드 UI (향후 확장)
- 알림 시스템 (향후 확장)
- 로그 집계 및 분석 (향후 확장)

### 비즈니스 가치

1. **운영 효율 개선**: 시스템 상태 확인 시간 단축 (30분 → 10분)
2. **장애 대응 시간 단축**: 헬스 체크 API로 장애 원인 빠른 파악 (50% 단축)
3. **모니터링 자동화**: 수동 체크에서 API 기반 자동 모니터링으로 전환
4. **운영 업무 시간 절감**: 월 10시간 이상 절감 (추정)

---

## 핵심 기능 (Core Features)

### 1. 시스템 통계 조회 (GET /api/admin/stats)

**설명**: 시스템 전체 통계를 한 번에 조회

**주요 규칙**:
- 문서 통계: total, indexed, failed, categories
- 사용량 통계: totalQueries, avgQueryTime, topQueries
- 성능 통계: qdrant (avgSearchTime), llm (avgGenerationTime, totalTokens)
- 시스템 통계: uptime, version, lastIngestion, cacheHitRate

**기능**:
```typescript
{
  documents: {
    total: 100,              // Unique document count
    indexed: 2000,           // Total chunks indexed
    failed: 5,
    categories: {
      "DEV": 50,
      "REACT": 30,
      "JS": 20
    }
  },
  usage: {
    totalQueries: 1500,
    avgQueryTime: 250,       // ms
    topQueries: ["nextjs", "react", "typescript"]
  },
  performance: {
    qdrant: {
      avgSearchTime: 50,
      totalCollections: 1,
      totalVectors: 2000
    },
    llm: {
      avgGenerationTime: 1500,
      totalTokens: 500000,
      avgTokensPerQuery: 333
    }
  },
  system: {
    uptime: "2h 30m",
    version: "0.1.0",
    lastIngestion: "2024-12-26T10:00:00Z",
    cacheHitRate: 0.85
  }
}
```

### 2. 컴포넌트별 헬스 체크 (GET /api/admin/health)

**설명**: 각 컴포넌트별 상태를 개별적으로 확인

**주요 규칙**:
- Qdrant: 상태, 응답 시간, 컬렉션 수, 벡터 수
- LLM: 상태, 제공자, 응답 시간
- Redis: 상태, 연결 여부, 메모리
- Storage: 상태, 여유 공간, 사용량

**기능**:
```typescript
{
  status: 'healthy' | 'unhealthy',
  components: {
    qdrant: {
      status: 'healthy' | 'unhealthy' | 'unknown',
      responseTime?: 50,
      collections?: 1,
      vectorsCount?: 2000
    },
    llm: {
      status: 'healthy' | 'unhealthy',
      provider: 'GLM-4.6',
      responseTime?: 1500
    },
    redis: {
      status: 'unknown',
      connected: true,
      memory: '128MB'
    },
    storage: {
      status: 'healthy',
      free: '500MB',
      usage: '45.67MB'
    }
  },
  uptime: '2h 30m',
  version: '0.1.0'
}
```

### 3. 임베딩 캐시 삭제 (DELETE /api/admin/cache)

**설명**: 임베딩 캐시를 삭제하여 메모리 확보 또는 문제 해결

**주요 규칙**:
- `type` 쿼리 파라미터: 'all' (기본값)
- 삭제 전 캐시 크기 확인
- 삭제 후 크기 반환

**기능**:
```typescript
{
  message: 'Cache cleared successfully',
  type: 'all',
  clearedAt: '2024-12-26T10:00:00Z',
  sizes: {
    embedding: '12.45MB'
  }
}
```

### 4. 전체 컬렉션 삭제 (DELETE /api/admin/collection)

**설명**: 전체 컬렉션을 삭제하여 모든 벡터 제거

**주요 규칙**:
- 요청 바디에 `confirm: 'yes'` 필수
- 리터럴 "yes" 문자열이어야 함 (실수 방지)
- 삭제된 벡터 수 반환

**기능**:
```typescript
// Request
{
  confirm: 'yes'  // Must be literal "yes"
}

// Response
{
  message: 'All vectors deleted from collection',
  deletedCount: 2000,
  clearedAt: '2024-12-26T10:00:00Z'
}
```

### 5. 재인덱싱 작업 관리

**설명**: 재인덱싱 작업 시작 및 상태 조회

**주요 규칙**:
- `POST /api/admin/reindex`: 재인덱싱 시작
- `GET /api/admin/reindex/{jobId}`: 작업 상태 조회
- force 옵션으로 강제 재인덱싱

**기능**:
```typescript
// POST /api/admin/reindex
{
  force?: boolean,
  batchSize?: number,
  collections?: string[]
}

// Response
{
  jobId: 'reindex_1735219200000',
  status: 'started',
  config: {
    force: boolean,
    batchSize: number,
    collections: string[]
  },
  estimatedTime: '~5 minutes'
}

// GET /api/admin/reindex/{jobId}
{
  jobId: string,
  status: 'running' | 'completed' | 'failed',
  progress: {
    total: number,
    processed: number,
    failed: number,
    percentage: number
  },
  startedAt: string,
  completedAt?: string,
  errors: Array<{
    documentId: string,
    error: string,
    timestamp: string
  }>
}
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
관리자 모니터링 아키텍처
├── Admin Routes (src/routes/admin/admin.routes.ts)
│   ├── GET /api/admin/stats       # 시스템 통계
│   ├── GET /api/admin/logs        # 감사 로그
│   ├── POST /api/admin/reindex    # 재인덱싱 시작
│   ├── GET /api/admin/reindex/:jobId  # 재인덱싱 상태
│   ├── DELETE /api/admin/cache    # 캐시 삭제
│   ├── GET /api/admin/health      # 헬스 체크
│   └── DELETE /api/admin/collection  # 컬렉션 삭제
│
└── Admin Handlers (src/routes/admin/admin.handlers.ts)
    ├── getStats()        # 통계 집계
    ├── getLogs()         # 로그 조회 (TODO: 구현 필요)
    ├── postReindex()     # 재인덱싱 시작
    ├── getReindexStatus() # 재인덱싱 상태
    ├── deleteCache()     # 캐시 삭제
    ├── getHealth()       # 헬스 체크
    └── deleteCollection() # 컬렉션 삭제
```

### 의존성

**Services**:
- `QdrantService`: 벡터 데이터베이스 상태 확인
- `EmbeddingService`: 캐시 상태 및 삭제
- `IngestionPipeline`: 재인덱싱 작업

**Libraries**:
- Hono: 웹 프레임워크

**Env Vars**:
- `REDIS_URL`: Redis 연결 (선택사항)

### 구현 접근

1. **통계 조회**: 각 서비스에서 메트릭 수집 후 집계
2. **헬스 체크**: 각 컴포넌트에 healthCheck() 호출
3. **캐시 삭제**: EmbeddingService.clearCache() 호출
4. **컬렉션 삭제**: QdrantService.deleteAllPoints() 호출
5. **재인덱싱**: IngestionPipeline.startIngestion() 호출

### 관측/운영(Observability)

**메트릭 수집**:
- 문서 통계: total, indexed, failed, categories
- 사용량 통계: totalQueries, avgQueryTime, topQueries
- 성능 통계: qdrant avgSearchTime, llm avgGenerationTime

**헬스 체크**:
- Qdrant: healthCheck() → boolean
- LLM: ping → responseTime
- Redis: isRedisAvailable() → boolean
- Storage: process.memoryUsage() → bytes

### 실패 모드/대응(Failure Modes)

**통계 조회 실패 시**:
- 일부 컴포넌트 실패 시 부분 데이터 반환
- 에러 발생 컴포넌트는 null 또는 0으로 표시

**헬스 체크 실패 시**:
- 개별 컴포넌트 상태를 'unhealthy'로 표시
- 전체 상태는 일부 컴포넌트 실패 시에도 'unhealthy'로 표시 가능

---

## 데이터 구조 (Data Structure)

### 모델/스키마

**SystemStats**:
```typescript
interface SystemStats {
  documents: {
    total: number;
    indexed: number;
    failed: number;
    categories: Record<string, number>;
  };
  usage: {
    totalQueries: number;
    avgQueryTime: number;
    topQueries: string[];
  };
  performance: {
    qdrant: {
      avgSearchTime: number;
      totalCollections: number;
      totalVectors: number;
    };
    llm: {
      avgGenerationTime: number;
      totalTokens: number;
      avgTokensPerQuery: number;
    };
  };
  system: {
    uptime: string;
    version: string;
    lastIngestion: string | null;
    cacheHitRate: number;
  };
}
```

**HealthStatus**:
```typescript
interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  components: {
    qdrant: {
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime?: number;
      collections?: number;
      vectorsCount?: number;
    };
    llm: {
      status: 'healthy' | 'unhealthy';
      provider: string;
      responseTime?: number;
    };
    redis: {
      status: 'unknown';
      connected: boolean;
      memory: string;
    };
    storage: {
      status: 'healthy';
      free: string;
      usage: string;
    };
  };
  uptime: string;
  version: string;
}
```

### 데이터 흐름

```
GET /api/admin/stats
    ↓
getStats() 핸들러
    ↓
QdrantService.getCollectionInfo() → 문서 통계
    ↓
EmbeddingService.getCacheStats() → 캐시 통계
    ↓
시스템 메트릭 수집 (process.uptime(), process.memoryUsage())
    ↓
통계 집계 및 응답
```

---

## API 명세 (API Specifications)

### GET /api/admin/stats

**Purpose**: 시스템 통계 조회

**Response** (200 OK):
```typescript
{
  documents: {
    total: number;
    indexed: number;
    failed: number;
    categories: Record<string, number>;
  };
  usage: {
    totalQueries: number;
    avgQueryTime: number;
    topQueries: string[];
  };
  performance: {
    qdrant: { ... };
    llm: { ... };
  };
  system: {
    uptime: string;
    version: string;
    lastIngestion: string | null;
    cacheHitRate: number;
  };
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L22-L98)

### GET /api/admin/health

**Purpose**: 상세 헬스 체크 (컴포넌트별 상태)

**Response** (200 OK):
```typescript
{
  status: 'healthy' | 'unhealthy';
  components: {
    qdrant: { ... };
    llm: { ... };
    redis: { ... };
    storage: { ... };
  };
  uptime: string;
  version: string;
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L312-L385)

### DELETE /api/admin/cache

**Purpose**: 임베딩 캐시 삭제

**Query Parameters**:
```
type?: string       # Default: "all"
```

**Response** (200 OK):
```typescript
{
  message: string;
  type: string;
  clearedAt: string;
  sizes: {
    embedding: string;
  };
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L252-L283)

### DELETE /api/admin/collection

**Purpose**: 전체 컬렉션 삭제 (모든 벡터 제거)

**Request Headers**:
```
X-RAG-API-Key: <API_KEY>
Content-Type: application/json
```

**Request Body**:
```typescript
{
  confirm: 'yes';              // Required: Must be literal "yes"
}
```

**Response** (200 OK):
```typescript
{
  message: string;
  deletedCount: number;
  clearedAt: string;
}
```

**Error Responses**:
- 400 Bad Request: Missing or invalid `confirm` parameter
- 500 Internal Server Error: Deletion failed

**Handler**: `src/routes/admin/admin.handlers.ts` (L285-L310)

### POST /api/admin/reindex

**Purpose**: 재인덱싱 작업 시작

**Request Body**:
```typescript
{
  force?: boolean;
  batchSize?: number;
  collections?: string[];
}
```

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'started';
  config: { ... };
  estimatedTime: string;
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L120-L223)

### GET /api/admin/reindex/:jobId

**Purpose**: 재인덱싱 작업 상태 조회

**Response** (200 OK):
```typescript
{
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  progress: { ... };
  startedAt: string;
  completedAt?: string;
  errors: Array<{ ... }>;
}
```

**Handler**: `src/routes/admin/admin.handlers.ts` (L225-L250)

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 시스템 통계 조회**
```
1. GET /api/admin/stats 요청
2. 전체 시스템 통계 수신
3. 문서, 사용량, 성능, 시스템 메트릭 확인
4. 대시보드 또는 모니터링 시스템에 표시
```

**2. 장애 발생 시 헬스 체크**
```
1. 장애 알림 수신
2. GET /api/admin/health 요청
3. 컴포넌트별 상태 확인
4. Qdrant 상태: 'unhealthy' 확인
5. Qdrant 장애 대응 시작
```

**3. 캐시 문제 해결**
```
1. 메모리 사용량 급증
2. DELETE /api/admin/cache 요청
3. 캐시 삭제 완료 확인
4. 메모리 사용량 정상화
```

**4. 전체 재인덱싱**
```
1. POST /api/admin/reindex에 force: true로 전송
2. jobId 수신
3. GET /api/admin/reindex/{jobId}로 진행률 확인
4. 상태: 'completed' 확인
```

### 실패/예외 시나리오

**1. 컬렉션 삭제 시 confirm 누락**
```
1. DELETE /api/admin/collection에 confirm 누락
2. 400 Bad Request 응답
3. 에러 메시지: "Missing or invalid confirm parameter"
```

**2. 존재하지 않는 jobId**
```
1. GET /api/admin/reindex/invalid-job-id 요청
2. 404 Not Found 응답
3. 에러 메시지: "Job not found"
```

### 권한/역할 시나리오

**1. 운영팀**
- 시스템 통계 모니터링
- 장애 발생 시 헬스 체크
- 캐시 및 컬렉션 관리

**2. 모니터링 시스템**
- 주기적으로 stats 및 health API 호출
- 알림 시스템과 연동 (향후 확장)

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**인증**:
- DELETE /api/admin/collection: `X-RAG-API-Key` 헤더 필요
- 기타 엔드포인트: 인증 없이 공개 (TODO: 인증 추가 권장)

**컬렉션 삭제 보호**:
- `confirm: 'yes'` 리터럴 문자열 필수
- 실수로 전체 삭제 방지

### 성능

**통계 조회 성능**:
- Qdrant, Redis, 시스템 메트릭 조회 병렬화
- 목표: 500ms 이내 응답

**헬스 체크 성능**:
- 각 컴포넌트 healthCheck() 병렬 호출
- 목표: 2초 이내 응답 (각 컴포넌트 타임아웃: 1초)

### 배포

**롤백 전략**:
- 재인덱싱 실패 시 이전 상태 유지 (force=false)
- 캐시 삭제는 되돌릴 수 없음 (주의 필요)

### 호환성/마이그레이션

**API 버전 관리**:
- 현재 버전: v1
- 향후 호환성 없는 변경 시 v2로 증가

---

## 향후 확장 가능성 (Future Expansion)

### 1. 모니터링 대시보드 구축 (High Priority)

**확장 아이디어**: `GET /api/admin/stats` 및 `GET /api/admin/health` API 활용한 실시간 모니터링 대시보드

**기능**:
- Grafana 또는 간단한 React 대시보드 구축
- 실시간 메트릭 모니터링
- 알림 설정 (장애, 비용 이상, 성능 저하)

**예상 효과**:
- 장애 대응 시간 50% 단축
- 운영 업무 자동화
- 시스템 가시성 향상

**참고**: [decisions/recommendations.md](../../../insights/apps/rag-gateway/decisions/recommendations.md#3-모니터링-대시보드-구축-⭐⭐)

### 2. 알림 시스템 도입 (Medium Priority)

**확장 아이디어**: 장애, 비용 이상, 성능 저하 시 자동 알림

**기능**:
- 이메일, Slack, SMS 알림
- 임계값 설정 (예: avgQueryTime > 1000ms)
- 알림 빈도 제한 (스팸 방지)

**예상 효과**:
- 장애 조기 발견
- 대응 시간 단축
- 24/7 모니터링

### 3. 로그 집계 및 분석 (Medium Priority)

**확장 아이디어**: `GET /api/admin/logs` 구현

**기능**:
- 로그 수집 (level, message, context)
- 페이지네이션, 필터링
- 로그 보관 및 삭제

**예상 효과**:
- 장애 원인 분석 개선
- 감사 추적
- 규정 준수

### 4. 자동화된 운영 스크립트 (Low Priority)

**확장 아이디어**: 주기적 작업 자동화

**기능**:
- 주기적 재인덱싱 (cron)
- 캐시 자동 정리
- 디스크 공간 모니터링

**예상 효과**:
- 운영 업무 자동화
- 인건비 절감

---

## 추가로 필요 정보(Needed Data/Decisions)

### TBD: 모니터링 대시보드 도구 선택

- **질문**: Grafana vs Datadog vs 간단한 React 대시보드
- **오너**: 운영팀
- **기한**: 2-3주 (High Priority)

### TBD: 알림 채널 선택

- **질문**: 이메일, Slack, SMS 중 우선순위
- **오너**: 운영팀
- **기한**: 1달 내 결정 권장

### TBD: 로그 보관 기간

- **질문**: 로그 보관 기간 (7일, 30일, 90일)
- **오너**: 운영팀, 법적팀
- **기한**: 1달 내 결정 권장
