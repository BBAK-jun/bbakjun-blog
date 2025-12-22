# CDC Sync Cache (Change Data Capture)

- **App**: apps/blog-admin
- **Status**: As-Is (현재 구현)
- **Scope**: Vercel Blob API 호출 최소화를 위한 CDC 캐시 레이어
- **Based on**:
  - Facts:
    - [../../../facts/apps/blog-admin/utils/caching.md](../../../facts/apps/blog-admin/utils/caching.md#blob-cdc-change-data-capture-캐싱)
    - [../../../facts/apps/blog-admin/schemas/db.md](../../../facts/apps/blog-admin/schemas/db.md#blobfile-모델)
    - [../../../facts/apps/blog-admin/apis/rpc.md](../../../facts/apps/blog-admin/apis/rpc.md#get-apirpcsyncblobfiles)
  - Insights:
    - [../../../insights/apps/blog-admin/impact/cost.md](../../../insights/apps/blog-admin/impact/cost.md#vercel-blob-api-비용-절감)
    - [../../../insights/apps/blog-admin/impact/risk.md](../../../insights/apps/blog-admin/impact/risk.md#cdc-최종적-일관성-리스크)
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 개요 (Overview)

- **목적**: Vercel Blob Storage의 API 호출 제한(월 2,000회) 문제를 해결하기 위해 PostgreSQL에 Blob 파일 메타데이터를 캐싱하여 API 호출을 97.6% 감소시키고, 연간 $28,800의 비용을 절감
- **범위**:
  - In-Scope:
    - Vercel Blob 메타데이터 캐싱 (PostgreSQL)
    - 주기적 자동 동기화 (기본 30분 간격)
    - 수동 동기화 API
    - Soft Delete 패턴으로 파일 이력 관리
    - 실시간 업로드/삭제 훅
  - Out-of-Scope:
    - Blob 파일 내용 캐싱 (메타데이터만 캐싱)
    - 다른 스토리지 제공자 지원
- **비즈니스 가치**:
  - 월 $20+의 Vercel Blob API 비용 절감 (무료 플랜 유지)
  - 97.6%의 API 호출 감소로 안정적인 서비스 운영
  - 확장 가능한 아키텍처로 트래픽 증가 대응

## 핵심 기능 (Core Features)

1. **자동 동기화 (Automatic Sync)**
   - 설명: 환경 변수로 설정된 간격(기본 30분)마다 Vercel Blob과 DB 간 데이터 동기화
   - 주요 규칙:
     - `BLOB_SYNC_INTERVAL_MINUTES` 환경 변수로 간격 조정 가능
     - `needsSync()` 함수로 동기화 필요 여부 확인
     - 백그라운드에서 실행되어 사용자 요청 차단 없음

2. **수동 동기화 (Manual Sync)**
   - 설명: 관리자가 즉시 동기화를 트리거할 수 있는 API 엔드포인트 제공
   - 주요 규칙:
     - `POST /api/rpc/syncBlobFiles` 엔드포인트
     - 관리자 권한 필수 (`requireAdminSession` 미들웨어)
     - 동기화 통계(추가, 삭제, 기존 파일 수) 반환

3. **소프트 삭제 처리 (Soft Delete Handling)**
   - 설명: Blob에서 삭제된 파일을 DB에서 즉시 삭제하지 않고 `isDeleted: true`로 표시
   - 주요 규칙:
     - 삭제된 파일의 이력 추적 가능
     - `isDeleted: false` 필터링으로 활성 파일만 조회
     - 재업로드 시 `isDeleted: false`로 복원

4. **실시간 훅 (Real-time Hooks)**
   - 설명: 파일 업로드/삭제 시 즉시 DB에 반영하는 비동기 훅
   - 주요 규칙:
     - `onBlobUpload()`: `upsert`로 중복 방지, `pathname` 기반 고유 보장
     - `onBlobDelete()`: 소프트 삭제 처리
     - 실패해도 업로드/삭제 작업은 계속 진행 (Non-blocking)

5. **캐시 조회 (Cache Retrieval)**
   - 설명: DB에서 캐시된 파일 목록을 효율적으로 조회
   - 주요 규칙:
     - 페이지네이션 지원 (limit, offset)
     - 검색 기능 (pathname contains)
     - 병렬 실행으로 성능 최적화

## 기술 사양 (Technical Specifications)

- **아키텍처 개요**:

  ```
  Vercel Blob Storage (Source of Truth)
      ↓
      ↓ Sync every N minutes
      ↓
  PostgreSQL BlobFile Table (Cache)
      ↓
      ↓ Read operations
      ↓
  Admin UI & Blog App
  ```

- **의존성**:
  - Services:
    - Vercel Blob Storage (파일 저장소)
    - PostgreSQL (캐시 데이터베이스)
  - Packages:
    - @vercel/blob (Blob API)
    - Prisma (DB ORM)
    - Hono (RPC 서버)
  - Libraries:
    - Zod (데이터 검증)
  - Env Vars:
    - `BLOB_READ_WRITE_TOKEN`: Vercel Blob 접근 토큰
    - `BLOB_SYNC_INTERVAL_MINUTES`: 동기화 간격 (기본: 30)
    - `DATABASE_URL`: PostgreSQL 연결 문자열

- **구현 접근**:
  - **동기화 알고리즘**:
    1. Vercel Blob에서 전체 파일 목록 조회
    2. DB에 저장된 파일 목록과 비교
    3. 새 파일: `createMany`로 DB에 추가
    4. 삭제된 파일: `updateMany`로 `isDeleted: true` 표시
    5. 기존 파일: `lastChecked` 타임스탬프 업데이트
  - **고유 식별자**: `pathname`을 고유 키로 사용 (URL은 재업로드 시 변경됨)
  - **성능 최적화**: 인덱싱(`uploadedAt`, `isDeleted`, `lastChecked`)과 병렬 처리

- **관측/운영(Observability)**:
  - 동기화 통계 로깅 (total, added, deleted, existing)
  - 실패 시 상세 에러 메시지 기록
  - 마지막 동기화 시간 추적

- **실패 모드/대응(Failure Modes)**:
  - Vercel Blob API 실패: 에러 로깅 후 다음 동기화 시점에 재시도
  - DB 연결 실패: 즉시 에러 반환, 수동 재시도 필요
  - 훅 실패: Non-blocking으로 동작 실패 시 로깅만

## 데이터 구조 (Data Structure)

- **모델/스키마**: BlobFile 모델 (`prisma/schema.prisma`)

  ```prisma
  model BlobFile {
    id          String   @id @default(cuid())
    url         String              // Blob URL (변경 가능)
    pathname    String   @unique    // 파일 경로 (고유 식별자)
    size        BigInt              // 파일 크기 (bytes)
    uploadedAt  DateTime            // 업로드 시간
    contentType String?             // MIME 타입
    syncedAt    DateTime @default(now())     // DB 동기화 시간
    lastChecked DateTime @default(now())     // 마지막 확인 시간
    isDeleted   Boolean  @default(false)     // 소프트 삭제 플래그
    uploadedBy  String?             // 업로더 추적 (선택사항)

    @@index([uploadedAt])
    @@index([isDeleted])
    @@index([lastChecked])
  }
  ```

- **데이터 흐름**:
  1. **업로드**: `onBlobUpload()` → DB에 `upsert` (pathname 기반)
  2. **삭제**: `onBlobDelete()` → `isDeleted: true`로 업데이트
  3. **동기화**: `syncBlobToDatabase()` → 전체 목록 비교 및 업데이트
  4. **조회**: `getCachedBlobFiles()` → `isDeleted: false` 필터링

- **검증/제약(Validation/Constraints)**:
  - `pathname` 유니크 제약조건 (Migration: 20251219112111)
  - `size` 필드 BigInt 타입 (큰 파일 지원)
  - `lastChecked` 인덱스로 동기화 필요 파일 빠른 조회

## API 명세 (API Specifications)

- **Endpoint**: `POST /api/rpc/syncBlobFiles`
  - **Auth**: 관리자 세션 필수 (`requireAdminSession`)
  - **Request**: 없음 (빈 본문)
  - **Response**:
    ```typescript
    {
      success: boolean;
      message: string;
      stats?: {
        total: number;      // 전체 파일 수
        added: number;      // 새로 추가된 파일 수
        deleted: number;    // 삭제된 파일 수
        existing: number;   // 기존 파일 수
        syncDuration: number; // 동기화 소요 시간 (ms)
      };
      error?: string;       // 실패 시 에러 메시지
    }
    ```
  - **Errors**:
    - 401: 인증 실패 (관리자 권한 없음)
    - 500: 동기화 중 서버 에러

- **Endpoint**: `GET /api/rpc/getBlobFilesAdmin`
  - **Auth**: 관리자 세션 필수
  - **Query Params**:
    - `limit`: 조회할 파일 수 (기본: 100)
    - `offset`: 시작 위치 (기본: 0)
    - `search`: 검색어 (pathname contains)
    - `autoSync`: 자동 동기화 여부 (기본: true)
  - **Response**:
    ```typescript
    {
      files: BlobFile[];
      total: number;
      hasMore: boolean;
      lastSyncTime?: string; // 마지막 동기화 시간 (autoSync=true 시)
    }
    ```

## 사용자 시나리오 (User Scenarios)

- **성공 시나리오**:
  1. 관리자가 파일 관리 페이지 접속
  2. 자동 동기화가 실행되어 최신 파일 목록 표시
  3. 관리자가 "동기화" 버튼 클릭
  4. API 호출 성공, 통계 표시 (예: "15개 추가, 2개 삭제됨")

- **실패/예외 시나리오**:
  1. Vercel Blob API 일시적 오류
     - 에러 로깅
     - 기존 캐시 데이터로 서비스 계속
     - 다음 동기화 시점에 자동 재시도
  2. DB 연결 실패
     - 즉시 에러 응답
     - 관리자에게 연결 문제 알림
     - 수동 재시도 대기

- **권한/역할 시나리오**:
  - 일반 사용자: 동기화 API 접근 불가 (401 에러)
  - ADMIN: 동기화 API 호출 가능
  - SUPER_ADMIN: 모든 동기화 기능 접근 가능

## 제약사항 및 고려사항 (Constraints and Considerations)

- **보안**:
  - 동기화 API는 관리자 권한 필수
  - Blob Read/Write 토큰 안전한 저장
  - DB 연결 시 SSL 강제

- **성능**:
  - 30분 지연으로 인한 최종적 일관성 (Eventual Consistency)
  - 대용량 파일 목록 처리 시 메모리 사용량 고려
  - 인덱스 최적화로 조회 성능 보장

- **배포**:
  - 마이그레이션 순서 중요 (`pathname` 유니크 변경)
  - 동기화 간격 환경 변수 설정 필요
  - 초기 데이터 베이스 채우기 필요

- **롤백**:
  - 동기화 실패 시 이전 상태 유지 (트랜잭션)
  - 잘못된 데이터 수정 시 수동 동기화로 복구
  - `isDeleted` 필드로 실수 방지

- **호환성/마이그레이션**:
  - 기존 URL 기반 ID에서 `pathname` 기반으로 변경
  - 백그라운드에서 호환성 유지
  - 점진적 마이그레이션 지원

## 향후 확장 가능성 (Future Expansion)

- **이벤트 기반 동기화**: Vercel Blob 웹훅 연동으로 실시간 동기화
- **다중 스토리지 지원**: AWS S3, Google Cloud Storage 등 확장
- **분산 캐싱**: Redis 레이어 추가로 읽기 성능 향상
- **증분 동기화**: 변경된 파일만 동기화로 효율성 개선
- **CDN 통합**: 글로벌 파일 배포를 위한 CDN 연동
- **메타데이터 확장**: 파일 태그, 설명, 카테고리 등 추가 정보

## 추가로 필요 정보(Needed Data/Decisions)

- TBD: 최적 동기화 간격 산정
  - 질문: 현재 30분 간격이 적절한가? 트래픽 패턴 분석 필요
  - 오너: 시스템 아키텍트
  - 기한: 1개월 내 데이터 분석 후 결정

- TBD: 데이터 보관 정책
  - 질문: `isDeleted` 파일의 보관 기간은 얼마로 할 것인가?
  - 오너: 데이터 관리자
  - 기한: 2주 내 정책 수립

- TBD: 모니터링 경보 임계값
  - 질문: 동기화 실패, 지연 등의 경보 기준은?
  - 오너: 운영팀
  - 기한: 1개월 내 SLA 정의
