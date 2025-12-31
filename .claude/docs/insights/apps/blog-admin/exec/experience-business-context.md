# Experience Management - Business Context Analysis

- **App**: apps/blog-admin
- **Feature**: Experience Management System
- **Last Verified**: 2025-12-31
- **Repo Ref**: c0049e1e70738fbbfaee84f1ebcf7964c7c7d62d

## ⚠️ Facts Verification Status

- **Last Facts Update**: 2025-12-31
- **Verification Results**:
  - `../../facts/apps/blog-admin/features/experience-management.md`: ✅ Verified
  - `../../facts/apps/blog-admin/schemas/db.md`: ✅ Verified
- **Analysis Status**: As-Is (현재 구현)

## Executive Summary

경력 관리 시스템은 블로그 소유자의 전문성과 신뢰도를 높이기 위한 핵심 기능입니다. About 페이지에 타임라인 형식으로 경력과 성과를 표시하여 방문자에게 저자의 전문 배경을 명확히 전달할 수 있습니다.

## Facts

### Data from Facts Documents

- **데이터베이스 스키마**: Experience, Achievement 모델 추가됨 (2025-12-31)
- **UI 위치**: `/dashboard/experience`
- **Blog 통합**: About 페이지에 ExperienceTimeline 컴포넌트로 표시
- **초기 데이터**: 5개 회사 경력 데이터 시드 기능 포함
- **CRUD**: Server Actions 기반 전체 CRUD 지원

## Key Insights (Interpretation)

### 1. 비즈니스 가치

**신뢰도 구축**:
- 방문자는 저자의 실무 경험을 통해 콘텐츠의 신뢰성을 판단
- 타임라인 형식으로 직관적인 경력 파악 가능
- 성과(Achievement)별 세부 사항으로 전문성 강조

**개인 브랜딩**:
- 기술 블로그 운영자의 커리어 히스토리 시각화
- 포트폴리오 역할 (About 페이지)
- 네트워킹 및 채용 기회 연결

### 2. 사용자 시나리오

**관리자 워크플로우**:
```
1. 경력 추가 (회사, 직책, 기간)
2. 성과 추가 (제목, 설명, 태그)
3. 드래그앤드롭 정렬
4. Blog About 페이지 실시간 미리보기
5. 변경사항 즉시 반영
```

**방문자 워크플로우**:
```
1. Blog 방문 → About 페이지 클릭
2. 경력 타임라인 확인
3. 관심 회사/성과 클릭
4. 저자 전문성 이해
5. 콘텐츠 신뢰도 증가
```

### 3. 기술적 이점

**데이터 중심 설계**:
- Prisma ORM으로 타입 세이프 데이터 관리
- Experience ↔ Achievement 1:N 관계로 구조화
- 정렬(SortOrder) 필드로 유연한 순서 변경

**UI/UX**:
- 드래그앤드롭 직관적 정렬
- 실시간 미리보기로 즉각적 피드백
- 초기 데이터 시드로 빠른 시작

## Stakeholder Impact

### 블로그 소유자 (Primary)

**Actions**:
- 경력 데이터 유지보수
- 성과 추가로 전문성 강조
- 정렬 조정으로 중요 경력 강조

**Benefits**:
- About 페이지 자동화 (수동 편집 불필요)
- 전문성 시각화로 방문자 신뢰 증가
- 채용/네트워킹 기회 증가

### 방문자 (Secondary)

**Benefits**:
- 저자 배경 빠른 이해
- 콘텐츠 신뢰도 판단 근거
- 관심 분야 확인

## Recommendations

### Short-term (1-2 weeks)

1. **데이터 마이그레이션**:
   - 기존 About 페이지 데이터를 DB로 이전
   - 초기 시드 데이터 검증

2. **SEO 최적화**:
   - Experience/Structured Data 추가
   - 검색 엔진에 경력 정보 제공

### Medium-term (1-2 months)

1. **다국어 지원**:
   - 영문/국문 이중 지원
   - 다국어 경력 관리

2. **이미지 업로드**:
   - 회사 로고 추가
   - 프로젝트 썸네일

### Long-term (3+ months)

1. **LinkedIn 연동**:
   - LinkedIn 프로필 import
   - 자동 동기화

2. **PDF Export**:
   - 경력 이력서 다운로드
   - 포트폴리오 PDF 생성

## Risk Assessment

### Low Risk

- **데이터 손실**: Prisma migrations로 DB 보호
- **UI 복잡도**: 직관적인 CRUD 인터페이스

### Medium Risk

- **SEO 영향**: About 페이지 변경으로 순위 변동 가능
  - **완화**: 301 리디렉션, 메타데이터 유지

### Opportunities

- **네트워킹**: 경력 공개로 새로운 기회 창출
- **채용**: 포트폴리오 역할 강화

## Assumptions

1. 현재 About 페이지가 정적 콘텐츠로 관리됨
2. 경력 데이터가 자주 변경되지 않음 (연 1-2회)
3. 방문자가 About 페이지를 방문하는 빈도가 낮음 (전체 방문의 ~5%)
4. 성과(Achievement)가 경력보다 자주 업데이트됨

## Needed Data

### Analytics

- **About 페이지 방문율**: 현재 대비 변경 후 트래픽 변화
- **체류 시간**: 경력 타임라인 상호작용率
- **전환율**: 연락처 클릭/채용 문의

### User Feedback

- **가용성 테스트**: 경력 추가/편집 용이성
- **시각적 피드백**: 타임라인 디자인 선호도

## References

- Facts: [Experience Management](../../facts/apps/blog-admin/features/experience-management.md)
- Facts: [Database Schema](../../facts/apps/blog-admin/schemas/db.md)
- Code: `apps/blog-admin/src/app/actions/experience.ts`
- Code: `apps/blog-admin/src/app/dashboard/experience/page.tsx`
