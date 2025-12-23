# Specification: Backend API Foundation

## Goal

Establish the foundational Elysia server with TypeBox validation, error handling middleware, CORS configuration, and OpenAPI/Swagger documentation, enabling all future API endpoints to be built on a consistent, type-safe foundation.

## User Stories

- As a developer, I want a well-configured Elysia server with standardized patterns so that I can build API endpoints consistently and efficiently
- As an API consumer, I want structured error responses with clear validation messages so that I can understand and fix issues when they occur

## Specific Requirements

**Elysia Server Initialization**
- Initialize Elysia application with Bun runtime
- Configure server to listen on `PORT` environment variable (default: 3000)
- Set up graceful shutdown handling for SIGTERM/SIGINT signals
- Use `/api/v1/` prefix for all endpoints via Elysia group routing
- Structure allows future `/api/v2/` without breaking existing clients

**TypeBox Validation Integration**
- Use TypeBox schemas for request body validation on all endpoints
- Validate query parameters (lang, limit, offset, featured)
- Validate path parameters (slug, id)
- Return 400 Bad Request with structured validation errors
- TypeBox schemas should be reusable across endpoints (shared types module)

**Error Handling Middleware**
- Implement global error handler catching all unhandled exceptions
- Return structured JSON error responses with: `error` (type/code), `message` (human-readable), `details` (validation/context), `timestamp` (ISO format), `path` (request path)
- Map error types to HTTP status codes: ValidationError -> 400, NotFoundError -> 404, UnauthorizedError -> 401, InternalError -> 500
- Always include detailed error messages (no production masking per requirements)
- Define base error classes that future specs can extend

**CORS Configuration**
- Allow origins: `https://marcomarchione.it`, `http://localhost:*` (with port wildcards for dev)
- Allow methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization
- Enable credentials for future JWT cookie authentication
- Use environment variable `CORS_ORIGINS` for additional origins override

**OpenAPI/Swagger Documentation**
- Auto-generate OpenAPI 3.0 specification from Elysia routes via @elysiajs/swagger
- Swagger UI available at `/api/docs` in development only (check `NODE_ENV`)
- OpenAPI JSON available at `/api/docs/json` in development only
- Disable completely in production environment (`NODE_ENV=production`)
- Document all request/response schemas with TypeBox integration

**Health Check Endpoint**
- `GET /api/v1/health` returns `{ status: "ok", timestamp: "ISO-8601" }`
- No authentication required
- Used for VPS monitoring and deployment verification
- Include database connectivity check (optional `?db=true` query param)

**Environment Configuration**
- `NODE_ENV`: "development" | "production" (default: development)
- `PORT`: Server port (default: 3000)
- `DATABASE_PATH`: SQLite file path (default: ./data.db)
- `CORS_ORIGINS`: Comma-separated additional allowed origins (optional)
- Create centralized config module that validates and exports all env vars

**Database Integration**
- Import existing database module from `src/db/`
- Use Elysia's derive/decorate to inject database instance into route context
- All route handlers receive typed `db` object via context
- Support `createTestDatabase()` pattern for API integration tests

## Visual Design

No visual assets provided - this is a backend API spec with no UI components.

## Existing Code to Leverage

**`src/db/index.ts` - Database Connection Module**
- Use `createDatabase()` function with same pragma configuration pattern
- Export barrel pattern via `index.ts` should be replicated for API modules
- Follow the `createTestDatabase()` pattern for API test utilities
- Database instance is already exported as `db` - can be directly imported

**`src/db/schema/index.ts` - TypeScript Type Exports Pattern**
- Follow same barrel export pattern for API types and validation schemas
- Export both runtime validators (TypeBox) and inferred types together
- Use CONSTANTS pattern (e.g., `CONTENT_TYPES`, `LANGUAGES`) for enums

**`src/db/test-utils.ts` - Testing Utilities Pattern**
- Create similar `createTestApp()` utility for API integration testing
- Follow seed function pattern for creating test fixtures
- Use `beforeEach`/`afterEach` reset pattern for test isolation

**`src/db/schema/*.ts` - Schema Definition Pattern**
- Reference existing schema types when defining API request/response schemas
- Reuse constants like `LANGUAGES`, `CONTENT_STATUSES` for validation
- Align API validation with database constraints

## Out of Scope

- Authentication/JWT implementation (deferred to spec #3 "Authentication System")
- Rate limiting (deferred to spec #22 "Security Hardening")
- Security headers like CSP, HSTS, X-Frame-Options (deferred to spec #22 "Security Hardening")
- Actual content CRUD endpoints (deferred to spec #4 "Content CRUD APIs")
- Media upload endpoints (deferred to spec #5 "Media Upload & Local Storage")
- Logging infrastructure and structured logging (can be added later)
- Request ID tracking and tracing (can be added later)
- Response compression (can be added later)
- API versioning beyond `/api/v1/` prefix structure
- Admin-only route guards (deferred to spec #3 "Authentication System")
