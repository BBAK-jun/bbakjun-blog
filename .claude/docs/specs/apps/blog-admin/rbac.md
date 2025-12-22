# RBAC (Role-Based Access Control)

- **App**: blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: 사용자 인증 및 역할 기반 권한 관리 시스템
- **Based on**:
  - Facts:
    - [../../../facts/apps/blog-admin/apis/auth.md](../../../facts/apps/blog-admin/apis/auth.md)
    - [../../../facts/apps/blog-admin/schemas/db.md](../../../facts/apps/blog-admin/schemas/db.md)
    - [../../../facts/apps/blog-admin/pages/routes.md](../../../facts/apps/blog-admin/pages/routes.md)
    - [../../../facts/apps/blog-admin/components/patterns.md](../../../facts/apps/blog-admin/components/patterns.md)
  - Insights:
    - [../../../insights/apps/blog-admin/stakeholders/mapping.md](../../../insights/apps/blog-admin/stakeholders/mapping.md)
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 개요 (Overview)

- **목적**: 관리자 기능에 대한 안전한 접근 제어를 위해 Google OAuth 기반의 인증 시스템과 3단계 역할 기반 권한 관리(RBAC)를 제공
- **범위**:
  - In-Scope:
    - Google OAuth 2.0을 통한 소셜 로그인
    - SUPER_ADMIN, ADMIN, GUEST 3단계 권한 체계
    - 데이터베이스 기반 세션 관리 (7일 유효기간)
    - RPC API 엔드포인트 역할별 접근 제어
    - 자동 관리자 지정 (첫 사용자)
  - Out-of-Scope:
    - 다중 OAuth 제공자 지원 (현재는 Google만)
    - 세분화된 권한 설정 (기능별 권한)
    - 사용자 초대 시스템
    - SSO(Single Sign-On) 연동
- **비즈니스 가치**:
  - 보안성: Google OAuth의 검증된 인증 체계 활용
  - 운영 효율성: 자동 관리자 지정으로 초기 설정 복잡성 감소
  - 거버넌스: 명확한 권한 계층 구조로 책임 분리

## 핵심 기능 (Core Features)

1. **OAuth 인증 시스템**
   - 설명: Google OAuth 2.0을 통한 소셜 로그인 제공
   - 주요 규칙:
     - Authorization Code Flow 사용
     - 이메일과 기본 프로필 정보 자동 수집
     - 사용자 자동 생성 및 데이터베이스 저장

2. **3단계 역할 시스템**
   - 설명: SUPER_ADMIN > ADMIN > GUEST 계층 구조의 권한 관리
   - 주요 규칙:
     - SUPER_ADMIN: 모든 관리 기능 접근 (첫 사용자 자동 지정)
     - ADMIN: 콘텐츠 CRUD 권한 (파일 생성, 편집, 업로드)
     - GUEST: 읽기 전용 권한 (기본 정보 조회만)

3. **세션 관리**
   - 설명: 데이터베이스 기반의 영속적 세션 저장 및 관리
   - 주요 규칙:
     - 7일 세션 유효기간
     - 세션에 사용자 ID와 역할 정보 포함
     - 자동 세션 정리 및 만료 처리

4. **API 인증 미들웨어**
   - 설명: RPC API 엔드포인트에 대한 역할 기반 접근 제어
   - 주요 규칙:
     - requireSession: 로그인 사용자만 접근
     - requireAdminSession: ADMIN/SUPER_ADMIN 역할 필요
     - API 키 인증도 지원 (서비스 간 통신용)

5. **자동 관리자 지정**
   - 설명: 시스템의 첫 번째 사용자를 자동으로 SUPER_ADMIN으로 지정
   - 주요 규칙:
     - createUser 이벤트 핸들러에서 사용자 수 확인
     - userCount === 1일 경우 역할을 SUPER_ADMIN으로 변경
     - 그 외 사용자는 기본적으로 GUEST 역할 부여

## 기술 사양 (Technical Specifications)

- **아키텍처 개요**:
  - NextAuth.js v5를 핵심 인증 프레임워크로 사용
  - Prisma Adapter로 데이터베이스 세션 저장
  - Hono 미들웨어로 RPC API 보호
  - 클라이언트 컴포넌트에서 세션 상태 공유

- **의존성**:
  - Services:
    - Google OAuth 2.0 API (인증 제공자)
    - Vercel Blob Storage (API 키 인증)
  - Packages:
    - next-auth (인증 프레임워크)
    - @auth/prisma-adapter (세션 저장소)
    - hono (RPC 미들웨어)
  - Libraries:
    - zod (타입 검증)
    - jose (JWT 토큰 처리)
  - Env Vars:
    - AUTH_SECRET: JWT 서명 키
    - AUTH_GOOGLE_ID/SECRET: OAuth 클라이언트 정보
    - BACKOFFICE_API_KEY: API 인증 키
    - NEXTAUTH_URL: NextAuth.js 기본 URL

- **구현 접근**:
  - 인증 흐름: Google OAuth → 사용자 생성/조회 → 세션 생성 → 역할 체크
  - 미들웨어 체인: API 요청 → 세션 확인 → 역할 검증 → 핸들러 실행
  - 클라이언트 상태: auth() 훅으로 세션 조회 및 리렌더링

- **관측/운영(Observability)**:
  - 세션 테이블의 만료 기간으로 자동 정리
  - NextAuth.js 내장 로깅으로 인증 이벤트 추적
  - Prisma 쿼리 로그로 데이터베이스 연동 모니터링

- **실패 모드/대응(Failure Modes)**:
  - 인증 실패: /login 페이지로 리다이렉트
  - 권한 없음: /unauthorized 페이지로 이동 (권한 안내)
  - 세션 만료: 자동 로그아웃 및 재로그인 요구
  - 데이터베이스 연결 실패: 인증 기능 중단 (전체 서비스 영향)

## 데이터 구조 (Data Structure)

- **모델/스키마**:
  ```prisma
  model User {
    id            String    @id @default(cuid())
    email         String    @unique
    role          UserRole  @default(GUEST)
    name          String?
    username      String?   @unique
    image         String?
    emailVerified DateTime?
    accounts      Account[]
    sessions      Session[]
  }

  enum UserRole {
    SUPER_ADMIN
    ADMIN
    GUEST
  }

  model Session {
    sessionToken String   @unique
    userId       String
    expires      DateTime
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  model Account {
    id                String  @id @default(cuid())
    userId            String
    type              String
    provider          String
    providerAccountId String
    refresh_token     String?
    access_token      String?
    expires_at        Int?
    token_type        String?
    scope             String?
    id_token          String?
    session_state     String?
    user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([provider, providerAccountId])
  }
  ```

- **데이터 흐름**:
  1. 로그인 요청 → Google OAuth → 사용자 정보 수신
  2. User 테이블에서 사용자 조회/생성 (역할 포함)
  3. Account 테이블에 OAuth 정보 저장
  4. Session 테이블에 세션 생성 (7일 유효기간)
  5. 클라이언트 쿠키에 세션 토큰 전달
  6. API 요청 시마다 세션 테이블 조회 및 유효성 검증

- **검증/제약(Validation/Constraints)**:
  - 이메일 중복 방지 (@unique)
  - OAuth 제공자+계정ID 조합 유니크
  - 세션 토큰 유니크
  - CASCADE 삭제로 관련 데이터 자동 정리

## API 명세 (API Specifications)

### NextAuth.js Endpoints

- **Endpoint**: `GET /api/auth/signin`
  - Auth: 없음
  - Request: 없음
  - Response: 로그인 페이지 리다이렉트
  - Errors: 없음

- **Endpoint**: `POST /api/auth/signin/google`
  - Auth: 없음
  - Request: OAuth 인증 코드
  - Response: 세션 쿠키 설정 및 리다이렉트
  - Errors: 인증 실패 시 에러 페이지

- **Endpoint**: `GET /api/auth/session`
  - Auth: 없음 (공개 엔드포인트)
  - Request: 없음
  - Response:
    ```json
    {
      "user": {
        "id": "string",
        "email": "string",
        "role": "SUPER_ADMIN|ADMIN|GUEST",
        "name": "string"
      },
      "expires": "2024-12-29T00:00:00.000Z"
    }
    ```
  - Errors: 세션 없음 시 null

- **Endpoint**: `POST /api/auth/signout`
  - Auth: 세션 필요
  - Request: CSRF 토큰
  - Response: 세션 삭제 및 리다이렉트
  - Errors: 없음

### RPC API Middleware

- **Middleware**: `requireSession`
  - Auth: 로그인 필수
  - Request: 세션 쿠키 또는 API 키
  - Response: Hono 컨텍스트에 사용자 정보 설정
  - Errors: 401 Unauthorized (세션 없음)

- **Middleware**: `requireAdminSession`
  - Auth: ADMIN 이상 역할 필수
  - Request: 세션 쿠키 또는 API 키
  - Response: Hono 컨텍스트에 사용자 정보 설정
  - Errors:
    - 401 Unauthorized (세션 없음)
    - 403 Forbidden (권한 부족)

### API Key Authentication

- **Endpoint**: 모든 RPC API 엔드포인트
  - Auth: Bearer 토큰 (선택사항)
  - Request: `Authorization: Bearer <BACKOFFICE_API_KEY>`
  - Response: 세션 없이도 API 접근 가능
  - Errors: 401 Unauthorized (잘못된 API 키)

## 사용자 시나리오 (User Scenarios)

- **성공 시나리오**:
  1. **초기 설정 및 첫 로그인**:
     - 사용자가 /login 접속 → Google 계정 선택 → OAuth 동의 →
     - 첫 사용자 확인 → 자동 SUPER_ADMIN 지정 → 대시보드 접속 성공
  2. **일반 관리자 로그인**:
     - 사용자가 /login 접속 → Google 계정으로 로그인 →
     - 기존 사용자 확인 → 기본 GUEST 역할 → 대시보드 접속 (읽기 전용)
  3. **API 서비스 통신**:
     - blog-app에서 RPC API 호출 → Bearer 토큰 포함 →
     - API 키 검증 성공 → 데이터 응답

- **실패/예외 시나리오**:
  1. **권한 없는 페이지 접근**:
     - GUEST 사용자가 ADMIN 전용 기능 접속 →
     - 미들웨어에서 권한 확인 실패 → /unauthorized 페이지 리다이렉트
  2. **세션 만료**:
     - 7일 경과 후 API 요청 → 세션 만료 확인 →
     - 자동 로그아웃 처리 → /login 페이지 리다이렉트
  3. **잘못된 API 키**:
     - 외부 서비스가 잘못된 토큰으로 API 호출 →
     - API 키 불일치 → 401 Unauthorized 응답

- **권한/역할 시나리오**:
  1. **SUPER_ADMIN 권한**:
     - 모든 대시보드 페이지 접근 가능
     - 사용자 역할 관리 (DB 직접 수정 필요)
     - 모든 RPC API 엔드포인트 호출 가능
  2. **ADMIN 권한**:
     - 콘텐츠 관리 기능 접근 가능 (create, files, upload)
     - 구독자 관리 기능 접근 가능
     - 설정 기능 접근 제한 (GUEST와 동일)
  3. **GUEST 권한**:
     - 대시보드 기본 정보만 조회 가능
     - 파일 목록 조회 가능 (수정/삭제 불가)
     - 대부분의 수정 기능 접근 제한

## 제약사항 및 고려사항 (Constraints and Considerations)

- 보안:
  - HTTPS 필수: 모든 인증 통신은 암호화 필요
  - Secure 쿠키: 프로덕션에서 secure 플래그 자동 설정
  - CSRF 보호: NextAuth.js 내장 CSRF 토큰
  - API 키 노출 주의: BACKOFFICE_API_KEY는 서버 환경변수에만 저장
  - 최소 권한 원칙: GUEST > ADMIN > SUPER_ADMIN 단계적 권한 부여

- 성능:
  - 세션 조회 시 데이터베이스 쿼리 발생 (캐시 적용 필요)
  - OAuth 리다이렉션으로 인한 초기 로그인 지연
  - 역할 확인 미들웨어의 모든 API 요청 오버헤드

- 배포:
  - 환경변수 필수: AUTH_SECRET, AUTH_GOOGLE_ID/SECRET
  - 데이터베이스 마이그레이션: User, Account, Session 테이블 선행 생성
  - Google OAuth 콘솔 설정: 리다이렉트 URI 등록 필요

- 롤백:
  - NextAuth.js 버전 호환성 주의
  - 세션 테이블 스키마 변경 시 기존 세션 무효화
  - 권한 열거형(Enum) 변경 시 데이터 마이그레이션 필요

- 호환성/마이그레이션:
  - Google OAuth 계정 연동으로 사용자 이관 불필요
  - 기존 세션은 버전 업그레이드 시 자동 정리
  - 권한 시스템 변경 시 기존 사용자 역할 보장 필요

## 향후 확장 가능성 (Future Expansion)

- 다중 인증 제공자: GitHub, Microsoft OAuth 추가
- 세분화된 권한: 기능별 권한 설정 (예: 콘텐츠 게시자, 편집자, 검토자)
- 사용자 초대 시스템: 이메일 초대 및 역할 사전 지정
- SSO 연동: 기업 인증 시스템과 통합
- MFA(다단계 인증): 보안 강화를 위한 2FA 추가
- 감사 로그: 사용자 활동 추적 및 보안 이벤트 기록
- 세션 관리 고도화: 다중 디바이스 세션 관리, 강제 로그아웃 기능
- 권한 위임: 임시 권한 부여 및 만료 시스템

## 추가로 필요 정보(Needed Data/Decisions)

- TBD: 권한 변경 인터페이스
  - 질문: SUPER_ADMIN이 다른 사용자의 역할을 변경할 수 있는 UI가 필요한가?
  - 오너: 개발팀
  - 기한: TBD

- TBD: 세션 타임아웃 정책
  - 질문: 현재 7일 고정 세션 만료를 역할별로 다르게 설정할 것인가? (예: ADMIN은 3일, GUEST는 1일)
  - 오너: 시스템 관리자
  - 기한: TBD

- TBD: API 키 관리
  - 질문: 단일 API 키 대신 여러 API 키를 발급하고 만료 기간을 설정할 것인가?
  - 오너: 개발팀
  - 기한: TBD

- TBD: 인증 로그 레벨
  - 질문: 현재 기본 로그 외에 어떤 수준의 인증 이벤트를 기록할 것인가? (로그인 실패, 권한 거부, 비정상 접근 등)
  - 오너: 시스템 관리자
  - 기한: TBD