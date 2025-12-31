# GitHub Actions Documentation Automation

이 파이프라인은 main 브랜치에 머지될 때 자동으로 문서를 업데이트합니다.

## 워크플로우 개요

```
main 브랜치 푸시
    ↓
1. 변경 감지 (git diff)
    ↓
2. 문서 업데이트 실행 (feature-orchestrator)
    ↓
3. PR 자동 생성
```

## 필요한 GitHub Secrets

### ANTHROPIC_API_KEY

Claude AI API를 호출하기 위한 API 키가 필요합니다.

**설정 방법:**

1. GitHub Repository → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. Name: `ANTHROPIC_API_KEY`
4. Value: Anthropic API 키 (`sk-ant-...`)

**API 키 발급 방법:**

- [Anthropic Console](https://console.anthropic.com/) 접속
- API Keys → Create Key
- 클라우드 혹은 로컬 개발용 키 생성

## 워크플로우 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/doc-update.yml` | 메인 GitHub Actions 워크플로우 |
| `.github/scripts/run-documentation-update.js` | 변경 감지 및 문서 업데이트 스크립트 |
| `.github/scripts/run-agent-locally.sh` | 로컬 테스트용 스크립트 |

## 로컬에서 테스트하기

```bash
# 기본 테스트 (main~1과 현재 HEAD 비교)
.github/scripts/run-agent-locally.sh

# 특정 커밋과 비교
.github/scripts/run-agent-locally.sh <commit-hash>
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
