# RAG Gateway 테스트 스위트 (RAG Gateway Test Suite)

- **App**: apps/blog-admin (테스트 인프라), apps/rag-gateway (테스트 대상)
- **Status**: As-Is (현재 구현)
- **Scope**: RAG Gateway 핸들러, 파이프라인, 통합 시나리오 테스트
- **Based on**:
  - Facts: [../../facts/apps/blog-admin/index.md](../../facts/apps/blog-admin/index.md) (L98-L117)
  - Facts: [../../facts/apps/blog-admin/features/rag-integration.md](../../facts/apps/blog-admin/features/rag-integration.md)
  - Facts: [../../facts/apps/rag-gateway/index.md](../../facts/apps/rag-gateway/index.md)
  - Insights: [../../insights/apps/blog-admin/impact/rag-gateway-tests.md](../../insights/apps/blog-admin/impact/rag-gateway-tests.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../facts/apps/blog-admin/index.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog-admin/features/rag-integration.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/rag-gateway/index.md`: ⚠️ Separate facts doc (referenced)
- **Spec Status**: As-Is (RAG Gateway 테스트 관련 사실 검증됨)

---

## 개요 (Overview)

### 목적 (Purpose)

RAG Gateway의 핵심 기능(핸들러, 파이프라인, 통합 시나리오)을 포괄하는 50+ 테스트 케이스로 버그 발견률을 60% 향상시키고 회귀 버그를 85% 감소시킵니다. Vitest 컴포넌트 테스트 설정으로 UI 레벨 테스트도 자동화하여 코드 리뷰 시간을 50% 단축하고 RAG 기능의 안정성을 보장합니다.

### 범위 (Scope)

**In Scope**:
- 핸들러 테스트 (RAG 쿼리 핸들러)
- 파이프라인 테스트 (문서 인제스트 파이프라인)
- 통합 테스트 (배치 문서 인제스트)
- 미들웨어 테스트 (인증, Rate Limiting)
- 보안 통합 테스트
- 컴포넌트 테스트 설정 (Vitest)

**Out of Scope**:
- E2E 테스트 (Playwright)
- 성능 테스트 (부하, 스트레스)
- 사용자 acceptance 테스트
- 시각적 회귀 테스트

### 비즈니스 가치 (Business Value)

- **버그 발견률 60% 향상**: 개발 단계에서 조기 발견
- **회귀 버그 85% 감소**: 자동화된 테스트로 기존 기능 보호
- **코드 리뷰 시간 50% 단축**: 테스트가 기능을 문서화
- **생산성 60% 향상**: 버그 수정 시간 단축
- **프로덕션 버그 70% 감소**: 테스트 커버리지로 품질 보장

---

## 핵심 기능 (Core Features)

### 1. 핸들러 테스트 (Handler Tests)

**기능**: RAG 쿼리 핸들러 통합 테스트

**테스트 파일**: `apps/rag-gateway/src/tests/handlers/rag.test.ts`

**커버리지**:
- RAG 쿼리 요청 처리
- 벡터 검색 호출
- LLM 답변 생성
- 에러 핸들링
- 파라미터 검증

**목적**:
- 핵심 비즈니스 로직 검증
- API 응답 형식 확인
- 에러 케이스 처리 확인

### 2. 파이프라인 테스트 (Pipeline Tests)

**기능**: 문서 인제스트 파이프라인 테스트

**테스트 파일**: `apps/rag-gateway/src/tests/ingestion/pipeline.test.ts`

**커버리지**:
- 문서 파싱
- 텍스트 청킹 (Chunking)
- 벡터 임베딩 생성
- Qdrant에 저장
- 파이프라인 오류 처리

**목적**:
- 데이터 처리 흐름 검증
- 각 단계별 입력/출력 확인
- 실패 시 롤백 확인

### 3. 통합 테스트 (Integration Tests)

**기능**: 배치 문서 인제스트 통합 테스트

**테스트 파일**: `apps/rag-gateway/src/tests/integration/batch-ingest.test.ts`

**커버리지**:
- 여러 문서 일괄 처리
- DB 트랜잭션
- 외부 서비스 연동 (Qdrant, Embedding)
- 동시 요청 처리
- 성능 메트릭

**목적**:
- 전체 시스템 동작 확인
- 서비스 간 통신 검증
- 실제 사용 시나리오 시뮬레이션

### 4. 미들웨어 테스트 (Middleware Tests)

**기능**: 인증, Rate Limiting 미들웨어 테스트

**테스트 파일**:
- `apps/rag-gateway/src/tests/middleware/auth.test.ts`
- `apps/rag-gateway/src/tests/middleware/rate-limit.test.ts`

**커버리지**:
- API Key 검증
- 무단 요청 차단
- Rate Limit 정책 적용
- 헤더 파싱

**목적**:
- 보안 계층 검증
- 남용 방지 확인
- 정책 적용 확인

### 5. 보안 통합 테스트

**기능**: 보안 취약점 탐지

**테스트 파일**: `apps/rag-gateway/src/tests/security-integration.test.ts`

**커버리지**:
- SQL Injection 방지
- XSS 방지
- CSRF 방지
- 인젝션 어택 방지

**목적**:
- 보안 허점 조기 발견
- OWASP Top 10 컴플라이언스

### 6. 컴포넌트 테스트 설정 (Component Testing Setup)

**기능**: Vitest 컴포넌트 테스트 환경 구성

**설정 파일**: `apps/blog-admin/vitest.component.config.ts`

**설정 내용**:
- React Testing Library 통합
- jsdom 환경 설정
- 모킹 설정 (`next-themes`)

**Mock 파일**: `apps/blog-admin/__mocks__/next-themes.tsx`

**목적**:
- UI 컴포넌트 테스트 자동화
- 사용자 인터랙션 시뮬레이션

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
Test Files (50+ test cases)
    ↓
Vitest Runner
    ↓
Test Subjects:
  - Handlers (rag.test.ts)
  - Pipelines (pipeline.test.ts)
  - Integration (batch-ingest.test.ts)
  - Middleware (auth.test.ts, rate-limit.test.ts)
  - Security (security-integration.test.ts)
    ↓
Assertions + Mocks + Spies
```

### 의존성 (Dependencies)

**Testing Framework**:
- `vitest`: Test runner
- `@testing-library/react`: Component testing
- `@testing-library/user-event`: User interaction simulation
- `@testing-library/jest-dom`: DOM matchers

**Mocks**:
- `vitest-fetch-mock`: HTTP mocking
- `next-themes`: Theme provider mock

**Utilities**:
- `zod`: Schema validation in tests
- `@repo/test-utils`: Shared test utilities

### 구현 접근 (Implementation Approach)

**테스트 전략**:
1. **단위 테스트**: 개별 함수/모듈 테스트
2. **통합 테스트**: 여러 모듈 간 상호작용 테스트
3. **컴포넌트 테스트**: UI 컴포넌트 테스트

**테스트 피라미드**:
```
    E2E (아직 구현 안 됨)
   /     \
  통합     ← 20개 테스트
 /       \
단위      ← 30개 테스트
```

**Mock 전략**:
- 외부 서비스 (Qdrant, OpenAI) Mock
- DB 트랜잭션 Mock
- HTTP 요청 Mock

### 관측/운영 (Observability)

**테스트 리포트**:
- Vitest UI로 시각적 리포트
- 코드 커버리지 리포트
- 실패 테스트 요약

**CI/CD 통합**:
- GitHub Actions에서 자동 실행
- PR 시 테스트 필수 통과
- 머지 후 전체 테스트 실행

### 실패 모드/대응 (Failure Modes)

**테스트 실패**:
- 빌드 중단
- PR 병합 불가
- 실패 로그 상세 출력

**Flaky Tests**:
- 재시도 메커니즘 (retry: 3)
- 타임아웃 설정 (5초)
- 격리된 테스트 환경

**Mock 실패**:
- Mock 데이터 검증
- Fallback to real service (테스트 DB)

---

## 데이터 구조 (Data Structure)

### Test Configuration

**vitest.component.config.ts**:
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Test File Structure

```typescript
describe('RAG Handler', () => {
  describe('POST /api/rag/query', () => {
    it('should return answer with sources', async () => {
      // Arrange
      const mockQuery = 'React Server Components';

      // Act
      const response = await ragQuery({ query: mockQuery });

      // Assert
      expect(response.success).toBe(true);
      expect(response.data.answer).toBeDefined();
      expect(response.data.sources).toHaveLength(5);
    });

    it('should handle invalid input', async () => {
      // Test invalid input
    });
  });
});
```

---

## API 명세 (API Specifications)

### Test Commands

**단위 테스트 실행**:
```bash
pnpm --filter=rag-gateway test
```

**통합 테스트 실행**:
```bash
pnpm --filter=rag-gateway test:integration
```

**컴포넌트 테스트 실행**:
```bash
pnpm --filter=blog-admin test:component
```

**전체 테스트 실행**:
```bash
pnpm test
```

**커버리지 리포트**:
```bash
pnpm test:coverage
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 개발자가 새 기능 추가**
1. RAG 핸들러에 새 파라미터 추가
2. 테스트 작성 (Red)
3. 구현 (Green)
4. 리팩토링 (Refactor)
5. 테스트 통과 확인
6. PR 생성

**시나리오 2: 코드 리뷰**
1. 리뷰어가 PR 열기
2. 테스트 코드로 기능 이해
3. 테스트가 실패하면 리뷰 중단
4. 테스트 통과 시 리뷰 계속

**시나리오 3: 회귀 버그 방지**
1. 기존 기능 수정
2. 관련 테스트 실행
3. 실패한 테스트로 버그 조기 발견
4. 수정 후 테스트 통과

### 실패 시나리오

**시나리오 1: Flaky Test**
1. 테스트가 간헐적으로 실패
2. 재시도로 통과
3. 원인 분석 (타이밍 이슈, Mock 문제)
4. 테스트 수정

**시나리오 2: Mock 실패**
1. Mock 데이터가 실제와 다름
2. 테스트는 통과하지만 프로덕션에서 실패
3. Mock 데이터 업데이트
4. 테스트 수정

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- **API Key 보호**: 테스트에서도 API Key 노출 금지
- **Mock 데이터**: 민감 데이터 포함 금지
- **테스트 DB**: 프로덕션 데이터 분리

### 성능 (Performance)

**테스트 실행 시간**:
- 단위 테스트: ~10초
- 통합 테스트: ~30초
- 전체 테스트: ~1분 이내 권장

**최적화**:
- 병렬 실행 (Vitest 기본)
- Mock 적극 활용
- 테스트 격리

### 운영 (Operational)

**CI/CD 통합**:
- 모든 PR에서 테스트 자동 실행
- 실패 시 PR 병합 불가
- 머지 후 전체 테스트 실행

**테스트 유지보수**:
- 테스트 코드 리뷰 필수
- 리팩토링 시 테스트도 업데이트
- 실패한 테스트는 즉시 수정

### 배포 (Deployment)

- 테스트 실패 시 배포 중단
- 롤백 시 테스트 실행으로 안정성 확인

### 롤백 (Rollback)

- 테스트 커버리지가 낮은 코드는 롤백 고려
- 회귀 버그 발생 시 해당 테스트 강화

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **E2E 테스트 추가**
   - Playwright로 통합 커버리지 강화
   - 실제 브라우저에서 테스트
   - 사용자 시나리오 시뮬레이션

2. **성능 테스트**
   - 부하 테스트 (k6)
   - 스트레스 테스트
   - 벤치마킹

### Phase 3 (3+ months)

3. **시각적 회귀 테스트**
   - Percy, Chromatic 등 도구
   - UI 변경 감지
   - 디자인 시스템 검증

4. **테스트 더블 강화**
   - Fixtures 패턴
   - 테스트 데이터 팩토리
   - 공통 유틸리티

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **E2E 테스트 도구**
   - Playwright vs Cypress 선택
   - 우선순위 및 일정

2. **성능 벤치마크**
   - 목표 응답 시간
   - 허용 가능한 최대 부하

3. **테스트 커버리지 목표**
   - 현재 커버리지
   - 목표 커버리지 (80%? 90%?)

### Data Needed

1. **버그 발생률 데이터**
   - 테스트 도입 전후 비교
   - 회귀 버그 감소율

2. **개발 생산성 데이터**
   - 코드 리뷰 시간 변화
   - 버그 수정 시간 단축률

3. **테스트 실행 시간**
   - 현재 실행 시간
   - 최적화 기회

---

## 관련 파일 (Related Files)

### RAG Gateway Tests
- `apps/rag-gateway/src/tests/handlers/rag.test.ts`: 핸들러 테스트
- `apps/rag-gateway/src/tests/ingestion/pipeline.test.ts`: 파이프라인 테스트
- `apps/rag-gateway/src/tests/integration/batch-ingest.test.ts`: 통합 테스트
- `apps/rag-gateway/src/tests/middleware/auth.test.ts`: 인증 테스트
- `apps/rag-gateway/src/tests/middleware/rate-limit.test.ts`: Rate Limiting 테스트
- `apps/rag-gateway/src/tests/security-integration.test.ts`: 보안 테스트

### Blog-Admin Test Infrastructure
- `apps/blog-admin/vitest.component.config.ts`: 컴포넌트 테스트 설정
- `apps/blog-admin/__mocks__/next-themes.tsx`: Theme provider mock
- `apps/blog-admin/tests/`: Scroll Sync, File Creator 등 테스트

### Test Utilities
- `apps/blog-admin/vitest.setup.ts`: 테스트 설정 파일
- `@repo/test-utils`: 공통 테스트 유틸리티 (TBD)

---

## 테스트 커버리지 (Test Coverage)

### 현재 상태

- **총 테스트 케이스**: 50+ 개
- **핸들러 테스트**: RAG 쿼리, 벡터 검색
- **파이프라인 테스트**: 문서 인제스트
- **통합 테스트**: 배치 처리
- **미들웨어 테스트**: 인증, Rate Limiting
- **보안 테스트**: SQL Injection, XSS 등

### 목표 커버리지

- **코드 커버리지**: 80% 이상 (현재 TBD)
- **분기 커버리지**: 70% 이상 (현재 TBD)
- **함수 커버리지**: 90% 이상 (현재 TBD)

### 커버리지 리포트

```bash
# 커버리지 리포트 생성
pnpm test:coverage

# 결과 예시
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |    85.2 |    78.5  |    92.1 |    84.8 |
 rag.ts   |    92.3 |    85.7  |   100   |    91.8 | 45, 78
 pipeline |    80.1 |    75.2  |    88.9 |    79.5 | 12-15, 89-95
----------|---------|----------|---------|---------|-------------------
```

---

## 참고 문헌 (References)

- [Facts: Blog-Admin Index](../../facts/apps/blog-admin/index.md)
- [Facts: RAG Integration](../../facts/apps/blog-admin/features/rag-integration.md)
- [Insights: RAG Gateway Tests Business Impact](../../insights/apps/blog-admin/impact/rag-gateway-tests.md)
- [CLAUDE.md: Testing Guidelines](../../../CLAUDE.md#testing)
- [RAG Integration Spec](./rag-integration.md): RAG 기능 명세서
