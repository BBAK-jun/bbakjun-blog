FROM node:24-alpine AS base

FROM base AS pruner
RUN apk add --no-cache libc6-compat && \
    npm install turbo --global
WORKDIR /app
COPY . ./
RUN turbo prune --docker --out-dir=output --scope=@apps/rag-gateway

FROM base AS installer
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
COPY --from=pruner /app/output/json ./
RUN corepack enable pnpm && pnpm install --no-frozen-lockfile

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=installer /app .
COPY --from=pruner /app/output/full ./
RUN corepack enable pnpm && pnpm build:rag-gateway

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002

RUN apk add --no-cache libc6-compat curl && \
    addgroup --system --gid 1001 rag-gateway && \
    adduser --system --uid 1001 -G rag-gateway rag-gateway

COPY --from=builder /app .
RUN chown -R rag-gateway:rag-gateway /app

USER rag-gateway

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/api/admin/health || exit 1

CMD ["node", "apps/rag-gateway/dist/index.mjs"]