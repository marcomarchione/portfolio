/**
 * Authentication Module Barrel Export
 *
 * Exports all authentication-related utilities and schemas.
 */

// JWT utilities
export {
  createJwtPlugin,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  type TokenPayload,
  type TokenPair,
  type JwtContext,
} from './jwt';

// Validation schemas
export {
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshRequestSchema,
  RefreshResponseSchema,
  LogoutResponseSchema,
  LoginApiResponseSchema,
  RefreshApiResponseSchema,
  LogoutApiResponseSchema,
} from './schemas';
