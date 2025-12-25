/**
 * API Response Types
 *
 * Shared API response structures used by both backend and frontend.
 */

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
  error: string;
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
 * Type guard to check if a response is an API error.
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    'message' in response &&
    'timestamp' in response &&
    'path' in response
  );
}
