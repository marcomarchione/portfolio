# Spec Requirements: Backend API Foundation

## Initial Description

Set up Elysia server with TypeBox validation, error handling middleware, CORS configuration, and OpenAPI/Swagger documentation generation for all endpoints.

**Source:** Product Roadmap Item #2
**Size Estimate:** S (2-3 days)
**Dependencies:** Item #1: Database Schema & Migrations (completed)

This is the second item in the technical roadmap, establishing the backend API foundation after the database layer has been implemented.

## Requirements Discussion

### First Round Questions

**Q1:** I assume you want the `/api/v1/` prefix for all endpoints as shown in your architecture document, allowing future breaking changes via `/api/v2/` without affecting existing clients. Is that correct?
**Answer:** Yes, `/api/v1/` prefix confirmed.

**Q2:** I assume the Swagger UI should be available at a development-friendly URL like `/api/docs` but only in development mode (disabled in production for security). Would you prefer it also available in production, perhaps behind authentication?
**Answer:** Development only (disabled in production).

**Q3:** I assume CORS should allow requests from the main site domain (marcomarchione.it), the admin panel (same domain or admin.marcomarchione.it?), and localhost during development. Should there be any other domains that need API access?
**Answer:** CORS origins confirmed:
- marcomarchione.it (main site)
- marcomarchione.it/admin (admin panel on same domain, not subdomain)
- localhost (development)

**Q4:** Should error responses include detailed validation messages in development but generic messages in production (for security), or do you want consistent detailed errors since this is a personal project with a single admin user?
**Answer:** Always detailed errors (single admin, personal project).

**Q5:** What should we explicitly NOT build in this foundation spec? For example, should we defer rate limiting to the later "Security Hardening" spec (#22), or include basic rate limiting now?
**Answer:** Rate limiting deferred to spec #22 "Security Hardening".

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Database Schema - Path: `src/db/`
- Database connection: `src/db/index.ts` - Uses Drizzle ORM with bun:sqlite driver
- Schema definitions: `src/db/schema/` - All table definitions with TypeScript types
- Relations: `src/db/relations.ts` - Drizzle relations for relational queries

**Key patterns from existing code:**
- `createDatabase()` function with SQLite pragma configuration
- `createTestDatabase()` for in-memory testing
- Barrel exports via index.ts files
- TypeScript types exported alongside table definitions (e.g., `ContentBase`, `NewContentBase`)
- Constants for enum values (e.g., `CONTENT_TYPES`, `LANGUAGES`, `CONTENT_STATUSES`)

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided (confirmed by bash check).

### Visual Insights:
Not applicable - this is a backend API spec with no UI components.

## Requirements Summary

### Functional Requirements

**Elysia Server Setup:**
- Initialize Elysia application with Bun runtime
- Configure server to listen on configurable port (default: 3000)
- Set up graceful shutdown handling

**API Versioning:**
- All endpoints prefixed with `/api/v1/`
- Group structure allowing future `/api/v2/` without breaking changes

**TypeBox Validation:**
- Request body validation using TypeBox schemas
- Query parameter validation
- Path parameter validation
- Consistent validation error responses

**Error Handling Middleware:**
- Global error handler catching all unhandled errors
- Structured error response format with:
  - `error`: Error type/code
  - `message`: Human-readable description
  - `details`: Validation details or additional context (always included)
  - `timestamp`: ISO timestamp
  - `path`: Request path that caused the error
- HTTP status code mapping for different error types
- Detailed error messages in all environments (personal project decision)

**CORS Configuration:**
- Allow origins:
  - `https://marcomarchione.it` (production)
  - `http://localhost:*` (development)
- Allow methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Allow headers: Content-Type, Authorization
- Credentials: enabled (for JWT cookies if used)

**OpenAPI/Swagger Documentation:**
- Auto-generate OpenAPI 3.0 specification from Elysia routes
- Swagger UI available at `/api/docs` in development only
- OpenAPI JSON available at `/api/docs/json` in development only
- Disabled in production environment
- Document all request/response schemas

**Health Check Endpoint:**
- `GET /api/v1/health` - Basic health check
- Returns: `{ status: "ok", timestamp: "..." }`
- Used for VPS monitoring and deployment verification

**Database Integration:**
- Import and use existing database from `src/db/`
- Pass database instance to route handlers via Elysia context/dependency injection

### Reusability Opportunities

**From existing codebase:**
- Database connection pattern from `src/db/index.ts`
- TypeScript type exports pattern from `src/db/schema/index.ts`
- Test database setup pattern using `createTestDatabase()`

**Patterns to establish for future specs:**
- Base error types that Content CRUD APIs (spec #4) will extend
- Validation schema patterns that all future endpoints will follow
- Response format standards for consistency across all endpoints

### Scope Boundaries

**In Scope:**
- Elysia server initialization and configuration
- TypeBox validation integration
- Global error handling middleware
- CORS middleware configuration
- OpenAPI/Swagger documentation setup (dev only)
- Health check endpoint
- Environment-based configuration (dev/prod)
- Database instance injection pattern
- Base TypeScript types for API responses

**Out of Scope:**
- Authentication/JWT (spec #3 "Authentication System")
- Rate limiting (spec #22 "Security Hardening")
- Actual content CRUD endpoints (spec #4 "Content CRUD APIs")
- Media upload endpoints (spec #5 "Media Upload & Local Storage")
- Security headers like CSP, HSTS (spec #22 "Security Hardening")
- Logging infrastructure (can be added later)
- Request ID tracking (can be added later)

### Technical Considerations

**Infrastructure Context:**
- Fully self-hosted on Hetzner VPS (CX32: 4 vCPU, 8GB RAM, 80GB SSD)
- Nginx reverse proxy in front of Elysia server
- All services on same VPS (frontend, backend, database)
- Cloudflare for DNS/SSL only (no Cloudflare Pages or R2)

**Integration Points:**
- Database: SQLite via Drizzle ORM (existing `src/db/`)
- Frontend: Astro static site consuming API
- Admin Panel: React SPA at `/admin` consuming API

**Environment Variables Expected:**
- `NODE_ENV`: "development" | "production"
- `PORT`: Server port (default: 3000)
- `DATABASE_PATH`: SQLite file path (existing, default: ./data.db)
- `CORS_ORIGINS`: Comma-separated allowed origins (optional, has defaults)

**File Structure (suggested):**
```
src/
  api/
    index.ts           # Elysia app initialization
    config.ts          # Environment configuration
    middleware/
      error-handler.ts # Global error handling
      cors.ts          # CORS configuration
    plugins/
      swagger.ts       # OpenAPI/Swagger setup
    types/
      responses.ts     # Standard response types
      errors.ts        # Error types and codes
    routes/
      health.ts        # Health check route
      index.ts         # Route aggregation
  db/                  # Existing database module
```

**Performance Targets (from product docs):**
- TTFB < 200ms
- Uptime > 99.5%

**Testing Approach:**
- Unit tests for error handler
- Integration tests for CORS and validation
- Use existing `createTestDatabase()` pattern for database-related tests
