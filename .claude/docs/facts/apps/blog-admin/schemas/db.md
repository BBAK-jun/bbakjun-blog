# Database Schema (Prisma Models)

- **Scope**: Prisma 데이터베이스 모델 및 관계 정의
- **Source of Truth**: `prisma/schema.prisma`
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## User 모델

- **Location**: `prisma/schema.prisma` (L25-L47)
- **Purpose**: Auth.js v5 인증 시스템의 사용자 정보 저장
- **Key Details**:
  - `id`: CUID 기반 고유 식별자
  - `email`: 고유 이메일 주소 (로그인용)
  - `role`: 사용자 권한 레벨 (SUPER_ADMIN, ADMIN, GUEST)
  - `username`: 레거시 호환성을 위한 고유 사용자名 (선택사항)
  - Auth.js 요구 필드: name, emailVerified, image
- **Relationships**:
  - `accounts`: OAuth 계정 연결 정보 (1:N)
  - `sessions`: 사용자 세션 정보 (1:N)
- **Indexes**:
  - `email` 인덱스 (로그인 최적화)
  - `role` 인덱스 (권한 기반 쿼리 최적화)
- **Evidence**:
  - `prisma/schema.prisma`: `model User { id String @id @default(cuid()); email String @unique; role UserRole @default(GUEST) }`

## Account 모델

- **Location**: `prisma/schema.prisma` (L49-L68)
- **Purpose**: OAuth 제공자별 계정 연결 정보 저장
- **Key Details**:
  - `provider`: OAuth 제공자 (예: "google")
  - `providerAccountId`: 제공자별 계정 ID
  - `refresh_token`, `access_token`: OAuth 토큰 저장
  - `expires_at`: 토큰 만료 시간 (Unix 타임스탬프)
- **Constraints**:
  - 복합 유니크 제약조건: `[provider, providerAccountId]`
- **Relationships**:
  - `user`: User 모델과 N:1 관계 (onDelete: Cascade)
- **Evidence**:
  - `prisma/schema.prisma`: `@@unique([provider, providerAccountId])`

## Session 모델

- **Location**: `prisma/schema.prisma` (L70-L80)
- **Purpose**: 사용자 로그인 세션 관리
- **Key Details**:
  - `sessionToken`: 고유 세션 토큰
  - `expires`: 세션 만료 시간
- **Constraints**:
  - `sessionToken` 유니크 제약조건
- **Relationships**:
  - `user`: User 모델과 N:1 관계 (onDelete: Cascade)
- **Evidence**:
  - `prisma/schema.prisma`: `sessionToken String @unique`

## VerificationToken 모델

- **Location**: `prisma/schema.prisma` (L82-L89)
- **Purpose**: 이메일 인증 토큰 관리
- **Key Details**:
  - `identifier`: 인증 대상 이메일
  - `token`: 인증 토큰
  - `expires`: 토큰 만료 시간
- **Constraints**:
  - 복합 유니크 제약조건: `[identifier, token]`
- **Evidence**:
  - `prisma/schema.prisma`: `@@unique([identifier, token])`

## Subscriber 모델

- **Location**: `prisma/schema.prisma` (L95-L111)
- **Purpose**: 뉴스레터 구독자 관리
- **Key Details**:
  - `email`: 고유 구독자 이메일
  - `isActive`: 구독 상태 (활성/비활성)
  - `unsubscribeToken`: 안전한 구독 취소를 위한 고유 토큰
  - `source`: 구독 경로 추적 (footer, popup, blog-post 등)
- **Timestamps**:
  - `subscribedAt`: 구독 시작 시간
  - `unsubscribedAt`: 구독 취소 시간 (선택사항)
- **Indexes**:
  - `email` 인덱스 (중복 확인 최적화)
  - `isActive` 인덱스 (활성 구독자 필터링 최적화)
- **Evidence**:
  - `prisma/schema.prisma`: `model Subscriber { email String @unique; isActive Boolean @default(true) }`

## BlobFile 모델

- **Location**: `prisma/schema.prisma` (L117-L137)
- **Purpose**: Vercel Blob Storage CDC (Change Data Capture) 캐시
- **Key Details**:
  - `pathname`: 파일 경로 (고유 식별자, NOT url)
  - `url`: Blob URL (재업로드 시 변경됨)
  - `size`: 파일 크기 (bytes)
  - `isDeleted`: 소프트 삭제 플래그
- **CDC 메타데이터**:
  - `syncedAt`: DB 동기화 시간
  - `lastChecked`: 마지막 확인 시간
  - `uploadedBy`: 업로드 사용자 추적 (선택사항)
- **Constraints**:
  - `pathname` 유니크 제약조건 (Migration: 20251219112111)
- **Indexes**:
  - `uploadedAt` 인덱스 (최신 파일 정렬)
  - `isDeleted` 인덱스 (삭제된 파일 필터링)
  - `lastChecked` 인덱스 (동기화 필요 파일 확인)
- **Evidence**:
  - `prisma/schema.prisma`: `pathname String @unique // File path (unique identifier)`

## UserRole 열거형

- **Location**: `prisma/schema.prisma` (L15-L19)
- **Purpose**: 역할 기반 접근 제어 (RBAC)
- **Values**:
  - `SUPER_ADMIN`: 최고 관리자 - 모든 권한 + 사용자 역할 관리
  - `ADMIN`: 일반 관리자 - 콘텐츠 관리 (CRUD)
  - `GUEST`: 게스트 - 읽기 전용
- **Evidence**:
  - `prisma/schema.prisma`: `enum UserRole { SUPER_ADMIN; ADMIN; GUEST }`

## 데이터베이스 제약조건

### 유니크 제약조건

1. `users.email`: 이메일 중복 방지
2. `users.username`: 사용자명 중복 방지 (레거시)
3. `accounts.provider_providerAccountId`: OAuth 계정 중복 방지
4. `sessions.sessionToken`: 세션 토큰 중복 방지
5. `subscribers.email`: 구독자 이메일 중복 방지
6. `subscribers.unsubscribeToken`: 구독 취소 토큰 중복 방지
7. `blob_files.pathname`: 파일 경로 중복 방지

### 복합 유니크 제약조건

1. `verification_tokens.identifier_token`: 이메일+토큰 조합 유니크
2. `accounts.provider_providerAccountId`: 제공자+계정ID 조합 유니크

### 인덱스

- 성능 최적화를 위한 인덱스가 주요 컬럼에 설정됨
- 쿼리 패턴에 따라 정렬, 필터링, 조인 최적화

## 마이그레이션 히스토리

1. **20251215063239_init**: 초기 테이블 생성 (User, Account, Session, VerificationToken)
2. **20251216122249_add_newsletter_subscriber**: Subscriber 모델 추가
3. **20251217004025_add_newsletter_and_blob_cdc**: BlobFile 모델 추가 (CDC 구현)
4. **20251219015706_add_lastchecked_index**: BlobFile.lastChecked 인덱스 추가
5. **20251219112111_change_pathname_to_unique**:
   - BlobFile pathname을 유니크로 변경
   - 중복 pathname 정리 (최신 파일 유지)
   - url 유니크 제약조건 제거

## 관계 다이어그램

```
User (1) ←→ (N) Account
User (1) ←→ (N) Session
Subscriber (독립)
BlobFile (독립, CDC 캐시)
VerificationToken (독립)
```
