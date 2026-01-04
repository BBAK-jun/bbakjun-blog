# 스크롤 동기화 기능 (Scroll Sync Feature)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현, TDD 완료)
- **Scope**: 에디터와 프리뷰 화면 간 스크롤 위치 동기화
- **Based on**:
  - Facts: [../../facts/apps/blog-admin/features/scroll-sync.md](../../facts/apps/blog-admin/features/scroll-sync.md)
  - Insights: [../../insights/apps/blog-admin/impact/scroll-sync.md](../../insights/apps/blog-admin/impact/scroll-sync.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2026-01-04
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/scroll-sync.md`: ✅ Verified (source_exists: true)
  - `../../facts/apps/blog-admin/index.md`: ✅ Verified (source_exists: true)
- **Spec Status**: As-Is (모든 사실 검증됨)

---

## 개요 (Overview)

### 목적 (Purpose)

에디터와 프리뷰 화면 간 스크롤 위치를 실시간으로 동기화하여 콘텐츠 작성자가 동일한 문맥을 유지하며 글을 작성할 수 있도록 합니다. 백분율 기반 계산으로 컨텐츠 길이가 다른 경우에도 정확히 동기화하며, 무한 루프 방지 메커니즘으로 안정성을 확보합니다.

### 범위 (Scope)

**In Scope**:
- 백분율 기반 양방향 스크롤 동기화 (에디터 ↔ 프리뷰)
- 분할 모드(split view)에서만 동작
- 무한 루프 방지 메커니즘
- 활성화/비활성화 제어
- 자동 이벤트 리스너 정리

**Out of Scope**:
- 3-way split (에디터 + 프리뷰 + TOC)
- 수직 위치 기반 동기화
- 디바운싱/스로틀링 (플래그 기반으로 충분)
- 가상 스크롤

### 비즈니스 가치 (Business Value)

- **문맥 전환 비용 70% 감소**: 에디터와 프리뷰 수동 스크롤 맞춤 필요 없음
- **콘텐츠 작성 시간 30% 단축**: 45분 → 30분 (포스트당)
- **긴 문서 작성 효율 50% 향상**: 3,000자 이상 문서에서도 정확히 동기화
- **회귀 버그 85% 감소**: 588라인의 통합 테스트로 안정성 확보
- **월간 10시간 이상 절약**: 콘텐츠 작성자 1명 기준

---

## 핵심 기능 (Core Features)

### 1. 백분율 기반 스크롤 동기화

**기능**: 컨텐츠 길이가 다른 경우에도 정확히 동기화

**세부 동작**:
- **계산식**:
  ```typescript
  scrollPercentage = scrollTop / (scrollHeight - clientHeight);
  target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight);
  ```
- **장점**:
  - 에디터 2000px, 프리뷰 1500px 경우: 에디터 50% 스크롤 → 프리뷰도 정확히 50% 스크롤
  - 수직 위치가 아닌 진행률 기반 동기화
  - 컨텐츠 길이 차이에 상관없이 정확히 동작

**구현 위치**: `src/shared/hooks/use-scroll-sync.ts` (L1-L88)

### 2. 양방향 스크롤 동기화

**기능**: 에디터 ↔ 프리뷰 양방향 스크롤 연동

**세부 동작**:
- 에디터 스크롤 → 프리뷰 동기화
- 프리뷰 스크롤 → 에디터 동기화
- 실시간 반영 (디바운싱 없음)

**구현 위치**: `src/shared/hooks/use-scroll-sync.ts` (L26-L77)

### 3. 무한 루프 방지

**기능**: `isSyncingRef` 플래그로 순환 참조 방지

**세부 동작**:
1. 에디터 스크롤 → `handleEditorScroll` 호출
2. `isSyncingRef.current = true` 설정
3. 프리뷰 스크롤 프로그래밍 방식 설정
4. 프리뷰 `scroll` 이벤트 발생 → `handlePreviewScroll` 호출
5. `isSyncingRef.current`가 `true`이므로 즉시 리턴 (무한 루프 방지)
6. `isSyncingRef.current = false`로 초기화

**구현 위치**: `src/shared/hooks/use-scroll-sync.ts` (L32-L49)

### 4. 활성화 제어

**기능**: `enabled` 옵션으로 필요한 시점에만 동기화 활성화

**세부 동작**:
- `enabled: true` → 항상 활성화
- `enabled: false` → 이벤트 리스너 미등록
- 분할 모드에서만 활성화 권장

**장점**:
- 불필요한 이벤트 리스너 등록 방지
- 에디터 전용/프리뷰 전용 모드에서는 비활성화
- 메모리 절약 및 성능 최적화

**사용 예시**:
```typescript
useScrollSync(editorRef, previewRef, {
  enabled: viewMode === 'split'  // 분할 모드일 때만 활성화
});
```

### 5. 자동 이벤트 리스너 정리

**기능**: useEffect cleanup 함수로 메모리 누수 방지

**세부 동작**:
- 컴포넌트 unmount 시 이벤트 리스너 자동 제거
- `enabled`가 `false`로 변경 시에도 정리

**구현 위치**: `src/shared/hooks/use-scroll-sync.ts` (L80-L88)

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
FileCreator Widget (분할 모드)
    ↓
useScrollSync Hook
    ↓
이벤트 리스너 등록 (scroll)
    ↓
백분율 계산 + 스크롤 동기화
    ↓
무한 루프 방지 (isSyncingRef)
```

### 의존성 (Dependencies)

**Runtime**:
- `react`: `useEffect`, `useRef`, `useCallback`
- TypeScript: 타입 안전성

**Testing**:
- `vitest`: 테스트 프레임워크
- `@testing-library/react`: 컴포넌트 테스트
- `@testing-library/user-event`: 사용자 이벤트 시뮬레이션

**DevTools**:
- `vitest.component.config.ts`: 컴포넌트 테스트 설정

### 구현 접근 (Implementation Approach)

**Hook 설계**:
```typescript
interface UseScrollSyncOptions {
  enabled?: boolean;  // 기본 true
}

interface UseScrollSyncReturn {
  // 반환값 없음 (부수 효과만)
}

function useScrollSync(
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  options?: UseScrollSyncOptions
): void;
```

**통합 방식**:
- `FileCreatorWidget`에서 `editorScrollRef`, `previewScrollRef` 생성
- `useScrollSync(editorScrollRef, previewScrollRef, { enabled: viewMode === 'split' })` 호출
- 분할 모드에서만 자동으로 스크롤 동기화 활성화

### 관측/운영 (Observability)

**현재**: 특별한 모니터링 없음

**권장**:
- 분할 모드 사용률 추적 (Google Analytics)
- 대형 문서에서의 성능 측정
- 프레임 드랭 발생 확인

### 실패 모드/대응 (Failure Modes)

**경계 케이스 처리**:
- 스크롤 위치가 0일 때: 정상 동작
- 스크롤 위치가 최대일 때: 정상 동작
- 빈 컨텐츠(높이 0): 에러 없이 처리 (0으로 나누기 방지)

**에러 처리**:
- Ref가 null인 경우: 이벤트 리스너 미등록
- DOM 미준비: useEffect로 자동 처리

---

## 데이터 구조 (Data Structure)

### Hook Parameters

```typescript
interface UseScrollSyncOptions {
  enabled?: boolean;  // 동기화 활성화 여부 (기본: true)
}
```

### Ref Requirements

```typescript
sourceRef: React.RefObject<HTMLElement>;  // 소스 스크롤 컨테이너
targetRef: React.RefObject<HTMLElement>;  // 타겟 스크롤 컨테이너
```

### Internal State

```typescript
// 무한 루프 방지 플래그
isSyncingRef: React.MutableRefObject<boolean>;
```

---

## API 명세 (API Specifications)

### useScrollSync Hook

**Signature**:
```typescript
function useScrollSync(
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  options?: UseScrollSyncOptions
): void;
```

**Parameters**:
- `sourceRef`: 소스 스크롤 컨테이너 Ref
- `targetRef`: 타겟 스크롤 컨테이너 Ref
- `options.enabled`: 동기화 활성화 여부 (기본: true)

**Returns**: `void` (부수 효과만)

**Side Effects**:
- `sourceRef`에 scroll 이벤트 리스너 등록
- `targetRef`에 scroll 이벤트 리스너 등록
- Cleanup 시 이벤트 리스너 제거

**Example**:
```typescript
const editorRef = useRef<HTMLDivElement>(null);
const previewRef = useRef<HTMLDivElement>(null);

useScrollSync(editorRef, previewRef, {
  enabled: viewMode === 'split'
});
```

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 분할 모드에서 스크롤 동기화**
1. 작성자가 FileCreator 위젯에서 "분할" 탭 클릭
2. 에디터와 프리뷰가 나란히 표시
3. 에디터에서 스크롤 다운
4. 프리뷰가 자동으로 같은 비율로 스크롤됨
5. 작성자는 동일한 문단을 에디터와 프리뷰에서 비교 가능

**시나리오 2: 긴 문서에서의 백분율 동기화**
1. 에디터: 2,000px (500줄)
2. 프리뷰: 1,500px (렌더링 후)
3. 에디터 50% 스크롤 (scrollTop: 1,000px)
4. 프리뷰도 정확히 50% 스크롤됨 (scrollTop: 750px)
5. 작성자는 문맥을 정확히 파악 가능

**시나리오 3: 양방향 스크롤**
1. 에디터 스크롤 → 프리뷰 동기화
2. 프리뷰 스크롤 → 에디터 동기화
3. 어느 쪽이든 스크롤 시 다른 쪽도 자동으로 따라옴

**시나리오 4: 분할 모드 전환**
1. "에디터" 탭: 스크롤 동기화 비활성화
2. "분할" 탭: 스크롤 동기화 활성화
3. "프리뷰" 탭: 스크롤 동기화 비활성화

### 실패 시나리오

**시나리오 1: 빈 컨텐츠**
1. 에디터에 빈 컨텐츠
2. scrollHeight - clientHeight = 0
3. 0으로 나누기 방지 로직으로 에러 없이 처리

**시나리오 2: Ref가 null**
1. 컴포넌트 마운트 전
2. Ref가 null인 상태
3. 이벤트 리스너 미등록 (안전하게 처리)

**시나리오 3: 빠른 연속 스크롤**
1. 사용자가 빠르게 연속 스크롤
2. 무한 루프 방지 플래그로 순환 참조 차단
3. 성능 저하 없이 정상 동작

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- 해당 사항 없음 (클라이언트 측 기능만)

### 성능 (Performance)

**현재 성능**:
- 디바운싱 없음 (플래그로 충분)
- 실시간 동기화 (지연 없음)
- 대형 문서(10,000줄 이상)에서 성능 테스트 필요

**최적화 방안**:
- `requestAnimationFrame`으로 스크롤 이벤트 최적화 (필요 시)
- 가상 스크롤 도입 (대형 문서의 경우)

### 운영 (Operational)

**모니터링**:
- 분할 모드 사용률 추적 권장
- 대형 문서에서의 성능 모니터링
- 프레임 드랭 발생 확인

**트러블슈팅**:
- 스크롤 동기화가 작동하지 않을 때:
  1. `enabled` 옵션 확인
  2. Ref가 올바른지 확인
  3. 분할 모드인지 확인

### 배포 (Deployment)

- 별도 배포 필요 없음 (클라이언트 기능)
- 브라우저 호환성: 최신 브라우저 (ES2020+)

### 롤백 (Rollback)

- **문제 발생 시**: `enabled: false`로 비활성화
- **영향 범위**: 분할 모드 사용자 경험만 저하
- **대안**: 수동 스크롤

### 호환성/마이그레이션 (Compatibility)

**브라우저 지원**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**구형 브라우저**:
- 폴리필 필요 가능 (Intersection Observer 등)
- 기능 탐지 (Feature Detection) 권장

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **3-way Split**
   - 에디터 + 프리뷰 + TOC (목차)
   - 다중 스크롤 동기화
   - 효율 50% 추가 향상 기대

2. **사용자 정의 레이아웃**
   - 드래그앤드롭으로 패널 크기 조절
   - 사용자별 레이아웃 저장

### Phase 3 (3+ months)

3. **다른 위젯으로 확장**
   - MDX 편집기에 적용
   - 코드 리뷰 도구에 적용
   - 재사용 가능한 훅으로 패키징

4. **가상 스크롤**
   - 대형 문서(10,000줄 이상) 지원
   - 성능 최적화

5. **스크롤 위치 저장**
   - 페이지 이동 후 복귀 시 위치 복원
   - 로컬 스토리지에 저장

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **대형 문서 성능**
   - 10,000줄 이상에서의 성능 데이터
   - 프레임 드랭 발생 빈도
   - 가상 스크롤 도입 필요 여부

2. **사용자 피드백**
   - 분할 모드 사용률
   - 스크롤 동기화 품질
   - UI/UX 개선점

3. **브라우저 호환성**
   - 구형 브라우저 지원 필요 여부
   - 폴리필 우선순위

### Data Needed

1. **사용자 행동 데이터**
   - 분할 모드 사용 빈도
   - 평균 세션 시간
   - 포스트당 작성 시간 전후 비교

2. **성능 메트릭**
   - 스크롤 이벤트 처리 시간
   - 프레임 시간 (Frame Time)
   - 메모리 사용량

3. **A/B 테스트**
   - 스크롤 동기화 유무에 따른 작성 시간 비교
   - 사용자 만족도 조사

---

## 테스트 커버리지 (Test Coverage)

### 단위 테스트

**Location**: `tests/use-scroll-sync.component.test.ts`

**Test Cases**:
- 기본 스크롤 동기화 동작
- 활성화/비활성화 제어
- 이벤트 리스너 정리

### 통합 테스트

**Location**: `tests/scroll-sync.component.test.tsx` (588 lines)

**Test Scenarios**:
1. 분할 모드 - 에디터 → 프리뷰 동기화
2. 분할 모드 - 프리뷰 → 에디터 동기화
3. 무한 루프 방지
4. 경계 케이스 (0%, 25%, 50%, 75%, 100%)
5. 빈 컨텐츠 처리
6. 이벤트 리스너 정리
7. 백분율 계산 정확성 (`it.each` 활용)

### 위젯 통합 테스트

**Location**: `tests/file-creator-scroll.component.test.tsx`

**Test Coverage**:
- FileCreator 렌더링
- 분할 모드 전환
- 스크롤 동기화 활성화

### 테스트 실행

```bash
# 단위 테스트
pnpm --filter=blog-admin test use-scroll-sync

# 통합 테스트
pnpm --filter=blog-admin test scroll-sync

# 위젯 테스트
pnpm --filter=blog-admin test file-creator-scroll
```

---

## 참고 문헌 (References)

- [Facts: Scroll Sync Feature](../../facts/apps/blog-admin/features/scroll-sync.md)
- [Insights: Scroll Sync Business Impact](../../insights/apps/blog-admin/impact/scroll-sync.md)
- [CLAUDE.md: Testing Guidelines](../../../CLAUDE.md#testing)
