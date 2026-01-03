# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website monorepo with CMS backend, admin panel, and public frontend. Uses Bun workspaces.

## Commands

```bash
# Development (Docker - recommended)
bun run dev              # Start all services with hot reload
bun run dev:build        # Build and start all services
bun run dev:api          # Start only API
bun run dev:admin        # Start only Admin panel
bun run dev:web          # Start only Web
bun run dev:down         # Stop all dev services
bun run dev:logs         # View all dev logs

# URLs when running:
# - API:   http://localhost:3000 (Swagger: http://localhost:3000/api/docs)
# - Admin: http://localhost:5173
# - Web:   http://localhost:4321

# Production (Docker)
bun run prod             # Start production in background
bun run prod:build       # Build and start production
bun run prod:down        # Stop production
bun run prod:logs        # View production logs

# Testing - API (from packages/api directory)
bun run test                          # Run all API tests
bun test src/path/to/file.test.ts     # Run single test
bun test --watch                      # Watch mode

# Testing - Admin (from packages/admin directory)
bun run test                          # Run Vitest unit tests
bun run playwright test               # Run Playwright E2E tests
bun run playwright test file.spec.ts  # Run single E2E test

# Database (requires local bun install or running inside container)
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
bun run db:generate  # Generate migrations

# Type checking (requires local bun install)
bun run typecheck

# Local development (without Docker - requires bun install first)
bun install           # Install dependencies locally
bun run dev:local     # Run all packages locally
```

## Architecture

### Monorepo Structure

```
packages/
├── api/      # Elysia REST API + SQLite/Drizzle
├── admin/    # React + Vite admin panel
├── web/      # Astro public website
└── shared/   # TypeScript types and constants
```

### API Package (`packages/api`)

**Entry Point**: `src/index.ts` creates Elysia app with middleware chain:
1. `errorHandler` - Global error handling
2. `corsMiddleware` - CORS configuration
3. `databasePlugin` - Injects Drizzle db instance
4. `swaggerPlugin` - OpenAPI docs (dev only)
5. `apiRoutes` - All routes under `/api/v1`

**Route Organization**:
- `routes/public/` - Read-only endpoints (projects, materials, news, technologies)
- `routes/admin/` - Protected CRUD endpoints (require JWT)
- `routes/auth.ts` - Login/refresh token endpoints

**Database Layer**:
- `db/schema/` - Drizzle table definitions
- `db/queries/` - Query functions by domain
- `db/relations.ts` - Table relationships

**Key Patterns**:
- Content uses base table + translations pattern (`content_base` + `content_translations`)
- Media has variants (original, thumbnail, medium, large)
- All admin routes require `Authorization: Bearer <token>` header

### Admin Package (`packages/admin`)

React + Vite SPA with TanStack Query for data fetching.

**Structure**:
- `components/` - Reusable UI components (forms, media, common)
- `pages/` - Route pages (projects, materials, news, technologies, media)
- `hooks/` - Custom hooks (useContentForm, useMediaLibrary)
- `lib/api/` - API client wrapper
- `lib/query/` - TanStack Query keys and utilities

**Key Patterns**:
- Custom form components use React Portal for dropdowns (z-index layering)
- Content forms share logic via `useContentForm` hook
- Media library uses URL search params for state (pagination, filters)

### Shared Package (`packages/shared`)

Exports types and constants used by all packages:
- `LANGUAGES`: ['it', 'en', 'es', 'de']
- `CONTENT_STATUSES`: ['draft', 'published', 'archived']
- API response types, content types, auth types

### Testing

Tests use in-memory SQLite databases for isolation.

```typescript
import { createTestApp, createTestAppWithAuth } from '../test-utils';

// Basic test app
const testApp = createTestApp();
await testApp.app.handle(new Request('http://localhost/api/v1/health'));
testApp.cleanup();

// With authentication
const authApp = createTestAppWithAuth();
const token = await authApp.generateAccessToken();
await authApp.app.handle(new Request('http://localhost/api/v1/admin/projects', {
  headers: { Authorization: `Bearer ${token}` }
}));
authApp.cleanup();
```

## Environment

API environment variables in `packages/api/.env`:
- `JWT_SECRET` - Min 32 chars
- `ADMIN_PASSWORD_HASH` - bcrypt hash
- `DATABASE_PATH` - SQLite file path
- `CORS_ORIGINS` - Comma-separated origins

## Commit Conventions

Uses Conventional Commits format: `type(scope): description`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scopes**: `frontend`, `backend`, `db`, `i18n`, `admin`, `api`, `ui`, `auth`, `media`

**Examples**:
```bash
feat(admin): add media library with upload support
fix(api): handle missing translation gracefully
refactor(db): extract query functions to repository pattern
```

## Versioning

Uses Conventional Commits with automatic version bumping:
- `feat:` → minor bump
- `fix:` → patch bump
- `BREAKING CHANGE:` → major bump

Versions are independent per package. Tags format: `@marcomarchione/pkg@version`
