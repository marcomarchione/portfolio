/**
 * Error Types Tests
 *
 * Tests for API error classes including new media-related errors:
 * PayloadTooLargeError (413) and UnsupportedMediaTypeError (415)
 */
import { describe, test, expect } from 'bun:test';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  InternalError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  isApiError,
  ERROR_CODES,
} from './errors';

describe('Error Types', () => {
  test('PayloadTooLargeError returns 413 status code', () => {
    const error = new PayloadTooLargeError('File size exceeds 10MB limit');

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(PayloadTooLargeError);
    expect(error.statusCode).toBe(413);
    expect(error.code).toBe(ERROR_CODES.PAYLOAD_TOO_LARGE);
    expect(error.message).toBe('File size exceeds 10MB limit');
    expect(error.name).toBe('PayloadTooLargeError');
    expect(isApiError(error)).toBe(true);
  });

  test('UnsupportedMediaTypeError returns 415 status code', () => {
    const error = new UnsupportedMediaTypeError('File type application/x-msdownload is not supported');

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(UnsupportedMediaTypeError);
    expect(error.statusCode).toBe(415);
    expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE);
    expect(error.message).toBe('File type application/x-msdownload is not supported');
    expect(error.name).toBe('UnsupportedMediaTypeError');
    expect(isApiError(error)).toBe(true);
  });

  test('PayloadTooLargeError accepts optional details', () => {
    const details = {
      maxSize: 10485760,
      receivedSize: 15728640,
      mimeType: 'image/png',
    };
    const error = new PayloadTooLargeError('File too large', details);

    expect(error.details).toEqual(details);
    expect(error.details?.maxSize).toBe(10485760);
    expect(error.details?.receivedSize).toBe(15728640);
  });

  test('UnsupportedMediaTypeError accepts optional details', () => {
    const details = {
      receivedType: 'application/octet-stream',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'],
    };
    const error = new UnsupportedMediaTypeError('Unsupported file type', details);

    expect(error.details).toEqual(details);
    expect(error.details?.receivedType).toBe('application/octet-stream');
    expect(Array.isArray(error.details?.allowedTypes)).toBe(true);
  });

  test('error codes include new media error codes', () => {
    expect(ERROR_CODES.PAYLOAD_TOO_LARGE).toBe('PAYLOAD_TOO_LARGE');
    expect(ERROR_CODES.UNSUPPORTED_MEDIA_TYPE).toBe('UNSUPPORTED_MEDIA_TYPE');
  });
});
