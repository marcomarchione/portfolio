/**
 * Authentication TypeBox Schemas
 *
 * Validation schemas for authentication endpoints.
 * Used for request body validation and Swagger documentation.
 */
import { t } from 'elysia';

/**
 * Login request body schema.
 * Requires username and password fields.
 */
export const LoginRequestSchema = t.Object({
  username: t.String({ minLength: 1, description: 'Admin username' }),
  password: t.String({ minLength: 1, description: 'Admin password' }),
});

/**
 * Login response data schema.
 * Returns tokens and expiry information.
 */
export const LoginResponseSchema = t.Object({
  accessToken: t.String({ description: 'JWT access token for API requests' }),
  refreshToken: t.String({ description: 'JWT refresh token for obtaining new access tokens' }),
  expiresIn: t.Number({ description: 'Access token expiry in seconds' }),
});

/**
 * Refresh request body schema.
 * Requires refresh token.
 */
export const RefreshRequestSchema = t.Object({
  refreshToken: t.String({ minLength: 1, description: 'Valid refresh token' }),
});

/**
 * Refresh response data schema.
 * Returns new access token and expiry.
 */
export const RefreshResponseSchema = t.Object({
  accessToken: t.String({ description: 'New JWT access token' }),
  expiresIn: t.Number({ description: 'Access token expiry in seconds' }),
});

/**
 * Logout response data schema.
 * Returns success message.
 */
export const LogoutResponseSchema = t.Object({
  message: t.String({ description: 'Logout confirmation message' }),
});

/**
 * API response wrapper for login.
 */
export const LoginApiResponseSchema = t.Object({
  data: LoginResponseSchema,
});

/**
 * API response wrapper for refresh.
 */
export const RefreshApiResponseSchema = t.Object({
  data: RefreshResponseSchema,
});

/**
 * API response wrapper for logout.
 */
export const LogoutApiResponseSchema = t.Object({
  data: LogoutResponseSchema,
});
