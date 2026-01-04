# RAG Gateway - 종합 테스트 스위트

- **App**: apps/rag-gateway
- **Status**: As-Is (현재 구현)
- **Scope**: 테스트 인프라, 테스트 커버리지, 테스트 실행 및 자동화
- **Based on**:
  - Facts: [../../../facts/apps/rag-gateway/utils/index.md](../../../facts/apps/rag-gateway/utils/index.md#test-suite-new)
  - Insights: [../../../insights/apps/rag-gateway/impact/risk.md](../../../insights/apps/rag-gateway/impact/risk.md)
  - Insights: [../../../insights/apps/rag-gateway/exec/summary.md](../../../insights/apps/rag-gateway/exec/summary.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/rag-gateway/utils/index.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/rag-gateway/config/index.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (현재 구현됨)

---

## 개요 (Overview)

### 목적

RAG Gateway의 종합 테스트 스위트는 **프로덕션 장애 위험 40% 이상 감소**, **버그 수정 비용 90% 절감**, **회귀 버그 발견 시간 80% 단축**을 목표로 구현되었습니다. Vitest 기반의 테스트 인프라를 통해 핸들러, 파이프라인, 통합 테스트를 자동화하여 시스템 신뢰성을 비약적으로 향상시킵니다.

### 범위

**In-Scope**:
- Vitest 테스트 러너 설정 및 환경 구성
- 핸들러 테스트 (RAG ingest, ingestStatus)
- 파이프라인 단위 테스트 (배치 처리, force 옵션, 에러 처리)
- 통합 테스트 (엔드투엔드 인제스트)
- 서비스 모킹 (Qdrant, Embedding, LLM)
- 테스트 커버리지 리포트

**Out-of-Scope**:
- E2E 브라우저 테스트
- 부하 테스트 (Load testing)
- 보안 침투 테스트

### 비즈니스 가치

1. **프로덕션 장애 감소**: 월 2시간 → 월 1시간 이하 (추정)
2. **버그 수정 비용 절감**: 프로덕션 버그 수정비용 vs 테스트 비용 = 10:1 비율
3. **개발 속도 향상**: 리팩토링 및 신규 기능 추가 시 안정성 확보로 개발 주기 단축
4. **운영 효율 개선**: 자동화된 테스트로 수동 테스트 시간 절약

---

## 핵심 기능 (Core Features)

### 1. Vitest 테스트 인프라

**설명**: Node.js 환경에서 Vitest를 실행하기 위한 기본 설정 제공

**주요 규칙**:
- 전역 테스트 함수 활성화 (`describe`, `it`, `expect`)
- Node.js 환경에서 테스트 실행
- V8 프로바이더 기반 커버리지 수집
- HTML, JSON, Text 형식의 커버리지 리포트

**기능**:
```typescript
// vitest.config.ts
{
  test: {
    globals: true,              // 전역 테스트 함수
    environment: 'node',        // Node.js 환경
    include: ['**/*.test.ts'],  // 테스트 파일 패턴
    setupFiles: ['./src/tests/setup.ts'],  // 테스트 설정 파일
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
}
```

### 2. 테스트 설정 및 모킹

**설명**: 환경변수 설정 및 서비스 모킹을 통한 격리된 테스트 환경 제공

**주요 규칙**:
- `NODE_ENV='test'` 설정으로 테스트 환경 식별
- Redis, Qdrant, API Keys 등 환경변수 모킹
- @repo/cache 모킹으로 Redis 의존성 제거
- 서비스 모킹 (QdrantService, EmbeddingService, LLMService)

**기능**:
```typescript
// src/tests/setup.ts
- 환경변수 설정 (NODE_ENV, REDIS_URL, QDRANT_URL, API keys)
- @repo/cache 모킹 (getRedisClient, isRedisAvailable)
- 서비스 모킹 (Qdrant, Embedding, LLM)
```

### 3. 핸들러 테스트

**설명**: RAG API 핸들러의 요청/응답 검증

**주요 규칙**:
- **ingest() 핸들러**: 문서 배열 처리, 빈 배열, force/batchSize 옵션, ID 자동 생성
- **ingestStatus() 핸들러**: 상태 조회, 404/400 에러 처리, completed/failed 상태

**테스트 케이스** (15+ 개):
1. 문서 배열 정상 처리
2. 빈 문서 배열 처리
3. force 옵션으로 재인덱싱
4. batchSize 옵션으로 배치 처리
5. ID 자동 생성 (누락 시)
6. 상태 조회 (jobId로 진행률 확인)
7. 존재하지 않는 jobId로 404 응답
8. 잘못된 jobId 형식으로 400 응답

### 4. 파이프라인 단위 테스트

**설명**: IngestionPipeline의 배치 처리 및 에러 처리 검증

**주요 규칙**:
- **배치 처리**: batchSize별 문서 배치 나누기
- **force 옵션**: 재인덱싱 vs 건너뛰기
- **에러 처리**: 개별 문서 실패 시 전체 파이프라인 계속 실행
- **진행률 업데이트**: 실시간 진행률 추적

**테스트 케이스** (20+ 개):
1. 빈 documents 배열 처리
2. 배치 처리 (batchSize별 나누기)
3. force 옵션 (재인덱싱 vs 건너뛰기)
4. 개별 문서 실패 처리
5. 진행률 업데이트
6. getJobStatus() 기능
7. cleanupJobs() 기능
8. getAllJobs() 기능

### 5. 통합 테스트

**설명**: 엔드투엔드 인제스트 파이프라인 검증

**주요 규칙**:
- **다중 문서 인제스트**: 여러 문서 동시 처리
- **단일 문서 인제스트**: 개별 문서 처리
- **대량 문서 인제스트**: 100개 문서 처리
- **force 옵션 통합**: 재인덱싱 통합 테스트
- **batchSize 옵션 통합**: 배치 크기 통합 테스트
- **상태 조회**: jobId로 진행률 확인
- **에러 처리**: 401, 422 에러 처리

**테스트 케이스** (15+ 개):
1. 다중 문서 인제스트
2. 단일 문서 인제스트
3. 대량(100개) 문서 인제스트
4. force 옵션 통합 테스트
5. batchSize 옵션 통합 테스트
6. 상태 조회 (jobId로 진행률 확인)
7. 인증 없이 401 응답
8. 잘못된 요청으로 422 응답

### 6. 테스트 패턴

**설명**: 일관된 테스트 작성을 위한 패턴 및 유틸리티

**주요 규칙**:
- **Service Mocking**: vi.mock()으로 서비스 모킹
- **Dynamic Import**: 동적 임포트로 테스트 격리
- **Async Job Testing**: 비동기 작업 테스트 패턴
- **HTTP Request Simulation**: Hono app.request()로 HTTP 요청 시뮬레이션

**기능**:
```typescript
// Service Mocking
vi.mock('@/services/qdrant', () => ({
  getQdrantService: vi.fn(() => ({
    initializeCollection: vi.fn(),
    upsertPoints: vi.fn(),
  })),
}));

// Dynamic Import
const { default: ragRouter } = await import('@/routes/rag/rag.index');
app.route('/api', ragRouter);

// Async Job Testing
const jobId = await pipeline.startIngestion(options);
await new Promise(resolve => setTimeout(resolve, 200));
const job = pipeline.getJobStatus(jobId);

// HTTP Request Simulation
const response = await app.request('/api/rag/ingest', {
  method: 'POST',
  headers: { 'X-RAG-API-Key': 'test-api-key' },
  body: JSON.stringify({ documents: [] }),
});
```

---

## 기술 사양 (Technical Specifications)

### 아키텍처 개요

```
테스트 스위트 구조
├── vitest.config.ts          # Vitest 설정
├── src/tests/setup.ts        # 테스트 설정 (모킹)
├── src/tests/handlers/       # 핸들러 테스트
│   └── rag.test.ts          # RAG 핸들러 테스트 (15+ 케이스)
├── src/tests/ingestion/      # 파이프라인 테스트
│   └── pipeline.test.ts     # IngestionPipeline 테스트 (20+ 케이스)
└── src/tests/integration/    # 통합 테스트
    └── batch-ingest.test.ts # 엔드투엔드 테스트 (15+ 케이스)
```

### 의존성

**Packages**:
- `vitest`: ^2.1.8 - 테스트 러너
- `@vitest/coverage-v8`: ^2.1.8 - 커버리지 도구
- `vi`: Vitest 내장 모킹 라이브러리

**DevDependencies**:
- TypeScript: 타입 검증
- @repo/cache: 모킹 대상

**Env Vars** (테스트용):
```bash
NODE_ENV=test
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=test-key
GLM_API_KEY=test-key
RAG_GATEWAY_API_KEY=test-api-key
BLOG_ADMIN_URL=http://localhost:3001
```

### 구현 접근

1. **테스트 실행**: `pnpm --filter=rag-gateway test`
2. **단일 실행**: `pnpm --filter=rag-gateway test:run`
3. **UI 모드**: `pnpm --filter=rag-gateway test:ui`
4. **커버리지**: `pnpm --filter=rag-gateway test:coverage`

### 관측/운영(Observability)

**커버리지 메트릭**:
- **현재**: 50개 테스트 케이스
- **목표**: 전체 코드 커버리지 80% 이상
- **리포트**: HTML, JSON, Text 형식

**테스트 실행 시간**:
- **목표**: 전체 스위트 30초 이내
- **현재**: 약 6초 (추정)

### 실패 모드/대응(Failure Modes)

**테스트 실패 시**:
- CI/CD 파이프라인에서 PR 차단
- 실패한 테스트 케이스 로그 출력
- 커버리지 리포트 생성

**모킹 실패 시**:
- 서비스 모킹이 적용되지 않으면 실제 API 호출 가능성
- `vi.mock()`을 사용하여 모든 외부 의존성 모킹

---

## 데이터 구조 (Data Structure)

### 테스트 데이터 모델

**Mock Document**:
```typescript
interface MockDocument {
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
}
```

**Ingestion Job Status**:
```typescript
interface JobStatus {
  id: string;                  // Format: ingest_<timestamp>
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
    current: string;
  };
  startedAt: string;
  documentsCount?: number;
}
```

### 데이터 흐름

```
테스트 데이터 생성
    ↓
서비스 모킹 (Qdrant, Embedding, LLM)
    ↓
핸들러/파이프라인 호출
    ↓
응답 검증 (expect)
    ↓
커버리지 수집
```

### 검증/제약(Validation/Constraints)

**테스트 유효성**:
- 모든 테스트는 독립적으로 실행 가능
- 외부 의존성 없이 실행 가능 (모킹)
- 순서에 의존하지 않음

**Mock 데이터**:
- `test/` 접두사를 사용하여 실제 데이터와 격리
- 일관된 테스트 데이터 사용

---

## API 명세 (API Specifications)

### 테스트 실행 API

**Endpoint**: N/A (테스트는 CLI로 실행)

**테스트 명령**:
```bash
# Run all tests
pnpm --filter=rag-gateway test

# Run once
pnpm --filter=rag-gateway test:run

# UI mode
pnpm --filter=rag-gateway test:ui

# Coverage
pnpm --filter=rag-gateway test:coverage
```

### 테스트 결과 형식

**Console Output**:
```
✓ src/tests/handlers/rag.test.ts (15)
  ✓ ingest handler should process document array
  ✓ ingest handler should handle empty array
  ✓ ingest handler should support force option
  ...

✓ src/tests/ingestion/pipeline.test.ts (20)
  ✓ pipeline should handle empty documents
  ✓ pipeline should process batches
  ...

✓ src/tests/integration/batch-ingest.test.ts (15)
  ✓ integration test should ingest multiple documents
  ...

Test Files  3 passed (3)
     Tests  50 passed (50)
  Duration  6.23s
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**1. 개발자가 새 기능 추가 후 테스트 실행**
```
1. 코드 변경
2. pnpm --filter=rag-gateway test 실행
3. 모든 테스트 통과 확인
4. PR 생성 및 배포
```

**2. CI/CD 파이프라인에서 자동 테스트 실행**
```
1. PR 생성
2. GitHub Actions에서 테스트 자동 실행
3. 테스트 통과 시 머지 가능
4. 테스트 실패 시 PR 차단
```

**3. 버그 수정 후 회귀 테스트**
```
1. 버그 수정 코드 작성
2. 재현 테스트 케이스 추가
3. 테스트 실행 및 통과 확인
4. 회귀 버그 없음 확인
```

### 실패/예외 시나리오

**1. 테스트 실패 시**
```
1. 테스트 실행
2. 특정 테스트 실패
3. 실패 로그 확인
4. 버그 수정 후 재실행
```

**2. 모킹 실패 시**
```
1. 서비스 모킹이 적용되지 않음
2. 실제 API 호출 시도
3. 테스트 타임아웃 또는 비용 발생
4. vi.mock() 설정 확인 및 수정
```

### 권한/역할 시나리오

**1. 개발자**
- 테스트 작성 및 실행
- 커버리지 확인
- 버그 수정

**2. CI/CD 시스템**
- 자동 테스트 실행
- 테스트 결과 리포트
- PR 머지/차단 결정

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안

**테스트용 API Key**:
- 실제 API Key 사용하지 않기
- 테스트용 모킹 사용

**민감 정보**:
- 테스트 코드에 민정 정보 포함하지 않기

### 성능

**테스트 실행 시간**:
- 목표: 전체 스위트 30초 이내
- 현재: 약 6초 (추정)

**커버리지 수집**:
- V8 프로바이더 사용으로 오버헤드 최소화

### 배포

**테스트 자동화**:
- GitHub Actions와 통합 권장
- 모든 PR에 자동 테스트 실행

**CI/CD 파이프라인**:
- 테스트 실패 시 PR 차단
- 커버리지 리포트 자동 생성

### 롤백

**테스트 롤백**:
- 특정 테스트가 실패하면 해당 테스트만 주석 처리
- 전체 테스트 스위트는 계속 실행

### 호환성/마이그레이션

**Vitest 버전**:
- ^2.1.8 사용
- Node.js 18+ 호환

---

## 향후 확장 가능성 (Future Expansion)

### 1. CI/CD 파이프라인 자동화 (High Priority)

**확장 아이디어**: GitHub Actions와 Vitest 통합

**기능**:
- 모든 PR에 자동 테스트 실행
- 테스트 실패 시 PR 차단
- 커버리지 리포트 자동 생성

**예상 효과**:
- 회귀 버그 90% 이상 조기 발견
- 배포 후 장애 50% 감소

### 2. 테스트 커버리지 80% 확대 (Medium Priority)

**확장 아이디어**: 미들웨어, 서비스, 에러 처리 테스트 추가

**추가 테스트**:
- 미들웨어 테스트 (보안, rate limiting, input validation)
- 서비스 테스트 (Qdrant, Embedding, LLM)
- 에러 처리 테스트 (edge cases)

**예상 효과**:
- 버그 발견률 60% 이상 개선
- 전체 코드 커버리지 80% 이상 달성

### 3. 부하 테스트 도입 (Medium Priority)

**확장 아이디어**: k6, Artillery, 또는 Vitest의 부하 테스트 기능 활용

**기능**:
- 고부하 상황에서의 시스템 안정성 검증
- API 성능 벤치마킹
- 병목 지점 발견

**예상 효과**:
- 프로덕션 장애 30% 추가 감소

### 4. 보안 테스트 강화 (Medium Priority)

**확장 아이디어**: Prompt Injection, Rate Limiting, 인증 우회 테스트

**추가 테스트**:
- Prompt Injection 테스트 케이스 확대
- Rate Limiting 테스트
- 인증 우회 테스트

**예상 효과**:
- 보안 사고 50% 이상 감소

---

## 추가로 필요 정보(Needed Data/Decisions)

### TBD: CI/CD 파이프라인 설정

- **질문**: GitHub Actions 워크플로우 파일 위치 및 설정
- **오너**: 개발팀
- **기한**: 2주 내 권장

### TBD: 테스트 커버리지 기준

- **질문**: 전체 코드 커버리지 목표 비율 (현재 80% 제안)
- **오너**: 개발팀
- **기한**: 1달 내 결정 권장

### TBD: 부하 테스트 기준

- **질문**: 목표 API 응답 시간, TPS (Transactions Per Second)
- **오너**: 운영팀
- **기한**: 3개월 내 결정 권장
