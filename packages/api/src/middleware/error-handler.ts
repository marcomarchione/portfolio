/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns structured JSON responses.
 * Maps custom ApiError classes to appropriate HTTP status codes.
 */
import { Elysia } from 'elysia';
import { ApiError, isApiError, ERROR_CODES } from '../types/errors';
import { createErrorResponse, type ApiErrorResponse } from '../types/responses';

/**
 * Error handler plugin for Elysia.
 * Provides global error handling with structured responses.
 * Uses { as: 'global' } to ensure errors are caught at the app level.
 */
export const errorHandler = new Elysia({ name: 'error-handler' }).onError(
  { as: 'global' },
  ({ error, path, set }): ApiErrorResponse => {
    // Log error for debugging
    console.error(`[ERROR] ${path}:`, error);

    // Handle custom API errors
    if (isApiError(error)) {
      set.status = error.statusCode;
      return createErrorResponse(error.code, error.message, path, error.details);
    }

    // Handle Elysia validation errors (from TypeBox)
    // Elysia validation errors have code: 'VALIDATION' and status 422
    const errorWithCode = error as { code?: string; status?: number; all?: unknown[]; errors?: unknown[] };
    if (errorWithCode.code === 'VALIDATION') {
      set.status = 400; // Convert 422 to 400 for consistency

      // Extract validation details from Elysia's error format
      const details: Record<string, unknown> = {};

      // Elysia may use 'all' or 'errors' for validation error details
      const validationErrors = errorWithCode.all || errorWithCode.errors;
      if (Array.isArray(validationErrors)) {
        details.errors = validationErrors.map((err: unknown) => {
          const e = err as { path?: string; message?: string; summary?: string };
          return {
            path: e.path || 'unknown',
            message: e.message || e.summary || 'Validation failed',
          };
        });
      }

      return createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        (error instanceof Error ? error.message : null) || 'Request validation failed',
        path,
        Object.keys(details).length > 0 ? details : null
      );
    }

    // Handle NotFound from Elysia (route not found)
    if (errorWithCode.code === 'NOT_FOUND') {
      set.status = 404;
      return createErrorResponse(ERROR_CODES.NOT_FOUND, `Route ${path} not found`, path, null);
    }

    // Handle all other errors as internal server errors
    set.status = 500;

    // Include detailed error message (per requirements: always detailed)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message, path, {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
);
