# 스크롤 동기화 기능 테스트 계획

## 개요
마크다운 에디터와 프리뷰 화면의 스크롤 동기화 기능을 검증하는 컴포넌트 테스트 계획입니다.

## 테스트 전략

### 테스트 방식: **React 컴포넌트 테스트**

스크롤 동기화는 사용자 상호작용 기능이므로 **컴포넌트 테스트**가 적합합니다.

| 테스트 방식 | 적합성 | 이유 |
|------------|--------|------|
| 유닛 테스트 | ❌ | DOM 이벤트, 실제 렌더링 필요 |
| 통합 테스트 | ❌ | DB 연결 불필요 (순수 UI 로직) |
| E2E 테스트 | ⚠️ | 느림, Playwright 설정 필요 |
| **컴포넌트 테스트** | ✅ | 실제 DOM 이벤트, 빠름, 적절한 격리 수준 |

### 테스트 프레임워크

**Vitest + React Testing Library** 사용:

```typescript
// vitest.config.ts에 이미 설정됨
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // DOM 환경 제공
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**이유**:
- 프로젝트에서 이미 Vitest 사용 중
- React Testing Library로 실제 DOM 이벤트 시뮬레이션 가능
- jsdom 환경으로 스크롤 이벤트 테스트 가능

---

## 테스트 파일 구조

```
apps/blog-admin/tests/
├── setup.ts                      # 전역 설정
├── blob-cdc.test.ts              # CDC 통합 테스트 (기존)
├── file-update-integration.test.ts
├── frontmatter.test.ts
└── scroll-sync.test.ts           # ✨ 새로 추가
```

---

## 테스트 케이스

### 1. 기본 동작 테스트

#### 1.1 분할 모드에서 에디터 스크롤 시 프리뷰 동기화

```typescript
describe('스크롤 동기화 - 에디터 → 프리뷰', () => {
  it('분할 모드에서 에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함', async () => {
    // Given: 분할 모드로 컴포넌트 렌더링
    // When: 에디터를 50% 스크롤
    // Then: 프리뷰도 50% 스크롤됨
  });
});
```

#### 1.2 분할 모드에서 프리뷰 스크롤 시 에디터 동기화

```typescript
describe('스크롤 동기화 - 프리뷰 → 에디터', () => {
  it('분할 모드에서 프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함', async () => {
    // Given: 분할 모드로 컴포넌트 렌더링
    // When: 프리뷰를 30% 스크롤
    // Then: 에디터도 30% 스크롤됨
  });
});
```

---

### 2. 양방향 동기화 테스트

#### 2.1 연속 스크롤 시 정확한 동기화

```typescript
describe('양방향 스크롤 동기화', () => {
  it('에디터 → 프리뷰 → 에디터 연속 스크롤 시 정확히 동기화되어야 함', async () => {
    // Given: 분할 모드
    // When: 에디터 스크롤 → 프리뷰 스크롤 → 에디터 스크롤
    // Then: 각 스크롤이 정확히 동기화됨
  });
});
```

---

### 3. 무한 루프 방지 테스트

#### 3.1 스크롤 이벤트 중복 방지

```typescript
describe('무한 루프 방지', () => {
  it('에디터 스크롤 → 프리뷰 동기화 시 추가 스크롤 이벤트가 발생하지 않아야 함', async () => {
    // Given: 분할 모드
    // When: 에디터 스크롤
    // Then: 프리뷰 스크롤 이벤트가 에디터에 다시 전파되지 않음 (무한 루프 방지)
  });

  it('isScrollingSyncRef 플래그가 순환 참조를 방지해야 함', async () => {
    // Given: 스크롤 동기화 활성화 상태
    // When: 빠르게 연속 스크롤
    // Then: 무한 루프로 인한 성능 저하 없음
  });
});
```

---

### 4. 단일 모드에서 비활성화 테스트

#### 4.1 편집 모드에서 동기화 비활성화

```typescript
describe('단일 모드 동작', () => {
  it('편집 모드에서는 스크롤 동기화가 비활성화되어야 함', async () => {
    // Given: viewMode='editor'
    // When: 에디터 스크롤
    // Then: 프리뷰가 렌더링되지 않음 (또는 스크롤 이벤트 무시)
  });
});
```

#### 4.2 프리뷰 모드에서 동기화 비활성화

```typescript
it('프리뷰 모드에서는 스크롤 동기화가 비활성화되어야 함', async () => {
  // Given: viewMode='preview'
  // When: 프리뷰 스크롤
  // Then: 에디터가 렌더링되지 않음
});
```

---

### 5. 컨텐츠 길이가 다른 경우 테스트

#### 5.1 에디터가 더 긴 컨텐츠인 경우

```typescript
describe('컨텐츠 길이 차이에 따른 동기화', () => {
  it('에디터 컨텐츠가 더 길 경우 백분율 기반으로 정확히 동기화되어야 함', async () => {
    // Given: 에디터(1000줄) + 프리뷰(500줄 HTML)
    // When: 에디터를 50% 스크롤
    // Then: 프리뷰도 50% 스크롤됨 (줄 수 상관없이 백분율 기반)
  });
});
```

#### 5.2 프리뷰가 더 긴 컨텐츠인 경우

```typescript
it('프리뷰 컨텐츠가 더 길 경우 백분율 기반으로 정확히 동기화되어야 함', async () => {
  // Given: 에디터(200줄) + 프리뷰(HTML 렌더링 후 800줄)
  // When: 프리뷰를 75% 스크롤
  // Then: 에디터도 75% 스크롤됨
});
```

---

### 6. 경계 케이스 테스트

#### 6.1 최상단 스크롤

```typescript
describe('경계 케이스', () => {
  it('스크롤 위치가 0일 때 정확히 동기화되어야 함', async () => {
    // Given: 분할 모드
    // When: scrollTop = 0
    // Then: 양쪽 모두 scrollTop = 0
  });
});
```

#### 6.2 최하단 스크롤

```typescript
it('스크롤 위치가 최대일 때 정확히 동기화되어야 함', async () => {
  // Given: 분할 모드
  // When: 스크롤을 맨 아래로
  // Then: 양쪽 모두 맨 아래 도달
});
```

#### 6.3 빈 컨텐츠

```typescript
it('빈 컨텐츠에서는 스크롤 이벤트가 무시되어야 함', async () => {
  // Given: content = ''
  // When: 스크롤 시도
  // Then: 에러 없이 무시됨
});
```

---

### 7. 이벤트 리스너 정리 테스트

#### 7.1 컴포넌트 언마운트 시 리스너 정리

```typescript
describe('메모리 관리', () => {
  it('컴포넌트 언마운트 시 스크롤 이벤트 리스너가 정리되어야 함', async () => {
    // Given: 분할 모드로 렌더링
    // When: 컴포넌트 언마운트
    // Then: 이벤트 리스너가 제거됨 (spy로 검증)
  });

  it('viewMode 변경 시 이전 이벤트 리스너가 정리되어야 함', async () => {
    // Given: split 모드
    // When: editor 모드로 변경
    // Then: split 모드의 리스너가 정리됨
  });
});
```

---

## 테스트 구현 예시

### 테스트 파일: `tests/scroll-sync.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FileCreatorWidget } from '@/widgets/file-creator';

// Mock scroll 이벤트를 위한 헬퍼 함수
const triggerScroll = (element: HTMLElement, scrollTop: number) => {
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    configurable: true,
    value: scrollTop,
  });
  element.dispatchEvent(new Event('scroll'));
};

describe('스크롤 동기화 기능', () => {
  beforeEach(() => {
    // localStorage mock (초안 저장 기능)
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock as any;
  });

  afterEach(() => {
    cleanup();
  });

  describe('분할 모드 (split)', () => {
    it('에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함', async () => {
      render(<FileCreatorWidget />);

      // 분할 모드 버튼 클릭
      const splitButton = await screen.findByRole('button', { name: /분할|split/i });
      fireEvent.click(splitButton);

      // 에디터와 프리뷰 컨테이너 찾기
      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      // 스크롤 가능한 높이 설정
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000 });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000 });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500 });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000 });

      // 에디터를 50% 스크롤
      triggerScroll(editorContainer, 500);

      // 프리뷰도 50% 스크롤되어야 함
      // (1500 - 1000) * 0.5 = 250
      expect(previewContainer.scrollTop).toBe(250);
    });

    it('프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함', async () => {
      render(<FileCreatorWidget />);

      const splitButton = await screen.findByRole('button', { name: /분할|split/i });
      fireEvent.click(splitButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000 });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000 });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500 });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000 });

      // 프리뷰를 60% 스크롤
      triggerScroll(previewContainer, 300);

      // 에디터도 60% 스크롤되어야 함
      // (2000 - 1000) * 0.6 = 600
      expect(editorContainer.scrollTop).toBe(600);
    });
  });

  describe('무한 루프 방지', () => {
    it('스크롤 동기화 시 순환 참조가 방지되어야 함', async () => {
      render(<FileCreatorWidget />);

      const splitButton = await screen.findByRole('button', { name: /분할|split/i });
      fireEvent.click(splitButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      // 이벤트 리스너 스파이
      const editorScrollSpy = vi.fn();
      const previewScrollSpy = vi.fn();

      editorContainer.addEventListener('scroll', editorScrollSpy);
      previewContainer.addEventListener('scroll', previewScrollSpy);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000 });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000 });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500 });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000 });

      // 에디터 스크롤 트리거
      triggerScroll(editorContainer, 500);

      // 에디터 스크롤 이벤트는 1번만 발생해야 함 (무한 루프 방지)
      expect(editorScrollSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('단일 모드', () => {
    it('편집 모드에서는 스크롤 동기화가 비활성화되어야 함', async () => {
      render(<FileCreatorWidget />);

      const editorButton = await screen.findByRole('button', { name: /편집|editor/i });
      fireEvent.click(editorButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.queryByTestId('preview-scroll');

      // 프리뷰가 렌더링되지 않아야 함
      expect(previewContainer).not.toBeInTheDocument();
    });

    it('프리뷰 모드에서는 스크롤 동기화가 비활성화되어야 함', async () => {
      render(<FileCreatorWidget />);

      const previewButton = await screen.findByRole('button', { name: /프리뷰|preview/i });
      fireEvent.click(previewButton);

      const editorContainer = screen.queryByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      // 에디터가 렌더링되지 않아야 함
      expect(editorContainer).not.toBeInTheDocument();
    });
  });

  describe('메모리 관리', () => {
    it('컴포넌트 언마운트 시 이벤트 리스너가 정리되어야 함', async () => {
      const { unmount } = render(<FileCreatorWidget />);

      const splitButton = await screen.findByRole('button', { name: /분할|split/i });
      fireEvent.click(splitButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');

      // removeEventListener 스파이
      const removeSpy = vi.spyOn(editorContainer, 'removeEventListener');

      unmount();

      // cleanup 함수가 호출되어야 함
      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });
});
```

---

## 필요한 컴포넌트 수정 사항

### `data-testid` 추가

테스트에서 DOM 요소를 쉽게 찾기 위해 `data-testid` 속성 추가:

```tsx
// file-creator-widget.tsx

// 에디터 컨테이너
<div ref={editorScrollRef} data-testid="markdown-editor-scroll" className="p-4 overflow-auto">
  <MarkdownEditor ... />
</div>

// 프리뷰 컨테이너
<div ref={previewScrollRef} data-testid="preview-scroll" className="overflow-auto h-full">
  <article ... />
</div>
```

---

## 의존성 추가 필요 여부 확인

```bash
# 현재 설치된 패키지 확인
cat apps/blog-admin/package.json | grep -E "@testing-library|vitest"
```

**이미 설치되어야 하는 패키지**:
- `vitest` - 테스트 러너
- `@testing-library/react` - React 컴포넌트 테스트
- `@testing-library/user-event` - 사용자 이벤트 시뮬레이션
- `@testing-library/jest-dom` - 추가 매처 (선택)

**설치 명령어** (필요 시):

```bash
pnpm add --filter=blog-admin -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

---

## 실행 방법

```bash
# 스크롤 동기화 테스트만 실행
pnpm --filter=blog-admin test scroll-sync

# watch mode
pnpm --filter=blog-admin test scroll-sync --watch

# coverage 확인
pnpm --filter=blog-admin test scroll-sync --coverage
```

---

## 성능 메트릭

| 테스트 | 예상 실행 시간 | 메모리 사용량 |
|--------|---------------|---------------|
| 기본 동기화 | < 100ms | < 10MB |
| 양방향 동기화 | < 150ms | < 15MB |
| 무한 루프 방지 | < 100ms | < 10MB |
| 단일 모드 | < 50ms | < 5MB |
| 경계 케이스 | < 100ms | < 10MB |
| **전체** | **< 500ms** | **< 50MB** |

---

## CI/CD 통합

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Run component tests
        run: pnpm --filter=blog-admin test:run
```

---

## 참고 자료

- [React Testing Library 공식 문서](https://testing-library.com/react)
- [Vitest 공식 문서](https://vitest.dev/)
- [스크롤 이벤트 테스팅 가이드](https://testing-library.com/docs/dom-testing-library/api-events)
