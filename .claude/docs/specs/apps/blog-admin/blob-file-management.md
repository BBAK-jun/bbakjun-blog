# Blob File Management (블롭 파일 관리)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: Vercel Blob Storage 파일 CRUD 운영 및 CDC 캐싱 시스템 관리
- **Based on**:
  - Facts: ../../facts/apps/blog-admin/apis/rpc.md, ../../facts/apps/blog-admin/apis/http.md, ../../facts/apps/blog-admin/schemas/db.md, ../../facts/apps/blog-admin/utils/caching.md, ../../facts/apps/blog-admin/components/ui.md, ../../facts/apps/blog-admin/pages/routes.md
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 개요 (Overview)

- **목적**: Vercel Blob Storage API 호출 비용 최적화를 위한 CDC(Change Data Capture) 캐싱 시스템을 통한 파일 관리 기능 제공. 월 2,000회의 API 호출 제한을 97.6% 감소시켜 운영 효율성 향상.
- **범위**:
  - In-Scope:
    - 파일 업로드 (MDX 마크다운, 이미지)
    - 파일 목록 조회 (페이지네이션, 검색)
    - 파일 편집 및 삭제
    - CDC 동기화 관리 (자동/수동)
    - 소프트 삭제 패턴으로 파일 이력 관리
  - Out-of-Scope:
    - 파일 버전 관리
    - 다중 스토리지 제공자 연동
    - 파일 변환 포맷 지원
- **비즈니스 가치**:
  - API 호출 비용 97.6% 감소 (월 2,000회 → 48회)
  - 운영자 생산성 향상 (드래그앤드롭 업로드, 실시간 편집)
  - 데이터 안정성 확보 (소프트 삭제, CDC 동기화)

## 핵심 기능 (Core Features)

1. **파일 업로드 관리**
   - 설명: MDX 마크다운과 이미지 파일을 Vercel Blob Storage에 업로드
   - 주요 규칙:
     - 드래그앤드롭 또는 클릭 업로드 지원
     - 파일명 자동 정리 (특수문자 제거)
     - 이미지 최적화 (썸네일 생성, 포맷 변환)
     - 업로드 즉시 CDC 캐시에 반영 (onBlobUpload 훅)

2. **파일 목록 조회 및 검색**
   - 설명: CDC 캐시에서 파일 목록을 페이징 및 검색 기능으로 제공
   - 주요 규칙:
     - 페이지네이션 (기본 100개, 최대 1000개)
     - pathname 기반 검색
     - isDeleted: false 필터링 (소프트 삭제된 파일 제외)
     - 실시간 업데이트 (React Query staleTime: 0)

3. **파일 편집**
   - 설명: MDX 파일의 프론트매터와 내용을 실시간으로 편집
   - 주요 규칙:
     - CodeMirror 기반 에디터
     - 실시간 미리보기
     - 스크롤 동기화
     - 이미지 드래그앤드롭 지원
     - 태그 입력 및 프론트매터 편집

4. **파일 삭제**
   - 설명: 파일을 소프트 삭제 패턴으로 처리
   - 주요 규칙:
     - DB에서 isDeleted: true로 표시
     - Vercel Blob에서는 실제 삭제
     - 삭제 확인 모달 표시
     - 삭제 후 ISR 캐시 무효화

5. **CDC 동기화 관리**
   - 설명: Vercel Blob과 DB 캐시 간 주기적 동기화
   - 주요 규칙:
     - 자동 동기화 (기본 30분 간격)
     - 수동 동기화 트리거
     - pathname을 고유 식별자로 사용
     - 중복 파일 자동 정리 (최신 파일 유지)

## 기술 사양 (Technical Specifications)

- **아키텍처 개요**:

  ```
  Blog-Admin UI
      ↓
      Server Actions (Next.js)
      ↓
      Vercel Blob Storage (Source of Truth)
      ↓ CDC Hooks (실시간)
      ↓
      PostgreSQL DB (Cache Layer)
      ↓ Hono RPC (Type-safe API)
      ↓
      Blog App (Consumer)
  ```

- **의존성**:
  - Services:
    - Vercel Blob Storage (파일 저장소)
    - PostgreSQL (CDC 캐시)
    - Redis (ISR 캐시 무효화)
  - Packages:
    - @vercel/blob (파일 업로드)
    - @tanstack/react-query (상태 관리)
    - Prisma (DB ORM)
    - Hono (RPC API)
  - Libraries:
    - Sharp (이미지 처리)
    - CodeMirror (마크다운 에디터)
  - Env Vars:
    - BLOB_READ_WRITE_TOKEN: Vercel Blob 인증
    - BLOB_STORE_ID: Blob 스토어 ID
    - BLOB_SYNC_INTERVAL_MINUTES: 동기화 간격 (기본 30)
    - DATABASE_URL: PostgreSQL 연결
    - NEXT_PUBLIC_BLOG_URL: 블로그 ISR 무효화

- **구현 접근**:
  - FSD (Feature-Sliced Design) 아키텍처 적용
  - Server Actions로 API 엔드포인트 대체
  - CDC 패턴으로 API 호출 최소화
  - React Query로 클라이언트 상태 관리
  - Hono RPC으로 타입 세이프 API 제공

- **관측/운영(Observability)**:
  - 동기화 통계 기록 (total, added, deleted, existing)
  - 에러 로깅 (CDC 실패 시 작업 중단 없음)
  - React Query DevTools 지원
  - 파일 업로드 진행률 표시

- **실패 모드/대응(Failure Modes)**:
  - CDC 동기화 실패: 로깅만 하고 작업 계속 진행
  - Vercel Blob API 실패: 재시도 로직 구현
  - DB 연결 실패: 에러 메시지 표시
  - 파일 업로드 실패: 상세 에러 피드백

## 데이터 구조 (Data Structure)

- **모델/스키마**:

  ```prisma
  model BlobFile {
    id          String   @id @default(cuid())
    pathname    String   @unique    // 파일 경로 (고유 식별자)
    url         String              // Blob URL (재업로드 시 변경)
    size        BigInt
    uploadedAt  DateTime
    contentType String?
    syncedAt    DateTime @default(now())
    lastChecked DateTime @default(now())
    isDeleted   Boolean  @default(false)
    uploadedBy  String?

    @@index([uploadedAt])
    @@index([isDeleted])
    @@index([lastChecked])
  }
  ```

- **데이터 흐름**:
  1. 파일 업로드 → Vercel Blob에 저장
  2. onBlobUpload 훅 → DB에 CDC 레코드 생성/업데이트
  3. 주기적 동기화 → Blob API 호출 → DB 캐시 업데이트
  4. 파일 조회 → DB 캐시에서 데이터 반환
  5. 파일 삭제 → isDeleted: true → Vercel Blob 삭제

- **검증/제약(Validation/Constraints)**:
  - pathname 유니크 제약조건 (Migration: 20251219112111)
  - 최대 파일 크기: 이미지 5MB, MDX 무제한
  - 지원 포맷: PNG, JPG, GIF, WebP (이미지), MDX (문서)
  - 특수문자 자동 정리 (파일명)

## API 명세 (API Specifications)

### Hono RPC 엔드포인트

- **Endpoint**: `GET /api/rpc/getBlobFiles`
  - Auth: 없음 (공개)
  - Request: `{ limit?: number, offset?: number, search?: string }`
  - Response: `{ files: BlobFile[], total: number, hasMore: boolean }`
  - Errors: 400 (파라미터 오류), 500 (서버 오류)

- **Endpoint**: `GET /api/rpc/getBlobFilesAdmin`
  - Auth: requireSession (인증 필요)
  - Request: `{ limit?: number, offset?: number, search?: string, autoSync?: boolean }`
  - Response: `{ files: BlobFile[], total: number, hasMore: boolean }`
  - Errors: 401 (인증 실패), 403 (권한 없음)

- **Endpoint**: `POST /api/rpc/syncBlobFiles`
  - Auth: requireAdminSession (관리자 전용)
  - Request: 없음
  - Response: `{ total: number, added: number, deleted: number, existing: number }`
  - Errors: 401 (인증 실패), 403 (관리자 권한 없음)

- **Endpoint**: `POST /api/rpc/uploadMarkdown`
  - Auth: requireSession
  - Request: multipart/form-data (file, path, tags, status)
  - Response: `{ success: boolean, file?: BlobFile, error?: string }`
  - Errors: 400 (파일 형식 오류), 422 (검증 실패)

- **Endpoint**: `POST /api/rpc/uploadImage`
  - Auth: requireSession
  - Request: multipart/form-data (file)
  - Response: `{ success: boolean, url?: string, filename?: string, error?: string }`
  - Errors: 400 (이미지 형식 오류), 413 (파일 크기 초과)

### 레거시 HTTP 엔드포인트

- **Endpoint**: `GET /api/v1/public/blob-files`
  - Purpose: 블로그 앱 호환성을 위한 공개 엔드포인트
  - Auth: 없음
  - Request: Query 파라미터
  - Response: RPC과 동일한 형식

- **Endpoint**: `GET/POST /api/v1/admin/blob-files`
  - Purpose: 관리자용 파일 CRUD
  - Auth: 세션 또는 API 키
  - Request/Response: RPC과 동일한 형식

## 사용자 시나리오 (User Scenarios)

- **성공 시나리오**:
  1. 관리자가 /dashboard/files 접속 → 파일 목록 조회
  2. 파일 드래그앤드롭 업로드 → Vercel Blob 저장 + CDC 캐시 업데이트
  3. 파일 편집 클릭 → CodeMirror 에디터에서 실시간 편집
  4. 저장 버튼 클릭 → 파일 업데이트 + ISR 캐시 무효화
  5. 삭제 버튼 클릭 → 확인 모달 → 소프트 삭제 처리

- **실패/예외 시나리오**:
  1. 파일 업로드 실패 → 에러 메시지 표시
  2. CDC 동기화 실패 → 로그 기록, 작업 계속 진행
  3. Vercel Blob API 제한 → 자동 재시도 로직
  4. 네트워크 오류 → React Query 에러 바운더리 처리

- **권한/역할 시나리오**:
  1. SUPER_ADMIN: 모든 파일 CRUD 가능
  2. ADMIN: 파일 CRUD 가능 (단, 동기화는 제한)
  3. GUEST: 읽기 전용 (파일 목록 조회만 가능)

## 제약사항 및 고려사항 (Constraints and Considerations)

- 보안:
  - Vercel Blob 토큰 안전한 저장
  - 파일 업로드 경로 검증
  - CSRF 보호 (Next.js 기본 제공)

- 성능:
  - CDC 동기화 간격 조정 가능 (기본 30분)
  - React Query 캐시 최적화 (staleTime: 0)
  - 이미지 최적화 및 썸네일 생성
  - 병렬 파일 다운로드

- 배포:
  - Prisma 마이그레이션 필요
  - 환경변수 설정 필수
  - Vercel Blob 설정 필요

- 롤백:
  - 소프트 삭제로 파일 복구 가능
  - CDC 캐시 재동기화로 데이터 일관성 복구
  - Prisma 롤백 스크립트 준비

- 호환성/마이그레이션:
  - pathname 유니크 제약조건 마이그레이션 필요
  - 기존 URL 기반 ID 마이그레이션
  - 레거시 API 경로 유지

## 향후 확장 가능성 (Future Expansion)

- 다중 스토리지 제공자 지원 (S3, Cloudflare R2)
- 파일 버전 관리 시스템
- 고급 검색 기능 (전문 검색, 메타데이터 검색)
- 파일 미리보기 기능 향상 (PDF, 비디오)
- 대용량 파일 업로드 (청크 업로드)
- CDN 통합으로 이미지 전송 최적화
- 웹훅 기반 실시간 동기화
- 파일 접근 통계 및 분석

## 추가로 필요 정보(Needed Data/Decisions)

- TBD: 파일 보관 정책
  - 질문: 삭제된 파일을 언제까지 보관할 것인가?
  - 오너: 시스템 관리자
  - 기한: 30일 후 자동 영구 삭제 검토

- TBD: 동기화 간격 최적화
  - 질문: 현재 30분 간격이 적절한가? 트래픽 패턴 분석 필요
  - 오너: 개발팀
  - 기한: 다음 분기 분석

- TBD: 파일 크기 제한 정책
  - 질문: 현재 5MB 이미지 제한이 적절한가?
  - 오너: 콘텐츠팀
  - 기한: 사용 피드백 수집 후 결정
