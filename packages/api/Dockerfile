# API Dockerfile
# Uses Bun runtime for the Elysia backend

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY package.json ./

# Production stage
FROM base AS runner
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 elysia
USER elysia

COPY --from=builder --chown=elysia:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=elysia:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=elysia:nodejs /app/packages/api ./packages/api
COPY --from=builder --chown=elysia:nodejs /app/package.json ./

# Create data directory for SQLite
RUN mkdir -p /app/packages/api/data && chown elysia:nodejs /app/packages/api/data

WORKDIR /app/packages/api

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_PATH=/app/packages/api/data/data.db

CMD ["bun", "run", "src/index.ts"]
