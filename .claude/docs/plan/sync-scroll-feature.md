# 스크롤 동기화 기능 구현 계획

## 개요
마크다운 에디터와 프리뷰 화면의 스크롤 위치를 동기화하는 기능을 파일 생성 페이지에 추가합니다.

## 현재 상태

### ✅ 이미 구현됨
- **파일 수정 페이지** (`apps/blog-admin/src/app/dashboard/files/edit/page.tsx`)
  - 318-358행에 스크롤 동기화 로직이 이미 구현됨
  - `editorScrollRef`, `previewScrollRef`, `isScrollingSyncRef` 사용
  - 백분율 기반 스크롤 동기화 (스크롤 비율 계산 후 상대편에 적용)

### ❌ 미구현
- **파일 생성 페이지** (`apps/blog-admin/src/widgets/file-creator/ui/file-creator-widget.tsx`)
  - 스크롤 동기화 기능 없음
  - `viewMode="split"`일 때만 동기화 필요

## 구현 계획

### 1. `FileCreatorWidget`에 스크롤 동기화 추가

**파일**: `apps/blog-admin/src/widgets/file-creator/ui/file-creator-widget.tsx`

**변경사항**:
1. `useRef`로 스크롤 컨테이너 참조 추가:
   - `editorScrollRef`: 마크다운 에디터 스크롤 컨테이너
   - `previewScrollRef`: 프리뷰 스크롤 컨테이너
   - `isScrollingSyncRef`: 무한 루프 방지 플래그

2. `useEffect`로 스크롤 이벤트 리스너 등록:
   - 에디터 스크롤 → 프리뷰 스크롤 동기화
   - 프리뷰 스크롤 → 에디터 스크롤 동기화
   - 스크롤 비율 계산 후 상대방 스크롤 위치 조정

3. JSX 구조 변경:
   - 에디터와 프리뷰 `div`에 `ref` 연결
   - 기존 스타일 유지

### 2. 구현 상세

#### 스크롤 동기화 로직 (파일 수정 페이지에서 이미 검증됨)

```typescript
useEffect(() => {
  const editorContainer = editorScrollRef.current;
  const previewContainer = previewScrollRef.current;

  if (!editorContainer || !previewContainer) return;

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

  return () => {
    editorContainer.removeEventListener('scroll', handleEditorScroll);
    previewContainer.removeEventListener('scroll', handlePreviewScroll);
  };
}, []);
```

#### DOM 구조 변경

**변경 전**:
```tsx
{(viewMode === 'editor' || viewMode === 'split') && (
  <div className={...}>
    <div className="p-4">
      <MarkdownEditor ... />
    </div>
  </div>
)}

{(viewMode === 'preview' || viewMode === 'split') && (
  <div className="p-4">
    <div className="overflow-auto h-full">
      ...
    </div>
  </div>
)}
```

**변경 후**:
```tsx
{(viewMode === 'editor' || viewMode === 'split') && (
  <div className={...}>
    <div ref={editorScrollRef} className="p-4 overflow-auto">
      <MarkdownEditor ... />
    </div>
  </div>
)}

{(viewMode === 'preview' || viewMode === 'split') && (
  <div className="p-4">
    <div ref={previewScrollRef} className="overflow-auto h-full">
      ...
    </div>
  </div>
)}
```

### 3. 동작 조건

- `viewMode === 'split'`일 때만 스크롤 동기화 활성화
- 단일 모드(`editor`, `preview`)에서는 동기화 비활성화

### 4. 기술적 고려사항

1. **무한 루프 방지**: `isScrollingSyncRef` 플래그로 순환 참조 방지
2. **백분율 기반 동기화**: 컨텐츠 길이가 다를 때도 정확한 동기화
3. **이벤트 리스너 정리**: `useEffect` cleanup 함수로 메모리 누수 방지

## 구현 파일

| 파일 | 변경 내용 |
|------|----------|
| `apps/blog-admin/src/widgets/file-creator/ui/file-creator-widget.tsx` | 스크롤 동기화 로직 추가 |

## 테스트 계획

1. **기본 동작**: 분할 모드에서 에디터 스크롤 시 프리뷰가 따라가는지 확인
2. **양방향 동기화**: 프리뷰 스크롤 시 에디터도 따라가는지 확인
3. **단일 모드**: 편집/프리뷰 단일 모드에서는 동기화 비활성화 확인
4. **성능**: 스크롤 시 버벅임 없는지 확인

## 참고

파일 수정 페이지의 구현을 그대로 재사용하므로, 이미 검증된 로직입니다.
