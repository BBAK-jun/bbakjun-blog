import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '@/env';

export const BLOG_MCP_SCOPES = ['blog:read', 'blog:write', 'blog:delete', 'blog:publish'] as const;

export type BlogMcpScope = (typeof BLOG_MCP_SCOPES)[number];

export interface BlogMcpApiKeyConfig {
  name: string;
  key: string;
  scopes: BlogMcpScope[];
}

export interface BlogMcpActor {
  name: string;
  scopes: BlogMcpScope[];
}

const scopeSet = new Set<string>(BLOG_MCP_SCOPES);

function isBlogMcpScope(scope: unknown): scope is BlogMcpScope {
  return typeof scope === 'string' && scopeSet.has(scope);
}

export function parseBlogMcpApiKeys(raw: string | undefined | null): BlogMcpApiKeyConfig[] {
  const normalizedRaw = raw?.trim();
  if (!normalizedRaw) {
    return [];
  }

  const jsonText =
    (normalizedRaw.startsWith("'") && normalizedRaw.endsWith("'")) ||
    (normalizedRaw.startsWith('"') && normalizedRaw.endsWith('"'))
      ? normalizedRaw.slice(1, -1).trim()
      : normalizedRaw;

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap(item => {
      if (!item || typeof item !== 'object') {
        return [];
      }

      const candidate = item as Record<string, unknown>;
      if (typeof candidate.name !== 'string' || typeof candidate.key !== 'string') {
        return [];
      }
      if (!candidate.name.trim() || !candidate.key.trim() || !Array.isArray(candidate.scopes)) {
        return [];
      }
      if (!candidate.scopes.every(isBlogMcpScope)) {
        return [];
      }

      return [
        {
          name: candidate.name,
          key: candidate.key,
          scopes: candidate.scopes,
        },
      ];
    });
  } catch {
    return [];
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}

export function verifyBlogMcpApiKey(authHeader: string | null | undefined): BlogMcpActor | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const matched = parseBlogMcpApiKeys(env.BLOG_MCP_API_KEYS).find(config => safeEqual(config.key, token));
  if (!matched) {
    return null;
  }

  return {
    name: matched.name,
    scopes: matched.scopes,
  };
}

export function assertBlogMcpScope(actor: BlogMcpActor, scope: BlogMcpScope): void {
  if (!actor.scopes.includes(scope)) {
    throw new Error(`Missing required MCP scope: ${scope}`);
  }
}
