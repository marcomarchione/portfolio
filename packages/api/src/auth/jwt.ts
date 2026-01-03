/**
 * JWT Token Management
 *
 * Provides token generation and verification utilities for authentication.
 * Uses @elysiajs/jwt for JWT operations with HS256 algorithm.
 */
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { config } from '../config';

/** Token payload structure */
export interface TokenPayload {
  /** Subject (user identifier) */
  sub: string;
  /** Token type */
  type: 'access' | 'refresh';
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
}

/** Token pair returned from login */
export interface TokenPair {
  /** Access token for API requests */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
}

/** JWT plugin context type - uses any for compatibility with Elysia's actual JWT type */
export interface JwtContext {
  jwt: {
    sign: (payload: unknown) => Promise<string>;
    verify: (token: string) => Promise<TokenPayload | false>;
  };
}

/**
 * Parses an expiry string like "15m" or "7d" into seconds.
 *
 * @param expiry - Expiry string (e.g., "15m", "7d", "1h")
 * @returns Expiry in seconds
 */
function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

/**
 * Creates an Elysia JWT plugin configured with the application secret.
 *
 * @param secret - JWT secret (optional, defaults to config.JWT_SECRET)
 * @returns Elysia plugin with jwt decorator
 */
export function createJwtPlugin(secret?: string): any {
  return new Elysia({ name: 'jwt-plugin' }).use(
    jwt({
      name: 'jwt',
      secret: secret ?? config.JWT_SECRET,
    })
  );
}

/**
 * Generates an access token with 15-minute expiry.
 *
 * @param jwtContext - JWT context from Elysia
 * @param expiryOverride - Optional expiry override for testing
 * @returns Access token string
 */
export async function generateAccessToken(
  jwtContext: JwtContext,
  expiryOverride?: string
): Promise<string> {
  const expiry = expiryOverride ?? config.JWT_ACCESS_EXPIRY;
  const expiresInSeconds = parseExpiryToSeconds(expiry);
  const now = Math.floor(Date.now() / 1000);

  return jwtContext.jwt.sign({
    sub: 'admin',
    type: 'access',
    iat: now,
    exp: now + expiresInSeconds,
  });
}

/**
 * Generates a refresh token with 7-day expiry.
 *
 * @param jwtContext - JWT context from Elysia
 * @param expiryOverride - Optional expiry override for testing
 * @returns Refresh token string
 */
export async function generateRefreshToken(
  jwtContext: JwtContext,
  expiryOverride?: string
): Promise<string> {
  const expiry = expiryOverride ?? config.JWT_REFRESH_EXPIRY;
  const expiresInSeconds = parseExpiryToSeconds(expiry);
  const now = Math.floor(Date.now() / 1000);

  return jwtContext.jwt.sign({
    sub: 'admin',
    type: 'refresh',
    iat: now,
    exp: now + expiresInSeconds,
  });
}

/**
 * Generates both access and refresh tokens.
 *
 * @param jwtContext - JWT context from Elysia
 * @returns Token pair with accessToken and refreshToken
 */
export async function generateTokenPair(jwtContext: JwtContext): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(jwtContext),
    generateRefreshToken(jwtContext),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Verifies an access token and returns the payload.
 * Returns null if token is invalid, expired, or wrong type.
 *
 * @param jwtContext - JWT context from Elysia
 * @param token - Token string to verify
 * @returns Token payload or null if invalid
 */
export async function verifyAccessToken(
  jwtContext: JwtContext,
  token: string
): Promise<TokenPayload | null> {
  try {
    const payload = await jwtContext.jwt.verify(token);

    if (!payload) {
      return null;
    }

    // Verify token type
    if (payload.type !== 'access') {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies a refresh token and returns the payload.
 * Returns null if token is invalid, expired, or wrong type.
 *
 * @param jwtContext - JWT context from Elysia
 * @param token - Token string to verify
 * @returns Token payload or null if invalid
 */
export async function verifyRefreshToken(
  jwtContext: JwtContext,
  token: string
): Promise<TokenPayload | null> {
  try {
    const payload = await jwtContext.jwt.verify(token);

    if (!payload) {
      return null;
    }

    // Verify token type
    if (payload.type !== 'refresh') {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/** Access token expiry in seconds (for response) */
export const ACCESS_TOKEN_EXPIRY_SECONDS = parseExpiryToSeconds(config.JWT_ACCESS_EXPIRY);
