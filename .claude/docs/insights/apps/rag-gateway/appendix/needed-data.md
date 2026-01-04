# RAG Gateway - Needed Data

- **Scope**: 비즈니스 분석 개선을 위해 필요한 데이터
- **Based on Facts**: All facts documents
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## Executive Summary

본 문서는 RAG Gateway의 비즈니스 분석을 개선하기 위해 **수집이 필요한 데이터**를 명시합니다. 데이터는 **우선순위별**로 분류되며, **수집 방법과 예상 effort**를 포함합니다.

---

## High Priority (즉시 수집 필요)

### 1. 테스트 효과 측정

#### 데이터 1.1: 현재 버그 발생률
- **목적**: 테스트 ROI 정확한 계산
- **필요한 데이터**:
  - 월별 프로덕션 버그 수 (테스트 도입 전후 비교)
  - 버그 심각도별 분포 (Critical/High/Medium/Low)
  - 버그 발생 레이어 (Handler/Service/Middleware)
- **수집 방법**:
  - GitHub Issues 분석
  - Sentry/LogRocket 에러 추적 (도입 시)
  - 개발팀 인터뷰
- **예상 effort**: 2-4시간
- **빈도**: 월간

#### 데이터 1.2: 버그 수정 시간
- **목적**: 테스트 투자 ROI 계산
- **필요한 데이터**:
  - 프로덕션 버그 수정 소요 시간 (평균)
  - 개발 환경 버그 수정 소요 시간 (평균)
  - 버그 수정 비용 (시간 × 시급)
- **수집 방법**:
  - GitHub PR/Issue 타임스탬프 분석
  - 개발팀 인터뷰
- **예상 effort**: 2-3시간
- **빈도**: 월간

#### 데이터 1.3: 테스트 실행 시간
- **목적**: CI/CD 파이프라인 최적화
- **필요한 데이터**:
  - 전체 테스트 스위트 실행 시간
  - 테스트별 실행 시간 분포
  - 병렬 실행 가능성
- **수집 방법**:
  - Vitest 실행 시간 측정
  - `pnpm --filter=rag-gateway test --reporter=verbose`
- **예상 effort**: 1시간
- **빈도**: 주간 (테스트 추가 시)

---

### 2. 비용 분석

#### 데이터 2.1: 실제 API 사용량
- **목적**: 정확한 비용 예측
- **필요한 데이터**:
  - 월별 토큰 사용량 (임베딩, LLM 별도)
  - 일별/시간별 사용량 분포
  - 쿼리별 토큰 소비 분포
- **수집 방법**:
  - OpenAI Dashboard (Usage)
  - Zhipu AI Dashboard (GLM 사용 시)
  - 사용량 로그 분석
- **예상 effort**: 2-3시간
- **빈도**: 일간

#### 데이터 2.2: 벤더별 청구서
- **목적**: 실제 비용 기반 ROI 계산
- **필요한 데이터**:
  - OpenAI 월별 청구서
  - Zhipu AI 월별 청구서
  - Qdrant Cloud 월별 청구서
  - Vercel/Render 월별 청구서
- **수집 방법**:
  - 각 벤더 대시보드에서 청구서 다운로드
- **예상 effort**: 1시간/월
- **빈도**: 월간

#### 데이터 2.3: 캐시 적중률
- **목적**: 캐시 효과 측정
- **필요한 데이터**:
  - 임베딩 캐시 적중률 (text hash → vector)
  - 답변 캐시 적중률 (도입 시)
  - 캐시 미스 시 API 호출 횟수
- **수집 방법**:
  - EmbeddingService.getCacheStats() 로그 추가
  - 캐시 히트/미스 카운터 구현
- **예상 effort**: 2-3시간 (구현)
- **빈도**: 일간

---

### 3. 운영 효율

#### 데이터 3.1: 장애 대응 시간
- **목적**: 모니터링 효과 측정
- **필요한 데이터**:
  - 장애 발생 시간 (Timestamp)
  - 장애 감지 시간 (Detection Time)
  - 장애 해결 시간 (Resolution Time)
  - 장애 원인별 분류
- **수집 방법**:
  - 장애 로그 분석
  - 운영팀 인터뷰
  - 알림 시스템 로그
- **예상 effort**: 3-4시간
- **빈도**: 월간

#### 데이터 3.2: 시스템 성능 메트릭
- **목적**: 성능 병목 지점 발견
- **필요한 데이터**:
  - 평균 응답 시간 (p50, p95, p99)
  - API 엔드포인트별 응답 시간
  - Qdrant 검색 시간
  - LLM 생성 시간
- **수집 방법**:
  - Pino 로그 분석 (queryTime 필드)
  - Datadog/NewRelic (도입 시)
- **예상 effort**: 2-3시간
- **빈도**: 일간

---

## Medium Priority (3개월 내 수집)

### 4. 품질 메트릭

#### 데이터 4.1: GLM vs OpenAI 품질 비교
- **목적**: GLM 전환 결정 지원
- **필요한 데이터**:
  - A/B 테스트 결과 (품질, 속도, 만족도)
  - 답변 정확도 (인간 평가)
  - 답변 관련성 (사용자 피드백)
- **수집 방법**:
  - A/B 테스트 구현 (50% GLM, 50% OpenAI)
  - 사용자 피드백 시스템 (좋아요/싫어요)
  - 전문가 평가 (샘플 100개 답변)
- **예상 effort**: 20-30시간 (A/B 테스트 구현)
- **빈도**: 일회성 (2주간)

#### 데이터 4.2: 사용자 만족도
- **목적**: 답변 품질 지속적 개선
- **필요한 데이터**:
  - 답변 만족도 (좋아요/싫어요 비율)
  - 출처 클릭률 (Source Click-through Rate)
  - 재검색률 (Same user re-query rate)
- **수집 방법**:
  - 피드백 UI 구현
  - 클릭 이벤트 추적
- **예상 effort**: 10-15시간 (구현)
- **빈도**: 월간 조사

#### 데이터 4.3: 검색 정확도
- **목적**: 검색 품질 개선
- **필요한 데이터**:
  - 검색 결과 관련성 (Precision@k)
  - 재현율 (Recall@k)
  - NDCG (Normalized Discounted Cumulative Gain)
- **수집 방법**:
  - 테스트 데이터셋 구축 (100개 쿼리)
  - 전문가 라벨링
  - 메트릭 계산
- **예상 effort**: 15-20시간
- **빈도**: 분기별

---

### 5. 사용자 행동

#### 데이터 5.1: 콘텐츠 발견율 개선
- **목적**: RAG 가치 입증
- **필요한 데이터**:
  - RAG 도입 전 콘텐츠 발견율 (키워드 검색)
  - RAG 도입 후 콘텐츠 발견율
  - 페이지뷰 증가율
- **수집 방법**:
  - Google Analytics 분석
  - A/B 테스트 (RAG vs 키워드 검색)
- **예상 effort**: 8-10시간
- **빈도**: 분기별

#### 데이터 5.2: 쿼리 패턴 분석
- **목적**: 사용자 needs 파악
- **필요한 데이터**:
  - 쿼리 의도별 분포 (search/explain/how_to/troubleshoot)
  - 자주 묻는 질문 (Top queries)
  - 검색 결과 없는 쿼리 (Zero-result queries)
- **수집 방법**:
  - 쿼리 로그 분석
  - 클러스터링 (의도 분류)
- **예상 effort**: 5-8시간
- **빈도**: 월간

---

## Low Priority (6개월 이내 수집)

### 6. 경쟁사 벤치마킹

#### 데이터 6.1: 유사 RAG 시스템 비교
- **목적**: 경쟁력 위치 확인
- **필요한 데이터**:
  - 경쟁사 RAG 시스템 품질
  - 경쟁사 가격 정책
  - 경쟁사 기능 비교
- **수집 방법**:
  - 경쟁사 테스트 (Anonymous)
  - 공개된 벤치마크 참고
- **예상 effort**: 10-15시간
- **빈도**: 반기별

---

## Data Collection Timeline

### Month 1: 기본 메트릭 수집
- [ ] 버그 발생률 및 수정 시간
- [ ] API 사용량 및 청구서
- [ ] 캐시 적중률 구현
- [ ] 장애 대응 시간

### Month 2-3: 품질 메트릭
- [ ] GLM vs OpenAI A/B 테스트
- [ ] 사용자 피드백 시스템 구현
- [ ] 검색 정확도 측정

### Month 4-6: 사용자 행동
- [ ] 콘텐츠 발견율 A/B 테스트
- [ ] 쿼리 패턴 분석
- [ ] 경쟁사 벤치마킹

---

## Data Collection Tools

### 로그 분석
- **Pino**: 구조화된 로그 (현재 사용)
- **Loki**: 로그 집계 (도입 고려)
- **Grafana**: 시각화 (도입 고려)

### 모니터링
- **Vercel Analytics**: 월간 메트릭 (무료)
- **Sentry**: 에러 추적 (무료 플랜)
- **Datadog**: APM (유료, $15/host/month)

### A/B 테스트
- **Custom 구현**: GitHub Issues 분석
- **Optimizely**: A/B 테스트 플랫폼 (유료)
- **Google Optimize**: 무료 A/B 테스트 (2023년 종료)

---

## Effort Summary

| 우선순위 | 데이터 카테고리 | 예상 effort |
|----------|----------------|-------------|
| High | 테스트 효과 측정 | 5-7시간 |
| High | 비용 분석 | 5-7시간 |
| High | 운영 효율 | 5-7시간 |
| Medium | 품질 메트릭 | 45-65시간 (A/B 테스트 포함) |
| Medium | 사용자 행동 | 13-18시간 |
| Low | 경쟁사 벤치마킹 | 10-15시간 |
| **합계** | | **83-119시간** |

---

## References

- [Executive Summary](../exec/summary.md)
- [Impact - ROI Analysis](../impact/roi.md)
- [Impact - Cost Analysis](../impact/cost.md)
- [Appendix - Assumptions](./assumptions.md)
