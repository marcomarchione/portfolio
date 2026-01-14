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

# Production stage with Node.js for SSR
FROM node:22-slim AS runner
WORKDIR /app

# Copy built output (server + client assets)
COPY --from=builder /app/packages/web/dist ./dist

# Copy node_modules for SSR runtime dependencies
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables for production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

# Expose the port
EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-4321}/ || exit 1

# Run the SSR server with Node.js
CMD ["node", "dist/server/entry.mjs"]
