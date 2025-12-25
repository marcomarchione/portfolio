/**
 * CORS Middleware Configuration
 *
 * Configures Cross-Origin Resource Sharing for the API.
 * Allows requests from marcomarchione.it and localhost during development.
 */
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from '../config';

/**
 * Checks if an origin should be allowed.
 * Supports exact matches and localhost with any port.
 *
 * @param origin - Origin to check
 * @param allowedOrigins - List of allowed origins
 * @returns true if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  // Check exact match in allowed origins
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Allow localhost with any port for development
  const localhostRegex = /^http:\/\/localhost(:\d+)?$/;
  if (localhostRegex.test(origin)) {
    return true;
  }

  // Allow 127.0.0.1 with any port for development
  const ipRegex = /^http:\/\/127\.0\.0\.1(:\d+)?$/;
  if (ipRegex.test(origin)) {
    return true;
  }

  return false;
}

/**
 * CORS middleware plugin for Elysia.
 * Configures CORS with allowed origins, methods, and headers.
 */
export const corsMiddleware = new Elysia({ name: 'cors-middleware' }).use(
  cors({
    origin: (request): boolean => {
      const origin = request.headers.get('origin');
      if (!origin) {
        // Allow requests without origin header (e.g., same-origin)
        return true;
      }
      return isOriginAllowed(origin, config.CORS_ORIGINS);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  })
);

/**
 * Creates a CORS middleware with custom origins.
 * Useful for testing with different origin configurations.
 *
 * @param origins - Array of allowed origins
 * @returns Configured CORS middleware
 */
export function createCorsMiddleware(origins: string[]) {
  return new Elysia({ name: 'cors-middleware' }).use(
    cors({
      origin: (request): boolean => {
        const origin = request.headers.get('origin');
        if (!origin) {
          return true;
        }
        return isOriginAllowed(origin, origins);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400,
    })
  );
}
