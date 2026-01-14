# Admin Panel Dockerfile
# Multi-stage build: Bun for building, nginx for serving
# Build from repo root with: docker build -f packages/admin/Dockerfile .

# Build stage
FROM oven/bun:1.3 AS builder
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/admin/package.json ./packages/admin/

# Install dependencies
RUN bun install --no-save

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/admin ./packages/admin

# Build the admin panel
WORKDIR /app/packages/admin
# Set as build arg for different environments
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

# Production stage with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY packages/admin/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/packages/admin/dist /usr/share/nginx/html

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
