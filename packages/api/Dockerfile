# API Dockerfile - v2 cache bust
# Uses Bun runtime for the Elysia backend with PostgreSQL
# Build from repo root with: docker build -f packages/api/Dockerfile .

FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies (production only to reduce memory)
FROM base AS deps
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/
RUN bun install --ignore-scripts --no-save

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

# Create non-root user (Debian syntax for oven/bun image)
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh elysia

# Copy application files
COPY --from=builder --chown=elysia:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=elysia:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=elysia:nodejs /app/packages/api ./packages/api
COPY --from=builder --chown=elysia:nodejs /app/package.json ./

# Create uploads directory for media files
# For Railway: mount persistent volume at /app/uploads
RUN mkdir -p /app/uploads && \
    chown -R elysia:nodejs /app/uploads

USER elysia

WORKDIR /app/packages/api

EXPOSE 3000

# Railway sets PORT automatically, default to 3000 for local
ENV PORT=${PORT:-3000}
ENV UPLOADS_PATH=/app/uploads

CMD ["bun", "run", "src/index.ts"]
