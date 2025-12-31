# RAG 통합 시스템 (RAG Integration System)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: 블로그 콘텐츠 지능형 검색, RAG Gateway 연동
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2025-12-31
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/rag-integration.md`: ✅ Verified
  - `../../facts/apps/rag-gateway/index.md`: ✅ Verified
- **Spec Status**: As-Is (모든 사실 검증됨)

## Based on

- Facts: [RAG Integration](../../facts/apps/blog-admin/features/rag-integration.md)
- Facts: [RAG Gateway](../../facts/apps/rag-gateway/index.md)
- Insights: [RAG Business Context](../../insights/apps/blog-admin/exec/rag-business-context.md)

---

## 개요 (Overview)

### 목적 (Purpose)

블로그 관리자가 자신의 콘텐츠를 의미론적 검색으로 빠르게 찾고, LLM을 통해 질문에 답변받을 수 있는 지능형 검색 시스템을 제공합니다. 콘텐츠 재발견, 블로그 분석, 새 포스트 아이디어 발굴 등 다양한 용도로 활용 가능합니다.

### 범위 (Scope)

**In Scope**:
- 채팅형 UI (대화형 질문/답변)
- RAG 쿼리 (LLM 기반 답변 생성)
- 벡터 검색 (문서 검색만)
- 헬스 체크 (RAG Gateway 상태)
- Temperature/limit 파라미터 조절
- 소스 문서 표시 (출처 포스트)

**Out of Scope**:
- 방문자용 공개 챗봇 (현재 관리자 전용)
- 스트리밍 응답 (현재 일반 요청)
- 채팅 히스토리 저장
- 프롬프트 템플릿
- 피드백 시스템 (좋아요/싫어요)
- 멀티모달 (이미지 검색)

### 비즈니스 가치 (Business Value)

- **콘텐츠 재발견**: 과거 포스트 쉽게 찾기, 키워드보다 의미 검색 우수
- **생산성 향상**: 관련 포스트 빠르게 찾아 새 포스트 작성에 활용
- **블로그 분석**: 주요 주제 파악, 콘텐츠 갭 발견
- **아이디어 발굴**: 관련 주제 그룹화, 연재 시리즈 발견

---

## 핵심 기능 (Core Features)

### 1. RAG 쿼리 (RAG Query)

**기능**: LLM 기반 질문 답변

**세부 동작**:
- **입력**: 질문 텍스트 (query)
- **파라미터**:
  - `temperature`: 0-2 (기본 0.7, 높을수록 창의적)
  - `limit`: 1-20 (기본 5, 검색 문서 수)
  - `includeSources`: true/false (기본 true)
- **출력**:
  - `answer`: LLM 생성 답변 (Markdown)
  - `sources`: 관련 포스트 리스트 (id, title, slug, score, content)
  - `queryTime`: 쿼리 시간 (ms)

**Server Action**: `ragQuery(input)`
- Zod validation
- API Key 헤더 포함 (`X-RAG-API-Key`)
- 에러 처리 + Toast

### 2. 벡터 검색 (Vector Search)

**기능**: LLM 미사용 문서 검색만

**세부 동작**:
- 입력/파라미터: RAG 쿼리와 동일
- 출력: 벡터 유사도 기반 문서 리스트
- 용도: 관련 문서 빠르게 찾기

**Server Action**: `ragSearch(input)`

### 3. 헬스 체크 (Health Check)

**기능**: RAG Gateway 연결 상태 확인

**세부 동작**:
- 출력: `{ status: 'ok', version: string }`
- 용도: 연결 문제 트러블슈팅

**Server Action**: `ragHealth()`

### 4. 채팅 UI (Chat Interface)

**기능**: 대화형 질문/답변 인터페이스

**세부 동작**:
- 메시지 히스토리 (state)
- Markdown 렌더링 (ReactMarkdown)
- 소스 문서 표시 (클릭 시 포스트로 이동)
- Temperature/limit 슬라이더 조절
- 로딩 상태
- 에러 처리

**컴포넌트**:
- `/dashboard/rag/page.tsx`
- Client Component
- `react-hook-form` + Zod

---

## 기술 사양 (Technical Specifications)

### 아키텍처 (Architecture)

```
Blog-Admin UI (/dashboard/rag)
    ↓ (Server Actions: ragQuery, ragSearch, ragHealth)
RAG Gateway (Hono API)
    ↓
QueryProcessor
    ↓
{ Qdrant (Vector DB), Embedding Service, LLM }
```

### 의존성 (Dependencies)

**Backend**:
- `hono/client`: Type-safe RPC client
- `@apps/rag-gateway`: RAG Gateway app type
- `zod`: Schema validation

**Frontend**:
- `react-hook-form`: Form state
- `@hookform/resolvers`: Zod integration
- `react-markdown`: Markdown rendering
- `@repo/ui`: UI components
- `lucide-react`: Icons
- `sonner`: Toast notifications

**External**:
- RAG Gateway: Hono app (별도 배포)
- Qdrant: Vector DB
- OpenAI API: GPT-4o-mini (LLM)

### 환경 변수 (Environment Variables)

| 변수 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `RAG_GATEWAY_API_KEY` | String | Yes | RAG Gateway 인증 키 |
| `NEXT_PUBLIC_RAG_GATEWAY_URL` | URL | No | RAG Gateway URL (기본: localhost:3002) |

### 구현 접근 (Implementation Approach)

**Server Actions**:
- `'use server'` 지시어
- API Key 보호 (서버에서만 사용)
- Zod validation
- 에러 핸들링

**Hono RPC Client**:
- `hc<RagGatewayApp>(url)` 생성
- 타입 세이프 메서드 호출
- 에러 response 처리

**UI**:
- Client Component
- Form state: `react-hook-form`
- Message list: state

---

## 데이터 구조 (Data Structure)

### Request Schema

```typescript
const RAGQuerySchema = z.object({
  query: z.string().min(1), // 질문 텍스트
  temperature: z.number().min(0).max(2).default(0.7),
  limit: z.number().min(1).max(20).default(5),
  includeSources: z.boolean().default(true),
  collectionName: z.string().optional(),
});
```

### Response Schema

```typescript
// RAG Query
{
  success: true;
  data: {
    answer: string; // Markdown
    sources: Array<{
      id: string;
      title: string;
      slug: string;
      score: number;
      content: string;
    }>;
    queryTime: number; // ms
  };
}

// Vector Search
{
  success: true;
  data: {
    results: Array<{ ... }>;
  };
}

// Health
{
  success: true;
  data: {
    status: 'ok';
    version: string;
  };
}
```

### Message Interface

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    title: string;
    slug: string;
    score: number;
  }>;
  timestamp: Date;
  queryTime?: number;
}
```

---

## API 명세 (API Specifications)

### Server Actions

| Action | Input | Output | Auth |
|--------|-------|--------|------|
| `ragQuery(input)` | `RAGQuerySchema` | `{ success: true, data: { answer, sources, queryTime } }` | API Key |
| `ragSearch(input)` | `RAGQuerySchema` | `{ success: true, data: { results } }` | API Key |
| `ragHealth()` | - | `{ success: true, data: { status, version } }` | - |

### RAG Gateway Endpoints (Proxy)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/rag/query` | POST | API Key | RAG 쿼리 (LLM) |
| `/api/rag/search` | POST | API Key | 벡터 검색만 |
| `/api/rag/health` | GET | - | 헬스 체크 |

---

## 사용자 시나리오 (User Scenarios)

### 성공 시나리오

**시나리오 1: 관련 포스트 찾기**
1. 관리자가 `/dashboard/rag` 접속
2. 질문 입력: "React Server Components에 대해 쓴 포스트는?"
3. `ragQuery()` Server Action 호출
4. RAG Gateway 처리:
   - Qdrant 벡터 검색
   - OpenAI LLM 답변 생성
5. 답변 표시:
   - "RSC 도입기" (score: 0.92)
   - "Next.js 14 변경사항" (score: 0.87)
   - ...
6. 소스 클릭 → 포스트로 이동

**시나리오 2: 콘텐츠 갭 분석**
1. 질문: "TypeScript 타입 추적에 대해 다룬 포스트 있어?"
2. 1개 결과만 반환
3. 관리자: "1개뿐이네. 더 작성 필요"

**시나리오 3: Temperature 조절**
1. 기본 temperature 0.7로 질문
2. 답변이 너무 보수적
3. Temperature 1.2로 조절
4. 더 창의적인 답변 생성

### 실패 시나리오

**시나리오 1: RAG Gateway 장애**
- RAG Gateway 다운 → 에러 메시지 + Toast
- 관리자는 헬스 체크로 장애 확인

**시나리오 2: API Key 실패**
- 401 Unauthorized → "인증 실패"

**시나리오 3: 질문 없음**
- 빈 쿼리 → Zod error + Toast

---

## 제약사항 및 고려사항 (Constraints and Considerations)

### 보안 (Security)

- **API Key 보호**: Server Action에서만 사용
- **인증**: 현재 공개 접근 (관리자 전용 필요)
- **Rate Limiting**: RAG Gateway에서 처리

### 성능 (Performance)

- **쿼리 시간**: 2-5초 (벡터 검색 + LLM)
- **벡터 검색**: 100-500ms (Qdrant)
- **LLM 생성**: 1-4초 (OpenAI)
- **캐싱**: 현재 없음 (추후 고려)

### 데이터 품질 (Data Quality)

- **벡터화 품질**: Embedding 모델 의존
- **LLM hallucination**: 소스 투명성으로 완화
- **언어**: 한글/영어 지원 (Embedding 모델 따름)

### 운영 (Operational)

- **RAG Gateway 장애**: 블로그 검색 불가 (영향 낮음)
- **Qdrant 다운**: 벡터 검색 불가
- **OpenAI API 장애**: LLM 답변 불가 (벡터 검색만 가능)

### 배포 (Deployment)

- **RAG Gateway**: 별도 배포 (Render/별도 서버)
- **Qdrant**: 별도 호스팅 필요
- **환경 변수**: `RAG_GATEWAY_API_KEY` 설정 필수

### 롤백 (Rollback)

- **문제 발생 시**: RAG 기능만 비활성화
- **영향 범위**: 관리자 콘텐츠 검색만
- **대안**: 키워드 검색 (기존 방식)

---

## 향후 확장 가능성 (Future Expansion)

### Phase 2 (1-2 months)

1. **스트리밍 응답**
   - Server-Sent Events
   - 실시간 답변 생성 표시

2. **채팅 히스토리**
   - DB 저장
   - 대화 맥락 유지
   - 재검색 기능

3. **프롬프트 템플릿**
   - 자주 쓰는 쿼리 저장
   - 빠른 검색 지원

### Phase 3 (3+ months)

1. **공개 챗봇**
   - 방문자용 블로그 검색
   - "이 블로그에서 OOO에 대해 알려줘"
   - Rate limiting 강화

2. **멀티모달**
   - 이미지 검색 (다이어그램, 스크린샷)
   - 코드 스니펫 검색

3. **피드백 시스템**
   - 답변 품질 피드백 (좋아요/싫어요)
   - 검색 결과 개선

4. **관리자 인증**
   - 세션 기반 접근 제어
   - 사용자별 쿼리 로그

---

## 추가로 필요 정보 (Needed Data/Decisions)

### TBD Items

1. **관리자 인증**
   - 현재 공개 접근
   - 세션 기반 접근 제어 필요 여부

2. **채팅 히스토리**
   - 저장 여부
   - 보관 기간
   - DB 스키마

3. **피드백 시스템**
   - 좋아요/싫어요 필요 여부
   - 익명 사용자 식별

4. **공개 챗봇**
   - 방문자에게 공개할지
   - Rate limiting 정책
   - 비용 부담

### Data Needed

1. **사용자 피드백**
   - RAG 검색 품질
   - UI/UX 개선점
   - 자주 묻는 질문 유형

2. **Analytics**
   - 쿼리 패턴
   - 답변 관련성
   - 사용 빈도
   - 비용 분석

3. **LLM 벤치마크**
   - GPT-4o-mini vs GLM-4.6 품질 비교
   - 비용 대비 효율
   - 한글 답변 품질

---

## 비용 분석 (Cost Analysis)

### 현재 비용 (월별 추정)

- **관리자 1인, 일 10회 쿼리**:
  - 월 300회 쿼리
  - LLM 비용: ~$0.5 (GPT-4o-mini)
  - Qdrant: 무료 tier
  - RAG Gateway 호스팅: $5-10 (Render)
  - **총계**: ~$10/월

### 공개 시 비용 (추정)

- **일 100회 쿼리**:
  - 월 3,000회 쿼리
  - LLM 비용: ~$5-10
  - Qdrant: 유료 tier 필요 ($20+)
  - **총계**: ~$30-40/월

### 최적화 방안

1. **캐싱**: 자주 묻는 질문 캐시
2. **벡터 검색 우선**: LLM 사용 안 하고 검색만
3. **저렴한 모델**: GLM-4.6 (중국어 최적화)
4. **Rate Limiting**: 남용 방지
