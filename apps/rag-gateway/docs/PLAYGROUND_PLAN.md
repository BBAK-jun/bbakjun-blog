# RAG Gateway 플레이그라운드 구현 계획

## 목표

RAG Gateway에 채팅 형태의 플레이그라운드 UI를 추가하여 RAG 질의응답 기능을 쉽게 테스트할 수 있게 합니다.

## 기술 스택 선택

- **UI 프레임워크**: 순수 HTML + JavaScript
- **스타일링**: Tailwind CSS (CDN)
- **아키텍처**: 정적 HTML 파일을 Hono가 직접 제공

## 구현 방법

**`c.html()` 메서드 사용** - Hono의 내장 HTML 응답 메서드로 HTML을 직접 반환

이 방식이 선택된 이유:

- 추가 의존성 불필요 (serveStatic 미들웨어 불필요)
- 단일 파일로 UI 관리 가능
- 배포 시 별도의 정적 파일 불필요
- 개발/프로덕션 환경 동일하게 작동

## 구현할 파일

### 1. `src/index.ts` 수정

루트 경로 `/`와 `/playground`에 플레이그라운드 라우트 추가:

```typescript
// Playground UI
app.get('/', playgroundHandler); // 루트 접속 시 플레이그라운드로
app.get('/playground', playgroundHandler);
```

### 2. `src/routes/playground.ts` 신규 생성

플레이그라운드 UI 핸들러와 HTML을 포함하는 파일:

**주요 기능:**

- 채팅 인터페이스 (메시지 입력, 전송, 히스토리)
- RAG API 호출 (`/api/rag/query`)
- 로딩 상태 표시
- 에러 처리
- 다크 모드 지원
- 소스 문서 미리보기

**UI 구성:**

1. 헤더: RAG Gateway 타이틀 + 상태 표시
2. 채팅 영역: 메시지 버블 (사용자/AI)
3. 입력 영역: 텍스트 입력 + 전송 버튼
4. 소스 패널: 검색된 문서 목록

### 3. `src/types/playground.ts` 신규 생성 (선택)

채팅 메시지 타입 정의:

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceDocument[];
}
```

## API 호출 흐름

```
사용자 입력
    ↓
POST /api/rag/query
    ↓
{
  "query": "사용자 질문",
  "topK": 5,
  "minScore": 0.7
}
    ↓
{
  "answer": "LLM 답변",
  "sources": [...],
  "query": "원본 질문"
}
    ↓
UI에 메시지와 소스 표시
```

## UI 와이어프레임

```
┌─────────────────────────────────────────────────┐
│  RAG Gateway Playground                    [🌙] │  ← 헤더
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ User: Next.js ISR은 어떻게 작동하나요?    │ │  ← 채팅 영역
│  ├───────────────────────────────────────────┤ │
│  │ Assistant: ISR는 정적 생성의 성능과...    │ │
│  │                                           │ │
│  │ Sources:                                  │ │
│  │ • Next.js ISR 가이드 (0.92)              │ │
│  │ • Incremental Static Regeneration (0.87) │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│  [입력창.................................] [전송] │  ← 입력 영역
└─────────────────────────────────────────────────┘
```

## Tailwind CSS 설정

CDN을 통해 로드:

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    darkMode: 'class',
    theme: { extend: { colors: { ... } } }
  }
</script>
```

## 사용할 CDN 라이브러리

```html
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Marked.js (마크다운 렌더링) -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- DOMPurify (XSS 방지 - 선택사항) -->
<script src="https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js"></script>
```

## 구현 단계

1. **`src/routes/playground.ts` 생성**
   - HTML 템플릿 작성 (Tailwind CSS 적용)
   - 자바스크립트 로직 작성 (API 호출, UI 업데이트)

2. **`src/index.ts` 수정**
   - 플레이그라운드 라우트 추가
   - 미들웨어 순서 조정 (CORS 전에 라우트 추가)

3. **테스트**
   - 개발 서버 실행
   - 브라우저에서 http://localhost:3002 접속
   - 채팅 기능 테스트

## 주요 파일 목록

| 파일                       | 작업      | 설명                       |
| -------------------------- | --------- | -------------------------- |
| `src/routes/playground.ts` | 신규 생성 | 플레이그라운드 UI 핸들러   |
| `src/index.ts`             | 수정      | 플레이그라운드 라우트 추가 |

## 참고: 채팅 UI 기능

**기본 기능:**

- 메시지 전송 (Enter 키 또는 전송 버튼)
- 자동 스크롤 (최신 메시지로)
- 로딩 인디케이터 (응답 대기 중)
- 마크다운 렌더링 (marked.js CDN)
- 채팅 기록 저장 (localStorage)
- 기록 지우기 버튼

**소스 표시:**

- 검색된 문서 목록 표시
- 점수(관련성) 표시
- 문서 URL 클릭 가능
- 접기/펼치기 토글

**다크 모드:**

- 시스템 설정 자동 감지
- 토글 버튼으로 수동 전환
- 로컬 스토리지에 저장
