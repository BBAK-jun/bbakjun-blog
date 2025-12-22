# Blog-Admin 설정 가이드

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
3. [Vercel Blob Storage 설정](#vercel-blob-storage-설정)
4. [환경 변수 구성](#환경-변수-구성)
5. [개발 서버 실행](#개발-서버-실행)
6. [프로덕션 배포](#프로덕션-배포)
7. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 요구사항

- **Node.js**: v24 이상
- **pnpm**: v10.25.0 이상
- **Git**: v2.0 이상
- **Vercel 계정**: (프로덕션 배포 필요)

### 시스템 요구사항

- **디스크 공간**: 최소 2GB
- **메모리**: 최소 4GB (권장 8GB)
- **인터넷 연결**: 필수

### 권장 도구

- **Visual Studio Code**: 코드 편집기
- **Postman/Insomnia**: API 테스트 도구
- **GitHub CLI**: Git 작업 자동화

---

## 로컬 개발 환경 설정

### Step 1: 저장소 클론

```bash
git clone https://github.com/your-username/bbakjun-blog.git
cd bbakjun-blog
```

### Step 2: Node 버전 확인

blog-admin은 Node v24를 필요로 합니다. `.nvmrc` 파일로 관리됩니다:

```bash
# nvm 또는 fnm 사용
nvm use
# 또는
fnm use

# 현재 Node 버전 확인
node --version  # v24.x.x
```

### Step 3: 의존성 설치

pnpm을 사용하여 의존성을 설치합니다:

```bash
# 전체 모노레포 의존성 설치
pnpm install

# blog-admin만 설치 (필요시)
pnpm install --filter=blog-admin
```

**설치 확인**:

```bash
pnpm list @vercel/blob
```

---

## Vercel Blob Storage 설정

### Option 1: Vercel 대시보드 사용 (권장)

Vercel 프로젝트에서 자동으로 토큰을 생성할 수 있습니다:

#### 1.1 Vercel 대시보드 접속

[https://vercel.com/dashboard](https://vercel.com/dashboard) 에서 프로젝트 선택

#### 1.2 Storage 탭 이동

```
프로젝트 → Settings → Storage
```

#### 1.3 Blob Database 생성

- **"Create Database"** 클릭
- **"Blob"** 선택
- **"Continue"** 클릭

#### 1.4 `.env.local` 생성

Vercel이 자동으로 생성한 환경 변수를 복사:

```bash
# 대시보드에서 표시되는 텍스트 복사
# .env.local에 붙여넣기
```

자동 생성된 `.env.local`:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
```

### Option 2: 로컬에서 수동 설정

로컬 개발 환경에서만 사용할 경우:

#### 2.1 테스트용 토큰 생성

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬 토큰 생성
vercel env pull
```

#### 2.2 `.env.local` 생성

```bash
cat > .env.local << 'EOF'
BLOB_READ_WRITE_TOKEN=your-token-here
BACKOFFICE_API_KEY=your-secret-key
EOF
```

---

## 환경 변수 구성

### 필수 환경 변수

#### `BLOB_READ_WRITE_TOKEN`

**설명**: Vercel Blob Storage 읽기/쓰기 토큰

**형식**: `vercel_blob_rw_` 접두어 포함

**예시**:

```
vercel_blob_rw_1a2b3c4d5e6f7g8h9i0j...
```

**획득 방법**:

1. Vercel 대시보드 → Storage
2. Blob Database 생성
3. 자동 생성된 토큰 복사

#### `BACKOFFICE_API_KEY`

**설명**: API 인증용 Bearer Token

**권장사항**:

- 최소 32자 이상
- 특수문자, 숫자, 문자 혼합

**생성 예시**:

```bash
# openssl 사용
openssl rand -base64 32

# node 사용
require('crypto').randomBytes(32).toString('hex')
```

### 선택 환경 변수

#### `NODE_ENV`

**설명**: 실행 환경

**값**: `development` (기본값), `production`

```env
NODE_ENV=development
```

---

## 개발 서버 실행

### 1단계: 환경 변수 확인

```bash
# .env.local 파일 존재 확인
ls -la .env.local
```

### 2단계: 개발 서버 시작

**blog-admin만 실행**:

```bash
pnpm dev:admin
```

**blog + blog-admin 동시 실행**:

```bash
pnpm dev:all
```

**출력 예시**:

```
blog-admin:dev:    ▲ Next.js 16.0.8 (Turbopack)
blog-admin:dev:    - Local:         http://localhost:3001
blog-admin:dev:    - Environments:  .env.local
blog-admin:dev:
blog-admin:dev:  ✓ Ready in 682ms
```

### 3단계: 대시보드 접속

브라우저에서 열기:

```
http://localhost:3001/dashboard
```

로그인:

- API 키 입력 필드에 `BACKOFFICE_API_KEY` 값 입력
- "로그인" 클릭

---

## 프로덕션 배포

### 배포 전 체크리스트

- [ ] 모든 코드 변경사항 커밋
- [ ] 환경 변수 설정 완료
- [ ] 로컬 테스트 완료
- [ ] 빌드 성공 확인

### Vercel에 배포

#### 1단계: Vercel에 프로젝트 연결

```bash
vercel link
```

#### 2단계: 환경 변수 설정

Vercel 대시보드에서:

```
Settings → Environment Variables

추가:
- BLOB_READ_WRITE_TOKEN
- BACKOFFICE_API_KEY
```

#### 3단계: 빌드 및 배포

```bash
# 빌드 확인
pnpm build:admin

# 프로덕션 배포
vercel --prod
```

#### 4단계: 배포 확인

```bash
# 배포된 URL 확인
vercel ls

# 대시보드에서 배포 상태 확인
https://vercel.com/dashboard
```

### 배포 구성 (vercel.json)

프로젝트 루트의 `vercel.json`:

```json
{
  "buildCommand": "pnpm build:admin",
  "outputDirectory": "apps/blog-admin/.next",
  "rootDirectory": "apps/blog-admin"
}
```

---

## 문제 해결

### Node 버전 오류

**오류**: `Node version does not match`

**해결**:

```bash
# nvm으로 올바른 버전 설치
nvm install 24
nvm use 24

# 확인
node --version
```

### BLOB_READ_WRITE_TOKEN 관련 오류

**오류**: `BLOB_READ_WRITE_TOKEN is not set`

**해결**:

1. `.env.local` 파일 확인
2. Vercel 대시보드에서 토큰 확인
3. 토큰이 `vercel_blob_rw_`로 시작하는지 확인

```bash
# .env.local 파일 확인
cat .env.local

# 토큰 유효성 테스트
node -e "require('@vercel/blob').list().then(r => console.log('OK'))"
```

### 포트 충돌

**오류**: `Port 3001 is already in use`

**해결**:

```bash
# 포트 확인
lsof -i :3001

# 프로세스 종료
kill -9 <PID>

# 또는 다른 포트 사용
pnpm dev:admin -- -p 3002
```

### 빌드 실패

**오류**: `Build failed`

**해결**:

```bash
# 캐시 삭제
pnpm store prune
rm -rf .next
rm -rf apps/blog-admin/.next

# 의존성 재설치
pnpm install

# 빌드 재시도
pnpm build:admin
```

### 타입스크립트 오류

**오류**: `Type error`

**해결**:

```bash
# 타입 확인
pnpm type-check

# 타입 정의 재생성
pnpm install

# 빌드 재시도
pnpm build:admin
```

---

## 개발 워크플로우

### 1. 기능 개발

```bash
# 새 브랜치 생성
git checkout -b feature/my-feature

# 개발 서버 실행
pnpm dev:admin

# 파일 수정 및 테스트
```

### 2. API 테스트

```bash
# Postman 또는 cURL로 테스트
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@test.md" \
  -F "path=DEV/test"
```

### 3. 빌드 테스트

```bash
# 프로덕션 빌드 테스트
pnpm build:admin

# 빌드 결과 확인
ls -la apps/blog-admin/.next
```

### 4. 커밋 및 푸시

```bash
# 변경사항 스테이징
git add .

# 커밋
git commit -m "feat: add new feature"

# 푸시
git push origin feature/my-feature
```

### 5. Pull Request 생성

GitHub에서 Pull Request 생성 후 리뷰 대기

---

## 성능 최적화

### 빌드 시간 단축

```bash
# Turbo 캐시 사용
pnpm build:admin

# 캐시 상태 확인
turbo -vv build:admin
```

### 개발 환경 최적화

```bash
# 개발 서버 빠르게 시작
pnpm dev:admin

# hot reload 확인
# 파일 수정 후 자동 리로드됨
```

---

## 보안 체크리스트

- [ ] `BACKOFFICE_API_KEY` 환경 변수로만 관리
- [ ] `.env.local`을 `.gitignore`에 추가
- [ ] 프로덕션 토큰을 로컬에 저장하지 않음
- [ ] 정기적으로 API 키 변경
- [ ] HTTPS 사용 (프로덕션)
- [ ] 파일 업로드 크기 제한 준수 (10MB)

---

## 추가 리소스

- [Vercel Blob 문서](https://vercel.com/docs/storage/vercel-blob)
- [Next.js 문서](https://nextjs.org/docs)
- [pnpm 문서](https://pnpm.io)
- [TypeScript 문서](https://www.typescriptlang.org/docs)

---

**마지막 업데이트**: 2025-12-12
**버전**: 1.0.0
