# Task Breakdown: Authentication System

## Overview

Total Tasks: 27 sub-tasks across 5 task groups

**Feature Summary:** JWT-based authentication system for the admin panel with login, token refresh, logout, and protected route middleware.

**Key Technical Decisions:**
- Single admin user (no users table) - credentials via environment variables
- JWT tokens using `@elysiajs/jwt` with HS256 algorithm
- Access token: 15-minute expiry, Refresh token: 7-day expiry
- Client-side logout only (no token blacklist)
- `Bun.password.verify()` for password verification

## Task List

### Configuration Layer

#### Task Group 1: Environment Configuration
**Dependencies:** None

- [x] 1.0 Complete environment configuration for authentication
  - [x] 1.1 Write 4 focused tests for config validation
    - Test `JWT_SECRET` validation (required, minimum 32 characters)
    - Test `ADMIN_PASSWORD_HASH` validation (required, bcrypt format)
    - Test `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY` defaults
    - Test `loadConfig()` throws descriptive errors for missing auth vars
  - [x] 1.2 Extend `Config` interface in `src/api/config.ts`
    - Add `JWT_SECRET: string` (required, min 32 chars)
    - Add `ADMIN_PASSWORD_HASH: string` (required)
    - Add `JWT_ACCESS_EXPIRY: string` (optional, default "15m")
    - Add `JWT_REFRESH_EXPIRY: string` (optional, default "7d")
  - [x] 1.3 Create validation functions following `parsePort()` pattern
    - `parseJwtSecret(value: string | undefined): string` - validate min 32 chars
    - `parsePasswordHash(value: string | undefined): string` - validate presence
    - `parseExpiry(value: string | undefined, defaultValue: string): string`
  - [x] 1.4 Update `loadConfig()` to validate auth environment variables
    - Add descriptive error messages for missing/invalid values
    - Document env var requirements in code comments
  - [x] 1.5 Ensure configuration tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify validation functions work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- `Config` interface includes all JWT/auth properties
- Missing `JWT_SECRET` or `ADMIN_PASSWORD_HASH` throws clear error at startup
- Default expiry values applied when env vars not set

**Files to Create/Modify:**
- Modify: `src/api/config.ts`
- Create: `src/api/__tests__/auth-config.test.ts`

---

### JWT Utilities Layer

#### Task Group 2: JWT Token Management
**Dependencies:** Task Group 1

- [x] 2.0 Complete JWT token utilities
  - [x] 2.1 Write 5 focused tests for JWT operations
    - Test access token generation with correct payload structure
    - Test refresh token generation with correct payload structure
    - Test access token verification (valid token)
    - Test token verification failure (expired token)
    - Test token verification failure (invalid signature)
  - [x] 2.2 Create `src/api/auth/jwt.ts` module
    - Import `jwt` from `@elysiajs/jwt`
    - Define `TokenPayload` interface: `{ sub: string, type: 'access' | 'refresh', iat: number, exp: number }`
    - Define `TokenPair` interface: `{ accessToken: string, refreshToken: string }`
  - [x] 2.3 Implement `createJwtPlugin()` function
    - Configure with `JWT_SECRET` from config
    - Use HS256 algorithm
    - Return Elysia plugin with `jwt` decorator
  - [x] 2.4 Implement token generation functions
    - `generateAccessToken(jwt: JwtPlugin): Promise<string>` - 15min expiry, type: "access"
    - `generateRefreshToken(jwt: JwtPlugin): Promise<string>` - 7day expiry, type: "refresh"
    - `generateTokenPair(jwt: JwtPlugin): Promise<TokenPair>`
  - [x] 2.5 Implement token verification functions
    - `verifyAccessToken(jwt: JwtPlugin, token: string): Promise<TokenPayload | null>`
    - `verifyRefreshToken(jwt: JwtPlugin, token: string): Promise<TokenPayload | null>`
    - Check `type` field matches expected token type
  - [x] 2.6 Ensure JWT utility tests pass
    - Run ONLY the 5 tests written in 2.1
    - Verify token generation and verification work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 5 tests written in 2.1 pass
- Access tokens have 15-minute expiry with type: "access"
- Refresh tokens have 7-day expiry with type: "refresh"
- Token verification rejects expired or invalid tokens
- Token verification rejects wrong token type (access vs refresh)

**Files to Create:**
- Create: `src/api/auth/jwt.ts`
- Create: `src/api/auth/index.ts` (barrel export)
- Create: `src/api/__tests__/auth-jwt.test.ts`

---

### Middleware Layer

#### Task Group 3: Authentication Middleware
**Dependencies:** Task Group 2

- [x] 3.0 Complete authentication middleware
  - [x] 3.1 Write 5 focused tests for auth middleware
    - Test request passes with valid access token in Authorization header
    - Test request fails with missing Authorization header (401)
    - Test request fails with invalid token format (401)
    - Test request fails with expired access token (401)
    - Test request fails with refresh token (wrong token type, 401)
  - [x] 3.2 Create `src/api/middleware/auth.ts`
    - Follow pattern from `src/api/middleware/cors.ts`
    - Export `authMiddleware` as Elysia plugin with `name: 'auth-middleware'`
    - Use `scoped: false` for global protection
  - [x] 3.3 Implement Bearer token extraction
    - Extract token from `Authorization: Bearer <token>` header
    - Throw `UnauthorizedError` if header missing or malformed
    - Use existing `UnauthorizedError` from `src/api/types/errors.ts`
  - [x] 3.4 Implement token verification in middleware
    - Verify access token using JWT plugin
    - Check token type is "access" (reject refresh tokens)
    - Throw `UnauthorizedError` on invalid/expired token
  - [x] 3.5 Export factory function `createAuthMiddleware()`
    - Accept JWT secret as parameter for testing
    - Follow pattern from `createCorsMiddleware()`
  - [x] 3.6 Ensure middleware tests pass
    - Run ONLY the 5 tests written in 3.1
    - Verify middleware correctly protects routes
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 5 tests written in 3.1 pass
- Middleware extracts Bearer token from Authorization header
- Valid access tokens allow request to proceed
- Missing/invalid/expired tokens return 401 UnauthorizedError
- Refresh tokens are rejected (wrong token type)

**Files to Create/Modify:**
- Create: `src/api/middleware/auth.ts`
- Modify: `src/api/middleware/index.ts` (add export)
- Create: `src/api/__tests__/auth-middleware.test.ts`

---

### API Endpoints Layer

#### Task Group 4: Authentication Routes
**Dependencies:** Task Groups 2, 3

- [x] 4.0 Complete authentication API endpoints
  - [x] 4.1 Write 8 focused tests for auth endpoints
    - Test POST /api/v1/auth/login with valid credentials returns tokens
    - Test POST /api/v1/auth/login with invalid password returns 401
    - Test POST /api/v1/auth/login with invalid username returns 401
    - Test POST /api/v1/auth/login validates request body schema
    - Test POST /api/v1/auth/refresh with valid refresh token returns new access token
    - Test POST /api/v1/auth/refresh with expired/invalid token returns 401
    - Test POST /api/v1/auth/refresh with access token (wrong type) returns 401
    - Test POST /api/v1/auth/logout returns success message
  - [x] 4.2 Create TypeBox schemas for request/response validation
    - `LoginRequestSchema`: `{ username: string, password: string }`
    - `LoginResponseSchema`: `{ accessToken: string, refreshToken: string, expiresIn: number }`
    - `RefreshRequestSchema`: `{ refreshToken: string }`
    - `RefreshResponseSchema`: `{ accessToken: string, expiresIn: number }`
    - `LogoutResponseSchema`: `{ message: string }`
    - Place in `src/api/auth/schemas.ts`
  - [x] 4.3 Create `src/api/routes/auth.ts` with login endpoint
    - POST /auth/login
    - Accept `{ username, password }` JSON body
    - Verify username === "admin" (hardcoded single user)
    - Verify password against `ADMIN_PASSWORD_HASH` using `Bun.password.verify()`
    - Return `{ data: { accessToken, refreshToken, expiresIn: 900 } }` on success
    - Throw `UnauthorizedError` on invalid credentials
  - [x] 4.4 Add token refresh endpoint
    - POST /auth/refresh
    - Accept `{ refreshToken }` JSON body
    - Verify refresh token signature and expiration
    - Verify token type is "refresh"
    - Return `{ data: { accessToken, expiresIn: 900 } }` on success
    - Throw `UnauthorizedError` on invalid/expired refresh token
  - [x] 4.5 Add logout endpoint
    - POST /auth/logout
    - Return `{ data: { message: "Logged out successfully" } }`
    - No server-side token invalidation (client-side only)
  - [x] 4.6 Export `authRoutes` as Elysia plugin with `/auth` prefix
    - Follow pattern from `healthRoutes`
    - Include TypeBox schemas for Swagger documentation
  - [x] 4.7 Register auth routes in `src/api/routes/index.ts`
    - Add `.use(authRoutes)` after health routes
    - Routes accessible at /api/v1/auth/*
  - [x] 4.8 Ensure auth endpoint tests pass
    - Run ONLY the 8 tests written in 4.1
    - Verify all three endpoints work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 8 tests written in 4.1 pass
- Login returns both tokens on valid credentials
- Login returns 401 on invalid credentials
- Refresh returns new access token on valid refresh token
- Refresh returns 401 on invalid/expired refresh token
- Logout returns success message
- All endpoints documented in Swagger via TypeBox schemas
- Response format uses `createResponse()` helper

**Files to Create/Modify:**
- Create: `src/api/auth/schemas.ts`
- Create: `src/api/routes/auth.ts`
- Modify: `src/api/routes/index.ts`
- Create: `src/api/__tests__/auth-routes.test.ts`

---

### Testing & Integration Layer

#### Task Group 5: Test Review & Integration Testing
**Dependencies:** Task Groups 1-4

- [x] 5.0 Review existing tests and fill critical gaps
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review 4 tests from Task 1.1 (config validation)
    - Review 5 tests from Task 2.1 (JWT operations)
    - Review 5 tests from Task 3.1 (auth middleware)
    - Review 8 tests from Task 4.1 (auth endpoints)
    - Total existing tests: 22 tests
  - [x] 5.2 Analyze test coverage gaps for authentication feature
    - Identify critical integration workflows lacking coverage
    - Focus ONLY on authentication feature requirements
    - Prioritize end-to-end auth flow over unit test gaps
  - [x] 5.3 Write up to 8 additional strategic tests if needed
    - Integration test: Full login -> use token -> access protected route flow
    - Integration test: Token expiry -> refresh -> continue session flow
    - Edge case: Concurrent requests with same token
    - Edge case: Malformed JWT tokens (corrupted base64)
    - Edge case: Token with tampered payload
    - Boundary test: JWT_SECRET exactly 32 characters
    - Boundary test: Password hash in different bcrypt formats
    - Error response format consistency across all auth endpoints
  - [x] 5.4 Update test utilities for auth testing
    - Add `createTestAppWithAuth(options)` helper to `src/api/test-utils.ts`
    - Helper should configure JWT secret and admin password hash for tests
    - Add `generateTestToken(type: 'access' | 'refresh')` helper
  - [x] 5.5 Run feature-specific tests only
    - Run ONLY tests related to authentication feature
    - Expected total: approximately 22-30 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical auth workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (22-30 tests total)
- Full authentication workflow tested end-to-end
- Token refresh flow tested
- Protected route access tested with valid/invalid tokens
- No more than 8 additional tests added
- Test utilities updated to support auth testing

**Files to Create/Modify:**
- Modify: `src/api/test-utils.ts` (add auth helpers)
- Create: `src/api/__tests__/auth-integration.test.ts`

---

## Execution Order

Recommended implementation sequence:

1. **Configuration Layer (Task Group 1)** - Foundation for all auth components
   - Must complete first as JWT utils and routes depend on config values

2. **JWT Utilities Layer (Task Group 2)** - Core token management
   - Depends on config for JWT_SECRET
   - Required by middleware and routes

3. **Middleware Layer (Task Group 3)** - Route protection
   - Depends on JWT utilities for token verification
   - Can be developed in parallel with routes if interfaces are defined

4. **API Endpoints Layer (Task Group 4)** - Auth routes
   - Depends on JWT utilities for token generation
   - Uses middleware for protected routes (future)
   - Largest task group, core feature implementation

5. **Testing & Integration (Task Group 5)** - Final validation
   - Depends on all previous task groups
   - Validates complete authentication flow

## File Structure Summary

```
src/api/
  auth/
    index.ts           # Barrel export
    jwt.ts             # JWT token utilities
    schemas.ts         # TypeBox validation schemas
  middleware/
    auth.ts            # Auth middleware (new)
    index.ts           # Update exports
  routes/
    auth.ts            # Auth routes (new)
    index.ts           # Update to add authRoutes
  config.ts            # Update with auth env vars
  test-utils.ts        # Update with auth helpers
  __tests__/
    auth-config.test.ts       # Config validation tests
    auth-jwt.test.ts          # JWT utility tests
    auth-middleware.test.ts   # Middleware tests
    auth-routes.test.ts       # Endpoint tests
    auth-integration.test.ts  # Integration tests
```

## Environment Variables Summary

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret for signing JWTs (min 32 chars) |
| `ADMIN_PASSWORD_HASH` | Yes | - | bcrypt hash of admin password |
| `JWT_ACCESS_EXPIRY` | No | "15m" | Access token expiry duration |
| `JWT_REFRESH_EXPIRY` | No | "7d" | Refresh token expiry duration |

## Dependencies to Install

```bash
bun add @elysiajs/jwt
```

## Notes

- This is a backend-only feature with no UI components
- Single admin user system - no users table or registration
- Client-side logout only - no server-side token blacklist
- CORS already configured to allow Authorization header
- Existing `UnauthorizedError` class ready to use
- Follow existing Elysia plugin patterns from cors.ts and error-handler.ts
