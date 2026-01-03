# Web (Astro) Dockerfile
# Multi-stage build: Bun for building, nginx for serving static site

# Build stage
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

# Build the Astro site
WORKDIR /app/packages/web
ARG PUBLIC_API_URL=http://localhost:3000
ENV PUBLIC_API_URL=$PUBLIC_API_URL
RUN bun run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
