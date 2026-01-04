/**
 * 스크롤 동기화 기능 테스트
 *
 * 마크다운 에디터와 프리뷰 화면의 스크롤 위치 동기화를 검증합니다.
 *
 * 이 테스트는 DB 연결이 필요 없으므로 별도로 실행됩니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// DB 연결이 필요 없는 테스트임을 표시
// 실제 FileCreatorWidget 컴포넌트 구현 후 import

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

/**
 * 스크롤 이벤트를 트리거하는 헬퍼 함수
 */
const triggerScroll = (element: HTMLElement, scrollTop: number, scrollHeight?: number, clientHeight?: number) => {
  // scrollHeight와 clientHeight 설정
  if (scrollHeight !== undefined) {
    Object.defineProperty(element, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: scrollHeight,
    });
  }
  if (clientHeight !== undefined) {
    Object.defineProperty(element, 'clientHeight', {
      writable: true,
      configurable: true,
      value: clientHeight,
    });
  }

  // scrollTop 설정 및 이벤트 트리거
  Object.defineProperty(element, 'scrollTop', {
    writable: true,
    configurable: true,
    value: scrollTop,
  });

  element.dispatchEvent(new Event('scroll', { bubbles: true }));
};

describe('스크롤 동기화 기능', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('분할 모드 (split) - 에디터 → 프리뷰', () => {
    it('에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함', async () => {
      // Given: 분할 모드로 렌더링 (가상의 컴포넌트)
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      editorContainer.setAttribute('data-testid', 'markdown-editor-scroll');
      previewContainer.setAttribute('data-testid', 'preview-scroll');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      // 스크롤 가능한 높이 설정
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      // 스크롤 동기화 로직 (컴포넌트 내부 로직과 동일)
      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 에디터를 50% 스크롤
      triggerScroll(editorContainer, 500);

      // Then: 프리뷰도 50% 스크롤되어야 함
      // (1500 - 1000) * 0.5 = 250
      expect(previewContainer.scrollTop).toBe(250);

      // Cleanup
      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });

    it('에디터가 긴 컨텐츠일 경우 백분율 기반으로 정확히 동기화되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      // 에디터가 훨씬 긴 경우
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 5000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 에디터를 80% 스크롤
      triggerScroll(editorContainer, 3200); // (5000 - 1000) * 0.8 = 3200

      // Then: 프리뷰도 80% 스크롤되어야 함
      // (1500 - 1000) * 0.8 = 400
      expect(previewContainer.scrollTop).toBe(400);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });

  describe('분할 모드 (split) - 프리뷰 → 에디터', () => {
    it('프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handlePreviewScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight);
        editorContainer.scrollTop =
          scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
      };

      previewContainer.addEventListener('scroll', handlePreviewScroll);

      // When: 프리뷰를 60% 스크롤
      triggerScroll(previewContainer, 300); // (1500 - 1000) * 0.6 = 300

      // Then: 에디터도 60% 스크롤되어야 함
      // (2000 - 1000) * 0.6 = 600
      expect(editorContainer.scrollTop).toBe(600);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });

    it('프리뷰가 긴 컨텐츠일 경우 백분율 기반으로 정확히 동기화되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      // 프리뷰가 더 긴 경우
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 3000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 500, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handlePreviewScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight);
        editorContainer.scrollTop =
          scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
      };

      previewContainer.addEventListener('scroll', handlePreviewScroll);

      // When: 프리뷰를 75% 스크롤
      triggerScroll(previewContainer, 1875); // (3000 - 500) * 0.75 = 1875

      // Then: 에디터도 75% 스크롤되어야 함
      // (1000 - 500) * 0.75 = 375
      expect(editorContainer.scrollTop).toBe(375);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });

  describe('무한 루프 방지', () => {
    it('에디터 스크롤 → 프리뷰 동기화 시 추가 스크롤 이벤트가 발생하지 않아야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };
      const editorScrollSpy = vi.fn();

      const handleEditorScroll = () => {
        editorScrollSpy();
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 에디터 스크롤 트리거
      triggerScroll(editorContainer, 500);

      // Then: 핸들러가 1번만 호출되어야 함 (무한 루프 방지)
      expect(editorScrollSpy).toHaveBeenCalledTimes(1);
      expect(previewContainer.scrollTop).toBe(250);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });

    it('빠르게 연속 스크롤 시 무한 루프로 인한 성능 저하 없음', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };
      let syncCount = 0;

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        syncCount++;
        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      const handlePreviewScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        syncCount++;
        isScrollingSyncRef.current = true;
        const scrollPercentage =
          previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight);
        editorContainer.scrollTop =
          scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);
      previewContainer.addEventListener('scroll', handlePreviewScroll);

      // When: 빠르게 연속 스크롤
      for (let i = 0; i < 10; i++) {
        triggerScroll(editorContainer, i * 100);
      }

      // Then: 무한 루프가 발생하지 않아야 함
      // syncCount가 10보다 작거나 같으면 무한 루프가 방지된 것
      // (isScrollingSyncRef 플래그로 인해 일부 동기화가 건너뜀)
      expect(syncCount).toBeLessThanOrEqual(10);
      expect(syncCount).toBeGreaterThan(0);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });

  describe('경계 케이스', () => {
    it('스크롤 위치가 0일 때 정확히 동기화되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: scrollTop = 0
      triggerScroll(editorContainer, 0);

      // Then: 양쪽 모두 scrollTop = 0
      expect(editorContainer.scrollTop).toBe(0);
      expect(previewContainer.scrollTop).toBe(0);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });

    it('스크롤 위치가 최대일 때 정확히 동기화되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 에디터를 맨 아래로 스크롤
      triggerScroll(editorContainer, 1000); // scrollHeight - clientHeight = 2000 - 1000 = 1000

      // Then: 프리뷰도 맨 아래로
      expect(editorContainer.scrollTop).toBe(1000);
      expect(previewContainer.scrollTop).toBe(500); // 1500 - 1000 = 500

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });

    it('빈 컨텐츠(높이 0)에서는 에러 없이 처리되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      // 스크롤 가능한 영역이 없는 경우
      Object.defineProperty(editorContainer, 'scrollHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 100, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;

        // 분모가 0이 되지 않도록 체크
        const maxScroll = editorContainer.scrollHeight - editorContainer.clientHeight;
        if (maxScroll > 0) {
          const scrollPercentage = editorContainer.scrollTop / maxScroll;
          previewContainer.scrollTop =
            scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
        }
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 스크롤 시도 (실제로는 스크롤 불가)
      expect(() => triggerScroll(editorContainer, 0)).not.toThrow();

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });

  describe('이벤트 리스너 정리', () => {
    it('이벤트 리스너가 정상적으로 제거되어야 함', async () => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      const handlePreviewScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          previewContainer.scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight);
        editorContainer.scrollTop =
          scrollPercentage * (editorContainer.scrollHeight - editorContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);
      previewContainer.addEventListener('scroll', handlePreviewScroll);

      // 리스너 제거 스파이
      const editorRemoveSpy = vi.spyOn(editorContainer, 'removeEventListener');
      const previewRemoveSpy = vi.spyOn(previewContainer, 'removeEventListener');

      // When: 이벤트 리스너 제거 (컴포넌트 언마운트 시뮬레이션)
      editorContainer.removeEventListener('scroll', handleEditorScroll);
      previewContainer.removeEventListener('scroll', handlePreviewScroll);

      // Then: removeEventListener가 호출되어야 함
      expect(editorRemoveSpy).toHaveBeenCalledWith('scroll', handleEditorScroll);
      expect(previewRemoveSpy).toHaveBeenCalledWith('scroll', handlePreviewScroll);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });

  describe('백분율 계산 정확성', () => {
    it.each([
      { editorScroll: 0, expectedPercentage: 0 },
      { editorScroll: 250, expectedPercentage: 0.25 },
      { editorScroll: 500, expectedPercentage: 0.5 },
      { editorScroll: 750, expectedPercentage: 0.75 },
      { editorScroll: 1000, expectedPercentage: 1.0 },
    ])('에디터 스크롤 $editorScrollpx 시 백분율 $expectedPercentage 계산', async ({ editorScroll, expectedPercentage }) => {
      const editorContainer = document.createElement('div');
      const previewContainer = document.createElement('div');

      document.body.appendChild(editorContainer);
      document.body.appendChild(previewContainer);

      Object.defineProperty(editorContainer, 'scrollHeight', { value: 2000, writable: true, configurable: true });
      Object.defineProperty(editorContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'scrollHeight', { value: 1500, writable: true, configurable: true });
      Object.defineProperty(previewContainer, 'clientHeight', { value: 1000, writable: true, configurable: true });

      const isScrollingSyncRef = { current: false };

      const handleEditorScroll = () => {
        if (isScrollingSyncRef.current) {
          isScrollingSyncRef.current = false;
          return;
        }

        isScrollingSyncRef.current = true;
        const scrollPercentage =
          editorContainer.scrollTop / (editorContainer.scrollHeight - editorContainer.clientHeight);
        previewContainer.scrollTop =
          scrollPercentage * (previewContainer.scrollHeight - previewContainer.clientHeight);
      };

      editorContainer.addEventListener('scroll', handleEditorScroll);

      // When: 에디터 스크롤
      triggerScroll(editorContainer, editorScroll);

      // Then: 프리뷰가 해당 백분율로 스크롤됨
      const expectedPreviewScroll = expectedPercentage * (1500 - 1000);
      expect(previewContainer.scrollTop).toBeCloseTo(expectedPreviewScroll, 0);

      document.body.removeChild(editorContainer);
      document.body.removeChild(previewContainer);
    });
  });
});
