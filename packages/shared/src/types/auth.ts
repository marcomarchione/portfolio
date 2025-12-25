/**
 * Authentication Types
 *
 * Shared authentication types for JWT-based auth.
 */

/** Token pair returned after successful login */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Login request body */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Login response */
export interface LoginResponse {
  tokens: TokenPair;
  user: {
    username: string;
  };
}

/** Refresh token request */
export interface RefreshRequest {
  refreshToken: string;
}

/** Refresh token response */
export interface RefreshResponse {
  accessToken: string;
}

/** Decoded JWT payload */
export interface TokenPayload {
  sub: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}
