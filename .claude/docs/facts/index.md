# Codebase Facts Documentation

## 개요

이 디렉토리에는 bbakjun-blog 모노레포의 각 애플리케이션과 패키지에 대한 구조적 문서가 저장됩니다. 모든 문서는 실제 코드베이스를 기반으로 작성되었으며, 정확한 위치 참조와 코드 증거를 포함합니다.

## 애플리케이션 문서

### Blog-Admin (/apps/blog-admin/)

블로그 관리자 대시보드 - 콘텐츠 관리, 파일 업로드, 사용자 관리

- [Overview](./apps/blog-admin/index.md)
- **API Documentation**
  - [API Architecture](./apps/blog-admin/apis/index.md)
  - [HTTP Routes](./apps/blog-admin/apis/http.md)
  - [RPC Routes](./apps/blog-admin/apis/rpc.md)
  - [Authentication](./apps/blog-admin/apis/auth.md)
  - [Error Handling](./apps/blog-admin/apis/errors.md)

### Blog (/apps/blog/)

공개 블로그 - 포스트 조회, 검색, 태그 필터링
_문서 준비 중..._

## 패키지 문서

### @repo/analytics

Redis 기반 조회수 추적 시스템
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

### 업데이트 주기

- 코드 변경 시 해당 문서 즉시 업데이트
- 주요 리팩토링 시 전체 문서 검토
- 매주 최신 코드와 동기화

### 마지막 업데이트

- **날짜**: 2025-12-22
- **커밋**: 2c541823391c87ad23934193eddd21e2335f0b09
