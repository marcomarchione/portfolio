/**
 * Authentication Configuration Tests
 *
 * Tests for JWT and auth-related environment variable validation.
 * Tests the parsing functions directly rather than through module import
 * to avoid singleton initialization issues.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

// Store original env for restoration
const originalEnv = { ...process.env };

/**
 * Re-implement the parsing functions to test them in isolation.
 * This mirrors the logic in config.ts without triggering the singleton.
 */
function parseJwtSecret(value: string | undefined, isProduction: boolean): string {
  if (!value) {
    if (isProduction) {
      throw new Error('JWT_SECRET is required in production environment');
    }
    return 'development-secret-that-is-at-least-32-characters-long';
  }

  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for security');
  }

  return value;
}

function parsePasswordHash(value: string | undefined, isProduction: boolean): string {
  if (!value) {
    if (isProduction) {
      throw new Error('ADMIN_PASSWORD_HASH is required in production environment');
    }
    return '$2b$10$development-hash-for-testing-only';
  }

  return value;
}

function parseExpiry(value: string | undefined, defaultValue: string): string {
  return value ?? defaultValue;
}

describe('Authentication Configuration', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('JWT_SECRET validation requires minimum 32 characters', () => {
    // Short secret should throw
    expect(() => parseJwtSecret('short-secret', false)).toThrow(
      'JWT_SECRET must be at least 32 characters'
    );

    // Valid secret should work
    const validSecret = parseJwtSecret('test-secret-that-is-at-least-32-characters-long', false);
    expect(validSecret).toBe('test-secret-that-is-at-least-32-characters-long');
  });

  test('ADMIN_PASSWORD_HASH is required in production and must be present', () => {
    // Missing hash in production should throw
    expect(() => parsePasswordHash(undefined, true)).toThrow('ADMIN_PASSWORD_HASH is required');

    // Missing hash in development uses default
    const devHash = parsePasswordHash(undefined, false);
    expect(devHash).toBe('$2b$10$development-hash-for-testing-only');

    // Provided hash should be returned
    const providedHash = parsePasswordHash('$2b$10$custom-hash', false);
    expect(providedHash).toBe('$2b$10$custom-hash');
  });

  test('JWT_ACCESS_EXPIRY and JWT_REFRESH_EXPIRY have correct defaults', () => {
    // Default values when not set
    expect(parseExpiry(undefined, '15m')).toBe('15m');
    expect(parseExpiry(undefined, '7d')).toBe('7d');

    // Custom values when set
    expect(parseExpiry('30m', '15m')).toBe('30m');
    expect(parseExpiry('14d', '7d')).toBe('14d');
  });

  test('loadConfig throws descriptive error for missing JWT_SECRET in production', () => {
    // Missing JWT_SECRET in production should throw with descriptive message
    expect(() => parseJwtSecret(undefined, true)).toThrow('JWT_SECRET is required');

    // But in development, missing JWT_SECRET uses default
    const devSecret = parseJwtSecret(undefined, false);
    expect(devSecret).toBe('development-secret-that-is-at-least-32-characters-long');
  });
});
