# Blog-Admin Needed Data Collection

- **Scope**: blog-admin 애플리케이션 분석 및 최적화에 필요한 데이터 목록
- **Priority**: High/Medium/Low
- **Collection Method**: Automatic/Manual/Survey
- **Based on Insights**:
  - [../impact/roi.md](../impact/roi.md)
  - [../impact/cost.md](../impact/cost.md)
  - [../impact/customer.md](../impact/customer.md)
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 현재 미추적 메트릭 (Currently Untracked Metrics)

### 개발 생산성 지표 (High Priority)

#### 개발 시간 추적
- **데이터 유형**: Feature별 개발 소요 시간
- **단위**: 시간
- **수집 방법**: Jira/GitHub Integration + Time tracking
- **수집 주기**: 실시간
- **목표**: FSD 레이어별 개발 시간 벤치마크 구축

```javascript
// 예시 데이터 구조
{
  feature: "ImageUploader",
  layer: "shared/ui",
  estimatedHours: 8,
  actualHours: 5.5,
  complexity: "Medium",
  developer: "dev@company.com"
}
```

#### 코드 재사용률
- **데이터 유형**: 컴포넌트 재사용 횟수
- **단위**: 재사용 횟수 / 총 사용次数
- **수집 방법**: Static code analysis
- **수집 주기**: 주간
- **목표**: 60% → 80% 향상

#### 버그 발생률
- **데이터 유형**: 레이어별 버그 발생 빈도
- **단위**: 버그 수 / 1,000 LOC
- **수집 방법**: Bug tracking integration
- **수집 주기**: 주간
- **세부사항**:
  - 버그 유형 (Runtime, Type, Logic)
  - 발생 레이어 (entities, features, shared)
  - 수정 시간

### API 성능 메트릭 (High Priority)

#### API 호출 패턴 분석
- **데이터 유형**: 엔드포인트별 호출 빈도 및 응답시간
- **단위**: calls/min, ms
- **수집 방법**: Vercel Analytics + Custom logging
- **수집 주기**: 실시간
- **필요 데이터**:
  ```json
  {
    endpoint: "/api/rpc/blob-files",
    method: "GET",
    calls: 150,
    avgResponseTime: 120,
    p95ResponseTime: 250,
    errorRate: 0.01
  }
  ```

#### 캐시 적중률
- **데이터 유형**: Redis 캐시 히트/미스 비율
- **단위**: %
- **수집 방법**: Redis monitoring
- **수집 주기**: 실시간
- **목표**: 95% 이상 유지

#### 데이터베이스 쿼리 성능
- **데이터 유형**: Slow query 로그
- **단위**: ms
- **수집 방법**: Neon query logs
- **수집 주기**: 실시간
- **임계값**: 100ms 이상 쿼리 추적

### 사용자 행동 데이터 (Medium Priority)

#### 기능별 사용 빈도
- **데이터 유형**: Admin 기능 사용 패턴
- **수집 방법**: Analytics tracking
- **수집 주기**: 일간
- **추적 기능**:
  - 파일 업로드: 60회/월
  - 포스트 편집: 45회/월
  - 태그 관리: 20회/월
  - 뉴스레터 관리: 5회/월

#### 세션 시간
- **데이터 유형**: 평균 세션 지속 시간
- **단위**: 분
- **수집 방법**: Session tracking
- **수집 주기**: 일간

#### 사용 흐름 분석
- **데이터 유형**: 일반적인 사용자 경로
- **수집 방법**: Funnel analysis
- **분석 대상**:
  - 로그인 → 대시보드 → 파일 관리
  - 포스트 작성 → 미리보기 → 발행
  - 설정 변경 → 확인

## 비용 추적 데이터 (High Priority)

### 세부 인프라 비용
- **Vercel Blob API 사용량**:
  - 일별/시간별 호출 패턴
  - 데이터 전송량
  - 스토리지 사용량

- **Neon DB 사용량**:
  - 컴퓨팅 시간 (compute time)
  - 데이터 전송
  - 스토리지
  - 백업 사용량

### 개발 리소스 비용
- **개발자별 작업 시간**:
  - Feature별 소요 시간
  - 버그 수정 시간
  - 리뷰 시간
  - 학습 시간

- **자동화 효과 측정**:
  - 수동 작업 절감 시간
  - 반복 작업 자동화률

## 모니터링 및 경고 데이터 (Medium Priority)

### 시스템 상태 모니터링
- **서버리스 함수 성능**:
  - Cold start 시간
  - 메모리 사용률
  - CPU 사용률
  - 동시 실행 수

- **데이터베이스 상태**:
  - 연결 풀 상태
  - 쿼리 대기 시간
  - 인덱스 효율

### 비즈니스 KPI 모니터링
- **콘텐츠 생산성**:
  - 월간 포스트 발행 수
  - 평균 포스트 길이
  - 미디어 파일 수

- **운영 효율성**:
  - 배포 빈도
  - 롤백률
  - 다운타임

## 데이터 수집 우선순위

### 즉시 수집 (1개월 내)
1. **개발 시간 추적 시스템 구축**
   - 도구: Clockify/Toggl + Jira 연동
   - 예상 비용: $50/월
   - 기대 효과: 정확한 ROI 계산

2. **API 성능 모니터링 강화**
   - 도구: Vercel Analytics + New Relic
   - 예상 비용: $100/월
   - 기대 효과: 성능 병목 파악

3. **캐시 성능 대시보드**
   - 도구: Redis Insight + Grafana
   - 예상 비용: $30/월
   - 기대 효과: 캐시 효율 최적화

### 단기 수집 (3개월 내)
1. **사용자 행동 추적**
   - 도구: Hotjar + Custom analytics
   - 예상 비용: $90/월
   - 기대 효과: UX 개선 기반 확보

2. **자동화 효과 측정**
   - 도구: Custom metrics + logs
   - 예상 비용: 개발 비용 $2,000
   - 기대 효과: 자동화 ROI 정량화

3. **코드 품질 메트릭**
   - 도구: SonarQube + CodeClimate
   - 예상 비용: $150/월
   - 기대 효과: 기술 부채 관리

### 장기 수집 (6개월 내)
1. **머신러닝 기반 예측**
   - 용도: 비용 예측, 장애 예측
   - 예상 비용: $500/월
   - 기대 효과: 선제적 대응 능력

2. **A/B 테스팅 프레임워크**
   - 용도: UI/UX 개선 효과 측정
   - 예상 비용: $200/월
   - 기대 효과: 데이터 기반 의사결정

## 데이터 수집 권장 사항

### 기술 스택
```yaml
추천 도구:
  시간 추적: Toggl Track
  성능 모니터링: Vercel Analytics + New Relic
  사용자 분석: Hotjar + Mixpanel
  로그 관리: Datadog
  비용 분석: Vercel + CloudHealth
```

### 데이터 거버넌스
- **보안**: PII 데이터 마스킹
- **개인정보**: GDPR 준수
- **보관 정책**: 2년
- **접근 권한**: Role-based

### 성능 고려사항
- **수집 주기**: 실시간 > 일간 > 주간 > 월간
- **데이터 압축**: 로그 데이터 압축 저장
- **쿼리 최적화**: 인덱스 기반 쿼리
- **비용 최적화**: 샘플링 활용

## 수집 계획 로드맵

### Phase 1 (Month 1): 기반 구축
- [ ] 개발 시간 추적 시스템 구축
- [ ] API 성능 모니터링 설정
- [ ] 기본 대시보드 구현

### Phase 2 (Month 2): 확장
- [ ] 캐시 성능 모니터링
- [ ] 사용자 행동 추적 시작
- [ ] 비용 추적 자동화

### Phase 3 (Month 3): 고도화
- [ ] 머신러닝 기반 예측 모델
- [ ] A/B 테스팅 프레임워크
- [ ] 자동화된 보고 시스템

## 참고 자료

- [Data Collection Best Practices](https://docs.google.com/document/d/123)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Neon Database Monitoring](https://neon.tech/docs/reference/monitoring)
- [FSD Metrics Guidelines](https://feature-sliced.design/docs/guides/metrics)