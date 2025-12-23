/**
 * Environment Configuration Module
 *
 * Centralizes all environment variable loading and validation.
 * Exports a singleton config object and helper functions.
 *
 * Required environment variables for authentication:
 * - JWT_SECRET: Secret for signing JWTs (minimum 32 characters)
 * - ADMIN_PASSWORD_HASH: bcrypt hash of admin password
 *
 * Optional environment variables:
 * - JWT_ACCESS_EXPIRY: Access token expiry (default: "15m")
 * - JWT_REFRESH_EXPIRY: Refresh token expiry (default: "7d")
 * - UPLOADS_PATH: Path for uploaded media files (default: "./uploads")
 */

/** Supported environment types */
export type NodeEnv = 'development' | 'production';

/** Configuration interface for all environment variables */
export interface Config {
  /** Current environment */
  NODE_ENV: NodeEnv;
  /** Server port */
  PORT: number;
  /** Path to SQLite database file */
  DATABASE_PATH: string;
  /** Allowed CORS origins */
  CORS_ORIGINS: string[];
  /** Secret for signing JWTs (minimum 32 characters) */
  JWT_SECRET: string;
  /** bcrypt hash of admin password */
  ADMIN_PASSWORD_HASH: string;
  /** Access token expiry duration (default: "15m") */
  JWT_ACCESS_EXPIRY: string;
  /** Refresh token expiry duration (default: "7d") */
  JWT_REFRESH_EXPIRY: string;
  /** Path for uploaded media files (default: "./uploads") */
  UPLOADS_PATH: string;
}

/**
 * Parses a comma-separated string into an array of trimmed strings.
 * Filters out empty strings.
 *
 * @param value - Comma-separated string
 * @returns Array of trimmed strings
 */
function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * Validates and parses the PORT environment variable.
 * Throws an error if PORT is not a valid positive integer.
 *
 * @param value - Port value from environment
 * @returns Parsed port number
 */
function parsePort(value: string | undefined): number {
  const defaultPort = 3000;
  if (!value) return defaultPort;

  const port = parseInt(value, 10);
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid PORT value: "${value}". PORT must be a positive integer between 1 and 65535.`
    );
  }
  return port;
}

/**
 * Validates and parses the NODE_ENV environment variable.
 *
 * @param value - Environment value
 * @returns Valid NodeEnv value
 */
function parseNodeEnv(value: string | undefined): NodeEnv {
  if (value === 'production') return 'production';
  return 'development';
}

/**
 * Validates and parses the JWT_SECRET environment variable.
 * Must be at least 32 characters for security.
 *
 * @param value - JWT secret from environment
 * @param isProduction - Whether running in production mode
 * @returns Validated JWT secret
 */
function parseJwtSecret(value: string | undefined, isProduction: boolean): string {
  if (!value) {
    if (isProduction) {
      throw new Error('JWT_SECRET is required in production environment');
    }
    // Use default secret only in development
    return 'development-secret-that-is-at-least-32-characters-long';
  }

  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters for security');
  }

  return value;
}

/**
 * Validates and parses the ADMIN_PASSWORD_HASH environment variable.
 * Required for authentication.
 *
 * @param value - Password hash from environment
 * @param isProduction - Whether running in production mode
 * @returns Validated password hash
 */
function parsePasswordHash(value: string | undefined, isProduction: boolean): string {
  if (!value) {
    if (isProduction) {
      throw new Error('ADMIN_PASSWORD_HASH is required in production environment');
    }
    // Use default hash only in development (hash of "admin")
    return '$2b$10$development-hash-for-testing-only';
  }

  return value;
}

/**
 * Parses an expiry duration with a default value.
 *
 * @param value - Expiry value from environment
 * @param defaultValue - Default expiry if not set
 * @returns Expiry string
 */
function parseExpiry(value: string | undefined, defaultValue: string): string {
  return value ?? defaultValue;
}

/**
 * Parses the UPLOADS_PATH environment variable.
 * Defaults to ./uploads relative to project root.
 *
 * @param value - Path from environment
 * @returns Validated uploads path
 */
function parseUploadsPath(value: string | undefined): string {
  return value ?? './uploads';
}

/**
 * Loads and validates all environment configuration.
 * Throws an error if critical validation fails.
 *
 * @returns Validated configuration object
 */
export function loadConfig(): Config {
  const NODE_ENV = parseNodeEnv(process.env.NODE_ENV);
  const isProduction = NODE_ENV === 'production';
  const PORT = parsePort(process.env.PORT);
  const DATABASE_PATH = process.env.DATABASE_PATH ?? './data.db';
  const additionalOrigins = parseOrigins(process.env.CORS_ORIGINS);

  // Default allowed origins
  const defaultOrigins = ['https://marcomarchione.it'];

  // Combine default and additional origins
  const CORS_ORIGINS = [...defaultOrigins, ...additionalOrigins];

  // Parse authentication configuration
  const JWT_SECRET = parseJwtSecret(process.env.JWT_SECRET, isProduction);
  const ADMIN_PASSWORD_HASH = parsePasswordHash(process.env.ADMIN_PASSWORD_HASH, isProduction);
  const JWT_ACCESS_EXPIRY = parseExpiry(process.env.JWT_ACCESS_EXPIRY, '15m');
  const JWT_REFRESH_EXPIRY = parseExpiry(process.env.JWT_REFRESH_EXPIRY, '7d');

  // Parse media configuration
  const UPLOADS_PATH = parseUploadsPath(process.env.UPLOADS_PATH);

  return {
    NODE_ENV,
    PORT,
    DATABASE_PATH,
    CORS_ORIGINS,
    JWT_SECRET,
    ADMIN_PASSWORD_HASH,
    JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY,
    UPLOADS_PATH,
  };
}

/** Singleton configuration instance */
export const config = loadConfig();

/**
 * Checks if the application is running in development mode.
 *
 * @returns true if NODE_ENV is "development"
 */
export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

/**
 * Checks if the application is running in production mode.
 *
 * @returns true if NODE_ENV is "production"
 */
export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}
