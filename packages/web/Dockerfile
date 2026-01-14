# Web (Astro) Dockerfile
# Multi-stage build: Bun for building and running SSR server
# Build from repo root with: docker build -f packages/web/Dockerfile .

# Build stage
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install dependencies (ignore scripts to reduce memory usage)
RUN bun install --ignore-scripts && rm -rf ~/.bun/install/cache

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

# Build the Astro site
WORKDIR /app/packages/web
# Set as build args for different environments
ARG PUBLIC_API_URL=http://localhost:3000
ARG PUBLIC_BROWSER_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_BROWSER_API_URL=$PUBLIC_BROWSER_API_URL
RUN bun run build

# Production stage with Bun runtime for SSR
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/sh astro

# Copy built application
COPY --from=builder --chown=astro:nodejs /app/packages/web/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astro:nodejs /app/packages/shared ./packages/shared

USER astro

# Railway sets PORT automatically, default to 4321 for local
ENV HOST=0.0.0.0
ENV PORT=${PORT:-4321}

EXPOSE 4321

# Run the Astro SSR server
CMD ["bun", "run", "dist/server/entry.mjs"]
