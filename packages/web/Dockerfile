# Web (Astro) Dockerfile
# Multi-stage build: Bun for building, nginx for serving static site
# Build from repo root with: docker build -f packages/web/Dockerfile .

# Build stage
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN bun install --no-save

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

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Railway sets PORT env var, nginx needs to listen on it
# Create a script to update nginx config with dynamic PORT
RUN echo '#!/bin/sh' > /docker-entrypoint.d/10-update-port.sh && \
    echo 'sed -i "s/listen 80;/listen ${PORT:-80};/g" /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.d/10-update-port.sh && \
    chmod +x /docker-entrypoint.d/10-update-port.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-80}/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
