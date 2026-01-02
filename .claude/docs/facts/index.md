# Codebase Facts Documentation

## 개요

이 디렉토리에는 bbakjun-blog 모노레포의 각 애플리케이션과 패키지에 대한 구조적 문서가 저장됩니다. 모든 문서는 실제 코드베이스를 기반으로 작성되었으며, 정확한 위치 참조와 코드 증거를 포함합니다.

## 애플리케이션 문서

### Blog-Admin (/apps/blog-admin/)

블로그 관리자 대시보드 - 콘텐츠 관리, 파일 업로드, 사용자 관리, 경력 관리, RAG 통합

- [Overview](./apps/blog-admin/index.md) - 최종 업데이트: 2026-01-02
- **API Documentation**
  - [Image Upload System](./apps/blog-admin/apis/image-upload.md) - 이미지 업로드 (ENHANCED: 다중 파일, 드래그앤드롭, 붙여넣기, 커서 삽입)
  - [API Architecture](./apps/blog-admin/apis/index.md)
  - [HTTP Routes](./apps/blog-admin/apis/http.md)
  - [RPC Routes](./apps/blog-admin/apis/rpc.md)
  - [Authentication](./apps/blog-admin/apis/auth.md)
  - [Error Handling](./apps/blog-admin/apis/errors.md)
- **Features** (NEW)
  - [Experience Management](./apps/blog-admin/features/experience-management.md) - 경력 타임라인 관리
  - [RAG Integration](./apps/blog-admin/features/rag-integration.md) - RAG Gateway 연동
- **Pages**
  - [Routes](./apps/blog-admin/pages/routes.md) - 페이지 라우팅 (NEW: Experience, RAG)
- **Schemas**
  - [Database](./apps/blog-admin/schemas/db.md) - 데이터베이스 스키마 (NEW: Experience, Achievement)

### Blog (/apps/blog/)

공개 블로그 - 포스트 조회, 검색, 태그 필터링

- [Overview](./apps/blog/index.md) - 최종 업데이트: 2025-12-26
- **API Documentation**
  - [API Index](./apps/blog/apis/index.md)
- **Pages**
  - [Pages Index](./apps/blog/pages/index.md)
- **Components**
  - [Components Index](./apps/blog/components/index.md)
- **Schemas**
  - [Schemas Index](./apps/blog/schemas/index.md)
- **Config**
  - [Config Index](./apps/blog/config/index.md)
- **Utils**
  - [Utils Index](./apps/blog/utils/index.md)

### RAG Gateway (/apps/rag-gateway/)

RAG(Retrieval-Augmented Generation) API 서비스

- [Overview](./apps/rag-gateway/index.md) - 최종 업데이트: 2026-01-02
- **API Documentation**
  - [API Index](./apps/rag-gateway/apis/index.md)
- **Components**
  - [Components Index](./apps/rag-gateway/components/index.md)
- **Pages**
  - [Routes](./apps/rag-gateway/pages/routes.md)
- **Schemas**
  - [Schemas Index](./apps/rag-gateway/schemas/index.md)
- **Config**
  - [Config Index](./apps/rag-gateway/config/index.md)
- **Utils**
  - [Utils Index](./apps/rag-gateway/utils/index.md)

## 패키지 문서

### @repo/analytics

Redis 기반 조회수 추적 시스템
_문서 준비 중..._

### @repo/cache

Redis 기반 API 응답 캐싱
_문서 준비 중..._

### @repo/content

MDX 처리 및 콘텐츠 관리
_문서 준비 중..._

### @repo/types

공통 TypeScript 타입 정의
_문서 준비 중..._

### @repo/ui

공유 UI 컴포넌트 (shadcn/ui)
_문서 준비 중..._

### @repo/config

공유 설정 및 유틸리티
_문서 준비 중..._

## 문서 작성 가이드라인

### 형식 요구사항

- 각 항목은 **Location**과 **Evidence** 필수 포함
- 코드는 실제 파일 경로와 라인 번호 참조
- 타입 안정성과 실행 가능한 코드만 문서화
- 메타데이터 포함 (git_commit, last_verified, changed_files, deleted_files)

### 업데이트 주기

- 코드 변경 시 해당 문서 즉시 업데이트
- 주요 리팩토링 시 전체 문서 검토
- 매주 최신 코드와 동기화

### 증분 업데이트 (Incremental Update)

**Git Diff 기반 업데이트**:
- 변경된 파일만 재추출
- 삭제된 파일 문서 제거
- 메타데이터에 변경 추적

**Stale Content Detection**:
- `source_exists: false` 항목 자동 제거
- Git hash로 변경 감지
- `deleted_files` 리스트로 삭제 추적

### 마지막 업데이트

- **날짜**: 2025-12-31
- **커밋**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d
- **주요 변경**:
  - Experience Management System 추가
  - RAG Integration 추가
  - RPC Routes Restructuring
  - Blog FSD refactoring
