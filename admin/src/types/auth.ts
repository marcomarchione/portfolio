/**
 * Authentication Types
 *
 * Types for authentication requests and responses.
 */

/**
 * Login request payload.
 */
export interface LoginRequest {
  /** Username (always "admin" for single-user system) */
  username: string;
  /** Password */
  password: string;
}

/**
 * Login response data.
 */
export interface LoginResponse {
  /** JWT access token for API requests */
  accessToken: string;
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Access token expiry time in seconds */
  expiresIn: number;
}

/**
 * Refresh token request payload.
 */
export interface RefreshRequest {
  /** Refresh token */
  refreshToken: string;
}

/**
 * Refresh token response data.
 */
export interface RefreshResponse {
  /** New JWT access token */
  accessToken: string;
  /** New access token expiry time in seconds */
  expiresIn: number;
}

/**
 * Logout response data.
 */
export interface LogoutResponse {
  /** Success message */
  message: string;
}

/**
 * Authenticated user information.
 */
export interface AuthUser {
  /** User subject identifier (from JWT sub claim) */
  subject: string;
}

/**
 * Stored tokens with expiry timestamp.
 */
export interface StoredTokens {
  /** Access token */
  accessToken: string;
  /** Refresh token */
  refreshToken: string;
  /** Expiry timestamp in milliseconds */
  expiresAt: number;
}
