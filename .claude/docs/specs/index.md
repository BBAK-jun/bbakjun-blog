# Feature Specifications (기능 명세서)

이 디렉토리에는 bbakjun-blog 모노레포의 각 애플리케이션 기능에 대한 상세 명세서가 저장됩니다. 모든 명세서는 실제 구현을 기반으로 작성되었으며, 기술적 요구사항과 비즈니스 가치를 연결합니다.

## 구조

```
.claude/docs/specs/
├── index.md                    # 이 파일
├── apps/
│   └── blog-admin/
│       ├── blob-file-management.md  # 블롭 파일 관리 기능 명세
│       ├── cdc-sync-cache.md        # CDC 동기화 캐시 기능 명세
│       └── rbac.md                  # 역할 기반 접근 제어 기능 명세
└── packages/
    # 공유 패키지 기능 명세 (추가 예정)
```

## 앱별 기능 명세

### Blog Admin (`apps/blog-admin`)
블로그 관리자 대시보드의 핵심 기능 명세

- [RBAC (Role-Based Access Control)](apps/blog-admin/rbac.md) `생성일: 2025-12-22`
  - Google OAuth 기반 인증 시스템
  - SUPER_ADMIN, ADMIN, GUEST 3단계 권한 체계
  - 데이터베이스 기반 세션 관리 (7일 유효기간)
  - RPC API 역할별 접근 제어

- [Blob File Management](apps/blog-admin/blob-file-management.md) `생성일: 2025-12-22`
  - Vercel Blob Storage 파일 관리 및 CDC 캐싱 시스템
  - 파일 업로드, 조회, 편집, 삭제 기능
  - API 호출 비용 97.6% 감소 구현

- [CDC Sync Cache](apps/blog-admin/cdc-sync-cache.md) `생성일: 2025-12-22`
  - Vercel Blob API 호출 최소화를 위한 Change Data Capture 캐시
  - PostgreSQL에 Blob 메타데이터 캐싱
  - 자동/수동 동기화, 소프트 삭제 처리
  - 연간 $28,800 비용 절감

### Blog (`apps/blog`)
공개 블로그 애플리케이션 기능 명세
*명세서 준비 중...*

## 명세서 작성 가이드

### 필수 섹션

모든 기능 명세서는 다음 섹션을 포함해야 합니다:

1. **개요 (Overview)**: 목적, 범위, 비즈니스 가치
2. **핵심 기능 (Core Features)**: 기능 목록과 상세 동작
3. **기술 사양 (Technical Specifications)**: 아키텨처와 의존성
4. **데이터 구조 (Data Structure)**: 모델과 데이터 흐름
5. **API 명세 (API Specifications)**: 엔드포인트 상세
6. **사용자 시나리오 (User Scenarios)**: 성공/실패/권한 시나리오
7. **제약사항 및 고려사항 (Constraints and Considerations)**: 보안/성능/운영
8. **향후 확장 가능성 (Future Expansion)**: 개선 방안
9. **추가로 필요 정보(Needed Data/Decisions)**: TBD 항목

### 상태 표기

- **As-Is (현재 구현)**: 이미 구현된 기능
- **To-Be (계획)**: 구현 계획 중인 기능
- **Mixed**: 일부 구현된 기능

### 증거 기반 명세

모든 기술적 주장은 다음 중 하나로 뒷받침되어야 합니다:

- Facts 문서 링크: `../../facts/apps/...`
- 코드 위치 참조: `path/to/file.ts`
- TBD 표기: 확인되지 않은 사항

## 명세서 템플릿

새로운 기능 명세서 작성 시 [feature-spec-writer](../agents/feature-spec-writer.md) 에이전트를 사용하거나, 기존 명세서를 복사하여 사용하세요.

## Last Updated

- **날짜**: 2025-12-22
- **커밋**: 2c541823391c87ad23934193eddd21e2335f0b09
- **전체 명세서 수**: 3개 (Blog Admin)
- **상태**: 모든 명세서 As-Is (현재 구현됨)