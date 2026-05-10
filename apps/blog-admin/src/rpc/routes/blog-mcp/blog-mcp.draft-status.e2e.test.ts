import { beforeEach, describe, expect, it, vi } from 'vitest';

const blobContents = new Map<string, string>();
const blobFiles = new Map<
  string,
  {
    pathname: string;
    url: string;
    size: number;
    uploadedAt: Date;
    contentType: string;
    isDeleted: boolean;
  }
>();

function readBlobText(blob: Blob): Promise<string> {
  if (typeof (blob as { text?: () => Promise<string> }).text === 'function') {
    return (blob as { text: () => Promise<string> }).text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () =>
      reject(reader.error ?? new Error('Failed to read blob'))
    );
    reader.readAsText(blob);
  });
}

const putMock = vi.fn(async (pathname: string, blob: Blob) => {
  const content = await readBlobText(blob);
  const url = `blob://${pathname}`;
  blobContents.set(url, content);
  blobFiles.set(pathname, {
    pathname,
    url,
    size: Buffer.byteLength(content, 'utf8'),
    uploadedAt: new Date('2026-04-28T00:00:00.000Z'),
    contentType: blob.type,
    isDeleted: false,
  });
  return { pathname, url };
});

const getCachedBlobFilesMock = vi.fn(async ({ searchTerm }: { searchTerm?: string } = {}) => {
  const files = Array.from(blobFiles.values()).filter(file =>
    searchTerm ? file.pathname.includes(searchTerm) : true
  );
  return { files, total: files.length, hasMore: false };
});

const onBlobUploadMock = vi.fn(async () => undefined);
const onBlobDeleteMock = vi.fn(async () => undefined);
const auditBlogMcpToolMock = vi.fn();

vi.mock('@vercel/blob', () => ({
  put: putMock,
  del: vi.fn(async () => undefined),
}));

vi.mock('@/shared/server/blob-cdc', () => ({
  getCachedBlobFiles: getCachedBlobFilesMock,
  onBlobUpload: onBlobUploadMock,
  onBlobDelete: onBlobDeleteMock,
}));

vi.mock('@/shared/server/blog-mcp-audit', () => ({
  auditBlogMcpTool: auditBlogMcpToolMock,
}));

const validContent = `---
title: "Draft status E2E"
date: "2026-04-28"
description: "Draft status E2E coverage"
tags: ["AI", "workflow"]
author: "bbakjun"
draft: true
---

# Body

Content.
`;

const companySensitiveContent = `---
title: "Sensitive draft"
date: "2026-04-28"
description: "Contains internal workflow details"
tags: ["AI", "workflow"]
author: "bbakjun"
draft: false
---

# Sensitive draft

요즘 \`mops-prompt\` 라는 사내 repo에서 작업하고 있다.
commit log와 \`docs/prompting-strategy.md\`를 보니 우리 classifier는 Sonnet 4.6으로 prod에서 돈다.
HITL 검수와 CS 문의 분류 흐름도 함께 있었다.
`;

async function digest(content: string): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(content).digest('hex');
}

function makeContext(tool: string, args: Record<string, unknown>) {
  return {
    req: {
      header: (name: string) =>
        name.toLowerCase() === 'authorization' ? 'Bearer test-key' : undefined,
      valid: () => ({ tool, arguments: args }),
    },
    json: (body: unknown, status: number) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
  };
}

async function invoke(tool: string, args: Record<string, unknown>) {
  const { invokeTool } = await import('./blog-mcp.handlers');
  const response = await (invokeTool as unknown as (context: unknown) => Promise<Response>)(
    makeContext(tool, args)
  );
  const body = await response.json();
  if (response.status !== 200) {
    return { response, body, result: null };
  }
  const result = JSON.parse(body.content[0].text);
  return { response, body, result };
}

function seedPost(pathname: string, content: string) {
  const url = `blob://${pathname}`;
  blobContents.set(url, content);
  blobFiles.set(pathname, {
    pathname,
    url,
    size: Buffer.byteLength(content, 'utf8'),
    uploadedAt: new Date('2026-04-28T00:00:00.000Z'),
    contentType: 'text/mdx; charset=utf-8',
    isDeleted: false,
  });
}

describe('Blog MCP draft status E2E', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv(
      'BLOG_MCP_API_KEYS',
      JSON.stringify([
        {
          name: 'e2e-test-agent',
          key: 'test-key',
          scopes: ['blog:read', 'blog:write', 'blog:publish'],
        },
      ])
    );
    vi.stubEnv('REVALIDATION_SECRET', 'test-revalidation-secret');
    blobContents.clear();
    blobFiles.clear();
    putMock.mockClear();
    getCachedBlobFilesMock.mockClear();
    onBlobUploadMock.mockClear();
    onBlobDeleteMock.mockClear();
    auditBlogMcpToolMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('blob://')) {
          const content = blobContents.get(url);
          return new Response(content ?? '', { status: content === undefined ? 404 : 200 });
        }
        if (url.includes('/api/revalidate')) {
          return new Response('revalidated', { status: 200 });
        }
        if (url.includes('/api/documents')) {
          return new Response('indexed', { status: 200 });
        }
        return new Response('unexpected fetch', { status: 500 });
      })
    );
  });

  it('covers 100% of draft/publish state transitions exposed by the MCP tools', async () => {
    const coverage = {
      publishForcesDraftFalse: false,
      dryRunReportsPendingDraftChangeWithoutWriting: false,
      publishNoopSkipsWriteAndSideEffects: false,
      draftTransitionWritesAndRevalidates: false,
    };

    const publish = await invoke('publish_post', {
      pathname: 'test/draft-status.mdx',
      content: validContent,
    });

    expect(publish.response.status).toBe(200);
    expect(publish.result.draft.previousDraft).toBe(true);
    expect(publish.result.draft.draft).toBe(false);
    expect(publish.result.draft.changed).toBe(true);
    expect(blobContents.get('blob://test/draft-status.mdx')).toContain('draft: false');
    coverage.publishForcesDraftFalse = true;

    const currentHash = await digest(blobContents.get('blob://test/draft-status.mdx') ?? '');
    const dryRun = await invoke('set_post_draft_status', {
      pathname: 'test/draft-status.mdx',
      expectedHash: currentHash,
      draft: true,
      dryRun: true,
    });

    expect(dryRun.response.status).toBe(200);
    expect(dryRun.result.updated.previousDraft).toBe(false);
    expect(dryRun.result.updated.draft).toBe(true);
    expect(dryRun.result.updated.statusChanged).toBe(true);
    expect(dryRun.result.updated.changed).toBe(true);
    expect(dryRun.result.updated.hash).not.toBe(currentHash);
    expect(dryRun.result.updated.preview.action).toBe('update');
    expect(dryRun.result.updated.preview.summary).toBe('update with content changes');
    expect(dryRun.result.updated.preview.size.delta).not.toBeNull();
    expect(dryRun.result.updated.preview.diff.lines).toEqual(
      expect.arrayContaining(['-draft: false', '+draft: true'])
    );
    expect(blobContents.get('blob://test/draft-status.mdx')).toContain('draft: false');
    coverage.dryRunReportsPendingDraftChangeWithoutWriting = true;

    const noop = await invoke('set_post_draft_status', {
      pathname: 'test/draft-status.mdx',
      expectedHash: currentHash,
      draft: false,
    });

    expect(noop.response.status).toBe(200);
    expect(noop.result.updated.statusChanged).toBe(false);
    expect(noop.result.updated.changed).toBe(false);
    expect(noop.result.revalidated).toBeNull();
    expect(noop.result.indexed).toBeNull();
    expect(noop.result.skipped).toBe('draft_status_already_matches');
    expect(putMock).toHaveBeenCalledTimes(1);
    coverage.publishNoopSkipsWriteAndSideEffects = true;

    const toDraft = await invoke('set_post_draft_status', {
      pathname: 'test/draft-status.mdx',
      expectedHash: currentHash,
      draft: true,
    });

    expect(toDraft.response.status).toBe(200);
    expect(toDraft.result.updated.previousDraft).toBe(false);
    expect(toDraft.result.updated.draft).toBe(true);
    expect(toDraft.result.updated.statusChanged).toBe(true);
    expect(toDraft.result.updated.changed).toBe(true);
    expect(toDraft.result.revalidated.path).toBe('/blog/test/draft-status');
    expect(toDraft.result.indexed).toBeNull();
    expect(blobContents.get('blob://test/draft-status.mdx')).toContain('draft: true');
    coverage.draftTransitionWritesAndRevalidates = true;

    expect(Object.values(coverage).every(Boolean)).toBe(true);
  });

  it('prepares a front matter update with a safe follow-up publish command without writing', async () => {
    seedPost('test/prepare-update.mdx', validContent);
    const currentHash = await digest(validContent);

    const prepared = await invoke('prepare_post_update', {
      pathname: 'test/prepare-update.mdx',
      patch: {
        title: 'Prepared title',
        description: 'Prepared description',
        tags: ['AI', 'MCP'],
      },
      publish: true,
    });

    expect(prepared.response.status).toBe(200);
    expect(prepared.result.pathname).toBe('test/prepare-update.mdx');
    expect(prepared.result.expectedHash).toBe(currentHash);
    expect(prepared.result.previous.title).toBe('Draft status E2E');
    expect(prepared.result.previous.draft).toBe(true);
    expect(prepared.result.next.title).toBe('Prepared title');
    expect(prepared.result.next.description).toBe('Prepared description');
    expect(prepared.result.next.tags).toEqual(['AI', 'MCP']);
    expect(prepared.result.next.draft).toBe(false);
    expect(prepared.result.preview.action).toBe('update');
    expect(prepared.result.preview.summary).toContain('title');
    expect(prepared.result.preview.diff.lines).toEqual(
      expect.arrayContaining(['-title: "Draft status E2E"', '+title: Prepared title'])
    );
    expect(prepared.result.suggestedNextTool).toBe('publish_post');
    expect(prepared.result.suggestedArguments).toMatchObject({
      pathname: 'test/prepare-update.mdx',
      expectedHash: currentHash,
      dryRun: true,
    });
    expect(prepared.result.suggestedArguments.content).toContain('title: Prepared title');
    expect(prepared.result.suggestedArguments.content).toContain('draft: false');
    expect(putMock).not.toHaveBeenCalled();
  });

  it('rejects stale expectedHash without writing', async () => {
    seedPost('test/stale.mdx', validContent.replace('draft: true', 'draft: false'));

    const stale = await invoke('set_post_draft_status', {
      pathname: 'test/stale.mdx',
      expectedHash: 'stale-hash',
      draft: true,
    });

    expect(stale.response.status).toBe(409);
    expect(stale.body.message).toBe('Post changed since expectedHash was produced');
    expect(putMock).not.toHaveBeenCalled();
  });

  it('scans posts for company-sensitive details before publication', async () => {
    const scanned = await invoke('scan_post_safety', {
      pathname: 'test/sensitive.mdx',
      content: companySensitiveContent,
    });

    expect(scanned.response.status).toBe(200);
    expect(scanned.result.safeToPublish).toBe(false);
    expect(scanned.result.summary.high).toBeGreaterThan(0);
    expect(scanned.result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ matched: 'mops-prompt' }),
        expect.objectContaining({ matched: '사내 repo' }),
        expect.objectContaining({ matched: 'docs/prompting-strategy.md' }),
        expect.objectContaining({ matched: 'Sonnet 4.6' }),
        expect.objectContaining({ matched: 'HITL' }),
      ])
    );
  });

  it('blocks publishing non-draft posts that still contain company-sensitive details', async () => {
    const blocked = await invoke('publish_post', {
      pathname: 'test/sensitive.mdx',
      content: companySensitiveContent,
    });

    expect(blocked.response.status).toBe(400);
    expect(blocked.body.message).toContain('Public safety review failed');
    expect(blocked.body.details.safeToPublish).toBe(false);
    expect(blocked.body.details.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ matched: 'mops-prompt' })])
    );
    expect(putMock).not.toHaveBeenCalled();
  });

  it('allows saving company-sensitive content as draft but includes safety findings in the result', async () => {
    const draftContent = companySensitiveContent.replace('draft: false', 'draft: true');
    const saved = await invoke('upsert_post', {
      pathname: 'test/sensitive-draft.mdx',
      content: draftContent,
    });

    expect(saved.response.status).toBe(200);
    expect(saved.result.safety.safeToPublish).toBe(false);
    expect(saved.result.safety.findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ matched: 'mops-prompt' })])
    );
    expect(blobContents.get('blob://test/sensitive-draft.mdx')).toContain('mops-prompt');
  });
});
