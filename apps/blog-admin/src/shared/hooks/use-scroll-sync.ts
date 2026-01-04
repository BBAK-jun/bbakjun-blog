/**
 * 스크롤 동기화 커스텀 훅
 *
 * 두 개의 스크롤 컨테이너 간 스크롤 위치를 동기화합니다.
 * 백분율 기반으로 계산하여 컨텐츠 길이가 다른 경우에도 정확히 동기화합니다.
 */

import { useEffect, useRef } from 'react';

interface UseScrollSyncOptions {
  /** 스크롤 동기화를 활성화할지 여부 */
  enabled?: boolean;
}

/**
 * 두 스크롤 컨테이너 간의 양방향 스크롤 동기화를 설정합니다.
 *
 * @param editorRef - 에디터 스크롤 컨테이너 ref
 * @param previewRef - 프리뷰 스크롤 컨테이너 ref
 * @param options - 동기화 옵션
 *
 * @example
 * ```tsx
 * const editorRef = useRef<HTMLDivElement>(null);
 * const previewRef = useRef<HTMLDivElement>(null);
 *
 * useScrollSync(editorRef, previewRef, { enabled: isSplitMode });
 * ```
 */
export function useScrollSync(
  editorRef: React.RefObject<HTMLElement>,
  previewRef: React.RefObject<HTMLElement>,
  options: UseScrollSyncOptions = {}
) {
  const { enabled = true } = options;
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const editor = editorRef.current;
    const preview = previewRef.current;

    // 활성화되지 않았거나 ref가 없으면 동기화 건너뜀
    if (!enabled || !editor || !preview) {
      return;
    }

    const handleEditorScroll = () => {
      // 동기화 중이면 건너뜀 (무한 루프 방지)
      if (isSyncingRef.current) {
        isSyncingRef.current = false;
        return;
      }

      isSyncingRef.current = true;

      // 백분율 계산
      const scrollPercentage =
        editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop =
        scrollPercentage * (preview.scrollHeight - preview.clientHeight);
    };

    const handlePreviewScroll = () => {
      if (isSyncingRef.current) {
        isSyncingRef.current = false;
        return;
      }

      isSyncingRef.current = true;

      const scrollPercentage =
        preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      editor.scrollTop =
        scrollPercentage * (editor.scrollHeight - editor.clientHeight);
    };

    // 이벤트 리스너 등록
    editor.addEventListener('scroll', handleEditorScroll);
    preview.addEventListener('scroll', handlePreviewScroll);

    // cleanup 함수로 이벤트 리스너 제거
    return () => {
      editor.removeEventListener('scroll', handleEditorScroll);
      preview.removeEventListener('scroll', handlePreviewScroll);
    };
  }, [enabled, editorRef, previewRef]);
}
