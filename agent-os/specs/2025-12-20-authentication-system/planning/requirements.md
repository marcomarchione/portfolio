# Spec Requirements: Authentication System

## Initial Description

**Source:** Product Roadmap Item #3

Implement JWT-based authentication with login endpoint, token refresh, protected route middleware, and secure password handling for admin access.

**Effort Estimate:** S (2-3 days)

**Context:**
- Single admin user (Marco) - no multi-user system
- Admin panel at marcomarchione.it/admin
- VPS-only architecture (self-hosted)
- Database schema complete (but no users table needed - single admin via env var)
- Backend API foundation complete with error handling, CORS, Swagger

## Requirements Discussion

### First Round Questions

**Q1:** Since this is a single-admin system, how do you want to handle the initial credential setup? I'm assuming you would prefer to set the admin password via environment variable (e.g., `ADMIN_PASSWORD_HASH`) rather than having a registration endpoint or database seeding. Is that correct, or would you prefer a different approach?

**Answer:** Environment variable (`ADMIN_PASSWORD_HASH`) confirmed - no registration endpoint needed.

**Q2:** For your workflow managing content, how long should a login session remain valid before requiring re-authentication? I'm assuming you'd want to stay logged in for a full work session (e.g., access token: 15 minutes, refresh token: 7 days) so you don't get logged out mid-editing. Does that align with how you expect to use the admin panel?

**Answer:** Confirmed - Access token 15 minutes, refresh token 7 days. Long sessions preferred for content editing workflows.

**Q3:** For the token refresh mechanism, should the admin panel automatically refresh tokens in the background (seamless UX, you never see a logout unless inactive for 7+ days), or would you prefer manual re-login when the session expires?

**Answer:** Automatic background refresh confirmed - seamless UX preferred.

**Q4:** When you log out, should the system invalidate the refresh token server-side (requiring a token blacklist or database storage), or is a simple client-side logout sufficient (just delete the token locally)? Given the single-admin context with full VPS control, I'm leaning toward client-side only for simplicity.

**Answer:** Client-side only logout confirmed - no server-side token blacklist needed. Simple approach for single-admin system.

**Q5:** Is there anything you explicitly do NOT want included in this authentication system?

**Answer:** Exclusions confirmed:
- No multi-factor authentication (MFA)
- No password reset flow
- No remember-me checkbox
- No session management UI
- No audit logging of login attempts

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Error Types - Path: `src/api/types/errors.ts`
  - UnauthorizedError class already defined and ready to use
- Feature: Middleware Patterns - Path: `src/api/middleware/`
  - Contains `cors.ts`, `error-handler.ts`, and `index.ts`
  - Pattern for creating Elysia middleware plugins
- Feature: Environment Configuration - Path: `src/api/config.ts`
  - Singleton config pattern with loadConfig() function
  - Environment variable parsing helpers
  - Pattern for adding new config values (JWT_SECRET, ADMIN_PASSWORD_HASH, etc.)

## Visual Assets

### Files Provided:
No visual assets provided (backend-only feature).

### Visual Insights:
Not applicable - this is an API/backend feature with no UI components.

## Requirements Summary

### Functional Requirements
- Login endpoint (`POST /api/v1/auth/login`) accepting username/password
- Token refresh endpoint (`POST /api/v1/auth/refresh`) for seamless session extension
- Logout endpoint (`POST /api/v1/auth/logout`) for client-side token clearing
- Protected route middleware for all `/api/v1/admin/*` endpoints
- Single admin user with credentials stored in environment variables
- JWT access tokens (15-minute expiry) for API authorization
- JWT refresh tokens (7-day expiry) for session persistence
- Secure password verification using bcrypt or Bun's native password hashing

### Reusability Opportunities
- Extend existing `UnauthorizedError` class from `src/api/types/errors.ts`
- Follow middleware plugin pattern from `src/api/middleware/cors.ts`
- Extend `Config` interface in `src/api/config.ts` for auth-related env vars
- Use existing `loadConfig()` pattern for validation of JWT_SECRET and ADMIN_PASSWORD_HASH

### Scope Boundaries

**In Scope:**
- JWT-based authentication (access + refresh tokens)
- Login endpoint with password verification
- Token refresh endpoint for automatic session extension
- Logout endpoint (client-side token clearing)
- Auth middleware for protecting admin routes
- Environment variable configuration for admin credentials and JWT secret
- Integration with existing error handling system

**Out of Scope:**
- Multi-user support or user registration
- Multi-factor authentication (MFA)
- Password reset flow
- Remember-me functionality
- Session management UI
- Audit logging of login attempts
- Server-side token blacklist/revocation
- Users table in database (single admin via env var)

### Technical Considerations
- Single admin system: Username "admin" (hardcoded or env var), password hash in env var
- JWT tokens signed with secret from `JWT_SECRET` environment variable
- Access token: 15-minute expiry, used in Authorization header
- Refresh token: 7-day expiry, used to obtain new access tokens
- Password hashing: Use Bun's native `Bun.password` API or bcrypt
- Middleware must integrate with Elysia's plugin system
- Error responses must use existing `UnauthorizedError` class
- All new environment variables must be validated at startup
- CORS already configured - auth endpoints should work with existing setup
