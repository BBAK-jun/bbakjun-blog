/**
 * FileCreatorWidget 스크롤 동기화 TDD 테스트
 *
 * Red → Green → Refactor 사이클
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useFileCreator hook
vi.mock('@/features/file-create', () => ({
  useFileCreator: () => ({
    formData: {
      title: '',
      description: '',
      date: '2025-01-04',
      tags: [],
      author: 'bbakjun',
      content: '',
    },
    setFormData: vi.fn(),
    category: 'DEV',
    setCategory: vi.fn(),
    previewHtml: '<p>테스트</p>',
    handlePreview: vi.fn(),
    isPreviewLoading: false,
    create: vi.fn(),
    isCreating: false,
    createError: null,
    isSuccess: false,
    lastSavedAt: null,
    isSaving: false,
    clearDraft: vi.fn(),
  }),
  CategorySelector: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="category-selector">
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  ),
  PathPreview: () => <div data-testid="path-preview">posts/DEV/test.md</div>,
}));

// MarkwonEditor 컴포넌트 Mock
vi.mock('@/shared/ui/markdown-editor', () => ({
  MarkdownEditor: ({ value, onChange, height }: { value: string; onChange: (v: string) => void; height: string }) => (
    <div data-testid="markdown-editor" style={{ height }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="markdown-textarea"
      />
    </div>
  ),
}));

// TagInput Mock
vi.mock('@/shared/ui/tag-input', () => ({
  TagInput: ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => (
    <input
      data-testid="tag-input"
      value={value.join(',')}
      onChange={(e) => onChange(e.target.value.split(','))}
    />
  ),
}));

/**
 * 스크롤 이벤트를 트리거하는 헬퍼 함수
 */
const triggerScroll = (element: HTMLElement, scrollTop: number) => {
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    configurable: true,
    value: scrollTop,
  });
  element.dispatchEvent(new Event('scroll', { bubbles: true }));
};

describe('FileCreatorWidget - 스크롤 동기화 (TDD)', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('RED: 실패하는 테스트 먼저 작성 → GREEN: 구현', () => {
    it('분할 모드에서 data-testid="markdown-editor-scroll" 요소가 존재해야 함', async () => {
      // Given: FileCreatorWidget 렌더링
      const { FileCreatorWidget } = await import('@/widgets/file-creator');
      render(<FileCreatorWidget />);

      // When: 분할 모드 버튼 클릭
      const splitButton = await screen.findByTitle('분할 보기');
      fireEvent.click(splitButton);

      // Then: 에디터와 프리뷰 컨테이너가 존재해야 함
      expect(screen.getByTestId('markdown-editor-scroll')).toBeInTheDocument();
      expect(screen.getByTestId('preview-scroll')).toBeInTheDocument();
    });

    it('분할 모드에서 에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함', async () => {
      // Given: FileCreatorWidget을 분할 모드로 렌더링
      const { FileCreatorWidget } = await import('@/widgets/file-creator');
      render(<FileCreatorWidget />);

      const splitButton = await screen.findByTitle('분할 보기');
      fireEvent.click(splitButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      // 스크롤 가능한 높이 설정
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      // When: 에디터를 50% 스크롤
      triggerScroll(editorContainer, 500);

      // Then: 프리뷰도 50% 스크롤되어야 함
      expect(previewContainer.scrollTop).toBe(250);
    });

    it('분할 모드에서 프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함', async () => {
      // Given: FileCreatorWidget을 분할 모드로 렌더링
      const { FileCreatorWidget } = await import('@/widgets/file-creator');
      render(<FileCreatorWidget />);

      const splitButton = await screen.findByTitle('분할 보기');
      fireEvent.click(splitButton);

      const editorContainer = screen.getByTestId('markdown-editor-scroll');
      const previewContainer = screen.getByTestId('preview-scroll');

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      // When: 프리뷰를 60% 스크롤
      triggerScroll(previewContainer, 300);

      // Then: 에디터도 60% 스크롤되어야 함
      expect(editorContainer.scrollTop).toBe(600);
    });

    it('편집 모드에서는 프리뷰가 렌더링되지 않아야 함', async () => {
      // Given: FileCreatorWidget 렌더링 (기본 상태는 편집 모드)
      const { FileCreatorWidget } = await import('@/widgets/file-creator');
      render(<FileCreatorWidget />);

      // Then: 에디터만 존재, 프리뷰는 존재하지 않음
      expect(screen.getByTestId('markdown-editor-scroll')).toBeInTheDocument();
      expect(screen.queryByTestId('preview-scroll')).not.toBeInTheDocument();
    });

    it('프리뷰 모드에서는 에디터가 렌더링되지 않아야 함', async () => {
      // Given: FileCreatorWidget 렌더링
      const { FileCreatorWidget } = await import('@/widgets/file-creator');
      render(<FileCreatorWidget />);

      // When: 프리뷰 모드 버튼 클릭
      const previewButton = await screen.findByTitle('미리보기');
      fireEvent.click(previewButton);

      // Then: 프리뷰만 존재, 에디터는 존재하지 않음
      expect(screen.queryByTestId('markdown-editor-scroll')).not.toBeInTheDocument();
      expect(screen.getByTestId('preview-scroll')).toBeInTheDocument();
    });
  });
});
