# Blog-Admin 아키텍처

## 개요

Blog-Admin은 마크다운 파일을 관리하기 위한 독립적인 Next.js 애플리케이션입니다. Vercel Blob Storage를 활용하여 파일을 저장하고 관리합니다.

---

## 시스템 아키텍처

### 전체 구조

```
┌──────────────────────────────────────────────────────────┐
│              Monorepo (pnpm workspaces)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  apps/blog          (포트 3000 - 공개 블로그)            │
│  ├─ /blog/*         (포스트 페이지)                      │
│  ├─ /api/views      (뷰 카운팅 API)                      │
│  └─ /api/og         (OG 이미지 생성)                     │
│                                                          │
│  apps/blog-admin    (포트 3001 - 관리 대시보드) ← 이곳  │
│  ├─ /dashboard      (마크다운 관리 UI)                   │
│  └─ /api/admin/*    (어드민 API 엔드포인트)             │
│      ├─ /upload     (파일 업로드)                        │
│      └─ /files      (파일 목록)                          │
│                                                          │
│  packages/                 (공유 패키지)                 │
│  ├─ @repo/analytics        (Redis 뷰 트래킹)             │
│  ├─ @repo/content          (MDX 처리)                    │
│  ├─ @repo/types            (공유 타입)                   │
│  ├─ @repo/ui               (UI 컴포넌트)                 │
│  └─ @repo/config           (공유 설정)                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
              ↓ @vercel/blob SDK (blog-admin만)
        ┌─────────────────────────────────┐
        │   Vercel Blob Storage           │
        ├─────────────────────────────────┤
        │  DEV/                           │
        │  ├─ my-post.mdx                 │
        │  └─ .metadata.json              │
        │                                 │
        │  REACT/                         │
        │  ├─ another-post.mdx            │
        │  └─ .metadata.json              │
        └─────────────────────────────────┘
```

---

## 디렉토리 구조

### Blog-Admin 프로젝트 구조

```
apps/blog-admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── files/route.ts        # GET: 파일 목록
│   │   │       └── upload/route.ts       # POST: 파일 업로드
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # 관리자 대시보드
│   │   ├── layout.tsx                    # 루트 레이아웃
│   │   ├── page.tsx                      # 리다이렉트 페이지
│   │   └── globals.css                   # 글로벌 스타일
│   ├── components/                       # UI 컴포넌트 (추후 확장)
│   └── lib/
│       ├── auth.ts                       # API 인증 로직
│       └── blob.ts                       # Vercel Blob 유틸리티
├── docs/
│   ├── API.md                           # API 문서
│   ├── SETUP.md                         # 설정 가이드
│   └── ARCHITECTURE.md                  # 이 파일
├── public/                              # 정적 자산
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 핵심 모듈

### 1. 인증 (src/lib/auth.ts)

**책임**: API 요청 인증

**주요 함수**:
```typescript
// 비동기 인증 (Request 헤더 확인)
verifyApiKey(): Promise<boolean>

// 동기식 인증 (토큰 값 직접 검증)
verifyApiKeySync(token: string): boolean
```

**동작**:
1. 요청 헤더에서 `Authorization` 헤더 추출
2. `Bearer ` 접두어 제거
3. 토큰과 `BACKOFFICE_API_KEY` 환경 변수 비교
4. 일치 여부 반환

**특징**:
- 런타임에만 환경 변수 접근 (빌드 타임 에러 방지)
- 에러 핸들링으로 안전한 실패

---

### 2. Blob Storage (src/lib/blob.ts)

**책임**: Vercel Blob Storage와의 상호작용

**주요 함수**:

#### `uploadBlob(path, content, contentType)`
- 파일을 Blob Storage에 업로드
- SHA256 해시 자동 생성
- 메타데이터 함께 저장

**예시**:
```typescript
const result = await uploadBlob(
  'DEV/my-post.mdx',
  fileContent,
  'text/markdown'
);
// { url, pathname, hash }
```

#### `listBlobs(prefix?)`
- 주어진 prefix 하의 모든 파일 나열
- 카테고리 필터링 지원

**예시**:
```typescript
const files = await listBlobs('DEV/');
// [{ filename, pathname, size, uploadedAt, url }, ...]
```

#### `downloadBlob(path)`
- Blob에서 파일 다운로드
- Buffer 형식으로 반환

#### `deleteBlob(path)`
- Blob에서 파일 삭제

#### `getBlobMetadata(path)`
- 파일 메타데이터 조회
- 존재하지 않으면 null 반환

---

### 3. API Routes

#### Upload 엔드포인트 (POST /api/admin/upload)

**요청 처리 흐름**:
```
1. 인증 확인 (verifyApiKey)
   ↓
2. FormData 파싱 (file, path, tags, status)
   ↓
3. 파일 검증
   - 형식: .md/.mdx 만 허용
   - 크기: 10MB 제한
   ↓
4. Buffer로 변환
   ↓
5. uploadBlob() 호출
   - SHA256 해시 생성
   - Vercel Blob에 저장
   ↓
6. 메타데이터 생성 및 저장
   ↓
7. 응답 반환
```

**에러 처리**:
- 400: 파일 형식/크기 오류
- 401: 인증 실패
- 500: 서버 에러

---

#### Files 엔드포인트 (GET /api/admin/files)

**요청 처리 흐름**:
```
1. 인증 확인 (verifyApiKey)
   ↓
2. Query Parameters 파싱 (category, limit)
   ↓
3. listBlobs(prefix) 호출
   ↓
4. 메타데이터 파일 제외
   - .metadata.json 무시
   - .versions/ 경로 무시
   ↓
5. 파일 타입 필터링 (.md/.mdx 만)
   ↓
6. limit 만큼 결과 반환
   ↓
7. JSON 응답
```

---

## 데이터 흐름

### 파일 업로드 흐름

```
클라이언트 (Dashboard)
    ↓
    [파일 선택]
    ↓
FormData 생성
    ↓
POST /api/admin/upload
    ↓
    서버 (Next.js API Route)
    ├─ 인증 확인
    ├─ 파일 검증
    ├─ SHA256 해시 생성
    └─ uploadBlob() 호출
         ↓
       Vercel Blob Storage
         │
         ├─ DEV/my-post.mdx (파일)
         └─ DEV/my-post/.metadata.json (메타데이터)
    ↓
응답 (JSON)
    ↓
클라이언트 (메시지 표시)
```

### 파일 목록 조회 흐름

```
클라이언트 (Dashboard)
    ↓
GET /api/admin/files?category=DEV
    ↓
    서버 (Next.js API Route)
    ├─ 인증 확인
    ├─ listBlobs('DEV/') 호출
    │   ↓
    │ Vercel Blob Storage
    │   (모든 파일 나열)
    ├─ 메타데이터 파일 제외
    ├─ 카테고리 필터
    └─ limit 적용
    ↓
응답 (JSON)
    ↓
클라이언트 (목록 표시)
```

---

## 환경 변수 관리

### 런타임 초기화 패턴

**문제**: 빌드 타임에 환경 변수를 접근하면 개발 환경에서 오류 발생

**해결**: 함수 내부에서 런타임에 환경 변수 접근

```typescript
// ❌ 잘못된 방식 (빌드 타임 실패)
const API_KEY = process.env.BACKOFFICE_API_KEY;
export function verify() { return token === API_KEY; }

// ✅ 올바른 방식 (런타임 실패)
function getApiKey() {
  const key = process.env.BACKOFFICE_API_KEY;
  if (!key) throw new Error('API_KEY not set');
  return key;
}
export function verify() { return token === getApiKey(); }
```

---

## 보안 고려사항

### 1. API 인증

- **Bearer Token 사용**: 간단하면서도 효과적
- **환경 변수**: 소스 코드에 노출 방지
- **HTTPS**: 프로덕션에서 필수

### 2. 파일 검증

```typescript
// 파일 형식 검증
if (!file.name.endsWith('.md') && !file.name.endsWith('.mdx')) {
  throw new Error('Invalid file type');
}

// 파일 크기 검증
if (file.size > 10 * 1024 * 1024) {
  throw new Error('File too large');
}
```

### 3. 해시 기반 무결성 확인

```typescript
const hash = createHash('sha256').update(buffer).digest('hex');
// 파일이 손상되지 않았음을 확인
```

---

## 성능 최적화

### 1. Turbopack 사용

Next.js 16에서 Turbopack을 기본으로 사용하여 빌드 속도 향상:
```
기존: ~2-3초
Turbopack: ~1초
```

### 2. Streaming Response

파일 업로드 시 streaming 지원:
```typescript
const buffer = Buffer.from(await file.arrayBuffer());
// 메모리 효율적인 처리
```

### 3. 메타데이터 캐싱

향후 구현 예정:
- 파일 목록 캐싱
- 메타데이터 로컬 캐시

---

## 향후 확장 계획

### Phase 2: 파일 관리 기능

- [ ] 파일 삭제 (DELETE /api/admin/file/:id)
- [ ] 파일 수정 (PATCH /api/admin/file/:id)
- [ ] 파일 상세 조회 (GET /api/admin/file/:id)

### Phase 3: 버전 관리

- [ ] 버전 관리 시스템
- [ ] 이력 조회 API
- [ ] 버전 복원 기능

### Phase 4: 고급 기능

- [ ] 전문 검색 (Full-text Search)
- [ ] 태그 관리
- [ ] 자동 배포 (CI/CD 연동)

---

## 배포 아키텍처

### 개발 환경 (로컬)

```
http://localhost:3001
    ↓
Next.js Dev Server (Turbopack)
    ├─ Hot Module Replacement 지원
    └─ Vercel Blob Storage 연결
```

### 프로덕션 환경 (Vercel)

```
https://your-domain.com
    ↓
Vercel Edge Network
    ├─ CDN (캐싱)
    ├─ Next.js Serverless Functions
    │   ├─ POST /api/admin/upload
    │   └─ GET /api/admin/files
    └─ Vercel Blob Storage
        └─ 글로벌 분산 저장
```

---

## 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| **런타임** | Node.js | 24 |
| **프레임워크** | Next.js | 16.0.8 |
| **UI 라이브러리** | React | 19.2.1 |
| **스토리지** | Vercel Blob | 0.23.4 |
| **스타일링** | Tailwind CSS | 4 |
| **패키지 관리** | pnpm | 10.25.0 |
| **빌드 도구** | Turbopack | - |
| **타입스크립트** | TypeScript | 5 |
| **린터** | ESLint | 9 |

---

## 주요 의사결정

### 1. 별도 애플리케이션 (vs 모듈)

**선택**: 별도 Next.js 앱
**이유**:
- 배포 독립성
- 보안 격리
- 개발 속도 향상
- 리소스 최적화

### 2. Vercel Blob (vs Azure)

**선택**: Vercel Blob
**이유**:
- Vercel과 기본 통합
- 자동 토큰 관리
- 글로벌 CDN 포함
- 간단한 API

### 3. Bearer Token (vs OAuth)

**선택**: Bearer Token
**이유**:
- 구현 단순성
- 현재 요구사항 충분
- OAuth는 향후 추가 가능

---

## 모니터링 및 로깅

### 현재 구현

- 콘솔 로그 (개발용)
- 에러 응답 (사용자용)

### 향후 계획

- [ ] Vercel Analytics 통합
- [ ] 에러 트래킹 (Sentry)
- [ ] 성능 모니터링
- [ ] 접근 로깅

---

## 문서

- `API.md` - API 엔드포인트 상세 문서
- `SETUP.md` - 개발 환경 설정 가이드
- `ARCHITECTURE.md` - 이 파일 (아키텍처 설명)

---

**마지막 업데이트**: 2025-12-12
**버전**: 1.0.0
