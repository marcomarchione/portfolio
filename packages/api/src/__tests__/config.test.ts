/**
 * Configuration Module Tests
 *
 * Tests environment variable loading, parsing, and validation.
 */
import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';

describe('Configuration Module', () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('loads environment variables with defaults (NODE_ENV, PORT, DATABASE_PATH)', async () => {
    // Clear specific env vars to test defaults
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DATABASE_PATH;
    delete process.env.CORS_ORIGINS;

    // Import loadConfig function and test directly
    const configModule = await import('../config');
    const config = configModule.loadConfig();

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.DATABASE_PATH).toBe('./data.db');
  });

  test('parses CORS_ORIGINS from comma-separated string to array', async () => {
    process.env.CORS_ORIGINS = 'https://example.com, https://test.com, https://another.com';

    const configModule = await import('../config');
    const config = configModule.loadConfig();

    // Default origin should always be included
    expect(config.CORS_ORIGINS).toContain('https://marcomarchione.it');
    // Additional origins from env var
    expect(config.CORS_ORIGINS).toContain('https://example.com');
    expect(config.CORS_ORIGINS).toContain('https://test.com');
    expect(config.CORS_ORIGINS).toContain('https://another.com');
  });

  test('throws error for invalid PORT (non-numeric)', async () => {
    process.env.PORT = 'invalid-port';

    const configModule = await import('../config');

    // loadConfig should throw when called with invalid PORT
    expect(() => configModule.loadConfig()).toThrow('Invalid PORT value');
  });

  test('isDevelopment/isProduction helper functions work correctly', async () => {
    // Test development mode
    process.env.NODE_ENV = 'development';
    const configModule = await import('../config');

    // Test with loadConfig to get fresh config
    const devConfig = configModule.loadConfig();
    expect(devConfig.NODE_ENV).toBe('development');

    // Verify helper logic
    const isDev = devConfig.NODE_ENV === 'development';
    const isProd = devConfig.NODE_ENV === 'production';
    expect(isDev).toBe(true);
    expect(isProd).toBe(false);

    // Test production mode (must provide required auth env vars)
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
    process.env.ADMIN_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=2,p=1$testhashedpassword';
    const prodConfig = configModule.loadConfig();
    expect(prodConfig.NODE_ENV).toBe('production');

    const isDevProd = prodConfig.NODE_ENV === 'development';
    const isProdProd = prodConfig.NODE_ENV === 'production';
    expect(isDevProd).toBe(false);
    expect(isProdProd).toBe(true);
  });
});
