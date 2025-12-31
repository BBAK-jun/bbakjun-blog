# GitHub Actions Documentation Automation

이 파이프라인은 main 브랜치에 머지될 때 자동으로 문서를 업데이트합니다. **z.ai glm-4.7** API를 사용합니다.

## 워크플로우 개요

```
main 브랜치 푸시
    ↓
1. 변경 감지 (latest doc tag → HEAD)
    ↓
2. z.ai API로 문서 업데이트 (glm-4.7)
    ↓
3. PR 자동 생성
    ↓
4. PR 머지 시 태그 생성 (docs/update-{run_number}-{timestamp})
```

### 태그 기반 증분 업데이트

- **첫 실행**: 태그가 없으면 `HEAD~1` 사용
- **이후 실행**: 가장 최근 `docs/update-*` 태그부터 변경사항만 반영
- **태그 형식**: `docs/update-{run_number}-{timestamp}`
- **무한 루프 방지**: 자동화 커밋 메시지로 감지하여 건너뜀

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

### GH_PAT (권장)

GitHub Actions가 PR을 생성할 수 있는 Personal Access Token (PAT)입니다.

**왜 필요한가요?**

GitHub의 기본 `GITHUB_TOKEN`은 API를 통한 PR 생성을 제한합니다. PR 자동 생성 기능을 완전히 활성화하려면 PAT를 사용하는 것이 권장됩니다.

**설정 방법:**

1. GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. Name: `Documentation Automation` 또는 원하는 이름
4. Expiration: 원하는 만료 기간 선택 (또는 No expiration)
5. Scopes: `repo` (전체 repository 액세스 권한)
6. "Generate token" 클릭
7. 생성된 토큰 복사
8. Repository → Settings → Secrets and variables → Actions
9. New repository secret 클릭
10. Name: `GH_PAT`
11. Value: 복사한 토큰 붙여넣기

**참고**: `GH_PAT`가 설정되지 않은 경우, 워크플로우는 `GITHUB_TOKEN`을 사용하며 PR 생성이 제한될 수 있습니다.

## 워크플로우 파일

| 파일 | 설명 |
|------|------|
| `.github/workflows/doc-update.yml` | 메인 문서 업데이트 워크플로우 |
| `.github/workflows/doc-tag.yml` | PR 머지 시 태그 생성 워크플로우 |
| `.github/scripts/run-documentation-update.js` | z.ai API 호출 스크립트 |
| `.github/scripts/run-agent-locally.sh` | 로컬 테스트용 스크립트 |

## 로컬에서 테스트하기

```bash
# 기본 테스트 (최신 태그와 현재 HEAD 비교)
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
- **Commit Message**: `docs: automated documentation update`

PR 본문에는 다음 정보가 포함됩니다:

- 변경된 앱 목록
- 생성된 문서 설명
- 태그 기반 증분 업데이트 설명

### PR 머지 시 태그 생성

`automated` 라벨이 있는 PR이 머지되면 자동으로 태그가 생성됩니다:

- **태그 형식**: `docs/update-{run_number}-{timestamp}`
- **태그 메시지**: PR 정보 포함 (번호, 제목, 머지한 사용자)
- **용도**: 다음 문서 업데이트 시 이 태그부터 비교

### 무한 루프 방지

시스템은 무한 루프를 방지하기 위해 두 가지 보호 장치를 갖추고 있습니다:

1. **커밋 메시지 체크**: `docs: automated documentation update`로 시작하는 커밋을 건너뜀
2. **파일 필터**: `.claude/docs/`와 `.github/` 변경사항을 무시

### PR 생성 실패 시

`GH_PAT`가 설정되지 않은 경우, GitHub Actions는 `GITHUB_TOKEN`을 사용합니다. 이 경우 다음 오류가 발생할 수 있습니다:

```
Error: GitHub Actions is not permitted to create or approve pull requests.
```

이런 경우에도 브랜치는 정상적으로 push되므로, 수동으로 PR을 생성할 수 있습니다:

1. Repository 페이지에서 "Pull requests" 탭 클릭
2. "Compare & pull request" 버튼이 표시되는지 확인
3. 또는 직접 compare 페이지로 이동: `https://github.com/{owner}/{repo}/compare/main...docs/auto-update-{run_number}`

### 완전한 자동화를 위한 설정

PR 자동 생성이 완전히 작동하도록 하려면:

1. 위에서 설명한 대로 `GH_PAT` secret 설정
2. PAT에 `repo` scope가 포함되어 있는지 확인
3. Repository의 Actions 권한이 "Read and write permissions"로 설정되어 있는지 확인
   - Settings → Actions → General → Workflow permissions
   - "Read and write permissions" 선택
   - "Allow GitHub Actions to create and approve pull requests" 체크 (Enterprise 한정)
