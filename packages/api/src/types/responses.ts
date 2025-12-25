/**
 * Standard API Response Types
 *
 * Defines consistent response structures for all API endpoints.
 */
import type { ErrorCode } from './errors';

/**
 * Generic successful API response wrapper.
 * Used for single-item responses.
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Optional metadata */
  meta?: Record<string, unknown>;
}

/**
 * Structured error response format.
 * All error responses follow this structure.
 */
export interface ApiErrorResponse {
  /** Error type/code for programmatic handling */
  error: ErrorCode | string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (validation errors, context) */
  details?: Record<string, unknown> | null;
  /** ISO-8601 timestamp of when the error occurred */
  timestamp: string;
  /** Request path that caused the error */
  path: string;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  /** Total number of items */
  total: number;
  /** Current page offset */
  offset: number;
  /** Items per page */
  limit: number;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Paginated response wrapper for list endpoints.
 * Includes pagination metadata.
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Health check response type.
 */
export interface HealthResponse {
  /** Health status */
  status: 'ok' | 'degraded' | 'error';
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Optional database connectivity status */
  database?: {
    connected: boolean;
    error?: string;
  };
}

/**
 * Creates a successful API response with data.
 *
 * @param data - Response data
 * @param meta - Optional metadata
 * @returns Formatted API response
 */
export function createResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return meta ? { data, meta } : { data };
}

/**
 * Creates a paginated API response.
 *
 * @param data - Array of items
 * @param total - Total number of items
 * @param offset - Current offset
 * @param limit - Items per page
 * @returns Formatted paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  offset: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      total,
      offset,
      limit,
      hasMore: offset + data.length < total,
    },
  };
}

/**
 * Creates an error response object.
 *
 * @param error - Error code
 * @param message - Human-readable message
 * @param path - Request path
 * @param details - Additional details
 * @returns Formatted error response
 */
export function createErrorResponse(
  error: ErrorCode | string,
  message: string,
  path: string,
  details?: Record<string, unknown> | null
): ApiErrorResponse {
  return {
    error,
    message,
    details: details ?? null,
    timestamp: new Date().toISOString(),
    path,
  };
}
