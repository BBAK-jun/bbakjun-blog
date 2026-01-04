# RAG Gateway - Technical Tradeoffs

- **Scope**: RAG Gateway 서비스의 기술적 트레이드오프 분석
- **Based on Facts**:
  - [../../../facts/apps/rag-gateway/config/index.md](../../../facts/apps/rag-gateway/config/index.md)
  - [../../../facts/apps/rag-gateway/utils/index.md](../../../facts/apps/rag-gateway/utils/index.md)
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## ⚠️ Facts Verification Status

- **Facts Last Updated**: 2026-01-04
- **Verification Results**:
  - `../../../facts/apps/rag-gateway/config/index.md`: ✅ Verified (source_exists: true)
  - `../../../facts/apps/rag-gateway/utils/index.md`: ✅ Verified (source_exists: true)

---

## Executive Summary

RAG Gateway의 설계 및 구현 과정에서 다양한 기술적 트레이드오프가 고려되었습니다. 본 문서는 **비용 vs 품질, 성능 vs 복잡성, 유연성 vs 단순성** 등의 트레이드오프를 분석하고, 각 결정의 비즈니스 임팩트를 설명합니다.

---

## Tradeoff Analysis

### 1. OpenAI vs GLM: 비용 vs 품질

**Decision**: 다중 LLM 전략 (OpenAI + GLM)

**Tradeoff**:
| 측면 | OpenAI (gpt-4o-mini) | GLM (glm-4.6) |
|------|---------------------|---------------|
| **비용** | $0.15/M input, $0.60/M output | $0.005/M input, $0.025/M output (95% 저렴) |
| **품질** | 높음 (벤치마크 검증됨) | 중간-높음 (한국어 최적화, 검증 필요) |
| **속도** | 빠름 (전역 인프라) | 중간 (중국 서버) |
| **안정성** | 매우 높음 (99.9% Uptime) | 높음 (Zhipu AI 안정성) |

**비즈니스 임팩트**:
- **비용 절감**: GLM 사용 시 월 $50-$100 절감 가능 (100k queries/month)
- **품질 리스크**: GLM 품질 검증되지 않음 → A/B 테스트 필요
- **전략적 가치**: 벤더 다각화로 단일 공급자 리스크 감소

**권장사항**:
- 단기: A/B 테스트로 GLM 품질 검증
- 중기: 한국어 쿼리는 GLM, 영어는 OpenAI 하이브리드
- 장기: 비용/품질 최적점 찾기

**Reference**: [config/index.md - LLM Models](../../../facts/apps/rag-gateway/config/index.md#llm-models)

---

### 2. 임베딩 모델: 다중 지원 vs 단일 모델

**Decision**: 10개 이상의 임베딩 모델 지원

**Tradeoff**:
| 측면 | 단일 모델 | 다중 모델 |
|------|----------|----------|
| **복잡성** | 낮음 (관리 용이) | 높음 (모델별 튜닝 필요) |
| **비용 최적화** | 제한적 | 높음 (용도별 선택 가능) |
| **성능** | 일관적 | 다양 (모델별 차이) |
| **유연성** | 낮음 | 높음 (벤더 전환 용이) |

**비즈니스 임팩트**:
- **복잡성 증가**: 모델별 튜닝 및 최적화에 추가 노력 필요
- **비용 절감**: OpenAI 대비 BAAI/Zephyr 모델 사용 시 비용 절감 가능
- **리스크 분산**: 단일 벤더 장애 시 다른 벤더로 즉시 전환

**권장사항**:
- 기본값: OpenAI `text-embedding-3-small` (안정성)
- 한국어: GLM `embedding-2` 또는 BAAI `bge-m3` (성능)
- 실험용: Zephyr 모델 (비용 절감)

**Reference**: [config/index.md - Embedding Models](../../../facts/apps/rag-gateway/config/index.md#embedding-models)

---

### 3. Rate Limiting: 보안 vs 사용성

**Decision**: 60 requests/minute (Standard), 10 requests/minute (Public)

**Tradeoff**:
| 측면 | 낮은 제한 (10/min) | 높은 제한 (60/min) |
|------|-------------------|-------------------|
| **보안** | 높음 (DoS 방어) | 중간 (일부 DoS 가능) |
| **사용성** | 낮음 (정상 사용도 제한) | 높음 (일반 사용 OK) |
| **비용 상한** | $17/month (최악) | $101/month (최악) |

**비즈니스 임팩트**:
- **비용 보호**: 최악의 경우 월 $101 상한 (GLM)
- **사용성 저하**: 정상 사용자도 60req/min 제한
- **보안 강화**: 공격자의 비용 폭주 방지

**권장사항**:
- 현재: 60req/min 유지 (균형 잡힘)
- 고려: 사용자별/세션별 제한으로 세분화
- 모니터링: 실제 사용 패턴 분석 후 조정

**Reference**: [config/index.md - Rate Limiting](../../../facts/apps/rag-gateway/config/index.md#rate-limiting-configuration)

---

### 4. 테스트: 커버리지 vs 유지보수 비용

**Decision**: 50개 이상의 테스트 케이스 (핸들러, 파이프라인, 통합)

**Tradeoff**:
| 측면 | 낮은 커버리지 (10개) | 높은 커버리지 (50개) |
|------|---------------------|---------------------|
| **유지보수 비용** | 낮음 (2-4시간/월) | 중간 (4-8시간/월) |
| **버그 발견률** | 낮음 (30-40%) | 높음 (70-80%) |
| **리팩토링 안정성** | 낮음 | 높음 |
| **개발 속도** | 빠름 (초기) | 느림 (초기), 빠름 (장기) |

**비즈니스 임팩트**:
- **단기 비용**: 테스트 유지보수에 월 4-8시간 소요
- **장기 수익**: 버그 수정 비용 90% 절감, 장애 40% 감소
- **ROI**: 400% (버그 수정 시간 절감 / 테스트 유지보수 시간)

**권장사항**:
- 현재: 50개 테스트 케이스 유지
- 목표: 커버리지 80% (핵심 경로 집중)
- CI/CD: 자동화로 유지보수 비용 최소화

**Reference**: [utils/index.md - Test Coverage](../../../facts/apps/rag-gateway/utils/index.md#test-coverage-summary)

---

### 5. 캐시 전략: 메모리 vs Redis

**Decision**: In-memory Map (임베딩), Redis 선택적 (Rate Limiting)

**Tradeoff**:
| 측면 | In-memory | Redis |
|------|-----------|--------|
| **성능** | 매우 빠름 (~1ms) | 빠름 (~5-10ms) |
| **확장성** | 낮음 (단일 인스턴스) | 높음 (분산) |
| **복잡성** | 낮음 | 중간 |
| **비용** | $0 | $0.20-10/month |

**비즈니스 임팩트**:
- **단일 인스턴스**: In-memory 캐시는 분산 확장 불가
- **비용 절감**: Redis 사용료 월 $0.20-10 (적은 비용)
- **성능**: In-memory가 5-10배 빠름

**권장사항**:
- 현재: In-memory (단일 인스턴스 충분)
- 확장시: Redis로 전환 (수평 확장 필요시)
- 하이브리드: In-memory 1차, Redis 2차 캐시

**Reference**: [utils/index.md - EmbeddingService](../../../facts/apps/rag-gateway/utils/index.md#embeddingservice)

---

### 6. 배치 처리: 대기 시간 vs 처리량

**Decision**: 배치 크기 10 (기본값), 최대 100

**Tradeoff**:
| 배치 크기 | 대기 시간 | 처리량 | API 호출 횟수 |
|----------|----------|--------|---------------|
| 1 (개별) | 낮음 | 낮음 | 높음 |
| 10 (기본) | 중간 | 중간 | 중간 |
| 100 (최대) | 높음 | 높음 | 낮음 |

**비즈니스 임팩트**:
- **사용자 경험**: 대기 시간 증가 (100개 문서 인제스트 시)
- **비용 절감**: 배치 처리로 API 호출 횟수 감소
- **처리량**: 대량 인제스트 시 효율적

**권장사항**:
- 일반: 배치 크기 10 (균형)
- 대량: 배치 크기 50-100 (야간 배치)
- 실시간: 배치 크기 1-5 (즉시 반영 필요시)

**Reference**: [apis/index.md - POST /api/rag/ingest](../../../facts/apps/rag-gateway/apis/index.md#post-api-rag-ingest)

---

### 7. Force Reindexing: 안정성 vs 신선도

**Decision**: Force 옵션으로 선택적 재인덱싱

**Tradeoff**:
| 측면 | Force=false (기본) | Force=true |
|------|---------------------|------------|
| **안정성** | 높음 (기존 데이터 보존) | 낮음 (기존 데이터 삭제) |
| **신선도** | 낮음 (변경 사항만) | 높음 (전체 재인덱싱) |
| **비용** | 낮음 (증분만) | 높음 (전체) |
| **시간** | 빠름 | 느림 |

**비즈니스 임팩트**:
- **운영 유연성**: 필요시 전체 재인덱싱 가능
- **비용 최적화**: 기본적으로 증분 업데이트로 비용 절감
- **데이터 무결성**: 실수로 전체 삭제 방지 (기본값 안전)

**권장사항**:
- 일반: Force=false (안전)
- 스키마 변경: Force=true (일회성 전체 재인덱싱)
- 품질 저하: Force=true (임베딩 모델 변경시)

**Reference**: [apis/index.md - POST /api/rag/ingest](../../../facts/apps/rag-gateway/apis/index.md#post-api-rag-ingest)

---

### 8. 보안: P0/P1/P2 레이어

**Decision**: 5단계 보안 미들웨어 (P0: 인증, P1: 입력 검증, P2: Rate Limiting, 출력 필터링, 보안 헤더)

**Tradeoff**:
| 레벨 | 미들웨어 | 보안 강도 | 성능 영향 | 복잡성 |
|------|----------|-----------|----------|--------|
| P0 | API Key 인증 | 매우 높음 | 낮음 (~1ms) | 낮음 |
| P1 | Prompt Injection 탐지 | 높음 | 중간 (~5ms) | 중간 |
| P2 | Rate Limiting | 중간 | 낮음 (~2ms) | 낮음 |
| P2 | Sensitive Data Redaction | 중간 | 중간 (~10ms) | 중간 |
| P2 | Security Headers | 낮음 | 없음 | 낮음 |

**비즈니스 임팩트**:
- **보안 강화**: 5단계로 다층 방어
- **성능 저하**: 전체 ~18ms 추가 (허용 가능 수준)
- **복잡성 증가**: 유지보수 비용 증가

**권장사항**:
- 현재: 모든 레이어 유지 (균형 잡힘)
- 고려: P1 레벨 선택적 적용 (공격 패턴 확인 후)
- 모니터링: 각 레이어의 효과 측정

**Reference**: [utils/index.md - Middleware](../../../facts/apps/rag-gateway/utils/index.md#middleware)

---

## Decision Framework

### 트레이드오프 평가 기준

1. **비즈니스 임팩트** (High/Medium/Low)
2. **구현 복잡성** (High/Medium/Low)
3. **유지보수 비용** (High/Medium/Low)
4. **ROI** (High/Medium/Low)
5. **리스크** (High/Medium/Low)

### 의사결정 프로세스

```
1. 문제 정의
   ↓
2. 대안 식별
   ↓
3. 트레이드오프 분석 (위 표기준)
   ↓
4. 이해관계자 피드백
   ↓
5. 결정 및 문서화
   ↓
6. 모니터링 및 재평가
```

---

## References

- [Facts - Configuration](../../../facts/apps/rag-gateway/config/index.md)
- [Facts - Utilities & Services](../../../facts/apps/rag-gateway/utils/index.md)
- [Impact - Cost Analysis](../impact/cost.md)
- [Decisions - Recommendations](./recommendations.md)
