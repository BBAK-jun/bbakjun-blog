# Blog Blob MCP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** AI Coding Harness/agents can safely create, read, update, delete, publish, and index blog content stored in Vercel Blob Storage through an authenticated MCP-compatible interface.

**Architecture:** Keep `Vercel Blob` as the source of truth. Add a dedicated `blog-mcp` capability layer over the existing `blog-admin` upload/CDC/RPC primitives. Expose agent-safe tools with scoped API-key authentication, optional dry-run, audit logging, and explicit destructive-action guards. Do not let agents access raw `BLOB_READ_WRITE_TOKEN`.

**Tech Stack:** Next.js 16 blog-admin RPC/Hono, Vercel Blob, CDC cache, Prisma/Neon, existing RAG Gateway/Hono MCP routes, TypeScript, Zod/OpenAPI.

---

## Current Repository Facts

- Repo: `/home/bbakjun/projects/bbakjun-blog`
- Remote: `https://github.com/BBAK-jun/bbakjun-blog.git`
- Branch: `main`
- Content source of truth: **Vercel Blob Storage only**
- Existing relevant app boundaries:
  - `apps/blog`: public renderer, consumes blob file list through RPC
  - `apps/blog-admin`: authenticated content management, Vercel Blob upload/delete, CDC sync
  - `apps/rag-gateway`: existing pseudo-MCP HTTP endpoints for RAG tools
- Existing auth primitives:
  - `apps/blog-admin/src/shared/lib/auth/auth.ts` / `verifyApiKeySync()` for `BACKOFFICE_API_KEY`
  - `apps/rag-gateway/src/middleware/auth.ts` for `X-RAG-API-Key`
- Existing content upload primitive:
  - `apps/blog-admin/src/rpc/routes/upload/upload.handlers.ts#uploadMarkdown`
- Existing CDC primitive:
  - `apps/blog-admin/src/shared/server/blob-cdc.ts`

---

## Recommended Direction

Build the agent MCP surface in `apps/blog-admin`, not directly in `apps/rag-gateway`.

Reason:

1. `blog-admin` already owns Blob write permissions.
2. `blog-admin` already syncs CDC after upload/delete.
3. Agents should not receive `BLOB_READ_WRITE_TOKEN`.
4. RAG Gateway can remain search/indexing focused and call blog-admin MCP tools when needed.

The MCP server can be exposed as HTTP tools first, then later adapted to full Streamable HTTP MCP if necessary.

---

## Tool Contract v1

### Read tools

1. `list_posts`
   - Input: `{ category?: string; tag?: string; draft?: boolean; limit?: number; offset?: number }`
   - Output: post metadata list from CDC/blob files
   - Scope: `blog:read`

2. `get_post`
   - Input: `{ pathname: string }`
   - Output: raw markdown/MDX + metadata
   - Scope: `blog:read`

3. `validate_post`
   - Input: `{ content: string; pathname?: string }`
   - Output: front matter validation, slug/path validation, duplicate detection, markdown warnings
   - Scope: `blog:read`

### Write tools

4. `upsert_post`
   - Input:
     ```ts
     {
       pathname: string;        // e.g. career/ai-coding-harness-delegation.mdx
       content: string;         // full MDX with front matter
       expectedHash?: string;   // optimistic concurrency guard
       draft?: boolean;
       dryRun?: boolean;
     }
     ```
   - Output: `{ pathname, url, size, hash, changed, dryRun, warnings }`
   - Scope: `blog:write`

5. `delete_post`
   - Input: `{ pathname: string; expectedHash: string; confirm: string; dryRun?: boolean }`
   - Guard: `confirm` must equal `DELETE ${pathname}`
   - Scope: `blog:delete`

6. `upload_image`
   - Input: `{ filename: string; contentBase64: string; alt?: string }`
   - Output: `{ url, pathname, markdown }`
   - Scope: `blog:write`

### Publish/indexing tools

7. `revalidate_post`
   - Input: `{ slug: string }`
   - Calls existing blog revalidation endpoint
   - Scope: `blog:publish`

8. `index_post_for_rag`
   - Input: `{ pathname: string }`
   - Calls RAG Gateway document indexing after reading Blob content
   - Scope: `blog:publish`

9. `publish_post`
   - Composite tool: validate → upsert → CDC sync → revalidate → RAG index
   - Input: `{ pathname, content, expectedHash?, dryRun? }`
   - Scope: `blog:write + blog:publish`

---

## Auth / Authorization Model

Use a new dedicated secret, not the existing broad admin secret.

```env
BLOG_MCP_API_KEYS='[
  {"name":"local-agent","key":"...","scopes":["blog:read","blog:write","blog:publish"]},
  {"name":"readonly-agent","key":"...","scopes":["blog:read"]}
]'
```

Request header:

```txt
Authorization: Bearer <blog-mcp-api-key>
```

Server attaches identity to context:

```ts
{
  actor: 'local-agent',
  scopes: ['blog:read', 'blog:write']
}
```

Minimum rules:

- `list_posts`, `get_post`, `validate_post`: require `blog:read`
- `upsert_post`, `upload_image`: require `blog:write`
- `delete_post`: require `blog:delete`
- `revalidate_post`, `index_post_for_rag`, `publish_post`: require `blog:publish`
- All write/delete tools must create an audit log entry.
- All write/delete tools should support `dryRun`.
- Delete must require both `expectedHash` and exact textual confirmation.

---

## Task 1: Add Blog MCP environment schema

**Objective:** Add a dedicated env var for scoped MCP API keys.

**Files:**
- Modify: `apps/blog-admin/src/env.ts`

**Implementation:**

Add server env:

```ts
BLOG_MCP_API_KEYS: z.string().optional(),
```

Add runtime env:

```ts
BLOG_MCP_API_KEYS: process.env.BLOG_MCP_API_KEYS,
```

**Verification:**

Run:

```bash
pnpm --filter @apps/blog-admin type-check
```

Expected: type-check passes after dependencies are installed with Node 24.

---

## Task 2: Implement scoped MCP auth utility

**Objective:** Parse `BLOG_MCP_API_KEYS`, validate bearer token, and check scopes.

**Files:**
- Create: `apps/blog-admin/src/shared/lib/auth/blog-mcp-auth.ts`
- Test: `apps/blog-admin/src/shared/lib/auth/blog-mcp-auth.test.ts`

**Core API:**

```ts
export type BlogMcpScope = 'blog:read' | 'blog:write' | 'blog:delete' | 'blog:publish';

export interface BlogMcpActor {
  name: string;
  scopes: BlogMcpScope[];
}

export function verifyBlogMcpApiKey(authHeader: string | null | undefined): BlogMcpActor | null;
export function requireBlogMcpScope(actor: BlogMcpActor, scope: BlogMcpScope): void;
```

**Behavior:**

- Accept only `Authorization: Bearer ...`
- Return `null` for missing/invalid keys
- Throw/return authorization failure for missing scope
- Do not log raw keys

**Verification:**

Run:

```bash
pnpm --filter @apps/blog-admin test:run blog-mcp-auth
```

---

## Task 3: Add post validation service

**Objective:** Validate MDX front matter and path conventions before writes.

**Files:**
- Create: `apps/blog-admin/src/shared/lib/blog-post/validate-post.ts`
- Test: `apps/blog-admin/src/shared/lib/blog-post/validate-post.test.ts`

**Rules:**

- Required front matter:
  - `title: string`
  - `date: string`
  - `description: string`
  - `tags: string[]`
  - `author: string`
- Optional:
  - `draft: boolean`
  - `order: number`
- `pathname` must end with `.md` or `.mdx`
- `pathname` must not contain `..`, leading slash, or backslash
- Allow category prefixes like `DEV/`, `career/`, `REACT/`

**Verification:**

Run:

```bash
pnpm --filter @apps/blog-admin test:run validate-post
```

---

## Task 4: Add Blob post service for agents

**Objective:** Wrap Vercel Blob read/write/delete with hash and CDC sync.

**Files:**
- Create: `apps/blog-admin/src/shared/server/blog-mcp-posts.ts`

**Core functions:**

```ts
export async function listAgentPosts(input: ListPostsInput): Promise<ListPostsResult>;
export async function getAgentPost(pathname: string): Promise<GetPostResult>;
export async function upsertAgentPost(input: UpsertPostInput): Promise<UpsertPostResult>;
export async function deleteAgentPost(input: DeletePostInput): Promise<DeletePostResult>;
```

**Important implementation notes:**

- Reuse existing CDC file list when possible.
- Use Blob `put()` with `addRandomSuffix: false` for deterministic paths.
- Compute SHA-256 hash of content.
- If `expectedHash` is provided and current hash differs, reject with `409 Conflict`.
- Call `onBlobUpload()` after upsert.
- For delete, update CDC consistently using existing delete path if available.

---

## Task 5: Add audit logging

**Objective:** Record every agent write/delete/publish operation.

**Files:**
- Create: `apps/blog-admin/src/shared/server/blog-mcp-audit.ts`
- Optional DB change if persistent audit table is desired.

**Minimum log shape:**

```ts
{
  actor: string,
  tool: string,
  pathname?: string,
  dryRun: boolean,
  success: boolean,
  timestamp: string,
  diffSummary?: string,
  error?: string
}
```

**MVP:** server logs are acceptable.

**Better:** Prisma table `AgentAuditLog`.

---

## Task 6: Create Blog MCP routes

**Objective:** Add HTTP route group for agent tools.

**Files:**
- Create: `apps/blog-admin/src/rpc/routes/blog-mcp/blog-mcp.routes.ts`
- Create: `apps/blog-admin/src/rpc/routes/blog-mcp/blog-mcp.handlers.ts`
- Create: `apps/blog-admin/src/rpc/routes/blog-mcp/blog-mcp.index.ts`
- Modify: `apps/blog-admin/src/rpc/index.ts`

**Routes:**

```txt
GET  /rpc/blog-mcp/tools
POST /rpc/blog-mcp/invoke
```

**Invoke body:**

```ts
{
  tool: 'list_posts' | 'get_post' | 'validate_post' | 'upsert_post' | 'delete_post' | 'upload_image' | 'revalidate_post' | 'index_post_for_rag' | 'publish_post',
  arguments: Record<string, unknown>
}
```

**Verification:**

Run local admin server and call:

```bash
curl -H "Authorization: Bearer $BLOG_MCP_LOCAL_KEY" \
  http://localhost:3001/rpc/blog-mcp/tools
```

---

## Task 7: Add an agent-facing local MCP stdio server

**Objective:** Let local agents like Claude Code/Hermes consume blog tools as real MCP tools without knowing your internal HTTP details.

**Files:**
- Create: `apps/blog-admin/mcp-server/package.json` or `scripts/blog-mcp-server.ts`
- Create: `apps/blog-admin/mcp-server/src/index.ts`

**Transport:** stdio MCP server that forwards tool calls to blog-admin HTTP endpoint.

**Env needed:**

```env
BLOG_MCP_BASE_URL=http://localhost:3001/rpc/blog-mcp
BLOG_MCP_API_KEY=...
```

**Claude/Hermes config example:**

```json
{
  "mcpServers": {
    "bbak-blog": {
      "command": "pnpm",
      "args": ["--filter", "@apps/blog-admin", "mcp"],
      "env": {
        "BLOG_MCP_BASE_URL": "http://localhost:3001/rpc/blog-mcp",
        "BLOG_MCP_API_KEY": "${BLOG_MCP_API_KEY}"
      }
    }
  }
}
```

Hermes `~/.hermes/config.yaml` example:

```yaml
mcp_servers:
  bbak_blog:
    command: "pnpm"
    args: ["--dir", "/home/bbakjun/projects/bbakjun-blog", "--filter", "@apps/blog-admin", "mcp"]
    env:
      BLOG_MCP_BASE_URL: "http://localhost:3001/rpc/blog-mcp"
      BLOG_MCP_API_KEY: "${BLOG_MCP_API_KEY}"
```

---

## Task 8: Add publish workflow tool

**Objective:** Provide one high-level tool for agents to safely publish a post.

**Tool:** `publish_post`

**Steps:**

1. Validate front matter and pathname.
2. If existing post exists, compare `expectedHash`.
3. Upsert Blob content.
4. Sync CDC.
5. Revalidate public blog route.
6. Index into RAG Gateway.
7. Return final URL and audit ID.

**Important:** `dryRun: true` must execute steps 1-2 only and return planned actions.

---

## Task 9: Add docs

**Objective:** Document how humans and agents should use the Blog MCP.

**Files:**
- Create: `apps/blog-admin/docs/BLOG_MCP.md`
- Update: `README.md`

**Include:**

- Tool list
- Auth model
- Required env vars
- Local setup
- Production setup
- Safety guarantees
- Example: create the AI Coding Harness post

---

## Task 10: Verification matrix

**Objective:** Verify the feature end-to-end.

**Commands:**

```bash
nvm use
pnpm install
pnpm --filter @apps/blog-admin test:run
pnpm --filter @apps/blog-admin type-check
pnpm --filter @apps/blog-admin build
```

**Manual smoke tests:**

1. `list_posts` with read key succeeds.
2. `upsert_post` with read-only key fails with 403.
3. `upsert_post` with write key and `dryRun: true` does not write Blob.
4. `upsert_post` with write key writes Blob and CDC updates.
5. `delete_post` without exact confirmation fails.
6. `publish_post` revalidates blog and indexes RAG.
7. Public blog can render the new/updated post.

---

## First Useful MVP

If we want the smallest valuable version, implement only:

1. `BLOG_MCP_API_KEYS`
2. `verifyBlogMcpApiKey()` with scopes
3. `validate_post`
4. `upsert_post`
5. `get_post`
6. `list_posts`
7. HTTP `/rpc/blog-mcp/tools` and `/rpc/blog-mcp/invoke`

Then add the local stdio MCP adapter after the HTTP layer is stable.
