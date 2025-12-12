# Blog-Admin 프로젝트 설정 완료

## 프로젝트 구조

별도의 **blog-admin** 애플리케이션이 생성되었으며, 다음과 같은 이점을 제공합니다:

### ✅ 완료된 작업

#### 1. 애플리케이션 생성
```
apps/blog-admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── upload/route.ts       # ✅ 파일 업로드 API
│   │   │       └── files/route.ts        # ✅ 파일 목록 조회 API
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # ✅ 대시보드 UI
│   │   ├── layout.tsx                    # ✅ 레이아웃
│   │   ├── page.tsx                      # ✅ 리다이렉트
│   │   └── globals.css                   # ✅ 글로벌 스타일
│   ├── components/                       # 준비된 위치
│   └── lib/
│       ├── auth.ts                       # ✅ API 키 검증
│       └── azure.ts                      # ✅ Azure Blob Storage 클라이언트
├── package.json                          # ✅ 의존성 정의
├── tsconfig.json                         # ✅ TypeScript 설정
├── next.config.ts                        # ✅ Next.js 설정
├── tailwind.config.ts                    # ✅ Tailwind 설정
├── postcss.config.mjs                    # ✅ PostCSS 설정
├── .eslintrc.json                        # ✅ ESLint 설정
├── .gitignore                            # ✅ Git 무시 설정
└── README.md                             # ✅ 프로젝트 문서
```

#### 2. 루트 패키지 업데이트
```json
// root package.json에 추가된 스크립트
"dev:admin": "turbo run dev --filter=blog-admin",
"dev:all": "turbo run dev --filter=blog --filter=blog-admin",
"build:admin": "turbo run build --filter=blog-admin"
```

#### 3. 구현된 기능

##### API 엔드포인트
- ✅ `POST /api/admin/upload` - 파일 업로드
  - 파일 유형 검증 (.md, .mdx만 허용)
  - 크기 검증 (10MB 제한)
  - 해시 생성 및 메타데이터 저장
  - Bearer Token 인증

- ✅ `GET /api/admin/files` - 파일 목록 조회
  - 카테고리 필터링 지원
  - 페이지네이션 지원

##### 인증 & 보안
- ✅ Bearer Token 기반 API 인증
- ✅ 파일 타입 검증 (.md, .mdx)
- ✅ 파일 크기 제한 (10MB)
- ✅ 환경 변수로 보안 관리

##### UI 컴포넌트
- ✅ 로그인 페이지 (API 키 입력)
- ✅ 대시보드 기본 레이아웃
- ✅ 탭 기반 네비게이션 (업로드, 파일관리, 이력)
- ✅ 다크모드 지원

#### 4. Vercel Blob Storage 통합
- ✅ @vercel/blob SDK 통합
- ✅ 파일 업로드 유틸리티
- ✅ 파일 다운로드 유틸리티
- ✅ 파일 삭제 유틸리티
- ✅ 목록 조회 유틸리티

## 설정 방법

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수 설정

먼저 Vercel 프로젝트에서 Blob Storage 생성:
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 → Settings → Storage
3. Create Database → Blob 선택
4. 생성된 `.env.local` 내용 복사

또는 수동으로 `.env.local` 파일을 생성하고 다음을 추가하세요:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Backoffice 보안
BACKOFFICE_API_KEY=your-secret-api-key
```

### 3. 개발 서버 실행

**blog-admin만 실행 (포트 3001):**
```bash
pnpm dev:admin
```

**blog와 blog-admin 동시 실행:**
```bash
pnpm dev:all
```

**모든 앱 실행:**
```bash
pnpm dev
```

### 4. 빌드
```bash
pnpm build:admin
```

## 아키텍처 장점

### 1. 배포 독립성
- blog와 blog-admin을 각각 배포 가능
- 관리자 UI 변경이 공개 블로그에 영향 없음
- 각 앱별로 다른 버전관리 가능

### 2. 보안 격리
- 관리자 대시보드에 별도 인증 적용
- API 엔드포인트도 별도 보안
- 공개 블로그와 완전히 분리

### 3. 개발 속도
- blog-admin 개발 시 blog 빌드 필요 없음
- 독립적인 개발 사이클
- Turbo의 캐싱으로 빌드 최적화

### 4. 스케일링
- 공개 블로그 트래픽과 독립적
- 관리자 UI는 필요시에만 배포
- 리소스 사용 최적화

## 공유 패키지 활용

blog-admin은 모놀로그의 공유 패키지를 활용합니다:

```
@repo/analytics  - Redis 뷰 트래킹 (필요시)
@repo/content    - MDX 처리, 마크다운 렌더링
@repo/types      - 공유 타입 정의
@repo/ui         - UI 컴포넌트 라이브러리
@repo/config     - 공유 설정
```

## 다음 단계

### Phase 1: 기초 구조 (현재 ✅ 완료)
- [x] Next.js 기본 설정
- [x] 파일 선택 UI 구조
- [x] API Routes 스켈레톤
- [x] 마크다운 미리보기 통합 준비

### Phase 2: Blob Storage 연동
- [x] Azure SDK 설정
- [x] 파일 업로드 API
- [ ] 메타데이터 저장 개선
- [ ] 에러 처리 강화

### Phase 3: 버전 관리 & 이력
- [ ] 이력 조회 API 구현
- [ ] 버전 복원 API 구현
- [ ] 이력 UI 구현

### Phase 4: 보안 & 최적화
- [ ] 접근 제어 강화
- [ ] 성능 최적화
- [ ] 로깅 추가

### Phase 5: 배포 & 모니터링
- [ ] Vercel 배포 설정
- [ ] 모니터링 설정
- [ ] 에러 트래킹

## 주요 파일 설명

### `src/lib/auth.ts`
API 요청 인증 담당. Bearer Token 검증 로직 포함.

**사용:**
```typescript
import { verifyApiKey } from "@/lib/auth";

const isAuthorized = await verifyApiKey();
```

### `src/lib/azure.ts`
Azure Blob Storage 클라이언트. 파일 업로드/다운로드/삭제 기능.

**사용:**
```typescript
import { uploadBlob, downloadBlob, deleteBlob, listBlobs } from "@/lib/azure";

await uploadBlob("path/to/file.mdx", fileContent, "text/markdown");
```

### `src/app/api/admin/upload/route.ts`
마크다운 파일 업로드 엔드포인트.

**사용:**
```bash
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@file.md" \
  -F "path=DEV/my-post" \
  -F "status=draft"
```

## 배포 (Vercel)

1. GitHub에 코드 푸시
2. Vercel에서 새 프로젝트 생성
3. **Root Directory**: `apps/blog-admin`
4. **Build Command**: `pnpm build:admin`
5. **Start Command**: `pnpm start`
6. 환경 변수 설정

## 문서

- `BACKOFFICE_PLAN.md` - 전체 기획 문서 (업데이트됨)
- `apps/blog-admin/README.md` - blog-admin 프로젝트 문서

---

**생성일**: 2025-12-12
**상태**: 기초 구조 완성, Phase 2 준비 중
