# Feature Specifications (기능 명세서)

이 디렉토리에는 bbakjun-blog 모노레포의 각 애플리케이션 기능에 대한 상세 명세서가 저장됩니다. 모든 명세서는 실제 구현을 기반으로 작성되었으며, 기술적 요구사항과 비즈니스 가치를 연결합니다.

## 구조

```
.claude/docs/specs/
├── index.md                    # 이 파일
├── apps/
│   ├── blog/
│   │   ├── isr-content-delivery.md       # ISR 기반 콘텐츠 전달
│   │   ├── view-tracking.md              # 조회수 추적 시스템
│   │   ├── search-and-discovery.md       # 검색 및 콘텐츠 발견
│   │   ├── content-rendering.md          # 콘텐츠 렌더링
│   │   └── cross-app-integration.md      # Blog-Admin 연동
│   ├── blog-admin/
│   │   ├── blob-file-management.md  # 블롭 파일 관리 기능 명세
│   │   ├── cdc-sync-cache.md        # CDC 동기화 캐시 기능 명세
│   │   ├── rbac.md                  # 역할 기반 접근 제어 기능 명세
│   │   ├── experience-management.md # 경력 관리 시스템 (NEW)
│   │   └── rag-integration.md       # RAG 통합 시스템 (NEW)
│   └── rag-gateway/
│       ├── document-ingestion.md       # 문서 수집 파이프라인
│       ├── mcp-integration.md         # Model Context Protocol 연동
│       ├── multi-llm-strategy.md      # 멀티 LLM 전략
│       ├── rag-query-pipeline.md      # RAG 쿼리 파이프라인
│       ├── render-deployment.md       # Render 배포 가이드
│       ├── security-layer.md          # 보안 레이어
│       ├── stale-document-cleanup.md  # 오래된 문서 정리
│       ├── vector-search.md           # 벡터 검색
│       └── index.md                  # RAG Gateway 개요
└── packages/
    # 공유 패키지 기능 명세 (해당 앱 명세서에 포함)
```

## 앱별 기능 명세

### Blog (`apps/blog`)

공개 블로그 애플리케이션 기능 명세

- [ISR 기반 콘텐츠 전달](apps/blog/isr-content-delivery.md) `생성일: 2025-12-26`
  - ISR(Incremental Static Regeneration)을 활용한 정적/동적 하이브리드 콘텐츠 전달
  - 60초 자동 재검증 (포스트, 홈)
  - On-Demand 재검증 API
  - OG 이미지 동적 생성

- [조회수 추적 시스템](apps/blog/view-tracking.md) `생성일: 2025-12-26`
  - Redis 기반 세션 당 중복 방지 조회수 추적
  - TanStack Query로 클라이언트 캐싱 (1분)
  - 봇 필터링 (User-Agent)
  - 통계 조회 (총 조회수, 인기글)

- [검색 및 콘텐츠 발견](apps/blog/search-and-discovery.md) `생성일: 2025-12-26`
  - 서버 사이드 검색 (제목, 설명, 태그, 내용)
  - 태그 필터링 및 태그 목록
  - 시리즈 네비게이션 (이전/다음)
  - 연관 포스트 추천 (알고리즘 기반)
  - 인기글/최신글 위젯

- [콘텐츠 렌더링](apps/blog/content-rendering.md) `생성일: 2025-12-26`
  - MDX 마크다운 처리 파이프라인
  - Mermaid 차트 렌더링 (다이어그램)
  - 코드 하이라이팅 (syntax highlighting)
  - 이미지 최적화 (WebP/AVIF, lazy loading)
  - 목차 (Table of Contents) 자동 생성

- [Blog-Admin 연동](apps/blog/cross-app-integration.md) `생성일: 2025-12-26`
  - Hono RPC를 통한 타입 안전한 통신
  - CDC 캐시로 Vercel Blob API 호출 97.6% 절감
  - 조회수, 통계, Blob 파일 조회
  - 경력 타임라인, 뉴스레터 구독

### Blog Admin (`apps/blog-admin`)

블로그 관리자 대시보드의 핵심 기능 명세

- **NEW**: [Image Upload UX Enhancements](apps/blog-admin/image-upload-ux-enhancements.md) `생성일: 2026-01-02`
  - 다중 파일 업로드 (최대 20개)
  - 드래그 앤 드롭 지원
  - 붙여넣기로 이미지 업로드 (Ctrl+V)
  - 커서 위치에 이미지 자동 삽입
  - 클라이언트 직접 업로드 (Vercel Blob Client SDK)
  - 성공/실패 피드백
  - **ROI**: 2,977% (월간)

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

- [Experience Management System](apps/blog-admin/experience-management.md) `생성일: 2025-12-31` ✨ NEW
  - 경력 타임라인 및 성과 관리
  - Experience, Achievement Prisma 모델
  - Blog About 페이지 통합
  - 드래그앤드롭 정렬
  - 초기 데이터 시드 기능

- [RAG Integration System](apps/blog-admin/rag-integration.md) `생성일: 2025-12-31` ✨ NEW
  - RAG Gateway 연동
  - 채팅형 UI (대화형 질문/답변)
  - 의미론적 콘텐츠 검색
  - Server Action 기반 API Key 보호
  - Temperature/limit 파라미터 조절

### RAG Gateway (`apps/rag-gateway`)

RAG(Retrieval-Augmented Generation) 게이트웨이 기능 명세

- [Index](apps/rag-gateway/index.md) - RAG Gateway 개요 및 아키텍처
- [Document Ingestion](apps/rag-gateway/document-ingestion.md) - 문서 수집 파이프라인
- [MCP Integration](apps/rag-gateway/mcp-integration.md) - Model Context Protocol
- [Multi-LLM Strategy](apps/rag-gateway/multi-llm-strategy.md) - 멀티 LLM 전략
- [RAG Query Pipeline](apps/rag-gateway/rag-query-pipeline.md) - 쿼리 파이프라인
- [Render Deployment](apps/rag-gateway/render-deployment.md) - Render 배포
- [Security Layer](apps/rag-gateway/security-layer.md) - 보안 레이어
- [Stale Document Cleanup](apps/rag-gateway/stale-document-cleanup.md) - 오래된 문서 정리
- [Vector Search](apps/rag-gateway/vector-search.md) - 벡터 검색

### Shared Packages (`packages/`)

공유 패키지 기능 명세 (해당 앱 명세서에 포함)

## 명세서 작성 가이드

### 필수 섹션

모든 기능 명세서는 다음 섹션을 포함해야 합니다:

1. **개요 (Overview)**: 목적, 범위, 비즈니스 가치
2. **핵심 기능 (Core Features)**: 기능 목록과 상세 동작
3. **기술 사양 (Technical Specifications)**: 아키텍처와 의존성
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
- **Needs Verification**: Facts가 오래되어 재검증 필요

### 증거 기반 명세

모든 기술적 주장은 다음 중 하나로 뒷받침되어야 합니다:

- Facts 문서 링크: `../../facts/apps/...`
- Insights 문서 링크: `../../insights/apps/...`
- 코드 위치 참조: `path/to/file.ts`
- TBD 표기: 확인되지 않은 사항

### Stale Facts Detection

**문제**: Facts가 변경되었는데 명세서가 업데이트되지 않은 경우

**해결**:
- Facts verification status 섹션 포함
- `source_exists: false` 항목 경고
- Git hash로 최신성 확인

## 명세서 템플릿

새로운 기능 명세서 작성 시 [feature-spec-writer](../agents/feature-spec-writer.md) 에이전트를 사용하거나, 기존 명세서를 복사하여 사용하세요.

## Last Updated

- **날짜**: 2025-12-31
- **커밋**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d
- **전체 명세서 수**: 17개
  - Blog: 5개
  - Blog Admin: 5개 (Experience, RAG 추가)
  - RAG Gateway: 7개
- **상태**: 모든 명세서 As-Is (현재 구현됨)

## 최신 변경 사항

### 2025-12-31 업데이트

**Blog-Admin**:
- ✨ **NEW**: [Experience Management System](apps/blog-admin/experience-management.md)
  - 경력 타임라인 관리 기능
  - Experience, Achievement Prisma 모델
  - Blog About 페이지 통합

- ✨ **NEW**: [RAG Integration System](apps/blog-admin/rag-integration.md)
  - RAG Gateway Hono RPC 연동
  - 채팅형 UI
  - 의미론적 콘텐츠 검색
  - Server Action 기반 API Key 보호
