# 블로그 관리자 인증 시스템

## 개요

블로그 관리자 앱은 JWT 기반의 안전한 인증 시스템을 사용합니다.

## 인증 방식

### 1. JWT 기반 세션 (권장)

사용자 이름과 비밀번호를 사용한 로그인 방식입니다.

**특징:**

- bcrypt를 사용한 안전한 비밀번호 해싱
- JWT 토큰 기반 세션 관리
- HttpOnly 쿠키로 토큰 저장 (XSS 방지)
- 7일간 유효한 세션
- Next.js 16 Proxy에서 자동 인증 검증

**기본 관리자 계정 (개발 환경):**

- 사용자명: `admin`
- 비밀번호: `admin123`
- 이메일: `admin@bbakjun.com`

### 2. API 키 인증 (레거시, 스크립트용)

마이그레이션 스크립트나 외부 도구에서 사용하는 Bearer 토큰 방식입니다.

**사용 예:**

```bash
curl -X POST http://localhost:3001/api/admin/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@post.mdx" \
  -F "path=posts/my-post"
```

## 환경 변수

### 필수 설정

```bash
# JWT 시크릿 키 (openssl rand -base64 32로 생성)
JWT_SECRET=your_jwt_secret_here

# 기본 관리자 계정 (개발 환경)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
ADMIN_EMAIL=admin@example.com

# 레거시 API 키 (스크립트용)
BACKOFFICE_API_KEY=your_api_key_here
```

### JWT_SECRET 생성

```bash
openssl rand -base64 32
```

## 아키텍처

### 파일 구조

```
apps/blog-admin/src/shared/
├── types/
│   └── user.ts              # 사용자 타입 정의
├── lib/
│   └── auth/
│       ├── session.ts       # JWT 세션 관리
│       ├── password.ts      # 비밀번호 해싱
│       ├── users.ts         # 사용자 저장소
│       ├── auth.ts          # 레거시 API 키 인증
│       ├── auth-server.ts   # 레거시 서버 인증
│       └── index.ts         # 통합 export
└── ...

apps/blog-admin/
├── proxy.ts                 # Next.js 16 Proxy (JWT 검증)
└── src/app/
    └── dashboard/
        ├── page.tsx         # 로그인 페이지
        ├── login-form.tsx   # 로그인 폼
        └── actions.ts       # 로그인/로그아웃 액션
```

### 데이터 흐름

```
1. 사용자 로그인 시도
   ↓
2. login() 액션: 사용자명/비밀번호 검증
   ↓
3. JWT 토큰 생성 및 HttpOnly 쿠키 저장
   ↓
4. /dashboard/upload로 리다이렉트
   ↓
5. Proxy: /dashboard를 제외한 모든 경로에서 JWT 검증
   ↓
6. 인증 성공 시 요청 헤더에 사용자 정보 추가
```

## 주요 컴포넌트

### 1. Session Manager (`session.ts`)

JWT 토큰 생성, 검증, 세션 관리를 담당합니다.

**주요 함수:**

- `createSession(payload)`: JWT 세션 생성 및 쿠키 저장
- `getSession()`: 현재 세션 가져오기
- `deleteSession()`: 세션 삭제 (로그아웃)
- `isAuthenticated()`: 인증 상태 확인

### 2. User Repository (`users.ts`)

사용자 데이터 관리를 담당합니다.

**주요 메서드:**

- `create(username, email, password)`: 사용자 생성
- `findByUsername(username)`: 사용자명으로 조회
- `findByEmail(email)`: 이메일로 조회
- `findById(id)`: ID로 조회

**⚠️ 현재 메모리 기반 저장소**

- 프로덕션에서는 PostgreSQL, MongoDB 등 실제 DB 사용 필요
- 서버 재시작 시 사용자 데이터 초기화됨

### 3. Proxy (`proxy.ts`)

Next.js 16의 Proxy를 사용하여 모든 보호된 경로에서 JWT를 자동으로 검증합니다.

**보호된 경로:**

- `/dashboard/*` (로그인 페이지 `/dashboard` 제외)
- 예: `/dashboard/upload`, `/dashboard/create`, `/dashboard/files` 등 모든 하위 경로

**동작:**

1. 로그인 페이지(`/dashboard`)는 인증 불필요
2. 다른 모든 dashboard 경로는 쿠키에서 JWT 토큰 추출
3. 토큰 검증 (서명, 만료 시간)
4. 실패 시 `/dashboard`로 리다이렉트
5. 성공 시 요청 헤더에 사용자 정보 추가 (x-user-id, x-username)

## 보안 고려사항

### 현재 구현된 보안 기능

✅ **비밀번호 해싱**: bcrypt (SALT_ROUNDS=10)
✅ **HttpOnly 쿠키**: XSS 공격 방지
✅ **Secure 쿠키**: 프로덕션에서 HTTPS only
✅ **SameSite=Lax**: CSRF 공격 완화
✅ **JWT 서명**: HS256 알고리즘
✅ **토큰 만료**: 7일 후 자동 만료

### 프로덕션 체크리스트

- [ ] JWT_SECRET을 안전하게 관리 (환경변수, Vault 등)
- [ ] HTTPS 강제 적용
- [ ] Rate limiting 추가 (로그인 시도 제한)
- [ ] 사용자 저장소를 실제 DB로 마이그레이션
- [ ] 비밀번호 정책 강화 (최소 길이, 복잡도)
- [ ] 계정 잠금 정책 (실패 5회 후 잠금)
- [ ] 2FA (Two-Factor Authentication) 고려
- [ ] 감사 로그 (audit log) 추가
- [ ] 세션 토큰 블랙리스트 (로그아웃 시)

## 사용 예제

### 서버 컴포넌트에서 인증 확인

```typescript
import { isAuthenticated, getSession } from "@/shared/lib/auth";

export default async function ProtectedPage() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/dashboard");
  }

  const session = await getSession();

  return <div>Welcome, {session?.username}!</div>;
}
```

### 서버 액션에서 세션 정보 사용

```typescript
'use server';

import { getSession } from '@/shared/lib/auth';

export async function createPost(formData: FormData) {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  // session.userId, session.username 사용 가능
  console.log(`Post created by ${session.username}`);
}
```

### 새 사용자 생성

```typescript
import { userRepository } from '@/shared/lib/auth';

// 개발 환경이나 초기 설정 스크립트에서 사용
await userRepository.create('newadmin', 'admin@example.com', 'securePassword123');
```

## 문제 해결

### 로그인이 안 돼요

1. `.env.local` 파일에 `JWT_SECRET`이 설정되어 있는지 확인
2. 기본 계정 정보 확인:
   - 사용자명: `admin`
   - 비밀번호: `admin123`
3. 개발 서버 재시작 (사용자 메모리 초기화)

### 세션이 계속 만료돼요

1. JWT_SECRET이 변경되지 않았는지 확인
2. 시스템 시간이 정확한지 확인
3. 쿠키가 제대로 저장되는지 브라우저 개발자 도구에서 확인

### API 키 인증이 안 돼요

1. `.env.local`에 `BACKOFFICE_API_KEY` 설정 확인
2. Authorization 헤더 형식: `Bearer YOUR_API_KEY`
3. API 키에 공백이나 특수문자가 포함되지 않았는지 확인

## 마이그레이션 가이드

### 레거시 API 키 → JWT 전환

기존 API 키 인증을 사용하던 코드:

```typescript
// Before
import { verifyApiKey } from '@/shared/lib/auth';
const isValid = await verifyApiKey();
```

새로운 JWT 인증:

```typescript
// After
import { isAuthenticated, getSession } from '@/shared/lib/auth';

const authenticated = await isAuthenticated();
if (!authenticated) {
  // handle unauthorized
}

const session = await getSession();
// session.userId, session.username, session.email 사용 가능
```

## 참고 자료

- [JWT.io](https://jwt.io/) - JWT 토큰 디코딩 및 검증
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
