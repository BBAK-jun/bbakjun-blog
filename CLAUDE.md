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

**Location**: `packages/content/src/markdown.ts`

```
Raw MDX content
  → remark-parse (markdown → AST)
  → remark-gfm (GitHub Flavored Markdown: tables, checkboxes)
  → remark-rehype (markdown AST → HTML AST)
  → rehype-slug (add IDs to headings)
  → rehype-autolink-headings (add anchor links to headings)
  → rehype-highlight (syntax highlighting for code blocks)
  → rehype-mermaid (convert ```mermaid to renderable divs)
  → rehype-optimize-images (lazy loading, responsive images, captions)
  → rehype-stringify (HTML AST → string)
```

### Mermaid Chart Support

Mermaid code blocks are transformed server-side by `packages/content/src/rehype-mermaid.ts`:

1. Detects `code.language-mermaid` elements in HTML AST
2. Wraps content in `<div data-mermaid="..."><pre class="mermaid">...</pre></div>`
3. Client-side: `MermaidRenderer` component initializes mermaid.js on mount

### Image Optimization

Images are optimized server-side by `packages/content/src/rehype-optimize-images.ts`:

1. Detects `<img>` elements in HTML AST
2. Adds `loading="lazy"` and `decoding="async"` for better performance
3. Wraps images with alt text in `<figure>` with `<figcaption>`
4. Adds responsive styling classes
5. Prevents layout shift with proper sizing

**Features**:
- Lazy loading for images below the fold
- Automatic captions from alt text
- Responsive design with hover effects
- Dark mode support
- WebP/AVIF format support via Next.js Image configuration

## ISR (Incremental Static Regeneration)

The blog uses **ISR** to combine static performance with dynamic content updates:

### Revalidation Strategy

- **Blog Posts** (`/blog/[...slug]`): 60 seconds
  - Automatically updates content every minute
  - `dynamicParams: true` allows new posts to be generated on-demand

- **Home Page** (`/`): 60 seconds
  - Latest posts list refreshes every minute

- **Tag Pages** (`/tags/[tag]`): 300 seconds (5 minutes)
  - Tag-based post lists refresh every 5 minutes
  - New tags are generated on-demand

### On-Demand Revalidation

API endpoint: `POST /api/revalidate?secret=<token>&path=<path>`

**Usage from blog-admin**:
```bash
curl -X POST \
  'https://your-blog.vercel.app/api/revalidate?secret=YOUR_SECRET&path=/blog/my-post'
```

**Environment Variables**:
- `REVALIDATION_SECRET`: Secret token for on-demand revalidation (generate with `openssl rand -base64 32`)

**See**: [apps/blog/docs/ISR.md](apps/blog/docs/ISR.md) for complete guide

## Component Architecture

### Page Components (App Router)

- **`src/app/blog/[...slug]/page.tsx`**: Individual post pages
  - Uses `generateStaticParams()` for static generation with ISR
  - Handles catch-all routes for nested slugs
  - Generates metadata with dynamic OG images
  - Renders processed markdown with dangerouslySetInnerHTML
  - **ISR**: 60 second revalidation

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

## Vercel Blob CDC (Change Data Capture)

**Problem**: Vercel Blob free tier limits to 2,000 operations/month. Frequent `list()` API calls for file management UIs can exceed this limit quickly.

**Solution**: CDC pipeline that caches Blob file listings in PostgreSQL, reducing API calls by ~99%.

### Architecture

**Location**: `apps/blog-admin/src/lib/blob-cdc.ts`

```
Vercel Blob Storage (Source of Truth)
    ↓
    ↓ Sync every 5 minutes
    ↓
PostgreSQL BlobFile table (Cache)
    ↓
    ↓ Read operations
    ↓
Admin UI & Blog App
```

### Key Components

1. **BlobFile Model** (`apps/blog-admin/prisma/schema.prisma`):
   ```prisma
   model BlobFile {
     id          String   @id @default(cuid())
     url         String   @unique
     pathname    String
     size        BigInt
     uploadedAt  DateTime
     contentType String?
     syncedAt    DateTime @default(now())
     lastChecked DateTime @default(now())
     isDeleted   Boolean  @default(false)  // Soft delete
     uploadedBy  String?
   }
   ```

2. **Sync Function** (`syncBlobToDatabase()`):
   - Calls Vercel Blob `list()` API once
   - Compares with DB cache
   - Adds new files, marks deleted files, updates timestamps
   - Runs automatically every 5 minutes via `needsSync()` check

3. **Cache Read** (`getCachedBlobFiles()`):
   - Queries PostgreSQL instead of Blob API
   - Supports pagination, search, filtering
   - Returns only non-deleted files

4. **Upload Hooks** (`onBlobUpload()`, `onBlobDelete()`):
   - Real-time tracking of uploads/deletes
   - Called immediately after Blob operations
   - Non-critical: upload succeeds even if hook fails

### API Endpoints

**GET `/api/admin/blob-files`** (blog-admin):
- Auto-syncs if 5+ minutes since last sync
- Returns cached file list from DB
- Query params: `limit`, `offset`, `search`, `autoSync`

**POST `/api/admin/blob-files/sync`** (blog-admin):
- Manual sync trigger (admin only)
- Returns sync statistics

### Usage Pattern

**❌ Old (Direct Blob API)**:
```typescript
import { list } from '@vercel/blob'
const { blobs } = await list() // API call every page load
```

**✅ New (CDC Cached)**:
```typescript
const response = await fetch('/api/admin/blob-files?limit=100')
const { files } = await response.json() // DB query, no Blob API call
```

### Cost Reduction

- **Before CDC**: ~2000+ Blob API calls/month (exceeded limit)
- **After CDC**: ~288 Blob API calls/month (5-min intervals × 24h × 30d ÷ 60)
- **Savings**: 99% reduction in API calls

### Important Notes

1. **Soft Delete Pattern**: Files are marked `isDeleted: true` instead of removed from DB to maintain history
2. **Eventually Consistent**: 5-minute sync interval means slight delay for manual Blob operations
3. **Non-blocking Hooks**: Upload hook failures are logged but don't block uploads
4. **Manual Sync**: Admins can trigger immediate sync via POST endpoint
5. **Auto-sync**: Automatically triggers on GET requests if 5+ minutes elapsed

### When to Use CDC

Use this pattern when:
- External API has strict rate limits
- Data doesn't need real-time accuracy (eventual consistency OK)
- Read-heavy workload (many list/fetch operations)
- Source of truth is external (Vercel Blob, S3, etc.)

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

## Monorepo Structure

This is a **Turborepo monorepo** with the following structure:

```
├── apps/
│   ├── blog/              # Public blog (Next.js)
│   └── blog-admin/        # Admin dashboard (Next.js + Prisma + Auth.js)
├── packages/
│   ├── analytics/         # @repo/analytics - Redis-based view tracking
│   ├── content/           # @repo/content - MDX processing
│   ├── types/             # @repo/types - Shared TypeScript types
│   ├── ui/                # @repo/ui - Shared UI components
│   └── config/            # @repo/config - Shared configurations
└── turbo.json             # Turborepo configuration
```

### Development Commands (Monorepo)

```bash
# Run all apps
pnpm dev

# Run specific app
pnpm dev:admin        # blog-admin only (port 3001)
pnpm dev              # blog only (port 3000)

# Build specific app
pnpm build:admin      # blog-admin
pnpm build:blog       # blog

# Build all packages and apps
pnpm build

# Type checking
pnpm type-check
```

### Workspace Dependencies

Packages use `workspace:*` protocol for local dependencies:
```json
{
  "dependencies": {
    "@repo/analytics": "workspace:*",
    "@repo/content": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

## Deployment Notes

### Blog App (apps/blog)

**Platform**: Vercel (optimized for Next.js)

**Required Environment Variables**:
```
REDIS_URL=redis://...
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GISCUS_REPO_ID=... (optional, for comments)
REVALIDATION_SECRET=... (for on-demand ISR revalidation)
NEXT_PUBLIC_ADMIN_URL=https://... (blog-admin URL for newsletter API)
```

**Build Process**:
1. Static generation for all posts via `generateStaticParams()` with ISR
2. API routes deployed as serverless functions
3. Redis connection pooled via Vercel KV
4. ISR revalidation: 60s for posts/home, 300s for tags

**ISR Configuration**:
- Blog posts and home page automatically refresh every 60 seconds
- Tag pages refresh every 5 minutes
- On-demand revalidation available via `/api/revalidate` endpoint
- See [apps/blog/docs/ISR.md](apps/blog/docs/ISR.md) for details

### Blog-Admin App (apps/blog-admin)

**Platform**: Vercel

**Required Environment Variables**:
```
DATABASE_URL=postgresql://...           # Neon PostgreSQL
DIRECT_URL=postgresql://...             # Direct connection (non-pooled)
AUTH_SECRET=...                         # openssl rand -base64 32
AUTH_GOOGLE_ID=...                      # Google OAuth Client ID
AUTH_GOOGLE_SECRET=...                  # Google OAuth Client Secret
BLOB_READ_WRITE_TOKEN=...               # Vercel Blob Storage token
BLOB_STORE_ID=...                       # Vercel Blob Store ID
BACKOFFICE_API_KEY=...                  # Legacy API key
JWT_SECRET=...                          # openssl rand -base64 32
NEXT_PUBLIC_BLOG_URL=https://...        # Public blog URL
RESEND_API_KEY=...                      # Resend email API key (for newsletter)
```

**Critical Setup**:
1. **Prisma Client Generation**: `postinstall` script runs `prisma generate`
2. **Environment Variables**: All env vars must be declared in `turbo.json`
3. **Build Configuration**: Uses `vercel.json` with custom build commands

**CRITICAL - Vercel Environment Variables (Prisma 7)**:

⚠️ **NEVER wrap environment variable values in quotes on Vercel**:

❌ Wrong:
```
DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"
```

✅ Correct:
```
DATABASE_URL = postgresql://user:pass@host/db?sslmode=require
```

**Why**: Vercel treats quotes as part of the value, causing Prisma to fail with cryptic errors like "Can't reach database server at base". Always enter raw values without quotes.

**Deployment Issues & Solutions**:

See [apps/blog-admin/docs/DEPLOYMENT.md](apps/blog-admin/docs/DEPLOYMENT.md) for:
- Prisma Client build errors
- Turborepo environment variable warnings
- Prisma 7 database connection issues
- Complete troubleshooting guide

### Turborepo Environment Variables

**IMPORTANT**: All environment variables used in the monorepo must be declared in `turbo.json`:

```json
{
  "globalEnv": ["NODE_ENV", "VERCEL", "DATABASE_URL", ...],
  "tasks": {
    "build": {
      "env": ["DATABASE_URL", "AUTH_SECRET", ...]
    }
  }
}
```

For library packages that don't use environment variables, add `"envMode": "loose"` to their `package.json`:

```json
{
  "name": "@repo/types",
  "envMode": "loose"
}
```

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

## Documentation Guidelines

**CRITICAL**: Always update documentation when making significant changes to the codebase.

### When to Update Documentation

1. **After Adding New Features**
   - Update relevant files in `apps/[app-name]/docs/`
   - Add API documentation if new endpoints created
   - Update ARCHITECTURE.md if structure changes

2. **After Fixing Deployment Issues**
   - Document the issue in `apps/blog-admin/docs/DEPLOYMENT.md` under "문제 해결 (트러블슈팅)"
   - Include error messages, causes, and solutions
   - Update CLAUDE.md if it's a critical pattern to remember

3. **After Adding Environment Variables**
   - Update `turbo.json` with new variables
   - Document in CLAUDE.md under "Deployment Notes"
   - Add to DEPLOYMENT.md's environment variables section

4. **After Major Refactoring**
   - Update ARCHITECTURE.md with new structure
   - Update code examples in documentation
   - Update CLAUDE.md if patterns changed

5. **After Adding Dependencies**
   - Document why the dependency was added
   - Note any special configuration required
   - Update package-specific README if needed

### Documentation Structure to Follow

```
Problem/Feature → Solution → Documentation Update
```

**Example Flow**:
1. Fix Prisma build issue
2. Update `package.json` with `postinstall` script
3. **Document in**:
   - ✅ `apps/blog-admin/docs/DEPLOYMENT.md` (troubleshooting section)
   - ✅ `CLAUDE.md` (critical setup section)

### Files to Update Based on Change Type

| Change Type | Update These Files |
|-------------|-------------------|
| Deployment issue | `apps/blog-admin/docs/DEPLOYMENT.md`, `CLAUDE.md` |
| New API endpoint | `apps/blog-admin/docs/API.md` |
| Architecture change | `apps/blog-admin/docs/ARCHITECTURE.md`, `CLAUDE.md` |
| Environment variable | `turbo.json`, `CLAUDE.md`, `DEPLOYMENT.md` |
| New pattern/convention | `CLAUDE.md`, relevant `/docs/` files |
| Bug fix (significant) | `DEPLOYMENT.md` or `DEVELOPMENT.md` |

### Documentation Template for Issues

When documenting a resolved issue in DEPLOYMENT.md:

```markdown
#### Issue Title

**오류 메시지**:
\`\`\`
[Exact error message]
\`\`\`

**원인**: [Root cause explanation]

**해결 방법**:

1. [Step 1 with code example]
2. [Step 2 with code example]
3. [Verification step]
```

### What NOT to Document

- Minor variable renames
- Simple typo fixes
- Temporary debugging code
- Routine dependency updates (unless breaking changes)

### Documentation Priority

**HIGH (Must document immediately)**:
- Deployment configuration changes
- Build process changes
- Critical bug fixes
- New environment variables
- Breaking changes

**MEDIUM (Document when convenient)**:
- New features
- API changes
- Architecture refactoring
- New utilities

**LOW (Optional)**:
- Internal helper functions
- Minor optimizations
- Code cleanup

### Self-Check Before Completing Task

Before marking a task complete, ask:
1. ✅ Did I update CLAUDE.md if this is a pattern to remember?
2. ✅ Did I update DEPLOYMENT.md if this affects deployment?
3. ✅ Did I update API.md if I added/changed endpoints?
4. ✅ Did I update turbo.json if I used new environment variables?
5. ✅ Did I update ARCHITECTURE.md if structure changed?

**If any answer is YES but not done → Update documentation first, then complete task.**
