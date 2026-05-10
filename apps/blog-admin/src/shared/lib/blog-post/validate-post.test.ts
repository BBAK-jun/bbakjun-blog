import { describe, expect, it } from 'vitest';
import { setBlogPostDraftStatus, validateBlogPost, normalizeBlogPostPath } from './validate-post';

const validContent = `---
title: "AI가 나를 대체할 수 있게 일하기"
date: "2026-04-26"
description: "AI Coding Harness를 쓰며 느낀 위임과 워크플로우"
tags: ["AI", "workflow"]
author: "bbakjun"
draft: false
---

# 본문

내용입니다.
`;

describe('normalizeBlogPostPath', () => {
  it('trims slashes and preserves mdx extension', () => {
    expect(normalizeBlogPostPath('/career/post.mdx')).toBe('career/post.mdx');
  });

  it('rejects path traversal and non-markdown extensions', () => {
    expect(() => normalizeBlogPostPath('../secret.mdx')).toThrow('Path must not contain traversal');
    expect(() => normalizeBlogPostPath('career/post.txt')).toThrow(
      'Path must end with .md or .mdx'
    );
  });
});

describe('validateBlogPost', () => {
  it('accepts valid front matter and pathname', () => {
    const result = validateBlogPost({
      pathname: 'career/ai-coding-harness-delegation.mdx',
      content: validContent,
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedPathname).toBe('career/ai-coding-harness-delegation.mdx');
    expect(result.frontMatter?.title).toBe('AI가 나를 대체할 수 있게 일하기');
    expect(result.errors).toEqual([]);
  });

  it('accepts unquoted YAML dates parsed by gray-matter as Date objects', () => {
    const result = validateBlogPost({
      pathname: 'career/date-post.mdx',
      content: validContent.replace('date: "2026-04-26"', 'date: 2026-04-26'),
    });

    expect(result.valid).toBe(true);
    expect(result.frontMatter?.date).toBe('2026-04-26');
  });

  it('rejects invalid calendar dates', () => {
    const impossibleMonth = validateBlogPost({
      pathname: 'career/bad-month.mdx',
      content: validContent.replace('date: "2026-04-26"', 'date: "2026-99-99"'),
    });
    const impossibleDay = validateBlogPost({
      pathname: 'career/bad-day.mdx',
      content: validContent.replace('date: "2026-04-26"', 'date: "2026-02-30"'),
    });

    expect(impossibleMonth.valid).toBe(false);
    expect(impossibleMonth.errors).toContain('frontMatter.date: date must be valid');
    expect(impossibleDay.valid).toBe(false);
    expect(impossibleDay.errors).toContain('frontMatter.date: date must be valid');
  });

  it('reports missing required front matter fields', () => {
    const result = validateBlogPost({
      pathname: 'career/post.mdx',
      content: '---\ntitle: Only title\n---\nBody',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('frontMatter.date is required');
    expect(result.errors).toContain('frontMatter.description is required');
    expect(result.errors).toContain('frontMatter.tags is required');
    expect(result.errors).toContain('frontMatter.author is required');
  });

  it('warns when front matter draft disagrees with explicit draft argument', () => {
    const result = validateBlogPost({
      pathname: 'career/post.mdx',
      content: validContent,
      draft: true,
    });

    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Input draft=true differs from front matter draft=false');
  });
});

describe('setBlogPostDraftStatus', () => {
  it('updates an existing draft front matter value', () => {
    const content = validContent.replace('draft: false', 'draft: true');

    const result = setBlogPostDraftStatus(content, false);

    expect(result.changed).toBe(true);
    expect(result.content).toContain('draft: false');
    expect(
      validateBlogPost({ pathname: 'career/post.mdx', content: result.content }).frontMatter?.draft
    ).toBe(false);
  });

  it('adds draft front matter when it is missing', () => {
    const content = validContent.replace('draft: false\n', '');

    const result = setBlogPostDraftStatus(content, true);

    expect(result.changed).toBe(true);
    expect(result.content).toContain('draft: true');
    expect(
      validateBlogPost({ pathname: 'career/post.mdx', content: result.content }).frontMatter?.draft
    ).toBe(true);
  });

  it('reports no change when draft front matter already matches', () => {
    const result = setBlogPostDraftStatus(validContent, false);

    expect(result.changed).toBe(false);
    expect(result.content).toBe(validContent);
  });
});
