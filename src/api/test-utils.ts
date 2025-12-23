/**
 * API Test Utilities
 *
 * Provides helper functions for testing API endpoints.
 * Creates isolated test instances with in-memory databases.
 */
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { createTestDatabase, resetDatabase, closeDatabase } from '../db/test-utils';
import { errorHandler } from './middleware/error-handler';
import { createCorsMiddleware } from './middleware/cors';
import { createAuthMiddleware } from './middleware/auth';
import { createDatabasePlugin } from './plugins/database';
import { createSwaggerPlugin } from './plugins/swagger';
import { apiRoutes } from './routes';
import type { Database } from 'bun:sqlite';

/**
 * Default test JWT secret.
 * Must match the development secret from config.ts
 */
export const TEST_JWT_SECRET = 'development-secret-that-is-at-least-32-characters-long';

/** Default test admin password */
export const TEST_ADMIN_PASSWORD = 'test-admin-password';

/** Test app configuration options */
export interface TestAppOptions {
  /** Enable CORS middleware (default: false) */
  cors?: boolean;
  /** Enable Swagger documentation (default: false) */
  swagger?: boolean;
  /** Custom CORS origins (default: []) */
  corsOrigins?: string[];
}

/** Auth test app configuration options */
export interface AuthTestAppOptions extends TestAppOptions {
  /** JWT secret for signing tokens */
  jwtSecret?: string;
  /** Admin password hash */
  passwordHash?: string;
}

/** Test app instance with cleanup helpers */
export interface TestApp {
  /** Configured Elysia application */
  app: Elysia;
  /** Database instance for direct queries in tests */
  db: ReturnType<typeof createTestDatabase>['db'];
  /** SQLite connection for cleanup */
  sqlite: Database;
  /** Reset database to clean state */
  reset: () => void;
  /** Close database connection */
  cleanup: () => void;
}

/** Auth test app instance with token generation */
export interface AuthTestApp extends TestApp {
  /** Generate a test access token */
  generateAccessToken: () => Promise<string>;
  /** Generate a test refresh token */
  generateRefreshToken: () => Promise<string>;
  /** Generate an expired token */
  generateExpiredToken: (type: 'access' | 'refresh') => Promise<string>;
}

/**
 * Creates a test API application with an in-memory database.
 * Use this for integration tests that need a full API stack.
 *
 * @param options - Test app configuration
 * @returns Test app instance with helpers
 *
 * @example
 * ```typescript
 * import { createTestApp } from '../test-utils';
 *
 * describe('API Tests', () => {
 *   let testApp: TestApp;
 *
 *   beforeEach(() => {
 *     testApp = createTestApp();
 *   });
 *
 *   afterEach(() => {
 *     testApp.cleanup();
 *   });
 *
 *   test('health check', async () => {
 *     const response = await testApp.app.handle(
 *       new Request('http://localhost/api/v1/health')
 *     );
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */
export function createTestApp(options: TestAppOptions = {}): TestApp {
  const { cors = false, swagger = false, corsOrigins = [] } = options;

  // Create test database
  const { sqlite, db } = createTestDatabase();

  // Build app with test configuration
  let app = new Elysia({ name: 'test-api' })
    .use(errorHandler)
    .use(createDatabasePlugin(db));

  // Optionally add CORS
  if (cors) {
    app = app.use(createCorsMiddleware(corsOrigins));
  }

  // Optionally add Swagger
  if (swagger) {
    app = app.use(createSwaggerPlugin(true));
  }

  // Add API routes
  app = app.use(apiRoutes);

  return {
    app,
    db,
    sqlite,
    reset: () => resetDatabase(sqlite),
    cleanup: () => closeDatabase(sqlite),
  };
}

/**
 * Creates a test API application with authentication support.
 * Includes helpers for generating test tokens.
 *
 * @param options - Auth test app configuration
 * @returns Auth test app instance with helpers
 *
 * @example
 * ```typescript
 * import { createTestAppWithAuth } from '../test-utils';
 *
 * describe('Protected API Tests', () => {
 *   let testApp: AuthTestApp;
 *
 *   beforeEach(() => {
 *     testApp = createTestAppWithAuth();
 *   });
 *
 *   afterEach(() => {
 *     testApp.cleanup();
 *   });
 *
 *   test('protected route with valid token', async () => {
 *     const token = await testApp.generateAccessToken();
 *     const response = await testApp.app.handle(
 *       new Request('http://localhost/api/v1/admin/test', {
 *         headers: { Authorization: `Bearer ${token}` }
 *       })
 *     );
 *     expect(response.status).toBe(200);
 *   });
 * });
 * ```
 */
export function createTestAppWithAuth(options: AuthTestAppOptions = {}): AuthTestApp {
  const {
    cors = false,
    swagger = false,
    corsOrigins = [],
    jwtSecret = TEST_JWT_SECRET,
  } = options;

  // Create test database
  const { sqlite, db } = createTestDatabase();

  // Build app with test configuration
  let app = new Elysia({ name: 'test-api-with-auth' })
    .use(errorHandler)
    .use(createDatabasePlugin(db));

  // Optionally add CORS
  if (cors) {
    app = app.use(createCorsMiddleware(corsOrigins));
  }

  // Optionally add Swagger
  if (swagger) {
    app = app.use(createSwaggerPlugin(true));
  }

  // Add API routes
  app = app.use(apiRoutes);

  // Token generation helpers
  const tokenGenerator = new Elysia().use(jwt({ name: 'jwt', secret: jwtSecret }));

  let jwtInstance: { sign: (payload: Record<string, unknown>) => Promise<string> } | null = null;

  tokenGenerator.get('/init', ({ jwt: jwtPlugin }) => {
    jwtInstance = jwtPlugin;
    return 'ok';
  });

  // Initialize JWT instance
  const initPromise = tokenGenerator.handle(new Request('http://localhost/init'));

  const generateAccessToken = async (): Promise<string> => {
    await initPromise;
    if (!jwtInstance) throw new Error('JWT not initialized');
    const now = Math.floor(Date.now() / 1000);
    return jwtInstance.sign({
      sub: 'admin',
      type: 'access',
      iat: now,
      exp: now + 900,
    });
  };

  const generateRefreshToken = async (): Promise<string> => {
    await initPromise;
    if (!jwtInstance) throw new Error('JWT not initialized');
    const now = Math.floor(Date.now() / 1000);
    return jwtInstance.sign({
      sub: 'admin',
      type: 'refresh',
      iat: now,
      exp: now + 604800,
    });
  };

  const generateExpiredToken = async (type: 'access' | 'refresh'): Promise<string> => {
    await initPromise;
    if (!jwtInstance) throw new Error('JWT not initialized');
    const now = Math.floor(Date.now() / 1000);
    return jwtInstance.sign({
      sub: 'admin',
      type,
      iat: now - 1000,
      exp: now - 1,
    });
  };

  return {
    app,
    db,
    sqlite,
    reset: () => resetDatabase(sqlite),
    cleanup: () => closeDatabase(sqlite),
    generateAccessToken,
    generateRefreshToken,
    generateExpiredToken,
  };
}

/**
 * Generates a test token with custom payload.
 * Useful for testing edge cases.
 *
 * @param secret - JWT secret
 * @param payload - Token payload
 * @returns Token string
 */
export async function generateTestToken(
  secret: string,
  payload: Record<string, unknown>
): Promise<string> {
  const app = new Elysia().use(jwt({ name: 'jwt', secret }));

  let token = '';
  app.get('/gen', async ({ jwt: jwtPlugin }) => {
    token = await jwtPlugin.sign(payload);
    return 'ok';
  });

  await app.handle(new Request('http://localhost/gen'));
  return token;
}

/**
 * Helper to make a JSON request to the test app.
 *
 * @param app - Elysia app instance
 * @param path - Request path
 * @param options - Fetch options
 * @returns Response
 */
export async function testRequest(
  app: Elysia,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `http://localhost${path}`;

  // Merge headers properly - don't let options overwrite our headers object
  const { headers: optionHeaders, ...restOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add any additional headers from options
  if (optionHeaders) {
    if (optionHeaders instanceof Headers) {
      optionHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(optionHeaders)) {
      optionHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, optionHeaders);
    }
  }

  const request = new Request(url, {
    ...restOptions,
    headers,
  });

  return app.handle(request);
}

/**
 * Helper to make a JSON request and parse the response.
 *
 * @param app - Elysia app instance
 * @param path - Request path
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function testJsonRequest<T = unknown>(
  app: Elysia,
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; body: T }> {
  const response = await testRequest(app, path, options);
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

/**
 * Helper to make an authenticated request.
 *
 * @param app - Elysia app instance
 * @param path - Request path
 * @param token - Access token
 * @param options - Fetch options
 * @returns Response
 */
export async function testAuthRequest(
  app: Elysia,
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const { headers: optionHeaders, ...restOptions } = options;

  // Build headers with authorization
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  // Add any additional headers from options
  if (optionHeaders) {
    if (optionHeaders instanceof Headers) {
      optionHeaders.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(optionHeaders)) {
      optionHeaders.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, optionHeaders);
    }
  }

  return testRequest(app, path, {
    ...restOptions,
    headers,
  });
}

/**
 * Helper to make an authenticated JSON request and parse the response.
 *
 * @param app - Elysia app instance
 * @param path - Request path
 * @param token - Access token
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function testAuthJsonRequest<T = unknown>(
  app: Elysia,
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<{ status: number; body: T }> {
  const response = await testAuthRequest(app, path, token, options);
  const body = (await response.json()) as T;
  return { status: response.status, body };
}
