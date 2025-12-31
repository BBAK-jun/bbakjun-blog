# GitHub Actions Documentation Automation

이 파이프라인은 main 브랜치에 머지될 때 자동으로 문서를 업데이트합니다. **z.ai glm-4.7** API를 사용합니다.

## 워크플로우 개요

```
main 브랜치 푸시
    ↓
1. 변경 감지 (git diff)
    ↓
2. z.ai API로 문서 업데이트 (glm-4.7)
    ↓
3. PR 자동 생성
```

## 필요한 GitHub Secrets

### ZAI_API_KEY (필수)

z.ai의 API 키가 필요합니다. GitHub Marketplace 또는 https://open.bigmodel.cn/에서 발급받으세요.

**설정 방법:**

1. GitHub Repository → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. Name: `ZAI_API_KEY`
4. Value: z.ai API 키

### ZAI_API_BASE (선택)

기본값: `https://open.bigmodel.cn/api/paas/v4/`

별도의 API 엔드포인트를 사용하는 경우 설정하세요.

## 워크플로우 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/doc-update.yml` | 메인 GitHub Actions 워크플로우 |
| `.github/scripts/run-documentation-update.js` | z.ai API 호출 스크립트 |
| `.github/scripts/run-agent-locally.sh` | 로컬 테스트용 스크립트 |

## 로컬에서 테스트하기

```bash
# 기본 테스트 (main~1과 현재 HEAD 비교)
.github/scripts/run-agent-locally.sh

# 특정 커밋과 비교
.github/scripts/run-agent-locally.sh <commit-hash>
```

로컬 테스트 시에는 환경 변수를 설정해야 합니다:

```bash
export ZAI_API_KEY="your-zai-api-key"
node .github/scripts/run-documentation-update.js
```

## 수동 실행

GitHub Actions 탭에서 워크플로우를 수동으로 실행할 수 있습니다:

1. Actions 탭 → "Auto Documentation Update"
2. "Run workflow" 클릭
3. "Force full documentation update" 체크박스로 전체 업데이트 가능

## 문서 구조

```
.claude/docs/
├── facts/apps/<app>/      # 코드베이스 구조 및 기술적 사실
├── insights/apps/<app>/   # 비즈니스 컨텍스트 및 분석
└── specs/apps/<app>/      # 기능 명세서
```

## z.ai API 워크플로우

스크립트는 3단계로 z.ai API를 호출합니다:

1. **Stage 1**: 코드베이스 구조 분석 (Facts)
2. **Stage 2**: 비즈니스 컨텍스트 분석 (Insights)
3. **Stage 3**: 기능 명세서 작성 (Specs)

각 Stage는 이전 Stage의 결과를 의존하므로 순차적으로 실행됩니다.

## PR 자동 생성

변경사항이 감지되면 다음 내용으로 PR이 자동 생성됩니다:

- **Branch**: `docs/auto-update-{run_number}`
- **Title**: `docs: automated documentation update [skip ci]`
- **Labels**: `documentation`, `automated`

PR 본문에는 다음 정보가 포함됩니다:

- 변경된 앱 목록
- 베이스 커밋 정보 (이전/현재)
- 변경된 파일 목록
- 생성된 문서 설명
