# Blog MCP

Blog MCP는 AI Coding Harness가 BBAK 블로그 글을 안전하게 읽고, 검증하고, 수정하고, 발행/RAG 인덱싱까지 위임받기 위한 `blog-admin` 권한 경계의 도구 API입니다.

## 원칙

- AI Coding Harness나 로컬 MCP adapter에 `BLOB_READ_WRITE_TOKEN`을 주지 않습니다.
- Blob write, CDC sync, audit logging은 `blog-admin`에서 수행합니다.
- MCP client는 별도 `BLOG_MCP_API_KEYS`로 인증하고 scope로 인가됩니다.
- 삭제와 덮어쓰기는 `expectedHash` 기반으로 보호합니다.
- 공개 발행 전에는 회사/프로젝트 식별자, 내부 문서 경로, 운영 구조, 모델 버전, secret-like 문자열을 `scan_post_safety`와 write guard로 검사합니다.

## HTTP API

```txt
GET  /api/rpc/blog-mcp/tools
POST /api/rpc/blog-mcp/invoke
```

인증 헤더:

```txt
Authorization: Bearer <BLOG_MCP_API_KEY>
```

## 환경변수

`apps/blog-admin` 런타임에 다음 값을 설정합니다.

```env
BLOG_MCP_API_KEYS='[
  {"name":"local-agent","key":"<BLOG_MCP_API_KEY>","scopes":["blog:read","blog:write","blog:publish"]},
  {"name":"readonly-agent","key":"<BLOG_MCP_READONLY_API_KEY>","scopes":["blog:read"]}
]'
```

> 실제 key 값은 레포에 커밋하지 마세요.

지원 scope:

| Scope          | Tools                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `blog:read`    | `list_posts`, `get_post`, `validate_post`, `scan_post_safety`, `prepare_post_update`                     |
| `blog:write`   | `upsert_post`, `upload_image`                                                                            |
| `blog:delete`  | `delete_post`                                                                                            |
| `blog:publish` | `revalidate_post`, `index_post_for_rag`; with `blog:write`, also `publish_post`, `set_post_draft_status` |

## Tools

### `list_posts`

Blob CDC cache에 있는 markdown/MDX post 목록을 조회합니다.

```json
{
  "tool": "list_posts",
  "arguments": {
    "category": "career",
    "limit": 20,
    "offset": 0
  }
}
```

### `get_post`

Blob에서 raw markdown/MDX와 현재 `sha256` hash를 가져옵니다.

```json
{
  "tool": "get_post",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx"
  }
}
```

### `validate_post`

글 경로와 front matter를 검증합니다. Blob에는 쓰지 않습니다.

```json
{
  "tool": "validate_post",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "content": "---\ntitle: ...\ndate: ...\ndescription: ...\ntags: [...]\nauthor: ...\n---\n본문"
  }
}
```

필수 front matter:

- `title`
- `date`
- `description`
- `tags`
- `author`

### `scan_post_safety`

공개 발행 전에 회사와 관련된 민감정보를 제거하거나 일반화했는지 검사합니다. Blob에는 쓰지 않습니다.

검사 대상 예시:

- 회사명, 내부 repo/project/service 이름
- 내부 문서/source path
- commit/branch/ticket 세부 정보
- 실제 운영/장애/eval/HITL/CS 흐름을 추정할 수 있는 표현
- 내부에서 쓰는 특정 vendor/model/version 정보
- secret/token/api key/password 형태의 문자열

```json
{
  "tool": "scan_post_safety",
  "arguments": {
    "pathname": "DEV/example.mdx",
    "content": "---\ntitle: ...\n---\n본문"
  }
}
```

응답은 `safeToPublish`, severity별 `summary`, line number와 수정 권고를 포함한 `findings`, 그리고 공개 전 체크리스트를 반환합니다.

`upsert_post`, `publish_post`, `set_post_draft_status(draft:false)`는 같은 검사를 write guard로 사용합니다. `draft: false`인 글에서 high/medium finding이 남아 있으면 publish/write가 `Public safety review failed`로 차단됩니다. 단, `draft: true` 글은 저장할 수 있고 응답의 `safety` 필드로 findings를 확인할 수 있습니다.

### `prepare_post_update`

기존 Blob post를 읽어서 실제 write 없이 안전한 수정 계획을 만듭니다. 현재 `expectedHash`, 변경 전/후 front matter, preview diff, 그리고 다음에 호출할 tool과 arguments를 반환합니다. 사람이 diff를 확인한 뒤 `suggestedArguments.dryRun`을 `false`로 바꿔 `publish_post` 또는 `upsert_post`를 실행하는 흐름을 의도합니다.

지원 입력:

- `pathname`: 기존 markdown/MDX post 경로
- `patch.title`, `patch.description`, `patch.tags`, `patch.draft`: front matter 일부 수정
- `content`: 본문만 교체할 때 사용
- `publish: true`: 준비된 결과를 `draft: false`로 만들고 `suggestedNextTool`을 `publish_post`로 반환

```json
{
  "tool": "prepare_post_update",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "patch": {
      "title": "Prepared title",
      "description": "Prepared description",
      "tags": ["AI", "MCP"]
    },
    "publish": true
  }
}
```

응답 핵심 필드:

- `expectedHash`: 후속 write/publish에 반드시 넘길 현재 hash
- `nextHash`: 준비된 content의 hash
- `previous` / `next`: 변경 전/후 front matter
- `changedFields`: 변경된 field 목록
- `preview.action`, `preview.summary`, `preview.size`, `preview.diff.lines`
- `suggestedNextTool`: `publish_post` 또는 `upsert_post`
- `suggestedArguments`: 후속 호출에 바로 사용할 `{ pathname, content, expectedHash, dryRun: true }`

### `upsert_post`

글을 생성하거나 수정합니다. `dryRun`으로 사전 검증할 수 있고, 기존 글 수정 시 `expectedHash`를 넘기면 사람/다른 agent가 바꾼 글을 덮어쓰는 것을 막습니다.

`dryRun: true` 응답에는 실제 write 없이 다음 preview metadata가 포함됩니다.

- `preview.action`: `create` | `update` | `no_change`
- `preview.summary`: 사람이 읽기 쉬운 변경 요약
- `preview.size.previous` / `preview.size.next` / `preview.size.delta`
- `preview.diff.lines`: 변경 라인을 `-old`, `+new` 형태로 제한된 줄 수만 반환

```json
{
  "tool": "upsert_post",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "content": "...",
    "expectedHash": "optional-current-sha256",
    "dryRun": true
  }
}
```

### `delete_post`

삭제는 위험 작업이라 `expectedHash`와 정확한 확인 문구가 필요합니다.

```json
{
  "tool": "delete_post",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "expectedHash": "current-sha256",
    "confirm": "DELETE career/ai-coding-harness-delegation.mdx",
    "dryRun": true
  }
}
```

### `upload_image`

base64 이미지 파일을 Blob에 업로드하고 markdown image syntax를 반환합니다.

```json
{
  "tool": "upload_image",
  "arguments": {
    "filename": "diagram.png",
    "contentBase64": "...",
    "alt": "architecture diagram"
  }
}
```

### `revalidate_post`

public blog revalidation endpoint를 호출합니다.

```json
{
  "tool": "revalidate_post",
  "arguments": {
    "slug": "career/ai-coding-harness-delegation"
  }
}
```

### `index_post_for_rag`

Blob post를 읽어 RAG Gateway 문서 인덱스에 전달합니다.

```json
{
  "tool": "index_post_for_rag",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx"
  }
}
```

### `publish_post`

검증 → `draft: false` 강제 → upsert → revalidation → RAG indexing을 한 번에 실행합니다.

```json
{
  "tool": "publish_post",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "content": "...",
    "expectedHash": "optional-current-sha256",
    "dryRun": true
  }
}
```

### `set_post_draft_status`

기존 Blob post의 front matter `draft` 값을 변경합니다. `draft: false`는 발행 상태로 전환하며 revalidation과 RAG indexing을 실행하고, `draft: true`는 초안 상태로 전환하며 revalidation만 실행합니다. 기존 글을 수정하므로 `expectedHash`가 필수입니다.

`dryRun: true`에서는 Blob write, CDC sync, revalidation, RAG indexing을 모두 건너뛰고 `updated.preview`에 예상 변경 diff를 반환합니다.

```json
{
  "tool": "set_post_draft_status",
  "arguments": {
    "pathname": "career/ai-coding-harness-delegation.mdx",
    "expectedHash": "current-sha256",
    "draft": true,
    "dryRun": true
  }
}
```

## Local stdio adapter

Hermes/Claude Desktop-style MCP clients can use the checked-in adapter:

```bash
BLOG_MCP_ENDPOINT="http://localhost:3001/api/rpc/blog-mcp" \
BLOG_MCP_API_KEY="<BLOG_MCP_API_KEY>" \
node scripts/blog-mcp-server.js
```

Package script:

```bash
pnpm --filter @apps/blog-admin mcp
```

Hermes client config example (`~/.hermes/config.yaml`):

```yaml
mcp_servers:
  bbak_blog:
    command: node
    args:
      - /home/bbakjun/projects/bbakjun-blog/scripts/blog-mcp-server.js
    env:
      BLOG_MCP_ENDPOINT: ${BLOG_MCP_ENDPOINT}
      BLOG_MCP_API_KEY: ${BLOG_MCP_API_KEY}
    timeout: 60
    connect_timeout: 15
```

Keep the actual endpoint/key values in `~/.hermes/.env` or another local secret store, not in the repository.

Alternative config using the package script:

```yaml
mcp_servers:
  bbak_blog:
    command: pnpm
    args: ['--dir', '/home/bbakjun/projects/bbakjun-blog', '--filter', '@apps/blog-admin', 'mcp']
    env:
      BLOG_MCP_ENDPOINT: ${BLOG_MCP_ENDPOINT}
      BLOG_MCP_API_KEY: ${BLOG_MCP_API_KEY}
    timeout: 60
    connect_timeout: 15
```

## Smoke test checklist

1. `GET /api/rpc/blog-mcp/tools`가 read key로 성공한다.
2. read key로 `prepare_post_update` 호출 시 Blob에 쓰지 않고 `expectedHash`, preview diff, `suggestedArguments`를 반환한다.
3. read-only key로 `upsert_post` 호출 시 403이 난다.
4. write key로 `upsert_post` + `dryRun: true` 호출 시 Blob에 쓰지 않는다.
5. write key로 실제 `upsert_post` 호출 시 Blob과 CDC cache가 갱신된다.
6. `delete_post`는 `confirm`이 정확하지 않으면 실패한다.
7. `publish_post`는 revalidation과 RAG indexing까지 완료한다.
8. public blog에서 새/수정 글이 렌더링된다.

## Verification commands

```bash
pnpm --filter @apps/blog-admin test:unit blog-mcp-auth validate-post blog-mcp.draft-status.e2e
node --check scripts/blog-mcp-server.js
pnpm --filter @apps/blog-admin type-check
pnpm type-check
```

현재 레포는 Node `>=24`를 요구합니다. 로컬 WSL 세션이 Node 22면 engine warning이 발생합니다.
