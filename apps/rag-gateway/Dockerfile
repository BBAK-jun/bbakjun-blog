# -----------------------------------------------------------------------------
# RAG Gateway Dockerfile
# Multi-stage build using turbo prune for optimal size
# Target: ~500MB (from 2.14GB)
# -----------------------------------------------------------------------------

FROM node:24-alpine AS base

# -----------------------------------------------------------------------------
# Stage 1: Prune - Extract only needed packages using turbo prune
# -----------------------------------------------------------------------------
FROM base AS prune
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace files needed for turbo prune
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/rag-gateway ./apps/rag-gateway
COPY packages ./packages
COPY .npmrc ./.npmrc

# Install dependencies and run turbo prune
# This creates /app/output with:
#   - json/: pruned package.json files
#   - full/: pruned source code
#   - pnpm-lock.yaml: pruned lockfile
RUN corepack enable pnpm && \
    pnpm install --no-frozen-lockfile && \
    pnpm add -D -w turbo && \
    pnpm turbo prune --docker --out-dir=output --scope=@apps/rag-gateway

# -----------------------------------------------------------------------------
# Stage 2: Deps - Install only rag-gateway dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy workspace config + only rag-gateway and cache package.json
# This way pnpm only installs what rag-gateway needs
COPY pnpm-lock.yaml ./
COPY apps/rag-gateway/package.json ./apps/rag-gateway/
COPY packages/cache/package.json ./packages/cache/
COPY .npmrc ./.npmrc

# Create minimal workspace config for dependency resolution
RUN printf 'packages:\n  - "apps/*"\n  - "packages/*"\n' > pnpm-workspace.yaml

# Install only rag-gateway's dependencies (via workspace protocol)
RUN corepack enable pnpm && pnpm install --filter=@apps/rag-gateway... --no-frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 3: Builder - Build the application
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy pruned source and workspace configuration
COPY --from=prune /app/output/full ./
COPY --from=prune /app/output/pnpm-lock.yaml ./pnpm-lock.yaml
COPY turbo.json ./turbo.json

# Create minimal workspace and install all dependencies (including devDependencies for building)
RUN printf 'packages:\n  - "apps/*"\n  - "packages/*"\n' > pnpm-workspace.yaml

# Install all dependencies including devDependencies (tsup, typescript needed for build)
ENV CI=true
RUN corepack enable pnpm && \
    pnpm install --no-frozen-lockfile && \
    pnpm add -w -D tsup typescript && \
    cd /app/packages/cache && pnpm exec tsup src/index.ts src/redis.ts --format esm,cjs && \
    cd /app/apps/rag-gateway && pnpm exec tsup src/index.ts --no-dts --sourcemap --external '@repo/*'

# Remove source maps to reduce size
RUN find . -name "*.map" -delete

# -----------------------------------------------------------------------------
# Stage 4: Runner - Production image
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002

# Install runtime dependencies (curl for health check)
RUN apk add --no-cache libc6-compat curl

# Create non-root user for security
RUN addgroup --system --gid 1001 rag-gateway && \
    adduser --system --uid 1001 -G rag-gateway rag-gateway

# Copy built application artifacts
# Simplify: run rag-gateway as if it's the root (no workspace)
COPY --from=builder /app/apps/rag-gateway/package.json ./package.json
COPY --from=builder /app/apps/rag-gateway/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy @repo/cache since it's a runtime dependency
COPY --from=builder /app/packages/cache/package.json ./node_modules/@repo/cache/package.json
COPY --from=builder /app/packages/cache/dist ./node_modules/@repo/cache/dist

# Set ownership to non-root user
RUN chown -R rag-gateway:rag-gateway /app

# Switch to non-root user
USER rag-gateway

# Expose port
EXPOSE 3002

# Health check - matches the app's health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/api/admin/health || exit 1

# Start the application
CMD ["node", "dist/index.mjs"]
