# 블로그 백오피스 - 빠른 시작 가이드

## 30초 설정

```bash
# 1. 의존성 설치
pnpm install

# 2. Vercel Blob 토큰 설정
# Vercel 대시보드에서 Settings → Storage → Blob 생성 후 토큰 복사

# 3. .env.local 생성 (아래 내용)
cat > .env.local << 'ENV'
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
BACKOFFICE_API_KEY=your-secret-key
ENV

# 4. 개발 서버 실행
pnpm dev:admin
```

## 개발 명령어

| 명령어 | 설명 | 포트 |
|--------|------|------|
| `pnpm dev:blog` | blog만 실행 | 3000 |
| `pnpm dev:admin` | blog-admin만 실행 | 3001 |
| `pnpm dev:all` | blog + admin 동시 | 3000, 3001 |
| `pnpm build:blog` | blog 빌드 | - |
| `pnpm build:admin` | blog-admin 빌드 | - |
| `pnpm build` | 전체 빌드 | - |

## 디렉토리 구조

```
bbakjun-blog/
├── apps/
│   ├── blog/              (공개 블로그)
│   └── blog-admin/        (관리 대시보드) ← 여기서 작업
├── packages/              (공유 라이브러리)
├── BACKOFFICE_PLAN.md     (전체 기획)
├── BLOG_ADMIN_SETUP.md    (상세 설정)
└── QUICKSTART.md          (이 파일)
```

## 주요 파일

### blog-admin/src/lib/
- `auth.ts` - API 인증 (Bearer Token)
- `azure.ts` - Azure Blob Storage 클라이언트

### blog-admin/src/app/api/admin/
- `upload/route.ts` - 파일 업로드
- `files/route.ts` - 파일 목록 조회

### blog-admin/src/app/
- `dashboard/page.tsx` - 관리 대시보드 UI
- `layout.tsx` - 레이아웃

## API 테스트

### 파일 업로드
```bash
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer your-secret-key" \
  -F "file=@example.md" \
  -F "path=DEV/example" \
  -F "status=draft"
```

### 파일 목록
```bash
curl http://localhost:3001/api/admin/files?category=DEV \
  -H "Authorization: Bearer your-secret-key"
```

## 환경 변수

| 변수 | 설명 | 예시 |
|-----|------|------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 토큰 | `vercel_blob_rw_abc...` |
| `BACKOFFICE_API_KEY` | API 인증 토큰 | `secret-key-123` |

## 일반적인 문제

### "BLOB_READ_WRITE_TOKEN is not set"
→ Vercel Blob 토큰이 설정되지 않았습니다. `.env.local` 파일에 `BLOB_READ_WRITE_TOKEN`을 추가하세요.

### "PORT 3001 is already in use"
→ 포트가 이미 사용 중입니다. 다른 터미널이나 프로세스를 종료하세요.

### "Unauthorized" 에러
→ API 키가 잘못되었습니다. `BACKOFFICE_API_KEY` 값을 확인하세요.

## 배포 (Vercel)

1. GitHub에 push
2. Vercel 새 프로젝트 생성
3. 설정:
   - **Root Directory**: `apps/blog-admin`
   - **Build Command**: `pnpm build:admin`
   - **Start Command**: `pnpm start`
4. 환경 변수 추가

## 문서

- 📖 **BACKOFFICE_PLAN.md** - 전체 시스템 기획
- 📖 **BLOG_ADMIN_SETUP.md** - 상세 설정 가이드  
- 📖 **apps/blog-admin/README.md** - 프로젝트 문서

---

**팁**: `pnpm dev:all`로 blog와 blog-admin을 동시에 실행하세요!
