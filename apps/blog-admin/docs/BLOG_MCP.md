# Blog MCP

Blog MCP는 AI Coding Harness가 BBAK 블로그 글을 안전하게 읽고, 검증하고, 수정하고, 발행/RAG 인덱싱까지 위임받기 위한 `blog-admin` 권한 경계의 도구 API입니다.

## 원칙

- AI Coding Harness나 로컬 MCP adapter에 `BLOB_READ_WRITE_TOKEN`을 주지 않습니다.
- Blob write, CDC sync, audit logging은 `blog-admin`에서 수행합니다.
- MCP client는 별도 `BLOG_MCP_API_KEYS`로 인증하고 scope로 인가됩니다.
- 삭제와 덮어쓰기는 `expectedHash` 기반으로 보호합니다.

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

| Scope | Tools |
| --- | --- |
| `blog:read` | `list_posts`, `get_post`, `validate_post` |
| `blog:write` | `upsert_post`, `upload_image` |
| `blog:delete` | `delete_post` |
| `blog:publish` | `revalidate_post`, `index_post_for_rag`, `publish_post` |

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

### `upsert_post`

글을 생성하거나 수정합니다. `dryRun`으로 사전 검증할 수 있고, 기존 글 수정 시 `expectedHash`를 넘기면 사람/다른 agent가 바꾼 글을 덮어쓰는 것을 막습니다.

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

검증 → upsert → revalidation → RAG indexing을 한 번에 실행합니다.

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
    args: ["--dir", "/home/bbakjun/projects/bbakjun-blog", "--filter", "@apps/blog-admin", "mcp"]
    env:
      BLOG_MCP_ENDPOINT: ${BLOG_MCP_ENDPOINT}
      BLOG_MCP_API_KEY: ${BLOG_MCP_API_KEY}
    timeout: 60
    connect_timeout: 15
```

## Smoke test checklist

1. `GET /api/rpc/blog-mcp/tools`가 read key로 성공한다.
2. read-only key로 `upsert_post` 호출 시 403이 난다.
3. write key로 `upsert_post` + `dryRun: true` 호출 시 Blob에 쓰지 않는다.
4. write key로 실제 `upsert_post` 호출 시 Blob과 CDC cache가 갱신된다.
5. `delete_post`는 `confirm`이 정확하지 않으면 실패한다.
6. `publish_post`는 revalidation과 RAG indexing까지 완료한다.
7. public blog에서 새/수정 글이 렌더링된다.

## Verification commands

```bash
pnpm --filter @apps/blog-admin test:unit blog-mcp-auth validate-post
node --check scripts/blog-mcp-server.js
pnpm --filter @apps/blog-admin type-check
pnpm type-check
```

현재 레포는 Node `>=24`를 요구합니다. 로컬 WSL 세션이 Node 22면 engine warning이 발생합니다.
