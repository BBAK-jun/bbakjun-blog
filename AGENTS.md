# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Turborepo: apps in `apps/` (`blog`, `blog-admin`), shared packages in `packages/` (`analytics`, `content`, `types`, `ui`, `config`), posts in `content/posts/`, scripts in `scripts/`, and root docs in `docs/` plus project READMEs.
- Each app is a Next.js project (Blog: public site, Admin: dashboard with Prisma/Auth.js). Shared UI and config are imported via `@repo/*` workspaces; app-local imports use the `@/*` alias.
- Prisma schema and migrations live in `apps/blog-admin/prisma/`; keep DB changes scoped there.

## Build, Test, and Development Commands
- Install: `pnpm install` (Node 24+, pnpm 10.25). Clean: `pnpm clean` to wipe build artifacts and `node_modules`.
- Dev: `pnpm dev` for all apps, or `pnpm dev:blog` / `pnpm dev:admin` for a single app (admin runs on port 3001). Add `--filter=<package>` for other targets.
- Build: `pnpm build` for the monorepo, or `pnpm build:blog` / `pnpm build:admin` for a single app. Start production servers with `pnpm start` after building.
- Quality checks: `pnpm lint` (Next.js ESLint rules) and `pnpm type-check` (tsc with strict settings). These gate most changes in lieu of formal tests.
- Content tooling: `pnpm upload-posts` (or `pnpm upload-posts:prod`) to sync MDX posts; keep drafts in `content/posts/`.

## Coding Style & Naming Conventions
- TypeScript-first, functional React components, and 2-space indentation. Prefer named exports for shared modules; keep filenames kebab-case (e.g., `post-card.tsx`).
- Follow Next.js Core Web Vitals ESLint defaults; avoid disabling lint rules without justification. Tailwind utility ordering should favor readability over density.
- Use `@repo/*` packages for shared UI/content/analytics; prefer `@/` aliases for intra-app imports to avoid relative path chains.
- Keep env-specific config in `.env.local` files; do not commit secrets. Align with schemas in `packages/config/typescript/*.json` for compiler options.

## Testing Guidelines
- There is no dedicated unit/e2e test suite yet; regressions are caught through `pnpm lint`, `pnpm type-check`, and manual app flows.
- When adding tests, colocate them near features and mirror the scope in file names (e.g., `post-card.test.tsx`). Document any new test commands in package scripts.
- Before submitting PRs, sanity-check core flows: blog rendering (home, post detail, tags), admin auth, post upload/edit, and any migrations affecting Prisma.

## Commit & Pull Request Guidelines
- Commit messages follow a light Conventional Commits style seen in history (`feat(scope): ...`, `fix(scope): ...`, `docs: ...`). Use scopes like `newsletter`, `series`, `admin`, or package names when useful.
- PRs should include: purpose/issue link, summary of changes, commands run (e.g., `pnpm lint`, `pnpm type-check`), and screenshots for UI changes (blog + admin).
- Call out env var additions/changes (Turbo tracks `.env.*local`) and required Prisma migrations. Keep PRs focused; split large changes across multiple PRs where possible.

## Security & Configuration Tips
- Required env vars are listed in `turbo.json` under `globalEnv`; keep secrets in local env files and Vercel project settings. Never commit `.env*`.
- Admin app relies on Prisma and Postgres; run `pnpm --filter blog-admin prisma generate` after schema edits. For storage integrations (Redis KV, Vercel Blob, Resend), verify tokens locally before opening a PR.
