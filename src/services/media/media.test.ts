/**
 * Media Services Tests
 *
 * Tests for file validation utilities, storage key generation,
 * and image processing service.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { mkdir, rm, writeFile, readFile, exists } from 'fs/promises';
import { join } from 'path';
import {
  validateFileType,
  validateFileSize,
  isRasterImage,
  ALLOWED_MIME_TYPES,
} from './validation';
import {
  generateStorageKey,
  getVariantKey,
  getPublicUrl,
  getFilePath,
} from './storage';

describe('File Validation Utilities', () => {
  test('validateFileType accepts valid image types', () => {
    expect(validateFileType('image/jpeg')).toBe(true);
    expect(validateFileType('image/png')).toBe(true);
    expect(validateFileType('image/webp')).toBe(true);
    expect(validateFileType('image/gif')).toBe(true);
    expect(validateFileType('image/svg+xml')).toBe(true);
  });

  test('validateFileType accepts PDF documents', () => {
    expect(validateFileType('application/pdf')).toBe(true);
  });

  test('validateFileType rejects unsupported types', () => {
    expect(validateFileType('application/octet-stream')).toBe(false);
    expect(validateFileType('application/x-msdownload')).toBe(false);
    expect(validateFileType('text/html')).toBe(false);
    expect(validateFileType('application/javascript')).toBe(false);
    expect(validateFileType('video/mp4')).toBe(false);
    expect(validateFileType('')).toBe(false);
  });

  test('validateFileSize accepts files within limit for images (10MB)', () => {
    const tenMB = 10 * 1024 * 1024;
    expect(validateFileSize('image/jpeg', tenMB)).toBe(true);
    expect(validateFileSize('image/png', tenMB - 1)).toBe(true);
    expect(validateFileSize('image/webp', 1024)).toBe(true);
  });

  test('validateFileSize accepts files within limit for PDF (25MB)', () => {
    const twentyFiveMB = 25 * 1024 * 1024;
    expect(validateFileSize('application/pdf', twentyFiveMB)).toBe(true);
    expect(validateFileSize('application/pdf', twentyFiveMB - 1)).toBe(true);
    expect(validateFileSize('application/pdf', 1024)).toBe(true);
  });

  test('validateFileSize rejects files exceeding limit', () => {
    const tenMB = 10 * 1024 * 1024;
    const twentyFiveMB = 25 * 1024 * 1024;

    expect(validateFileSize('image/jpeg', tenMB + 1)).toBe(false);
    expect(validateFileSize('image/png', 15 * 1024 * 1024)).toBe(false);
    expect(validateFileSize('application/pdf', twentyFiveMB + 1)).toBe(false);
    expect(validateFileSize('application/pdf', 30 * 1024 * 1024)).toBe(false);
  });

  test('isRasterImage correctly identifies raster images', () => {
    expect(isRasterImage('image/jpeg')).toBe(true);
    expect(isRasterImage('image/png')).toBe(true);
    expect(isRasterImage('image/webp')).toBe(true);
    expect(isRasterImage('image/gif')).toBe(true);
  });

  test('isRasterImage returns false for SVG and PDF', () => {
    expect(isRasterImage('image/svg+xml')).toBe(false);
    expect(isRasterImage('application/pdf')).toBe(false);
  });
});

describe('Storage Key Generation', () => {
  test('generateStorageKey returns correct format', () => {
    const key = generateStorageKey('test-image.jpg');
    const parts = key.split('/');

    expect(parts).toHaveLength(3);
    // Year (4 digits)
    expect(parts[0]).toMatch(/^\d{4}$/);
    // Month (2 digits)
    expect(parts[1]).toMatch(/^\d{2}$/);
    // UUID-filename
    expect(parts[2]).toMatch(/^[a-f0-9-]+-test-image\.jpg$/);
  });

  test('generateStorageKey sanitizes filename', () => {
    const key = generateStorageKey('My Photo (1).jpg');
    const parts = key.split('/');
    const filename = parts[2];

    // Should not contain spaces or parentheses
    expect(filename).not.toContain(' ');
    expect(filename).not.toContain('(');
    expect(filename).not.toContain(')');
    expect(filename).toContain('.jpg');
  });

  test('generateStorageKey generates unique keys for same filename', () => {
    const key1 = generateStorageKey('photo.jpg');
    const key2 = generateStorageKey('photo.jpg');

    expect(key1).not.toBe(key2);
  });

  test('getVariantKey generates correct variant paths', () => {
    const storageKey = '2025/01/abc123-photo.jpg';

    expect(getVariantKey(storageKey, 'thumb')).toBe('2025/01/abc123-photo-thumb.webp');
    expect(getVariantKey(storageKey, 'medium')).toBe('2025/01/abc123-photo-medium.webp');
    expect(getVariantKey(storageKey, 'large')).toBe('2025/01/abc123-photo-large.webp');
  });

  test('getPublicUrl returns correct URL path', () => {
    const storageKey = '2025/01/abc123-photo.jpg';
    expect(getPublicUrl(storageKey)).toBe('/media/2025/01/abc123-photo.jpg');
  });

  test('getFilePath returns absolute filesystem path', () => {
    const storageKey = '2025/01/abc123-photo.jpg';
    const uploadsPath = '/var/uploads';

    expect(getFilePath(uploadsPath, storageKey)).toBe('/var/uploads/2025/01/abc123-photo.jpg');
  });
});
