import { createHash, randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { del, put } from '@vercel/blob';
import { env } from '@/env';
import { getCachedBlobFiles, onBlobDelete, onBlobUpload } from '@/shared/server/blob-cdc';
import {
  normalizeBlogPostPath,
  setBlogPostDraftStatus,
  validateBlogPost,
} from '@/shared/lib/blog-post/validate-post';

export class BlogMcpError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'BlogMcpError';
  }
}

type SafetySeverity = 'high' | 'medium' | 'low';

interface SafetyRule {
  id: string;
  label: string;
  severity: SafetySeverity;
  pattern: RegExp;
  recommendation: string;
}

const publicSafetyRules: SafetyRule[] = [
  {
    id: 'internal-repo-name',
    label: 'Internal repository or project name',
    severity: 'high',
    pattern: /\bmops-prompt\b/gi,
    recommendation: 'Replace internal repo/project names with a generic description.',
  },
  {
    id: 'internal-repository-reference',
    label: 'Internal repository reference',
    severity: 'high',
    pattern: /사내\s*repo|내부\s*repo|internal\s+repo/gi,
    recommendation: 'Use “관련 코드/문서/작업” instead of naming internal repositories.',
  },
  {
    id: 'internal-document-path',
    label: 'Internal document or source path',
    severity: 'high',
    pattern: /docs\/[A-Za-z0-9._/-]+|\.env\b|content\/posts\b/gi,
    recommendation: 'Remove internal paths or generalize them as “관련 문서”.',
  },
  {
    id: 'commit-or-ticket-detail',
    label: 'Commit, branch, or ticket detail',
    severity: 'medium',
    pattern: /commit\s+log|commit\s+hash|branch\b|ticket\b|JIRA\b/gi,
    recommendation: 'Describe the change without exposing commit, branch, or ticket details.',
  },
  {
    id: 'specific-runtime-model',
    label: 'Specific runtime model/version detail',
    severity: 'medium',
    pattern: /Sonnet\s*4\.6|Claude\s*4\.6|o3-mini|o4-mini|Gemini\s+Flash\s+2\.5/gi,
    recommendation:
      'For internal runtime choices, prefer a generic phrase such as “최신 Claude 계열 모델”.',
  },
  {
    id: 'production-ops-detail',
    label: 'Production or operations detail',
    severity: 'medium',
    pattern: /\bprod\b|production|운영\s*환경|장애\s*대응|HITL|CS\s*문의/gi,
    recommendation: 'Generalize operational details unless they are already public and necessary.',
  },
  {
    id: 'secret-like-token',
    label: 'Secret-like token or key reference',
    severity: 'high',
    pattern: /\b(secret|token|api[_-]?key|password)\b\s*[:=]/gi,
    recommendation: 'Remove secrets and secret-shaped snippets entirely.',
  },
];

function lineNumberForIndex(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

export function scanPostPublicSafety(input: { pathname?: string; content: string }) {
  const findings = publicSafetyRules.flatMap(rule => {
    const matches = Array.from(input.content.matchAll(rule.pattern));
    return matches.map(match => {
      const matched = match[0];
      const index = match.index ?? 0;
      return {
        id: rule.id,
        label: rule.label,
        severity: rule.severity,
        matched,
        line: lineNumberForIndex(input.content, index),
        recommendation: rule.recommendation,
      };
    });
  });

  const summary = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<SafetySeverity, number>
  );

  const safeToPublish = summary.high === 0 && summary.medium === 0;

  return {
    pathname: input.pathname,
    safeToPublish,
    summary,
    findings,
    checklist: [
      'Remove company names, internal repo names, service names, team names, customer names, and document paths.',
      'Generalize runtime, production, incident, evaluation, and review-process details unless already public.',
      'Keep the reusable technical lesson; remove details that let outsiders infer internal architecture or workflow.',
      'Re-scan after editing, then publish only when safeToPublish is true.',
    ],
  };
}

function assertPublicSafetyForWrite(input: { pathname: string; content: string; draft?: boolean }) {
  const validation = validateBlogPost({
    pathname: input.pathname,
    content: input.content,
    draft: input.draft,
  });
  const isDraft = validation.frontMatter?.draft === true || input.draft === true;
  const safety = scanPostPublicSafety({ pathname: input.pathname, content: input.content });

  if (!isDraft && !safety.safeToPublish) {
    throw new BlogMcpError(
      'Public safety review failed: remove or generalize company-sensitive details before publishing',
      400,
      safety
    );
  }

  return safety;
}

export interface ListAgentPostsInput {
  category?: string;
  tag?: string;
  draft?: boolean;
  limit?: number;
  offset?: number;
}

export interface UpsertAgentPostInput {
  pathname: string;
  content: string;
  expectedHash?: string;
  draft?: boolean;
  dryRun?: boolean;
  actor: string;
}

export interface PrepareAgentPostUpdateInput {
  pathname: string;
  patch?: {
    title?: string;
    description?: string;
    tags?: string[];
    draft?: boolean;
  };
  content?: string;
  publish?: boolean;
}

export interface ChangeAgentPostDraftStatusInput {
  pathname: string;
  expectedHash: string;
  draft: boolean;
  dryRun?: boolean;
  actor: string;
}

export interface DeleteAgentPostInput {
  pathname: string;
  expectedHash: string;
  confirm: string;
  dryRun?: boolean;
  actor: string;
}

export interface UploadAgentImageInput {
  filename: string;
  contentBase64: string;
  alt?: string;
  actor: string;
  dryRun?: boolean;
}

export function sha256(content: string | ArrayBuffer | Buffer): string {
  const data =
    typeof content === 'string'
      ? content
      : Buffer.isBuffer(content)
        ? content
        : Buffer.from(content);
  return createHash('sha256').update(data).digest('hex');
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);

function normalizeOrBadRequest(pathname: string): string {
  try {
    return normalizeBlogPostPath(pathname);
  } catch (error) {
    throw new BlogMcpError(error instanceof Error ? error.message : 'Invalid path', 400);
  }
}

function isMarkdownPath(pathname: string): boolean {
  return /\.(md|mdx)$/i.test(pathname);
}

function extensionToContentType(pathname: string): string {
  return pathname.toLowerCase().endsWith('.mdx')
    ? 'text/mdx; charset=utf-8'
    : 'text/markdown; charset=utf-8';
}

function coerceLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(Math.max(Math.trunc(value ?? 50), 1), 100);
}

function coerceOffset(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(Math.trunc(value ?? 0), 0);
}

function trimOptionalFilter(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function escapeMarkdownAlt(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/]/g, '\\]');
}

function buildContentPreview(input: {
  previousContent: string | null;
  nextContent: string;
  previousHash: string | null;
  nextHash: string;
}) {
  const previousSize =
    input.previousContent === null ? null : Buffer.byteLength(input.previousContent, 'utf8');
  const nextSize = Buffer.byteLength(input.nextContent, 'utf8');
  const changed = input.previousHash !== input.nextHash;
  const action = input.previousContent === null ? 'create' : changed ? 'update' : 'no_change';

  return {
    action,
    summary:
      action === 'create'
        ? 'create new post'
        : action === 'update'
          ? 'update with content changes'
          : 'no content changes',
    changed,
    previousHash: input.previousHash,
    nextHash: input.nextHash,
    size: {
      previous: previousSize,
      next: nextSize,
      delta: previousSize === null ? null : nextSize - previousSize,
    },
    diff: buildLineDiff(input.previousContent, input.nextContent),
  };
}

function buildLineDiff(previousContent: string | null, nextContent: string) {
  const maxLines = 120;
  if (previousContent === null) {
    const lines = nextContent
      .split('\n')
      .slice(0, maxLines)
      .map(line => `+${line}`);
    return { format: 'line-prefix', truncated: nextContent.split('\n').length > maxLines, lines };
  }

  if (previousContent === nextContent) {
    return { format: 'line-prefix', truncated: false, lines: [] as string[] };
  }

  const previousLines = previousContent.split('\n');
  const nextLines = nextContent.split('\n');
  const maxLength = Math.max(previousLines.length, nextLines.length);
  const lines: string[] = [];

  for (let index = 0; index < maxLength && lines.length < maxLines; index += 1) {
    const previousLine = previousLines[index];
    const nextLine = nextLines[index];
    if (previousLine === nextLine) continue;
    if (previousLine !== undefined) lines.push(`-${previousLine}`);
    if (nextLine !== undefined && lines.length < maxLines) lines.push(`+${nextLine}`);
  }

  return { format: 'line-prefix', truncated: lines.length >= maxLines, lines };
}

function decodeBase64Image(contentBase64: string): Buffer {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64.trim())) {
    throw new BlogMcpError('contentBase64 must be valid base64', 400);
  }
  const buffer = Buffer.from(contentBase64, 'base64');
  if (buffer.byteLength === 0) {
    throw new BlogMcpError('Image content is empty', 400);
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new BlogMcpError(`Image exceeds ${MAX_IMAGE_BYTES} byte limit`, 400);
  }
  return buffer;
}

async function findBlobFile(pathname: string) {
  const result = await getCachedBlobFiles({ limit: 100, offset: 0, searchTerm: pathname });
  return result.files.find(file => file.pathname === pathname && !file.isDeleted) ?? null;
}

async function downloadText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new BlogMcpError(`Failed to download blob content: ${response.status}`, 502);
  }
  return response.text();
}

export async function listAgentPosts(input: ListAgentPostsInput = {}) {
  const limit = coerceLimit(input.limit);
  const offset = coerceOffset(input.offset);
  const category = trimOptionalFilter(input.category);
  const tag = trimOptionalFilter(input.tag);
  const result = await getCachedBlobFiles({
    limit,
    offset,
    searchTerm: category ? `${category.replace(/^\/+|\/+$/g, '')}/` : undefined,
  });

  const files = result.files.filter(file => isMarkdownPath(file.pathname));

  if (!tag && input.draft === undefined) {
    return {
      files: files.map(file => ({
        pathname: file.pathname,
        url: file.url,
        size: Number(file.size),
        uploadedAt: file.uploadedAt,
        contentType: file.contentType,
      })),
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  const enriched = await Promise.all(
    files.map(async file => {
      try {
        const content = await downloadText(file.url);
        const validation = validateBlogPost({ pathname: file.pathname, content });
        return { file, validation };
      } catch {
        return { file, validation: null };
      }
    })
  );

  const filtered = enriched.filter(({ validation }) => {
    if (!validation?.frontMatter) return false;
    if (tag && !validation.frontMatter.tags.includes(tag)) return false;
    if (input.draft !== undefined && (validation.frontMatter.draft ?? false) !== input.draft)
      return false;
    return true;
  });

  return {
    files: filtered.map(({ file, validation }) => ({
      pathname: file.pathname,
      url: file.url,
      size: Number(file.size),
      uploadedAt: file.uploadedAt,
      contentType: file.contentType,
      frontMatter: validation?.frontMatter,
    })),
    total: filtered.length,
    hasMore: result.hasMore,
  };
}

export async function getAgentPost(pathnameInput: string) {
  const pathname = normalizeOrBadRequest(pathnameInput);
  const file = await findBlobFile(pathname);

  if (!file) {
    throw new BlogMcpError(`Post not found: ${pathname}`, 404);
  }

  const content = await downloadText(file.url);
  const hash = sha256(content);
  const validation = validateBlogPost({ pathname, content });

  return {
    pathname,
    url: file.url,
    size: Number(file.size),
    uploadedAt: file.uploadedAt,
    contentType: file.contentType,
    hash,
    content,
    validation,
  };
}

function summarizePreparedUpdate(input: {
  changedFields: string[];
  publish: boolean;
  changed: boolean;
}) {
  if (!input.changed) return 'no content changes';
  const fields = [...input.changedFields];
  if (input.publish) fields.push('publish');
  return fields.length > 0 ? `update ${fields.join(', ')}` : 'update content';
}

export async function prepareAgentPostUpdate(input: PrepareAgentPostUpdateInput) {
  const pathname = normalizeOrBadRequest(input.pathname);
  const existing = await findBlobFile(pathname);

  if (!existing) {
    throw new BlogMcpError(`Post not found: ${pathname}`, 404);
  }

  const previousContent = await downloadText(existing.url);
  const expectedHash = sha256(previousContent);
  const parsed = matter(previousContent);
  const previousValidation = validateBlogPost({ pathname, content: previousContent });

  if (!previousValidation.valid || !previousValidation.frontMatter) {
    throw new BlogMcpError(`Invalid existing post: ${previousValidation.errors.join('; ')}`, 400);
  }

  const changedFields: string[] = [];
  const nextData = { ...parsed.data };
  const patch = input.patch ?? {};

  if (typeof patch.title === 'string' && patch.title !== nextData.title) {
    nextData.title = patch.title;
    changedFields.push('title');
  }
  if (typeof patch.description === 'string' && patch.description !== nextData.description) {
    nextData.description = patch.description;
    changedFields.push('description');
  }
  if (Array.isArray(patch.tags) && JSON.stringify(patch.tags) !== JSON.stringify(nextData.tags)) {
    nextData.tags = patch.tags;
    changedFields.push('tags');
  }
  if (typeof patch.draft === 'boolean' && patch.draft !== (nextData.draft === true)) {
    nextData.draft = patch.draft;
    changedFields.push('draft');
  }
  if (input.publish && nextData.draft !== false) {
    nextData.draft = false;
    if (!changedFields.includes('draft')) changedFields.push('draft');
  }

  const nextBody = input.content ?? parsed.content;
  if (input.content !== undefined && input.content !== parsed.content) {
    changedFields.push('content');
  }

  const nextContentRaw = matter.stringify(nextBody, nextData);
  const nextContent = nextContentRaw.endsWith('\n') ? nextContentRaw : `${nextContentRaw}\n`;
  const nextHash = sha256(nextContent);
  const nextValidation = validateBlogPost({
    pathname,
    content: nextContent,
    draft: input.publish ? false : typeof patch.draft === 'boolean' ? patch.draft : undefined,
  });

  if (!nextValidation.valid || !nextValidation.frontMatter) {
    throw new BlogMcpError(`Prepared post is invalid: ${nextValidation.errors.join('; ')}`, 400);
  }

  const basePreview = buildContentPreview({
    previousContent,
    nextContent,
    previousHash: expectedHash,
    nextHash,
  });
  const suggestedNextTool = input.publish ? 'publish_post' : 'upsert_post';

  return {
    pathname,
    expectedHash,
    nextHash,
    previous: previousValidation.frontMatter,
    next: nextValidation.frontMatter,
    changed: basePreview.changed,
    changedFields,
    preview: {
      ...basePreview,
      summary: summarizePreparedUpdate({
        changedFields,
        publish: input.publish === true,
        changed: basePreview.changed,
      }),
    },
    suggestedNextTool,
    suggestedArguments: {
      pathname,
      content: nextContent,
      expectedHash,
      dryRun: true,
    },
  };
}

export async function upsertAgentPost(input: UpsertAgentPostInput) {
  const pathname = normalizeOrBadRequest(input.pathname);
  const validation = validateBlogPost({ pathname, content: input.content, draft: input.draft });

  if (!validation.valid) {
    throw new BlogMcpError(`Invalid post: ${validation.errors.join('; ')}`, 400);
  }

  const safety = assertPublicSafetyForWrite({
    pathname,
    content: input.content,
    draft: input.draft,
  });

  const shouldInspectExisting = !input.dryRun || Boolean(input.expectedHash);
  const existing = shouldInspectExisting ? await findBlobFile(pathname) : null;
  let previousContent: string | null = null;
  let previousHash: string | null = null;
  if (existing) {
    previousContent = await downloadText(existing.url);
    previousHash = sha256(previousContent);
  }

  if (input.expectedHash && previousHash && input.expectedHash !== previousHash) {
    throw new BlogMcpError('Post changed since expectedHash was produced', 409);
  }

  if (existing && !input.expectedHash && !input.dryRun) {
    throw new BlogMcpError('expectedHash is required when updating an existing post', 409);
  }

  const nextHash = sha256(input.content);
  const changed = previousHash !== nextHash;
  const size = Buffer.byteLength(input.content, 'utf8');
  const preview = buildContentPreview({
    previousContent,
    nextContent: input.content,
    previousHash,
    nextHash,
  });

  if (input.dryRun) {
    return {
      pathname,
      url: existing?.url ?? null,
      size,
      hash: nextHash,
      nextHash,
      previousHash,
      changed,
      preview,
      safety,
      dryRun: true,
      warnings: validation.warnings,
    };
  }

  const blob = await put(
    pathname,
    new Blob([input.content], { type: extensionToContentType(pathname) }),
    {
      access: 'public',
      token: env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    }
  );

  await onBlobUpload(
    {
      url: blob.url,
      pathname: blob.pathname,
      size,
      uploadedAt: new Date(),
      contentType: extensionToContentType(pathname),
      uploadedBy: input.actor,
    },
    { actionType: existing ? 'UPDATE' : 'CREATE' }
  );

  return {
    pathname: blob.pathname,
    url: blob.url,
    size,
    hash: nextHash,
    nextHash,
    previousHash,
    changed,
    preview,
    safety,
    dryRun: false,
    warnings: validation.warnings,
  };
}

export async function changeAgentPostDraftStatus(input: ChangeAgentPostDraftStatusInput) {
  const pathname = normalizeOrBadRequest(input.pathname);
  const existing = await findBlobFile(pathname);

  if (!existing) {
    throw new BlogMcpError(`Post not found: ${pathname}`, 404);
  }

  const currentContent = await downloadText(existing.url);
  const currentHash = sha256(currentContent);
  if (input.expectedHash !== currentHash) {
    throw new BlogMcpError('Post changed since expectedHash was produced', 409);
  }

  const statusChange = setBlogPostDraftStatus(currentContent, input.draft);

  if (!statusChange.changed) {
    return {
      pathname,
      url: existing.url,
      size: Buffer.byteLength(currentContent, 'utf8'),
      hash: currentHash,
      nextHash: currentHash,
      previousHash: currentHash,
      changed: false,
      preview: buildContentPreview({
        previousContent: currentContent,
        nextContent: currentContent,
        previousHash: currentHash,
        nextHash: currentHash,
      }),
      dryRun: input.dryRun === true,
      warnings: [] as string[],
      previousDraft: statusChange.previousDraft,
      draft: statusChange.draft,
      statusChanged: false,
    };
  }

  const upserted = await upsertAgentPost({
    pathname,
    content: statusChange.content,
    expectedHash: currentHash,
    draft: input.draft,
    dryRun: input.dryRun,
    actor: input.actor,
  });

  return {
    ...upserted,
    nextHash: upserted.hash,
    previousDraft: statusChange.previousDraft,
    draft: statusChange.draft,
    statusChanged: statusChange.changed,
  };
}

export async function deleteAgentPost(input: DeleteAgentPostInput) {
  const pathname = normalizeOrBadRequest(input.pathname);
  if (input.confirm !== `DELETE ${pathname}`) {
    throw new BlogMcpError(`Confirmation must equal "DELETE ${pathname}"`, 400);
  }

  const existing = await findBlobFile(pathname);
  if (!existing) {
    throw new BlogMcpError(`Post not found: ${pathname}`, 404);
  }

  const currentHash = sha256(await downloadText(existing.url));
  if (input.expectedHash !== currentHash) {
    throw new BlogMcpError('Post changed since expectedHash was produced', 409);
  }

  if (input.dryRun) {
    return { pathname, hash: currentHash, deleted: false, dryRun: true };
  }

  await del(existing.url, { token: env.BLOB_READ_WRITE_TOKEN });
  await onBlobDelete(pathname, input.actor);
  return { pathname, hash: currentHash, deleted: true, dryRun: false };
}

export async function uploadAgentImage(input: UploadAgentImageInput) {
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const extension = safeName.split('.').pop()?.toLowerCase() || 'png';
  if (!safeName || !allowedImageExtensions.has(extension)) {
    throw new BlogMcpError('filename must end with png, jpg, jpeg, webp, or gif', 400);
  }
  const contentType =
    extension === 'jpg' || extension === 'jpeg'
      ? 'image/jpeg'
      : extension === 'gif'
        ? 'image/gif'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/png';
  const pathname = `images/agent-${Date.now()}-${randomUUID().split('-')[0]}-${safeName}`;
  const buffer = decodeBase64Image(input.contentBase64);
  const alt = escapeMarkdownAlt(input.alt || safeName);

  if (input.dryRun) {
    return {
      pathname,
      url: null,
      size: buffer.byteLength,
      contentType,
      markdown: `![${alt}](${pathname})`,
      dryRun: true,
    };
  }

  const blob = await put(pathname, new Blob([new Uint8Array(buffer)], { type: contentType }), {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

  await onBlobUpload({
    url: blob.url,
    pathname: blob.pathname,
    size: buffer.byteLength,
    uploadedAt: new Date(),
    contentType,
    uploadedBy: input.actor,
  });

  return {
    pathname: blob.pathname,
    url: blob.url,
    size: buffer.byteLength,
    contentType,
    markdown: `![${alt}](${blob.url})`,
    dryRun: false,
  };
}
