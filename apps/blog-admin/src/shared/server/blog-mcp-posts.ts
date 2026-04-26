import { createHash, randomUUID } from 'node:crypto';
import { del, put } from '@vercel/blob';
import { env } from '@/env';
import { getCachedBlobFiles, onBlobDelete, onBlobUpload } from '@/shared/server/blob-cdc';
import { normalizeBlogPostPath, validateBlogPost } from '@/shared/lib/blog-post/validate-post';

export class BlogMcpError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = 'BlogMcpError';
  }
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
  const data = typeof content === 'string' ? content : Buffer.isBuffer(content) ? content : Buffer.from(content);
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
  return pathname.toLowerCase().endsWith('.mdx') ? 'text/mdx; charset=utf-8' : 'text/markdown; charset=utf-8';
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
    if (input.draft !== undefined && (validation.frontMatter.draft ?? false) !== input.draft) return false;
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

export async function upsertAgentPost(input: UpsertAgentPostInput) {
  const pathname = normalizeOrBadRequest(input.pathname);
  const validation = validateBlogPost({ pathname, content: input.content, draft: input.draft });

  if (!validation.valid) {
    throw new BlogMcpError(`Invalid post: ${validation.errors.join('; ')}`, 400);
  }

  const shouldInspectExisting = !input.dryRun || Boolean(input.expectedHash);
  const existing = shouldInspectExisting ? await findBlobFile(pathname) : null;
  let previousHash: string | null = null;
  if (existing) {
    previousHash = sha256(await downloadText(existing.url));
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

  if (input.dryRun) {
    return {
      pathname,
      url: existing?.url ?? null,
      size,
      hash: nextHash,
      previousHash,
      changed,
      dryRun: true,
      warnings: validation.warnings,
    };
  }

  const blob = await put(pathname, new Blob([input.content], { type: extensionToContentType(pathname) }), {
    access: 'public',
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
  });

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
    previousHash,
    changed,
    dryRun: false,
    warnings: validation.warnings,
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
