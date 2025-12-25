/**
 * API Error Classes
 *
 * Base error classes for structured API error handling.
 * All custom errors extend ApiError for consistent error responses.
 */

/** Error type codes for API responses */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Base API Error class.
 * All custom API errors should extend this class.
 */
export class ApiError extends Error {
  /** HTTP status code */
  readonly statusCode: number;
  /** Error type code for programmatic handling */
  readonly code: ErrorCode;
  /** Additional error details */
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for debugging
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Validation Error (400 Bad Request)
 * Thrown when request validation fails.
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found Error (404 Not Found)
 * Thrown when a requested resource does not exist.
 */
export class NotFoundError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 404, ERROR_CODES.NOT_FOUND, details);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized Error (401 Unauthorized)
 * Thrown when authentication is required but not provided or invalid.
 * Foundation for spec #3 Authentication System.
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 401, ERROR_CODES.UNAUTHORIZED, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Internal Error (500 Internal Server Error)
 * Thrown for unexpected server errors.
 */
export class InternalError extends ApiError {
  constructor(message: string = 'An unexpected error occurred', details?: Record<string, unknown>) {
    super(message, 500, ERROR_CODES.INTERNAL_ERROR, details);
    this.name = 'InternalError';
  }
}

/**
 * Payload Too Large Error (413 Payload Too Large)
 * Thrown when uploaded file exceeds size limit.
 * Used for file upload validation in media endpoints.
 */
export class PayloadTooLargeError extends ApiError {
  constructor(message: string = 'File size exceeds limit', details?: Record<string, unknown>) {
    super(message, 413, ERROR_CODES.PAYLOAD_TOO_LARGE, details);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Unsupported Media Type Error (415 Unsupported Media Type)
 * Thrown when uploaded file type is not allowed.
 * Used for file type validation in media endpoints.
 */
export class UnsupportedMediaTypeError extends ApiError {
  constructor(message: string = 'File type not supported', details?: Record<string, unknown>) {
    super(message, 415, ERROR_CODES.UNSUPPORTED_MEDIA_TYPE, details);
    this.name = 'UnsupportedMediaTypeError';
  }
}

/**
 * Type guard to check if an error is an ApiError.
 *
 * @param error - Error to check
 * @returns true if error is an ApiError instance
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
