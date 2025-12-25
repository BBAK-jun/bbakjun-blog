# DEV_BBAK Blog - Technical Facts Extracted

## 1. Project Structure

### Monorepo Architecture

```
bbakjun-blog-monorepo/
├── apps/
│   ├── blog/              # Public blog app (Next.js 15)
│   └── blog-admin/        # Admin dashboard (Next.js + Prisma + Auth)
├── packages/
│   ├── analytics/         # @repo/analytics - Redis-based view tracking
│   ├── content/           # @repo/content - MDX processing pipeline
│   ├── types/             # @repo/types - Shared TypeScript types
│   ├── ui/                # @repo/ui - Shared UI components
│   └── config/            # @repo/config - Shared configurations
├── scripts/               # Utility scripts for content management
└── turbo.json            # Turborepo configuration
```

### Package Manager & Tools

- **Package Manager**: pnpm 10.25.0
- **Build System**: Turborepo 2.6.3
- **Node Version**: >=24
- **TypeScript**: 5.x

### Workspace Dependencies

- All packages use `workspace:*` protocol for local dependencies
- Transpile packages configured in blog app's next.config.ts

## 2. Core Technologies

### Next.js 15 Configuration

- **Framework**: Next.js 16.0.8 (latest)
- **App Router**: Full adoption with App Router pattern
- **MDX Support**: Via @next/mdx with experimental mdxRs
- **Page Extensions**: js, jsx, md, mdx, ts, tsx
- **Image Optimization**: WebP/AVIF formats, multiple device sizes

### TypeScript Setup

- Strict TypeScript configuration
- Shared types in @repo/types package
- Environment variables validated with @t3-oss/env-nextjs

### Database & Storage

- **Primary Database**: PostgreSQL (Neon)
- **ORM**: Prisma 7.1.0
- **Cache**: Redis (Vercel KV)
- **File Storage**: Vercel Blob Storage
- **CDC Pattern**: Change Data Capture for Blob files

## 3. Architecture Patterns

### CDC (Change Data Capture) for Blob Storage

**Location**: `apps/blog-admin/src/lib/blob-cdc.ts`

Reduces Vercel Blob API calls by ~99%:

```typescript
// BlobFile Model
model BlobFile {
  id          String   @id @default(cuid())
  url         String              // Blob URL (changes on re-upload)
  pathname    String   @unique    // File path (unique identifier)
  size        BigInt
  uploadedAt  DateTime
  contentType String?
  syncedAt    DateTime @default(now())
  lastChecked DateTime @default(now())
  isDeleted   Boolean  @default(false)  // Soft delete
  uploadedBy  String?
}
```

**Key Features**:

- Sync interval: 30 minutes (configurable via BLOB_SYNC_INTERVAL_MINUTES)
- Pathname as unique identifier (NOT URL)
- Soft delete pattern for history tracking
- Real-time hooks for upload/delete operations

### Hono RPC for Cross-App Communication

**Type-safe API between blog and blog-admin**:

```typescript
// Blog Admin RPC Routes
- GET /api/rpc/blob-files - Public endpoint
- GET /api/rpc/blob-files/admin - Admin endpoint with auto-sync
- POST /api/rpc/blob-files/admin/sync - Manual sync trigger
- POST /api/rpc/uploadMarkdown
- POST /api/rpc/uploadImage
- POST /api/rpc/subscribeNewsletter
- GET /api/rpc/getViewsStats
- GET /api/rpc/getViewsBySlug/:slug
- POST /api/rpc/incrementViewsBySlug/:slug
```

**Client Usage**:

```typescript
import { AppType } from 'blog-admin/rpc';
import { hc } from 'hono/client';
export const client = hc<AppType>(env.NEXT_PUBLIC_ADMIN_URL);
```

### ISR (Incremental Static Regeneration)

- **Blog Posts**: 60 seconds revalidation
- **Home Page**: 60 seconds revalidation
- **Tag Pages**: 300 seconds revalidation
- **On-demand Revalidation**: Via `/api/revalidate` endpoint
- **Dynamic Params**: Enabled for new posts

### Type-Safe Environment Variables

Using @t3-oss/env-nextjs with Zod validation:

**Blog App Variables**:

```typescript
server: {
  REDIS_URL: z.string().url().optional(),
  REVALIDATION_SECRET: z.string().min(1).optional(),
}
client: {
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADMIN_URL: z.string().url(),
  NEXT_PUBLIC_GISCUS_REPO: z.string().optional(),
  // ... other Giscus variables
}
```

**Blog-Admin App Variables**:

```typescript
server: {
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  // ... 15+ other variables
}
```

## 4. Database Schema

### User Management (Auth.js v5)

```typescript
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(GUEST)  // SUPER_ADMIN | ADMIN | GUEST
  username      String?   @unique
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Auth.js required models
model Account { /* Google OAuth etc. */ }
model Session { /* Session management */ }
model VerificationToken { /* Email verification */ }
```

### Content Management

```typescript
model Experience {
  id          String   @id @default(cuid())
  company     String
  position    String
  team        String?
  period      String               // e.g., "2023.01 ~ 2024.12"
  isCurrent   Boolean  @default(false)
  description String?
  sortOrder   Int      @default(0)
  achievements Achievement[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Achievement {
  id          String   @id @default(cuid())
  title       String
  description String   @db.Text
  tags        String?              // JSON array
  sortOrder   Int      @default(0)
  experienceId String
  experience  Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Newsletter System

```typescript
model Subscriber {
  id              String    @id @default(cuid())
  email           String    @unique
  subscribedAt    DateTime  @default(now())
  unsubscribedAt  DateTime?
  isActive        Boolean   @default(true)
  unsubscribeToken String   @unique @default(cuid())
  source          String?   // "footer", "popup", "blog-post"
}
```

## 5. MDX Processing Pipeline

**Location**: `packages/content/src/markdown.ts`

```typescript
const processor = unified()
  .use(remarkParse) // Markdown → AST
  .use(remarkGfm) // GitHub Flavored Markdown
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug) // Add IDs to headings
  .use(rehypeAutolinkHeadings) // Anchor links
  .use(rehypeHighlight, {
    // Syntax highlighting
    detect: true,
    ignoreMissing: true,
  })
  .use(rehypeMermaid) // Mermaid chart support
  .use(rehypeOptimizeImages) // Lazy loading, captions
  .use(rehypeStringify, { allowDangerousHtml: true });
```

### Mermaid Support

- Server-side transformation in `rehype-mermaid.ts`
- Client-side rendering via `MermaidRenderer` component
- Wrapped in `<div data-mermaid="...">` pattern

### Image Optimization

- Automatic lazy loading
- Responsive captions from alt text
- Dark mode support
- WebP/AVIF format support

## 6. View Tracking System

**Location**: `packages/analytics/src/index.ts`

### Redis Hash-based Storage

```typescript
// Key pattern: views:{slug}
// Hash fields:
// - "views": Total count
// - "sessions:{sessionId}": Marker for each viewer

// Session-aware increment
ViewCounter.incrementWithSession(sessionId, slug);
```

### Features

- Session-based deduplication (24-hour TTL)
- Bot filtering
- Automatic migration from string to hash keys
- Bulk operations support
- Popular posts tracking
- Total view statistics

## 7. Blog Post System

### Content Architecture

- **Storage**: Vercel Blob Storage
- **Format**: MDX with front matter
- **Structure**: Supports nested categories
  - Flat: `content/posts/my-post.mdx`
  - Folder: `content/posts/my-post/index.mdx`
  - Nested: `content/posts/DEV/my-post/index.mdx`

### Front Matter Schema

```yaml
---
title: 'Post Title'
date: '2024-11-15'
description: 'Post description'
tags: ['nextjs', 'react', 'typescript']
author: 'bbakjun'
draft: false # Optional, defaults to false
order: 1 # Optional, for manual ordering
series: 'series-slug' # Optional, series identifier
seriesOrder: 1 # Optional, order in series
image: '/cover.jpg' # Optional, cover image
---
```

### Post Loading Flow

1. Fetch blob files via Hono RPC from blog-admin
2. Download content from blob URLs in parallel
3. Parse front matter with gray-matter
4. Calculate reading time
5. Process markdown with unified pipeline
6. Score related posts by tags/category/recency

### Related Posts Algorithm

- Shared tags: ×3 weight
- Same category: ×2 weight
- Recent posts: ×0.5 weight

## 8. Series Management

### Series Features

- Posts can be grouped into series
- Automatic series navigation
- Series pages with cover images
- Status tracking (ongoing/completed)
- Ordering within series

### Series Navigation Component

- Previous/Next post links
- Series index display
- Progress indicator

## 9. UI Components

### Shared UI Package (@repo/ui)

- Built with Radix UI primitives
- Tailwind CSS v4 with dark mode
- Components:
  - Avatar, Badge, Button, Card
  - Label, Separator, Slot, Tabs
  - Utility functions (cn, mergeClasses)

### Styling System

- **Framework**: Tailwind CSS v4
- **Dark Mode**: next-themes with system detection
- **Typography**: @tailwindcss/typography
- **Animation**: tailwindcss-animate
- **Icons**: Lucide React

## 10. Authentication & Authorization

### Auth.js v5 Integration

- Google OAuth provider
- Prisma adapter for session storage
- Role-based access control (RBAC)
- Session middleware for API routes

### User Roles

- **SUPER_ADMIN**: All permissions + user management
- **ADMIN**: Content CRUD operations
- **GUEST**: Read-only access

## 11. API Architecture

### Blog App APIs

- `GET/POST /api/views/[...slug]` - View tracking
- `GET /api/views/stats` - Statistics
- `GET /api/og/[...slug]` - Dynamic OG images
- `POST /api/revalidate` - ISR revalidation

### Blog-Admin RPC APIs

- Type-safe endpoints with Zod validation
- OpenAPI auto-generation
- CORS support for cross-origin requests
- Legacy v1 routes for backward compatibility

## 12. Build & Deployment

### Build Process

```bash
# Development
pnpm dev              # All apps
pnpm dev:blog         # Blog only (port 3000)
pnpm dev:admin        # Admin only (port 3001)

# Production
pnpm build            # All apps and packages
pnpm build:blog       # Blog only
pnpm build:admin      # Admin only
```

### Environment Variables

- All variables declared in turbo.json
- Server/client separation enforced
- Runtime validation with Zod

### Deployment Platforms

- **Blog**: Vercel (optimized for Next.js)
- **Admin**: Vercel with PostgreSQL (Neon)
- **Storage**: Vercel Blob Storage
- **Cache**: Vercel KV (Redis)

## 13. Testing

### Blog-Admin Tests

- **Framework**: Vitest
- **Type**: Integration tests
- **Database**: Real PostgreSQL (test isolation)
- **Location**: `apps/blog-admin/tests/`

### Test Coverage

- CDC functions (blob sync)
- API endpoints
- Database operations
- Auth flows

### Running Tests

```bash
pnpm --filter=blog-admin test      # Watch mode
pnpm --filter=blog-admin test:run  # Single run
pnpm --filter=blog-admin test:ui   # UI mode
```

## 14. Key Scripts & Utilities

### Content Management Scripts

- `upload-posts.js` - Upload MDX to Blob Storage
- `list-posts.js` - List all posts in content directory
- `migrate-images.js` - Migrate image references
- `update-mdx-paths.js` - Update MDX structure
- `cleanup-blob-duplicates.js` - Remove duplicates
- `cleanup-duplicate-content.js` - Clean duplicate entries

### Admin Setup Scripts

- `initial-blob-sync.js` - Critical first-time setup
- `check-duplicates.ts` - Identify duplicate files
- `cleanup-duplicates.ts` - Remove duplicates

## 15. Performance Optimizations

### Blog App

- ISR for content freshness
- Image optimization with Next.js Image
- Lazy loading for images
- Redis caching for view counts
- Parallel blob downloads

### Blog-Admin App

- CDC reduces Blob API calls by 99%
- PostgreSQL indexing for performance
- Connection pooling with Prisma
- Efficient pagination for file lists

## 16. Security Considerations

### Authentication

- JWT tokens for API access
- Session-based authentication
- Role-based permissions
- CSRF protection via sameSite cookies

### Data Validation

- Zod schemas for all API inputs
- Type-safe environment variables
- SQL injection prevention via Prisma
- XSS protection via React

## 17. Monitoring & Analytics

### View Tracking

- Real-time view counts
- Session-based deduplication
- Popular posts tracking
- Bot filtering

### Error Handling

- Structured error logging
- Graceful degradation for Redis failures
- Client error boundaries
- API error responses

## 18. Internationalization

### Language Support

- Korean as primary language
- UI components support Korean text
- Date formatting for Korean locale
- Blog posts in Korean with technical content

## 19. Content Features

### Newsletter System

- Email subscription via Resend
- Unsubscribe functionality
- Subscriber management in admin
- Optional source tracking

### Comments Integration

- Giscus for GitHub-based comments
- Configurable per post
- Dark mode support

### Sharing Features

- Social sharing buttons
- Dynamic OG images
- RSS feed generation
- Copy link functionality

## 20. Developer Experience

### Type Safety

- End-to-end TypeScript
- Shared type definitions
- RPC contract generation
- Environment variable validation

### Hot Reload

- Fast refresh in development
- RPC contract updates
- Style changes with Tailwind

### Code Quality

- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Automated type checking
