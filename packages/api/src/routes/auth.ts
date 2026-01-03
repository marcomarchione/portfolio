/**
 * Authentication Routes
 *
 * Provides login, token refresh, and logout endpoints.
 * Uses JWT tokens for stateless authentication.
 */
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { config } from '../config';
import { UnauthorizedError } from '../types/errors';
import { createResponse } from '../types/responses';
import {
  LoginRequestSchema,
  LoginApiResponseSchema,
  RefreshRequestSchema,
  RefreshApiResponseSchema,
  LogoutApiResponseSchema,
} from '../auth/schemas';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY_SECONDS,
  type JwtContext,
} from '../auth/jwt';

/**
 * Authentication routes plugin.
 * Provides /auth/login, /auth/refresh, and /auth/logout endpoints.
 */
export const authRoutes: any = new Elysia({ name: 'auth-routes', prefix: '/auth' })
  .use(
    jwt({
      name: 'jwt',
      secret: config.JWT_SECRET,
    })
  )
  .post(
    '/login',
    async ({ body, jwt: jwtPlugin }) => {
      const { username, password } = body;

      // Verify username is "admin" (single-user system)
      if (username !== 'admin') {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Verify password against stored hash using Bun.password.verify
      const isValid = await Bun.password.verify(password, config.ADMIN_PASSWORD_HASH);

      if (!isValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate token pair
      const jwtContext: JwtContext = { jwt: jwtPlugin as unknown as JwtContext['jwt'] };
      const accessToken = await generateAccessToken(jwtContext);
      const refreshToken = await generateRefreshToken(jwtContext);

      return createResponse({
        accessToken,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      });
    },
    {
      body: LoginRequestSchema,
      response: LoginApiResponseSchema,
      detail: {
        tags: ['auth'],
        summary: 'Login with admin credentials',
        description: 'Authenticates the admin user and returns JWT tokens.',
      },
    }
  )
  .post(
    '/refresh',
    async ({ body, jwt: jwtPlugin }) => {
      const { refreshToken: token } = body;

      // Verify refresh token
      const jwtContext: JwtContext = { jwt: jwtPlugin as unknown as JwtContext['jwt'] };
      const payload = await verifyRefreshToken(jwtContext, token);

      if (!payload) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = await generateAccessToken(jwtContext);

      return createResponse({
        accessToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      });
    },
    {
      body: RefreshRequestSchema,
      response: RefreshApiResponseSchema,
      detail: {
        tags: ['auth'],
        summary: 'Refresh access token',
        description: 'Exchanges a valid refresh token for a new access token.',
      },
    }
  )
  .post(
    '/logout',
    () => {
      // Client-side logout only - just return success
      return createResponse({
        message: 'Logged out successfully',
      });
    },
    {
      response: LogoutApiResponseSchema,
      detail: {
        tags: ['auth'],
        summary: 'Logout',
        description: 'Logs out the user. Client should discard tokens.',
      },
    }
  );

/**
 * Creates auth routes with custom configuration.
 * Useful for testing with different secrets and password hashes.
 *
 * @param secret - JWT secret
 * @param passwordHash - Admin password hash
 * @returns Configured auth routes
 */
export function createAuthRoutes(secret: string, passwordHash: string): any {
  return new Elysia({ name: 'auth-routes', prefix: '/auth' })
    .use(
      jwt({
        name: 'jwt',
        secret,
      })
    )
    .post(
      '/login',
      async ({ body, jwt: jwtPlugin }) => {
        const { username, password } = body;

        if (username !== 'admin') {
          throw new UnauthorizedError('Invalid credentials');
        }

        const isValid = await Bun.password.verify(password, passwordHash);

        if (!isValid) {
          throw new UnauthorizedError('Invalid credentials');
        }

        const jwtContext: JwtContext = { jwt: jwtPlugin as unknown as JwtContext['jwt'] };
        const accessToken = await generateAccessToken(jwtContext);
        const refreshToken = await generateRefreshToken(jwtContext);

        return createResponse({
          accessToken,
          refreshToken,
          expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        });
      },
      {
        body: LoginRequestSchema,
        response: LoginApiResponseSchema,
        detail: {
          tags: ['auth'],
          summary: 'Login with admin credentials',
          description: 'Authenticates the admin user and returns JWT tokens.',
        },
      }
    )
    .post(
      '/refresh',
      async ({ body, jwt: jwtPlugin }) => {
        const { refreshToken: token } = body;

        const jwtContext: JwtContext = { jwt: jwtPlugin as unknown as JwtContext['jwt'] };
        const payload = await verifyRefreshToken(jwtContext, token);

        if (!payload) {
          throw new UnauthorizedError('Invalid or expired refresh token');
        }

        const accessToken = await generateAccessToken(jwtContext);

        return createResponse({
          accessToken,
          expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
        });
      },
      {
        body: RefreshRequestSchema,
        response: RefreshApiResponseSchema,
        detail: {
          tags: ['auth'],
          summary: 'Refresh access token',
          description: 'Exchanges a valid refresh token for a new access token.',
        },
      }
    )
    .post(
      '/logout',
      () => {
        return createResponse({
          message: 'Logged out successfully',
        });
      },
      {
        response: LogoutApiResponseSchema,
        detail: {
          tags: ['auth'],
          summary: 'Logout',
          description: 'Logs out the user. Client should discard tokens.',
        },
      }
    );
}
