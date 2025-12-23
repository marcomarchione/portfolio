/**
 * Authentication Middleware
 *
 * Protects routes by requiring valid JWT access tokens.
 * Extracts Bearer token from Authorization header and verifies it.
 */
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { UnauthorizedError } from '../types/errors';
import { config } from '../config';
import type { TokenPayload } from '../auth/jwt';

/**
 * Extracts Bearer token from Authorization header.
 *
 * @param authorization - Authorization header value
 * @returns Token string or null if not found
 */
function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) {
    return null;
  }

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Admin context injected by auth middleware.
 */
export interface AdminContext {
  admin: {
    sub: string;
  };
}

/**
 * Authentication guard function.
 * Verifies the token and returns admin context.
 *
 * @param request - HTTP request
 * @param jwtVerify - JWT verify function
 * @returns Admin context
 * @throws UnauthorizedError if token is invalid
 */
async function authGuard(
  request: Request,
  jwtVerify: (token: string) => Promise<unknown | false>
): Promise<AdminContext> {
  const authorization = request.headers.get('authorization');
  const token = extractBearerToken(authorization);

  if (!token) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const payload = await jwtVerify(token);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  // Verify token type is access
  const tokenPayload = payload as unknown as TokenPayload;
  if (tokenPayload.type !== 'access') {
    throw new UnauthorizedError('Invalid token type');
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (tokenPayload.exp < now) {
    throw new UnauthorizedError('Token has expired');
  }

  return {
    admin: {
      sub: tokenPayload.sub,
    },
  };
}

/**
 * Authentication middleware plugin for Elysia.
 * Verifies JWT access tokens and protects routes.
 *
 * Usage:
 * ```typescript
 * const app = new Elysia()
 *   .use(authMiddleware)
 *   .get('/protected', ({ admin }) => `Hello ${admin.sub}`);
 * ```
 */
export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.JWT_SECRET,
    })
  )
  .derive({ as: 'scoped' }, async ({ request, jwt: jwtPlugin }) => {
    return authGuard(request, jwtPlugin.verify);
  });

/**
 * Creates an authentication middleware with custom configuration.
 * Useful for testing with different secrets.
 *
 * @param secret - JWT secret to use
 * @returns Configured auth middleware
 */
export function createAuthMiddleware(secret: string) {
  return new Elysia({ name: 'auth-middleware' })
    .use(
      jwt({
        name: 'jwt',
        secret,
      })
    )
    .derive({ as: 'scoped' }, async ({ request, jwt: jwtPlugin }) => {
      return authGuard(request, jwtPlugin.verify);
    });
}
