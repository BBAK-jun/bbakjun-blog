# Scroll Sync Feature

- **Scope**: 스크롤 동기화 기능 구현 및 테스트
- **Source of Truth**: `src/shared/hooks/use-scroll-sync.ts`
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

## 메타데이터

```yaml
metadata:
  version: "1.0.0"
  created_at: "2026-01-04T00:00:00Z"
  last_verified: "2026-01-04T00:00:00Z"
  git_commit: "628174858956a2b1ff3d7c33e4ae03c790ed3208"

  changed_files:
    - path: apps/blog-admin/src/shared/hooks/use-scroll-sync.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Scroll synchronization hook for split-view editor/preview"
      source_exists: true
    - path: apps/blog-admin/src/widgets/file-creator/ui/file-creator-widget.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "ENHANCED: Integrated scroll sync in split view mode"
      source_exists: true
    - path: apps/blog-admin/tests/scroll-sync.component.test.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Comprehensive scroll sync component tests (588 lines)"
      source_exists: true
    - path: apps/blog-admin/tests/use-scroll-sync.component.test.ts
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Hook-level unit tests for scroll sync"
      source_exists: true
    - path: apps/blog-admin/tests/file-creator-scroll.component.test.tsx
      changed_at: "2026-01-04T00:00:00Z"
      reason: "NEW: Integration tests for FileCreator scroll sync"
      source_exists: true

  deleted_files: []
```

## 개요

에디터와 프리뷰 화면 간 스크롤 위치를 동기화하는 기능입니다. 백분율 기반 계산으로 컨텐츠 길이가 다른 경우에도 정확히 동기화하며, 무한 루프 방지 메커니즘을 포함합니다.

## 핵심 구현

### useScrollSync Hook

- **Location**: `src/shared/hooks/use-scroll-sync.ts` (L1-L88)
- **Purpose**: 두 스크롤 컨테이너 간 양방향 스크롤 동기화
- **source_exists**: true
- **Key Details**:
  1. **백분율 기반 계산**:
     ```typescript
     const scrollPercentage =
       editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
     preview.scrollTop =
       scrollPercentage * (preview.scrollHeight - preview.clientHeight);
     ```
  2. **양방향 동기화**: 에디터 ↔ 프리뷰 양방향 스크롤 연동
  3. **무한 루프 방지**: `isSyncingRef` 플래그로 순환 참조 방지
  4. **활성화 제어**: `enabled` 옵션으로 분할 모드에서만 동작
  5. **자동 정리**: useEffect cleanup 함수로 이벤트 리스너 제거
- **Dependencies**:
  - React: `useEffect`, `useRef`
- **Evidence**:
  - `src/shared/hooks/use-scroll-sync.ts`: 전체 훅 구현

### FileCreator Widget Integration

- **Location**: `src/widgets/file-creator/ui/file-creator-widget.tsx` (L47-L52)
- **Purpose**: 분할 모드에서 스크롤 동기화 활성화
- **source_exists**: true
- **Key Details**:
  ```typescript
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  useScrollSync(editorScrollRef, previewScrollRef, {
    enabled: viewMode === 'split'
  });
  ```
- **View Modes**:
  - `editor`: 에디터만 표시
  - `preview`: 프리뷰만 표시
  - `split`: 에디터 + 프리뷰 동시 표시 (스크롤 동기화 활성화)
- **Evidence**:
  - `src/widgets/file-creator/ui/file-creator-widget.tsx`: L47-L52

## 테스트 커버리지

### 단위 테스트

- **Location**: `tests/use-scroll-sync.component.test.ts`
- **Purpose**: 훅 레벨 단위 테스트
- **source_exists**: true
- **Test Coverage**:
  1. 기본 스크롤 동기화 동작
  2. 활성화/비활성화 제어
  3. 이벤트 리스너 정리
- **Evidence**:
  - `tests/use-scroll-sync.component.test.ts`: 전체 테스트 코드

### 통합 테스트

- **Location**: `tests/scroll-sync.component.test.tsx` (588 lines)
- **Purpose**: 스크롤 동기화 통합 테스트 (모든 경계 케이스 포함)
- **source_exists**: true
- **Test Scenarios**:
  1. **분할 모드 - 에디터 → 프리뷰**:
     - 에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함
     - 에디터가 긴 컨텐츠일 경우 백분율 기반 정확히 동기화
  2. **분할 모드 - 프리뷰 → 에디터**:
     - 프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함
     - 프리뷰가 긴 컨텐츠일 경우 백분율 기반 정확히 동기화
  3. **무한 루프 방지**:
     - 에디터 스크롤 → 프리뷰 동기화 시 추가 스크롤 이벤트가 발생하지 않아야 함
     - 빠르게 연속 스크롤 시 무한 루프로 인한 성능 저하 없음
  4. **경계 케이스**:
     - 스크롤 위치가 0일 때 정확히 동기화
     - 스크롤 위치가 최대일 때 정확히 동기화
     - 빈 컨텐츠(높이 0)에서 에러 없이 처리
  5. **이벤트 리스너 정리**:
     - 이벤트 리스너가 정상적으로 제거
  6. **백분율 계산 정확성**:
     - `it.each`를 활용한 다양한 스크롤 위치 테스트 (0%, 25%, 50%, 75%, 100%)
- **Test Helper**:
  ```typescript
  const triggerScroll = (element, scrollTop, scrollHeight, clientHeight) => {
    // 스크롤 이벤트를 트리거하는 헬퍼 함수
  }
  ```
- **Evidence**:
  - `tests/scroll-sync.component.test.tsx`: L1-L588

### 위젯 통합 테스트

- **Location**: `tests/file-creator-scroll.component.test.tsx`
- **Purpose**: FileCreator 위젯에서 스크롤 동기화 통합 테스트
- **source_exists**: true
- **Test Coverage**:
  1. FileCreator 렌더링
  2. 분할 모드 전환
  3. 스크롤 동기화 활성화
- **Evidence**:
  - `tests/file-creator-scroll.component.test.tsx`: 전체 테스트 코드

## 기술적 세부사항

### 백분율 기반 계산

컨텐츠 길이가 다른 경우에도 정확히 동기화하기 위해 백분율을 사용합니다:

```typescript
// 현재 스크롤 백분율 계산 (0.0 ~ 1.0)
const scrollPercentage =
  scrollTop / (scrollHeight - clientHeight);

// 대상 컨테이너에 동일한 백분율 적용
target.scrollTop =
  scrollPercentage * (target.scrollHeight - target.clientHeight);
```

**장점**:
- 컨텐츠 길이 차이에 상관없이 정확히 동기화
- 에디터 2000px, 프리뷰 1500px 경우: 에디터 50% 스크롤 → 프리뷰도 50% 스크롤
- 수직 위치가 아닌 진행률을 기반으로 동기화

### 무한 루프 방지

`isSyncingRef` 플래그로 순환 참조를 방지합니다:

```typescript
const isSyncingRef = useRef(false);

const handleEditorScroll = () => {
  // 동기화 중이면 건너뜀
  if (isSyncingRef.current) {
    isSyncingRef.current = false;
    return;
  }

  isSyncingRef.current = true;
  // 스크롤 동기화 로직...
};
```

**작동 원리**:
1. 에디터 스크롤 → `handleEditorScroll` 호출
2. `isSyncingRef.current = true` 설정
3. 프리뷰 스크롤 프로그래밍 방식 설정
4. 프리뷰 `scroll` 이벤트 발생 → `handlePreviewScroll` 호출
5. `isSyncingRef.current`가 `true`이므로 즉시 리턴 (무한 루프 방지)
6. `isSyncingRef.current = false`로 초기화

### 활성화 제어

`enabled` 옵션으로 필요한 시점에만 동기화를 활성화합니다:

```typescript
useScrollSync(editorRef, previewRef, {
  enabled: viewMode === 'split'  // 분할 모드에서만 활성화
});
```

**장점**:
- 불필요한 이벤트 리스너 등록 방지
- 에디터 전용 모드/프리뷰 전용 모드에서는 동기화 비활성화
- 메모리 절약 및 성능 최적화

## 사용 예시

### 기본 사용법

```typescript
import { useScrollSync } from '@/shared/hooks/use-scroll-sync';
import { useRef } from 'react';

function MyComponent() {
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 스크롤 동기화 활성화
  useScrollSync(editorRef, previewRef, {
    enabled: true  // 항상 활성화
  });

  return (
    <div className="flex">
      <div ref={editorRef} className="editor">
        {/* 에디터 컨텐츠 */}
      </div>
      <div ref={previewRef} className="preview">
        {/* 프리뷰 컨텐츠 */}
      </div>
    </div>
  );
}
```

### 조건부 활성화

```typescript
const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('editor');

useScrollSync(editorRef, previewRef, {
  enabled: viewMode === 'split'  // 분할 모드일 때만 활성화
});
```

## TDD 프로세스

1. **테스트 먼저 작성**: `scroll-sync.component.test.tsx`에 모든 경계 케이스 작성
2. **구현**: `use-scroll-sync.ts`에 훅 구현
3. **리팩토링**: 무한 루프 방지, 성능 최적화
4. **위젯 통합**: `FileCreatorWidget`에 적용
5. **통합 테스트**: `file-creator-scroll.component.test.tsx`로 검증

## 성능 고려사항

1. **이벤트 리스너 정리**: useEffect cleanup 함수로 메모리 누수 방지
2. **조건부 활성화**: 필요할 때만 이벤트 리스너 등록
3. **플래그 기반 최적화**: `isSyncingRef`로 불필요한 동기화 스킵
4. **디바운싱 없음**: 실시간 동기화를 위해 디바운싱 사용하지 않음 (플래그로 충분)

## 관련 파일

- `src/shared/hooks/use-scroll-sync.ts`: 메인 훅 구현
- `src/widgets/file-creator/ui/file-creator-widget.tsx`: 위젯 통합
- `tests/scroll-sync.component.test.tsx`: 통합 테스트 (588 lines)
- `tests/use-scroll-sync.component.test.ts`: 단위 테스트
- `tests/file-creator-scroll.component.test.tsx`: 위젯 통합 테스트
- `vitest.component.config.ts`: 컴포넌트 테스트 설정
