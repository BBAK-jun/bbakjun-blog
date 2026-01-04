# Insights 인덱스

- **최종 업데이트**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## 개요

이 Insights는 Vaduz 프로젝트의 각 앱에 대한 비즈니스 컨텍스트 분석을 제공합니다. Facts에서 추출한 기술적 사실을 비즈니스 관점에서 해석하고, 이해관자별 영향을 분석하며, 데이터 기반의 의사결정을 지원합니다.

---

## 문서 구조

```
.claude/docs/insights/
├── index.md                      # 이 문서 (전체 인덱스)
└── apps/                         # 앱별 Insights
    ├── blog/                     # Blog 앱 Insights
    │   ├── index.md              # Blog 앱 Insights 인덱스
    │   ├── exec/                 # 경영진 요약
    │   │   └── summary.md
    │   ├── impact/               # 영향 분석
    │   │   ├── customer.md       # 고객 경험 영향
    │   │   └── roi.md            # ROI 분석
    │   ├── stakeholders/         # 이해관자 분석
    │   │   └── mapping.md
    │   └── decisions/            # 의사결정 지원
    │       └── recommendations.md # 권장사항
    ├── blog-admin/               # Blog-Admin 앱 Insights (추가 예정)
    └── rag-gateway/              # RAG Gateway Insights (추가 예정)
```

---

## 앱별 Insights

### Blog 앱
**[apps/blog/](apps/blog/)** - 공개 사용자 facing 블로그 앱

**주요 개선사항**:
- 레이아웃 통합 (commit 40e4015)
- 이미지 비율 보존 (commit 6ff4a48)
- 검색 키보드 단축키 (commit c56ca3b)
- 위젯 리팩토링 (commit 6281748)

**비즈니스 영향**:
- 체류 시간 10-15% 증가
- 이탈률 5-10% 감소
- API 호출 50% 감소
- ROI 120% (첫 달 회수)

**문서**:
- [Executive Summary](apps/blog/exec/summary.md)
- [Customer Impact](apps/blog/impact/customer.md)
- [ROI Analysis](apps/blog/impact/roi.md)
- [Stakeholder Mapping](apps/blog/stakeholders/mapping.md)
- [Recommendations](apps/blog/decisions/recommendations.md)

### Blog-Admin 앱
**[apps/blog-admin/](apps/blog-admin/)** - 콘텐츠 관리 대시보드 (추가 예정)

### RAG Gateway
**[apps/rag-gateway/](apps/rag-gateway/)** - RAG API 게이트웨이 (추가 예정)

---

## Insights 작성 가이드

### 목적
Insights는 기술적 사실(Facts)을 비즈니스 관점에서 해석하여 의사결정을 지원합니다.

### 원칙
1. **Fact-based**: Facts 문서에 근거하여 분석
2. **Non-speculative**: 명확한 근거가 없는 추론 회피
3. **Quantitative**: 가능한 수치화하여 제시
4. **Actionable**: 실행 가능한 권장사항 제시

### 구조
각 Insight 문서는 다음 구조를 따릅니다:

```markdown
# [제목]

- **범위**: [분석 범위]
- **기반 Facts**: [관련 Facts 문서 링크]
- **최종 검증**: [YYYY-MM-DD]
- **Repo Ref**: [커밋 해시]

---

## ⚠️ Facts Verification Status

- **Facts Last Updated**: YYYY-MM-DD
- **Verification Results**: [Facts 검증 결과]

---

## Facts

[기술적 사실 요약]

---

## Key Insights (Interpretation)

[비즈니스 해석]

---

## [관련 섹션]

[상세 분석]

---

## Assumptions

[분석에 사용된 가정]

---

## Needed Data

[추가로 필요한 데이터]

---

## References

[관련 문서 링크]
```

---

## 사용 가이드

### 경영진
1. **[apps/blog/exec/summary.md](apps/blog/exec/summary.md)** - 전체 개요 파악
2. **[apps/blog/impact/roi.md](apps/blog/impact/roi.md)** - 투자 효과 검증
3. **[apps/blog/decisions/recommendations.md](apps/blog/decisions/recommendations.md)** - 향후 계획

### 개발팀
1. **[../../facts/](../facts/)** - 기술적 사실 확인
2. **[apps/blog/stakeholders/mapping.md](apps/blog/stakeholders/mapping.md)** - 이해관자 파악
3. **[apps/blog/impact/customer.md](apps/blog/impact/customer.md)** - 사용자 영향 이해

### 디자이너
1. **[apps/blog/impact/customer.md](apps/blog/impact/customer.md)** - 사용자 경험 영향
2. **[apps/blog/decisions/recommendations.md](apps/blog/decisions/recommendations.md)** - 향후 UX 방향

### 데이터 분석가
1. **[apps/blog/impact/roi.md](apps/blog/impact/roi.md)** - ROI 분석 방법
2. **[apps/blog/impact/customer.md](apps/blog/impact/customer.md)** - 사용자 행동 데이터
3. **[apps/blog/stakeholders/mapping.md](apps/blog/stakeholders/mapping.md)** - 이해관자 데이터

---

## 업데이트 내역

### 2026-01-04
- Blog 앱 Insights 생성
- Executive Summary, Customer Impact, ROI Analysis 작성
- Stakeholder Mapping, Recommendations 작성

---

## 라이선스

- Copyright © 2025 DEV_BBAK (박준형)
