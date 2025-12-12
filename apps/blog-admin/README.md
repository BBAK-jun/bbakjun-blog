# Blog Admin Dashboard

독립적인 백오피스 시스템으로, Azure Blob Storage를 통해 마크다운 파일을 관리하고 업로드할 수 있는 관리 대시보드입니다.

## 개요

- **분리된 배포**: blog 앱과 독립적으로 배포 가능
- **보안 격리**: 별도의 인증 토큰으로 보호
- **Azure 통합**: Blob Storage에 직접 마크다운 파일 저장
- **버전 관리**: 파일 버전 관리 및 복원 기능

## 프로젝트 구조

```
apps/blog-admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── upload/route.ts      # 파일 업로드 API
│   │   │       ├── files/route.ts       # 파일 목록 조회 API
│   │   │       ├── history/route.ts     # 업로드 이력 API
│   │   │       └── restore/route.ts     # 버전 복원 API
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # 대시보드 메인 페이지
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── FileSelector.tsx             # 파일 선택 컴포넌트
│   │   ├── MarkdownPreview.tsx          # 미리보기 컴포넌트
│   │   ├── UploadQueue.tsx              # 업로드 대기열
│   │   └── UploadHistory.tsx            # 업로드 이력
│   └── lib/
│       ├── auth.ts                      # API Key 검증
│       └── azure.ts                     # Azure Blob Storage 클라이언트
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── postcss.config.mjs
```

## 시작하기

### 설치

```bash
# 루트 디렉토리에서
pnpm install

# blog-admin만 설치
pnpm install --filter=blog-admin
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# 백오피스 보안
BACKOFFICE_API_KEY=your-secret-api-key
```

**BLOB_READ_WRITE_TOKEN 획득**:
1. Vercel 프로젝트 대시보드 접속
2. Settings → Storage → Blob 생성
3. 자동 생성된 토큰을 .env.local에 복사

### 개발 서버 실행

```bash
# blog-admin만 실행 (포트 3001)
pnpm dev:admin

# blog와 blog-admin 동시 실행
pnpm dev:all

# 루트에서 모든 앱 실행
pnpm dev
```

### 빌드

```bash
# blog-admin만 빌드
pnpm build:admin

# 모든 앱 빌드
pnpm build
```

## API 엔드포인트

모든 API 요청에는 `Authorization: Bearer {BACKOFFICE_API_KEY}` 헤더가 필요합니다.

### POST /api/admin/upload

마크다운 파일을 Blob Storage에 업로드합니다.

**Request:**
```
multipart/form-data
- file: File (마크다운 파일, .md 또는 .mdx)
- path: string (저장 경로, 예: "DEV/my-post")
- tags: string (선택사항, 쉼표로 구분)
- status: "published" | "draft" (기본값: "draft")
```

**Response:**
```json
{
  "success": true,
  "fileId": "uuid",
  "version": 1,
  "message": "파일이 업로드되었습니다",
  "metadata": {
    "id": "uuid",
    "filename": "my-post.mdx",
    "path": "DEV/my-post",
    "size": 12345,
    "uploadedAt": "2025-12-12T10:00:00Z",
    "hash": "sha256:...",
    "tags": ["nextjs", "typescript"],
    "status": "draft"
  }
}
```

### GET /api/admin/files

파일 목록을 조회합니다.

**Query Parameters:**
- `category`: string (선택사항, 카테고리로 필터링)
- `limit`: number (기본값: 50)

**Response:**
```json
{
  "files": [
    {
      "filename": "my-post.mdx",
      "path": "DEV/my-post",
      "size": 12345,
      "uploadedAt": "2025-12-12T10:00:00Z",
      "version": 1,
      "status": "published"
    }
  ],
  "total": 5
}
```

### GET /api/admin/history

파일 업로드 이력을 조회합니다.

**Query Parameters:**
- `fileId`: string (파일 ID)

**Response:**
```json
{
  "fileId": "uuid",
  "filename": "my-post.mdx",
  "versions": [
    {
      "version": 2,
      "uploadedAt": "2025-12-12T11:00:00Z",
      "uploadedBy": "admin",
      "size": 12500
    },
    {
      "version": 1,
      "uploadedAt": "2025-12-12T10:00:00Z",
      "size": 12345
    }
  ]
}
```

### POST /api/admin/restore

파일을 특정 버전으로 복원합니다.

**Request:**
```json
{
  "fileId": "uuid",
  "targetVersion": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "v1로 복원되었습니다",
  "newVersion": 3
}
```

### DELETE /api/admin/file/:fileId

파일을 삭제합니다.

**Response:**
```json
{
  "success": true,
  "message": "파일이 삭제되었습니다"
}
```

## 공유 패키지 활용

blog-admin은 monorepo의 공유 패키지를 활용합니다:

- **@repo/content**: 마크다운 처리 (processMarkdown, getPosts)
- **@repo/analytics**: 뷰 트래킹 (ViewCounter)
- **@repo/types**: 공유 타입 정의
- **@repo/ui**: UI 컴포넌트 및 유틸리티

## 개발 단계

### Phase 1: 기초 구조 (진행 중)
- [x] Next.js 기본 설정
- [x] 기본 파일 선택 UI 구조
- [x] API Routes 스켈레톤
- [ ] 마크다운 미리보기 통합

### Phase 2: Blob Storage 연동
- [x] Azure SDK 설정
- [x] 파일 업로드 API
- [x] 메타데이터 저장
- [ ] 에러 처리 & 재시도 로직

### Phase 3: 버전 관리 & 이력
- [ ] 버전 관리 시스템
- [ ] 이력 조회 API
- [ ] 버전 복원 기능
- [ ] 이력 UI

### Phase 4: 보안 & 최적화
- [x] 인증 시스템
- [x] 파일 크기/유형 검증
- [ ] 접근 제어 강화
- [ ] 성능 최적화

### Phase 5: 배포 & 모니터링
- [ ] 프로덕션 환경 설정
- [ ] 로깅 & 모니터링
- [ ] 에러 트래킹
- [ ] 문서화

## 보안 고려사항

1. **API 인증**: 모든 API 요청은 Bearer Token으로 보호
2. **파일 검증**: .md, .mdx 파일만 허용, 10MB 크기 제한
3. **HTTPS 필수**: 프로덕션 환경에서는 HTTPS만 사용
4. **환경 변수**: API Key는 환경 변수에 저장
5. **접근 제어**: IP 화이트리스트 설정 권장

## 배포

### Vercel 배포

1. GitHub에 코드 푸시
2. Vercel에서 새 프로젝트 생성
3. Root Directory: `apps/blog-admin`
4. Build Command: `pnpm build:admin`
5. Start Command: `pnpm start`
6. 환경 변수 설정

## 트러블슈팅

### Azure 연결 오류

```
Error: Azure Storage configuration is missing
```

→ 환경 변수가 올바르게 설정되었는지 확인하세요.

### 파일 업로드 실패

```
Error: FILE_TOO_LARGE
```

→ 파일 크기가 10MB를 초과했습니다. 파일을 분할하거나 압축하세요.

## 라이선스

MIT
