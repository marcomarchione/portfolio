# Task Breakdown: Backend API Foundation

## Overview

**Total Tasks:** 32 sub-tasks across 5 task groups
**Estimated Size:** S (2-3 days)
**Dependencies:** Database Schema & Migrations (spec #1 - completed)

This spec establishes the foundational Elysia server with TypeBox validation, error handling middleware, CORS configuration, and OpenAPI/Swagger documentation. All future API endpoints will be built on this foundation.

## File Structure

```
src/
  api/
    index.ts           # Elysia app initialization and server startup
    config.ts          # Environment configuration with validation
    middleware/
      error-handler.ts # Global error handling middleware
      cors.ts          # CORS configuration middleware
    plugins/
      swagger.ts       # OpenAPI/Swagger setup (dev only)
      database.ts      # Database injection plugin
    types/
      responses.ts     # Standard API response types
      errors.ts        # Error classes and types
      validation.ts    # Shared TypeBox validation schemas
    routes/
      health.ts        # Health check route
      index.ts         # Route aggregation with /api/v1/ prefix
  db/                  # Existing database module (integrate with)
```

## Task List

### Configuration Layer

#### Task Group 1: Environment Configuration & Type Foundations
**Dependencies:** None

- [x] 1.0 Complete configuration layer
  - [x] 1.1 Write 4 focused tests for configuration module
    - Test environment variable loading with defaults (NODE_ENV, PORT, DATABASE_PATH)
    - Test CORS_ORIGINS parsing (comma-separated string to array)
    - Test validation fails for invalid PORT (non-numeric)
    - Test isDevelopment/isProduction helper functions
  - [x] 1.2 Create `src/api/config.ts` environment configuration module
    - Define `Config` interface with all environment variables
    - `NODE_ENV`: "development" | "production" (default: "development")
    - `PORT`: number (default: 3000)
    - `DATABASE_PATH`: string (default: "./data.db")
    - `CORS_ORIGINS`: string[] parsed from comma-separated env var
    - Export `config` singleton and `isDevelopment`/`isProduction` helpers
    - Validate critical values at startup (throw on invalid config)
  - [x] 1.3 Create `src/api/types/errors.ts` error classes
    - `ApiError` base class extending Error with `statusCode`, `code`, `details` properties
    - `ValidationError` (400) for request validation failures
    - `NotFoundError` (404) for missing resources
    - `UnauthorizedError` (401) for auth failures (foundation for spec #3)
    - `InternalError` (500) for unexpected server errors
    - Export error type constants for use in responses
  - [x] 1.4 Create `src/api/types/responses.ts` standard response types
    - `ApiResponse<T>` generic type for successful responses
    - `ApiErrorResponse` type matching spec error format (error, message, details, timestamp, path)
    - `PaginatedResponse<T>` type for list endpoints (future use)
    - `HealthResponse` type for health check endpoint
  - [x] 1.5 Create `src/api/types/validation.ts` shared TypeBox schemas
    - `LangSchema` - enum of supported languages from db schema (it, en, es, de)
    - `PaginationSchema` - limit (default 20, max 100), offset (default 0)
    - `SlugSchema` - string pattern for URL slugs
    - `IdSchema` - positive integer for resource IDs
    - `FeaturedSchema` - optional boolean for featured filter
    - Follow pattern from `src/db/schema/index.ts` for barrel exports
  - [x] 1.6 Ensure configuration layer tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify all config values load correctly with defaults
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Environment variables load with sensible defaults
- Error classes provide structured error information
- TypeBox schemas match database constraints (LANGUAGES constant)
- Types are exported via barrel pattern in `src/api/types/index.ts`

---

### Middleware Layer

#### Task Group 2: Error Handling & CORS Middleware
**Dependencies:** Task Group 1

- [x] 2.0 Complete middleware layer
  - [x] 2.1 Write 5 focused tests for middleware
    - Test error handler catches ValidationError and returns 400 with structured response
    - Test error handler catches NotFoundError and returns 404 with structured response
    - Test error handler catches unknown errors and returns 500 with InternalError format
    - Test CORS allows requests from marcomarchione.it origin
    - Test CORS allows requests from localhost with any port
  - [x] 2.2 Create `src/api/middleware/error-handler.ts`
    - Implement Elysia `onError` hook as global error handler
    - Map `ApiError` subclasses to appropriate HTTP status codes
    - Return structured JSON response: `{ error, message, details, timestamp, path }`
    - Include detailed error messages in all environments (per requirements)
    - Handle Elysia validation errors (convert to ValidationError format)
    - Log errors to console (basic logging, structured logging deferred)
  - [x] 2.3 Create `src/api/middleware/cors.ts`
    - Configure allowed origins: `https://marcomarchione.it`, `http://localhost:*`
    - Parse additional origins from `CORS_ORIGINS` environment variable
    - Allow methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
    - Allow headers: Content-Type, Authorization
    - Enable credentials for future JWT cookie authentication
    - Handle preflight OPTIONS requests
  - [x] 2.4 Create `src/api/middleware/index.ts` barrel export
    - Export `errorHandler` function/plugin
    - Export `corsMiddleware` function/plugin
    - Document usage in JSDoc comments
  - [x] 2.5 Ensure middleware layer tests pass
    - Run ONLY the 5 tests written in 2.1
    - Verify error responses match spec format
    - Verify CORS headers are set correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 5 tests written in 2.1 pass
- Error responses include all required fields (error, message, details, timestamp, path)
- CORS allows production and development origins
- Credentials are enabled for future auth cookies
- Middleware follows Elysia plugin patterns

---

### Plugin Layer

#### Task Group 3: Database Integration & Swagger Documentation
**Dependencies:** Task Group 1, Task Group 2

- [x] 3.0 Complete plugin layer
  - [x] 3.1 Write 4 focused tests for plugins
    - Test database plugin injects `db` into route context
    - Test Swagger UI is available at `/api/docs` in development
    - Test Swagger JSON is available at `/api/docs/json` in development
    - Test Swagger endpoints return 404 in production mode
  - [x] 3.2 Create `src/api/plugins/database.ts`
    - Import `db` from existing `src/db/` module
    - Use Elysia's `decorate` to inject database into context
    - Export `databasePlugin` for use in main app
    - Route handlers receive typed `db` object via `context.db`
    - Document integration with `createTestDatabase()` for testing
  - [x] 3.3 Create `src/api/plugins/swagger.ts`
    - Configure `@elysiajs/swagger` plugin
    - Set documentation path to `/api/docs`
    - Set JSON spec path to `/api/docs/json`
    - Configure OpenAPI 3.0 metadata (title, version, description)
    - Conditionally enable only when `NODE_ENV !== "production"`
    - Return no-op plugin in production for zero overhead
  - [x] 3.4 Create `src/api/plugins/index.ts` barrel export
    - Export `databasePlugin`
    - Export `swaggerPlugin`
    - Document plugin usage patterns
  - [x] 3.5 Ensure plugin layer tests pass
    - Run ONLY the 4 tests written in 3.1
    - Verify database is accessible in route handlers
    - Verify Swagger conditional loading works
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 3.1 pass
- Database instance is available via `context.db` in all routes
- Swagger UI renders correctly in development mode
- Swagger is completely disabled in production
- TypeBox schemas are reflected in OpenAPI documentation

---

### Routes Layer

#### Task Group 4: Health Check & Server Initialization
**Dependencies:** Task Group 1, Task Group 2, Task Group 3

- [x] 4.0 Complete routes and server layer
  - [x] 4.1 Write 5 focused tests for routes and server
    - Test `GET /api/v1/health` returns 200 with `{ status: "ok", timestamp }`
    - Test `GET /api/v1/health?db=true` returns database connectivity status
    - Test health endpoint requires no authentication
    - Test server listens on configured PORT
    - Test graceful shutdown on SIGTERM signal
  - [x] 4.2 Create `src/api/routes/health.ts`
    - Implement `GET /api/v1/health` endpoint
    - Return `{ status: "ok", timestamp: ISO-8601 }` for basic check
    - When `?db=true` query param: test database connection and include result
    - No authentication required
    - Document endpoint in OpenAPI via TypeBox response schema
  - [x] 4.3 Create `src/api/routes/index.ts` route aggregation
    - Create Elysia group with `/api/v1` prefix
    - Import and register health route
    - Export `apiRoutes` plugin for main app
    - Structure allows adding future route files (content, auth, media)
  - [x] 4.4 Create `src/api/index.ts` main server initialization
    - Initialize Elysia application instance
    - Apply error handler middleware
    - Apply CORS middleware
    - Apply database plugin
    - Apply Swagger plugin (conditional on environment)
    - Apply API routes with `/api/v1/` prefix
    - Configure server to listen on `PORT` from config
    - Implement graceful shutdown for SIGTERM/SIGINT signals
    - Log startup message with port and environment
  - [x] 4.5 Create `src/api/test-utils.ts` for API testing
    - `createTestApp()` function returning configured Elysia instance
    - Use `createTestDatabase()` from `src/db/test-utils.ts`
    - Inject test database instead of production database
    - Export helpers for making test requests
    - Follow patterns from existing `src/db/test-utils.ts`
  - [x] 4.6 Ensure routes and server layer tests pass
    - Run ONLY the 5 tests written in 4.1
    - Verify health endpoint responds correctly
    - Verify server starts and stops cleanly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 5 tests written in 4.1 pass
- Health check endpoint is accessible without authentication
- Database connectivity check works with `?db=true` parameter
- Server starts on configured port with logged confirmation
- Graceful shutdown handles in-flight requests

---

### Integration Testing

#### Task Group 5: Test Review & Integration Verification
**Dependencies:** Task Groups 1-4

- [x] 5.0 Review existing tests and fill critical gaps only
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 4 tests written by Task Group 1 (configuration)
    - Review the 5 tests written by Task Group 2 (middleware)
    - Review the 4 tests written by Task Group 3 (plugins)
    - Review the 5 tests written by Task Group 4 (routes/server)
    - Total existing tests: 18 tests
  - [x] 5.2 Analyze test coverage gaps for this feature only
    - Identify critical integration paths that lack coverage
    - Focus ONLY on gaps related to Backend API Foundation requirements
    - Prioritize end-to-end request flow over isolated unit tests
    - Check for TypeBox validation integration with error responses
  - [x] 5.3 Write up to 8 additional strategic tests maximum
    - Add tests for complete request lifecycle (request -> validation -> response)
    - Test TypeBox validation errors produce correct 400 responses
    - Test unknown routes return 404 with structured error
    - Test request to health endpoint with invalid query params
    - Test CORS preflight (OPTIONS) request handling
    - Test error response includes correct path and timestamp
    - Skip edge cases, performance tests unless business-critical
    - Maximum of 8 new tests to maintain focused coverage
  - [x] 5.4 Run feature-specific tests only
    - Run ONLY tests related to Backend API Foundation (tests from 1.1, 2.1, 3.1, 4.1, and 5.3)
    - Expected total: approximately 26 tests maximum
    - Verify all tests pass
    - Do NOT run the entire application test suite
  - [x] 5.5 Verify full integration manually
    - Start server with `bun run src/api/index.ts`
    - Test health endpoint with curl: `curl http://localhost:3000/api/v1/health`
    - Test health with db check: `curl http://localhost:3000/api/v1/health?db=true`
    - Verify Swagger UI loads at `http://localhost:3000/api/docs`
    - Test CORS headers with cross-origin request simulation
    - Document any issues found for immediate fix

**Acceptance Criteria:**
- All 25 feature-specific tests pass (18 from Task Groups 1-4 + 7 from Task Group 5)
- No more than 8 additional tests added when filling gaps
- Health endpoint responds correctly in manual verification
- Swagger UI is accessible and displays OpenAPI spec
- Error responses match documented format
- CORS headers allow expected origins

---

## Execution Order

Recommended implementation sequence:

1. **Configuration Layer (Task Group 1)** - Environment config and type foundations
2. **Middleware Layer (Task Group 2)** - Error handling and CORS
3. **Plugin Layer (Task Group 3)** - Database injection and Swagger
4. **Routes Layer (Task Group 4)** - Health check and server startup
5. **Integration Testing (Task Group 5)** - Test review and verification

## Dependencies Diagram

```
Task Group 1: Configuration
       |
       v
Task Group 2: Middleware
       |
       v
Task Group 3: Plugins
       |
       v
Task Group 4: Routes & Server
       |
       v
Task Group 5: Integration Testing
```

## Key Patterns to Establish

This spec establishes patterns that future specs will follow:

1. **Error Handling Pattern** - Base error classes for spec #4 (Content CRUD) to extend
2. **TypeBox Validation Pattern** - Shared schemas for all future endpoints
3. **Response Format Pattern** - Consistent JSON structure across all APIs
4. **Database Injection Pattern** - Route handlers access `context.db`
5. **Test Utility Pattern** - `createTestApp()` for API integration tests
6. **Plugin Organization Pattern** - Middleware, plugins, and routes separation

## Notes

- Authentication middleware is deferred to spec #3 "Authentication System"
- Rate limiting is deferred to spec #22 "Security Hardening"
- Actual CRUD endpoints are deferred to spec #4 "Content CRUD APIs"
- Structured logging can be added incrementally later
- Request ID tracking can be added incrementally later
