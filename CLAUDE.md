# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio CMS backend for marcomarchione.it - a multilingual content management system with Elysia API and SQLite database.

## Common Commands

```bash
# Development
bun run api:dev          # Start API with hot reload (port 3000)
bun run db:studio        # Open Drizzle Studio for DB inspection

# Testing
bun test                 # Run all tests
bun test src/db/         # Run only database tests
bun test src/api/        # Run only API tests
bun test path/to/file.test.ts  # Run single test file

# Database
bun run db:generate      # Generate migration from schema changes
bun run db:migrate       # Apply pending migrations
bun run db:push          # Push schema directly (dev only)

# Utilities
bun run media:cleanup    # Clean up orphaned media files
```

## Architecture

### API Layer (`src/api/`)
- **Framework**: Elysia with TypeBox validation
- **Auth**: JWT-based single admin authentication
- **Routes**: Versioned under `/api/v1`
  - Public: `/projects`, `/materials`, `/news`, `/technologies`
  - Admin: `/admin/*` (authenticated CRUD operations)
  - Auth: `/auth/login`, `/auth/refresh`, `/auth/logout`
- **Swagger**: Available at `/api/docs` in development

### Database Layer (`src/db/`)
- **ORM**: Drizzle with bun:sqlite driver
- **Schema**: Unified content model with extension tables
  - `content_base` → shared metadata for all content types
  - `content_translations` → multilingual content (IT, EN, ES, DE)
  - Extension tables: `projects`, `materials`, `news`
  - Lookup tables: `technologies`, `tags`, `media`
  - Junction tables: `project_technologies`, `news_tags`

### Services (`src/services/`)
- **Media**: Image processing with Sharp, file validation, storage management

## Key Patterns

### Content Model
All content types share `content_base` table with type-specific extension tables joined by `contentId`.

### Testing
Tests use in-memory SQLite with migrations applied. Use test utilities from `src/db/test-utils.ts`:
```typescript
import { createTestDatabase, resetDatabase, closeDatabase } from '@/db/test-utils';
```

### Path Aliases
- `@/*` → `./src/*`
- `@db/*` → `./src/db/*`

## Environment Variables

Required in production:
- `JWT_SECRET` (min 32 chars)
- `ADMIN_PASSWORD_HASH` (bcrypt hash)

Optional:
- `PORT` (default: 3000)
- `DATABASE_PATH` (default: ./data.db)
- `UPLOADS_PATH` (default: ./uploads)
- `CORS_ORIGINS` (comma-separated)
