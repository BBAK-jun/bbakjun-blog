import matter from 'gray-matter';
import { z } from 'zod';

function isValidIsoCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
  .refine(isValidIsoCalendarDate, 'date must be valid');

const frontMatterSchema = z.object({
  title: z.string().min(1),
  date: z.preprocess(
    value => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
    isoDateSchema
  ),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  author: z.string().min(1),
  draft: z.boolean().optional(),
  order: z.number().optional(),
});

export type BlogPostFrontMatter = z.infer<typeof frontMatterSchema>;

export interface ValidateBlogPostInput {
  pathname?: string;
  content: string;
  draft?: boolean;
}

export interface ValidateBlogPostResult {
  valid: boolean;
  normalizedPathname?: string;
  frontMatter?: BlogPostFrontMatter;
  body: string;
  errors: string[];
  warnings: string[];
}

export interface SetBlogPostDraftStatusResult {
  content: string;
  changed: boolean;
  previousDraft: boolean;
  draft: boolean;
}

export function normalizeBlogPostPath(pathname: string): string {
  const normalized = pathname.trim().replace(/^\/+|\/+$/g, '');

  if (!normalized) {
    throw new Error('Path is required');
  }
  if (normalized.includes('..')) {
    throw new Error('Path must not contain traversal');
  }
  if (normalized.includes('\\')) {
    throw new Error('Path must use forward slashes');
  }
  if (!/\.(md|mdx)$/i.test(normalized)) {
    throw new Error('Path must end with .md or .mdx');
  }

  return normalized;
}

function formatZodIssue(path: (string | number)[], message: string): string {
  const name = path.length > 0 ? `frontMatter.${path.join('.')}` : 'frontMatter';
  if (
    message === 'Required' ||
    message.includes('required') ||
    message.includes('received undefined')
  ) {
    return `${name} is required`;
  }
  return `${name}: ${message}`;
}

export function setBlogPostDraftStatus(
  content: string,
  draft: boolean
): SetBlogPostDraftStatusResult {
  const parsed = matter(content);
  const previousDraft = parsed.data.draft === true;

  if (previousDraft === draft && typeof parsed.data.draft === 'boolean') {
    return { content, changed: false, previousDraft, draft };
  }

  const nextContent = matter.stringify(parsed.content, { ...parsed.data, draft });
  return {
    content: nextContent.endsWith('\n') ? nextContent : `${nextContent}\n`,
    changed: true,
    previousDraft,
    draft,
  };
}

export function validateBlogPost(input: ValidateBlogPostInput): ValidateBlogPostResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let normalizedPathname: string | undefined;

  if (input.pathname !== undefined) {
    try {
      normalizedPathname = normalizeBlogPostPath(input.pathname);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid path');
    }
  }

  const parsed = matter(input.content);
  const frontMatterResult = frontMatterSchema.safeParse(parsed.data);

  if (!frontMatterResult.success) {
    errors.push(
      ...frontMatterResult.error.issues.map(issue =>
        formatZodIssue(
          issue.path.map(segment => String(segment)),
          issue.message
        )
      )
    );
  }

  if (input.draft !== undefined && frontMatterResult.success) {
    const frontMatterDraft = frontMatterResult.data.draft ?? false;
    if (frontMatterDraft !== input.draft) {
      warnings.push(
        `Input draft=${input.draft} differs from front matter draft=${frontMatterDraft}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    normalizedPathname,
    frontMatter: frontMatterResult.success ? frontMatterResult.data : undefined,
    body: parsed.content,
    errors,
    warnings,
  };
}
