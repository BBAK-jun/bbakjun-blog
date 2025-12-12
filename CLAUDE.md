# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DEV_BBAK 블로그 - A modern blog built with Next.js 15, TypeScript, MDX, and Redis (Vercel KV). This is a Korean-language technical blog with MDX-based content, real-time view tracking, tag-based filtering, and dark mode support.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Content Architecture

### MDX Post Structure

Blog posts are stored in `content/posts/` with support for nested folder structures:

- **Flat structure**: `content/posts/my-post.mdx` → slug: `my-post`
- **Folder with index**: `content/posts/my-post/index.mdx` → slug: `my-post`
- **Nested folders**: `content/posts/DEV/my-post/index.mdx` → slug: `DEV/my-post`

The first folder level (DEV, REACT, JS, STUDY, TIL, career) acts as a category for related posts scoring.

### Post Front Matter Schema

```yaml
---
title: "Post Title"
date: "2024-11-15"
description: "Post description"
tags: ["nextjs", "react", "typescript"]
author: "bbakjun"
draft: false  # Set to true to exclude from builds
---
```

All fields are required except `draft` (defaults to `false`).

## Core Data Flow

### Post Loading System (`src/lib/posts.ts`)

1. **File Discovery**: Recursively scans `content/posts/` for `.mdx` files
2. **Slug Generation**: Converts file paths to URL slugs (handles `index.mdx` specially)
3. **Front Matter Parsing**: Uses `gray-matter` to extract YAML metadata
4. **Reading Time**: Calculates using `reading-time` library
5. **Related Posts**: Scores posts by shared tags (×3), same category (×2), and recency (×0.5)

### View Tracking System (`src/lib/redis.ts`)

Uses Redis hashes with session-based deduplication:

- **Key Pattern**: `views:{slug}` (e.g., `views:DEV/my-post`)
- **Hash Fields**:
  - `views`: Total view count
  - `sessions:{sessionId}`: Marker for each unique viewer
- **Deduplication**: `HSETNX` ensures atomic session-based increment (no double-counting)
- **Bot Filtering**: API route filters common crawler user agents
- **TTL**: 24-hour expiry on hash keys

### API Routes

- `GET /api/views/[...slug]`: Fetch view count (60s cache)
- `POST /api/views/[...slug]`: Increment view (session-aware, bot-filtered)
- `GET /api/views/stats`: Total views and popular posts
- `GET /api/og/[...slug]`: Dynamic Open Graph images

## Markdown Processing Pipeline

**Location**: `src/lib/markdown.ts`

```
Raw MDX content
  → remark-parse (markdown → AST)
  → remark-gfm (GitHub Flavored Markdown: tables, checkboxes)
  → remark-rehype (markdown AST → HTML AST)
  → rehype-slug (add IDs to headings)
  → rehype-autolink-headings (add anchor links to headings)
  → rehype-highlight (syntax highlighting for code blocks)
  → rehype-mermaid (convert ```mermaid to renderable divs)
  → rehype-stringify (HTML AST → string)
```

### Mermaid Chart Support

Mermaid code blocks are transformed server-side by `src/lib/rehype-mermaid.ts`:

1. Detects `code.language-mermaid` elements in HTML AST
2. Wraps content in `<div data-mermaid="..."><pre class="mermaid">...</pre></div>`
3. Client-side: `MermaidRenderer` component initializes mermaid.js on mount

## Component Architecture

### Page Components (App Router)

- **`src/app/blog/[...slug]/page.tsx`**: Individual post pages
  - Uses `generateStaticParams()` for static generation
  - Handles catch-all routes for nested slugs
  - Generates metadata with dynamic OG images
  - Renders processed markdown with dangerouslySetInnerHTML

### Client Components

- **ViewCounter**: Fetches/increments views via API (session cookie required)
- **TableOfContents**: Client-side heading extraction from DOM
- **MermaidRenderer**: Initializes mermaid.js after hydration
- **Comments**: Giscus integration (requires `NEXT_PUBLIC_GISCUS_REPO_ID`)
- **PopularPosts**: Server component that queries Redis for top posts

### MDX Components (`mdx-components.tsx`)

Custom renderers for MDX elements with Tailwind styling:
- Headings (h1-h3): Bold, dark mode support
- Links: External links open in new tab
- Images: Wrapped in Next.js `Image` component (800×400)
- Code: Inline vs block styles

## Redis Integration

**Environment Variables**:
- `REDIS_URL`: Connection string for Redis instance

**Fallback Behavior**: If Redis is unavailable, view counts return 0 (app continues to work).

**Key Migration**: The ViewCounter class automatically migrates old string-based keys to hash-based keys.

## Styling System

- **Framework**: Tailwind CSS v4
- **UI Components**: Radix UI primitives (Avatar, Badge, Button, Card, etc.)
- **Dark Mode**: `next-themes` with system preference detection
- **Typography**: `@tailwindcss/typography` for prose styling
- **Utility**: `clsx` + `tailwind-merge` for conditional classes

## Next.js Configuration

**`next.config.ts`**:
- Enables MDX support via `@next/mdx`
- Experimental `mdxRs: true` for Rust-based MDX compiler
- Page extensions: `['js', 'jsx', 'md', 'mdx', 'ts', 'tsx']`

## Deployment Notes

**Platform**: Vercel (optimized for Next.js)

**Required Environment Variables**:
```
REDIS_URL=redis://...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GISCUS_REPO_ID=... (optional, for comments)
```

**Build Process**:
1. Static generation for all posts via `generateStaticParams()`
2. API routes deployed as serverless functions
3. Redis connection pooled via Vercel KV

## Common Patterns

### Adding a New Post

1. Create `content/posts/{category}/{slug}/index.mdx`
2. Add front matter (title, date, description, tags, author)
3. Build will auto-discover and generate static page
4. Related posts calculated based on tags and category

### Modifying Markdown Rendering

Edit the unified pipeline in `src/lib/markdown.ts`. Add rehype/remark plugins to the processor chain.

### Customizing UI Components

- Base components: `src/components/ui/` (shadcn/ui pattern)
- Feature components: `src/components/` (blog-specific)
- Global styles: Applied via `src/app/layout.tsx`

### Session Tracking

Session IDs are managed client-side (see `ViewCounter` component). The backend uses cookies to deduplicate views within 24 hours.
