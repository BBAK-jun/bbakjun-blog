/**
 * useScrollSync 훅 단위 테스트
 *
 * 모킹 없이 실제 DOM을 사용하여 스크롤 동기화 로직을 검증합니다.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useScrollSync } from '@/shared/hooks/use-scroll-sync';
import { RefObject, useRef } from 'react';

describe('useScrollSync', () => {
  let editorRef: RefObject<HTMLElement>;
  let previewRef: RefObject<HTMLElement>;
  let editorEl: HTMLDivElement;
  let previewEl: HTMLDivElement;

  beforeEach(() => {
    // 실제 DOM 요소 생성
    editorEl = document.createElement('div');
    previewEl = document.createElement('div');

    // 스크롤 가능한 높이 설정
    Object.defineProperty(editorEl, 'scrollHeight', { value: 2000, writable: true, configurable: true });
    Object.defineProperty(editorEl, 'clientHeight', { value: 1000, writable: true, configurable: true });
    Object.defineProperty(editorEl, 'scrollTop', { value: 0, writable: true, configurable: true });

    Object.defineProperty(previewEl, 'scrollHeight', { value: 1500, writable: true, configurable: true });
    Object.defineProperty(previewEl, 'clientHeight', { value: 1000, writable: true, configurable: true });
    Object.defineProperty(previewEl, 'scrollTop', { value: 0, writable: true, configurable: true });

    // document에 추가
    document.body.appendChild(editorEl);
    document.body.appendChild(previewEl);

    // ref 생성
    editorRef = { current: editorEl };
    previewRef = { current: previewEl };
  });

  afterEach(() => {
    cleanup();
    document.body.removeChild(editorEl);
    document.body.removeChild(previewEl);
  });

  describe('활성화된 상태', () => {
    it('에디터 스크롤 시 프리뷰가 같은 비율로 스크롤되어야 함', () => {
      // Given: 훅 렌더링
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When: 에디터를 50% 스크롤
      editorEl.scrollTop = 500;
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 프리뷰도 50% 스크롤됨
      expect(previewEl.scrollTop).toBe(250);
    });

    it('프리뷰 스크롤 시 에디터가 같은 비율로 스크롤되어야 함', () => {
      // Given: 훅 렌더링
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When: 프리뷰를 60% 스크롤
      previewEl.scrollTop = 300;
      previewEl.dispatchEvent(new Event('scroll'));

      // Then: 에디터도 60% 스크롤됨
      expect(editorEl.scrollTop).toBe(600);
    });

    it('양방향 연속 스크롤 시 무한 루프가 발생하지 않아야 함', () => {
      // Given: 훅 렌더링
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      let syncCount = 0;
      const originalEditorScroll = Object.getOwnPropertyDescriptor(HTMLDivElement.prototype, 'scrollTop');
      const originalPreviewScroll = Object.getOwnPropertyDescriptor(HTMLDivElement.prototype, 'scrollTop');

      // 스크롤 설정 감지
      Object.defineProperty(editorEl, 'scrollTop', {
        get() {
          return originalEditorScroll?.get.call(this) ?? 0;
        },
        set(value) {
          syncCount++;
          originalEditorScroll?.set.call(this, value);
        },
        configurable: true,
      });

      Object.defineProperty(previewEl, 'scrollTop', {
        get() {
          return originalPreviewScroll?.get.call(this) ?? 0;
        },
        set(value) {
          syncCount++;
          originalPreviewScroll?.set.call(this, value);
        },
        configurable: true,
      });

      // When: 에디터 스크롤 트리거
      editorEl.scrollTop = 500;
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 동기화가 한 번만 발생해야 함 (무한 루프 방지)
      expect(syncCount).toBeGreaterThan(0);
      expect(syncCount).toBeLessThan(3); // 1회 에디터 설정 + 1회 프리뷰 동기화 = 2회 이하여야 함

      // 복원
      Object.defineProperty(editorEl, 'scrollTop', { value: 0, writable: true, configurable: true });
      Object.defineProperty(previewEl, 'scrollTop', { value: 0, writable: true, configurable: true });
    });
  });

  describe('비활성화된 상태', () => {
    it('enabled=false일 때 스크롤 동기화가 일어나지 않아야 함', () => {
      // Given: 훅 렌더링 (비활성화)
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: false }));

      // When: 에디터 스크롤
      editorEl.scrollTop = 500;
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 프리뷰는 스크롤되지 않음
      expect(previewEl.scrollTop).toBe(0);
    });
  });

  describe('경계 케이스', () => {
    it('스크롤 가능한 영역이 없을 때 에러가 발생하지 않아야 함', () => {
      // Given: 스크롤 불가능한 요소
      Object.defineProperty(editorEl, 'scrollHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(editorEl, 'clientHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(previewEl, 'scrollHeight', { value: 100, writable: true, configurable: true });
      Object.defineProperty(previewEl, 'clientHeight', { value: 100, writable: true, configurable: true });

      // When & Then: 에러 없이 렌더링
      expect(() => {
        renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));
      }).not.toThrow();
    });

    it('ref가 null일 때 에러가 발생하지 않아야 함', () => {
      // Given: null ref
      const nullRef = { current: null };

      // When & Then: 에러 없이 렌더링
      expect(() => {
        renderHook(() => useScrollSync(nullRef, nullRef, { enabled: true }));
      }).not.toThrow();
    });

    it('최상단 스크롤 시 정확히 동기화되어야 함', () => {
      // Given
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When
      editorEl.scrollTop = 0;
      editorEl.dispatchEvent(new Event('scroll'));

      // Then
      expect(editorEl.scrollTop).toBe(0);
      expect(previewEl.scrollTop).toBe(0);
    });

    it('최하단 스크롤 시 정확히 동기화되어야 함', () => {
      // Given
      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When: 에디터를 맨 아래로
      editorEl.scrollTop = 1000; // scrollHeight - clientHeight
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 프리뷰도 맨 아래로
      expect(editorEl.scrollTop).toBe(1000);
      expect(previewEl.scrollTop).toBe(500); // 1500 - 1000
    });
  });

  describe('컨텐츠 길이 차이', () => {
    it('에디터가 훨씬 긴 경우에도 백분율로 정확히 동기화되어야 함', () => {
      // Given: 에디터가 5배 긴 경우
      Object.defineProperty(editorEl, 'scrollHeight', { value: 5000, writable: true, configurable: true });
      Object.defineProperty(editorEl, 'clientHeight', { value: 1000, writable: true, configurable: true });

      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When: 에디터를 80% 스크롤
      editorEl.scrollTop = 3200; // (5000 - 1000) * 0.8
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 프리뷰도 80%
      expect(previewEl.scrollTop).toBe(400); // (1500 - 1000) * 0.8
    });

    it('프리뷰가 더 긴 경우에도 백분율로 정확히 동기화되어야 함', () => {
      // Given: 프리뷰가 더 긴 경우
      Object.defineProperty(editorEl, 'scrollHeight', { value: 1000, writable: true, configurable: true });
      Object.defineProperty(editorEl, 'clientHeight', { value: 500, writable: true, configurable: true });
      Object.defineProperty(previewEl, 'scrollHeight', { value: 3000, writable: true, configurable: true });
      Object.defineProperty(previewEl, 'clientHeight', { value: 500, writable: true, configurable: true });

      renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));

      // When: 프리뷰를 75% 스크롤
      previewEl.scrollTop = 1875; // (3000 - 500) * 0.75
      previewEl.dispatchEvent(new Event('scroll'));

      // Then: 에디터도 75%
      expect(editorEl.scrollTop).toBe(375); // (1000 - 500) * 0.75
    });
  });

  describe('cleanup', () => {
    it('언마운트 후 스크롤 동기화가 더 이상 작동하지 않아야 함', () => {
      // Given: 훅 렌더링 후 언마운트
      const { unmount } = renderHook(() => useScrollSync(editorRef, previewRef, { enabled: true }));
      unmount();

      // When: 에디터 스크롤
      editorEl.scrollTop = 500;
      editorEl.dispatchEvent(new Event('scroll'));

      // Then: 프리뷰는 스크롤되지 않음 (이벤트 리스너가 제거됨)
      expect(previewEl.scrollTop).toBe(0);
    });
  });
});
