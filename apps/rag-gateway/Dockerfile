# -----------------------------------------------------------------------------
# RAG Gateway Dockerfile
# Multi-stage build for optimal image size and security
# Designed for Turborepo monorepo structure
# -----------------------------------------------------------------------------

FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/rag-gateway/package.json ./apps/rag-gateway/
COPY packages ./packages
COPY .npmrc ./.npmrc

# Install all dependencies (needed for workspace protocol)
# Note: --no-frozen-lockfile is used because Docker COPY doesn't expand globs the same way
RUN corepack enable pnpm && pnpm install --no-frozen-lockfile

# -----------------------------------------------------------------------------
# Builder stage
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build the application
# Build workspace dependencies (@repo/cache), then rag-gateway
ENV CI=true
RUN corepack enable pnpm && pnpm --filter=@repo/cache build && pnpm --filter=@apps/rag-gateway build

# -----------------------------------------------------------------------------
# Production runner stage
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

# Copy only rag-gateway production dependencies
COPY --from=builder /app/apps/rag-gateway/package.json ./package.json
COPY --from=builder /app/apps/rag-gateway/dist ./dist

# Copy workspace dependencies that rag-gateway uses
COPY --from=builder /app/node_modules ./node_modules

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
CMD ["node", "dist/index.js"]
