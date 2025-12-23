# Specification: Authentication System

## Goal

Implement a JWT-based authentication system for the admin panel with login, token refresh, and protected route middleware, enabling secure stateless access control for content management operations on the self-hosted VPS.

## User Stories

- As Marco (the only admin), I want to log in to the admin panel with my credentials so that I can manage website content securely
- As Marco, I want my session to stay active seamlessly during long editing sessions so that I don't lose work due to unexpected logouts

## Specific Requirements

**Login Endpoint (POST /api/v1/auth/login)**
- Accept JSON body with `username` and `password` fields
- Username is hardcoded as "admin" (single-user system)
- Verify password against `ADMIN_PASSWORD_HASH` environment variable using `Bun.password.verify()`
- Return both access token (15-min expiry) and refresh token (7-day expiry) on success
- Return 401 UnauthorizedError on invalid credentials
- Use TypeBox schema for request body validation

**Token Refresh Endpoint (POST /api/v1/auth/refresh)**
- Accept JSON body with `refreshToken` field
- Validate refresh token signature and expiration
- Return new access token (15-min expiry) on success
- Return 401 UnauthorizedError if refresh token is invalid or expired
- Do not rotate refresh token (client keeps original until expiry)

**Logout Endpoint (POST /api/v1/auth/logout)**
- Client-side only logout (no server-side token blacklist)
- Return 200 success response with acknowledgment message
- Frontend responsible for clearing tokens from storage

**JWT Token Structure**
- Access token payload: `{ sub: "admin", type: "access", iat, exp }`
- Refresh token payload: `{ sub: "admin", type: "refresh", iat, exp }`
- Sign tokens with `JWT_SECRET` environment variable using HS256 algorithm
- Use `@elysiajs/jwt` plugin for token signing and verification

**Protected Route Middleware (authMiddleware)**
- Create as Elysia plugin following existing middleware pattern in `src/api/middleware/`
- Extract Bearer token from `Authorization` header
- Verify access token signature and expiration
- Throw `UnauthorizedError` on missing, invalid, or expired token
- Apply to all `/api/v1/admin/*` routes (future content/media endpoints)
- Use `scoped: false` for global protection like `errorHandler`

**Environment Configuration**
- Add `JWT_SECRET` to Config interface (required, minimum 32 characters)
- Add `ADMIN_PASSWORD_HASH` to Config interface (required, bcrypt hash format)
- Add `JWT_ACCESS_EXPIRY` (optional, default "15m")
- Add `JWT_REFRESH_EXPIRY` (optional, default "7d")
- Validate presence of required auth env vars at startup in `loadConfig()`

**Auth Routes Organization**
- Create `src/api/routes/auth.ts` with all three endpoints
- Export `authRoutes` Elysia plugin with `/auth` prefix
- Register in `src/api/routes/index.ts` under `/api/v1`
- Document endpoints in Swagger via TypeBox schemas

**Response Format**
- Login success: `{ data: { accessToken, refreshToken, expiresIn } }`
- Refresh success: `{ data: { accessToken, expiresIn } }`
- Logout success: `{ data: { message: "Logged out successfully" } }`
- Use existing `createResponse()` helper from `src/api/types/responses.ts`

## Visual Design

No visual assets provided (backend-only feature).

## Existing Code to Leverage

**`src/api/types/errors.ts` - UnauthorizedError**
- Already defines `UnauthorizedError` class with 401 status code
- Use directly in auth middleware and login endpoint for auth failures
- Integrates with existing error handler for consistent JSON responses

**`src/api/middleware/cors.ts` - Middleware Plugin Pattern**
- Follow pattern of `new Elysia({ name: 'middleware-name' })` for auth middleware
- Already allows `Authorization` header in CORS configuration
- Use same export structure with default instance and factory function

**`src/api/config.ts` - Environment Configuration**
- Extend `Config` interface with JWT_SECRET and ADMIN_PASSWORD_HASH
- Follow `parsePort()` pattern for custom validation functions
- Add validation in `loadConfig()` with descriptive error messages

**`src/api/routes/index.ts` - Route Registration**
- Add `authRoutes` using `.use()` chain after health routes
- Routes already prefixed with `/api/v1`, auth routes add `/auth`

**`src/api/types/responses.ts` - Response Helpers**
- Use `createResponse()` for successful auth responses
- Use `ApiResponse<T>` type for token response interfaces

## Out of Scope

- Multi-user support or user registration (single admin via env var)
- Users table in database
- Multi-factor authentication (MFA)
- Password reset flow or forgot password
- Remember-me checkbox or persistent sessions
- Session management UI or active sessions list
- Audit logging of login attempts
- Server-side token blacklist or revocation
- Rate limiting on login endpoint (future security enhancement)
- Password change endpoint
