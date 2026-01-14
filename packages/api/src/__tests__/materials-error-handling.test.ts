/**
 * Materials API Error Handling Tests
 *
 * Tests for error scenarios and edge cases in materials API endpoints.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createTestApp } from '../test-utils';
import type { DrizzleDB } from '../db';

let testApp: ReturnType<typeof createTestApp>;
let db: DrizzleDB;

beforeAll(() => {
  testApp = createTestApp();
  db = testApp.db;
});

afterAll(() => {
  testApp.cleanup();
});

describe('GET /api/v1/materials - Error Handling', () => {
  test('should return empty array when no materials match search', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&search=nonexistentmaterial123456')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
    expect(data.data.length).toBe(0);
    expect(data.pagination.total).toBe(0);
  });

  test('should return empty array when no materials match category', async () => {
    // Use a valid category but expect no results
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&category=tool&search=impossiblesearchterm999')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
    expect(data.data.length).toBe(0);
    expect(data.pagination.total).toBe(0);
  });

  test('should reject invalid sortBy parameter with validation error', async () => {
    try {
      const response = await testApp.app.handle(
        new Request('http://localhost/api/v1/materials?lang=it&sortBy=invalid')
      );

      // API validates and rejects invalid sortBy values
      expect([400, 422]).toContain(response.status);
    } catch (error: any) {
      // Elysia may throw validation error
      expect(error.code).toBe('VALIDATION');
      expect(error.status).toBe(422);
    }
  });

  test('should handle missing lang parameter with default', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials')
    );

    // Should use default language or return error
    expect([200, 400, 422]).toContain(response.status);
  });

  test('should reject negative limit values', async () => {
    try {
      const response = await testApp.app.handle(
        new Request('http://localhost/api/v1/materials?lang=it&limit=-5')
      );

      // API should validate and reject negative limits
      expect([400, 422]).toContain(response.status);
    } catch (error: any) {
      // May throw validation error
      expect([400, 422]).toContain(error.status);
    }
  });

  test('should reject extremely large limit values', async () => {
    try {
      const response = await testApp.app.handle(
        new Request('http://localhost/api/v1/materials?lang=it&limit=999999')
      );

      // API validates limit maximum (100)
      expect([400, 422]).toContain(response.status);
    } catch (error: any) {
      // May throw validation error
      expect([400, 422]).toContain(error.status);
    }
  });

  test('should handle offset without errors', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&offset=100')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.offset).toBe(100);
  });
});

describe('GET /api/v1/materials/:slug - Error Handling', () => {
  test('should return 404 for nonexistent material slug', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials/nonexistent-slug-12345?lang=it')
    );

    expect(response.status).toBe(404);
  });

  test('should handle materials with missing translations', async () => {
    const { createMaterial, upsertTranslation } = await import('../db/queries');

    // Create material with only Italian translation
    const material = await createMaterial(db, {
      slug: `test-no-de-translation-${Date.now()}`,
      category: 'guide',
      downloadUrl: 'https://example.com/test.pdf',
      status: 'published',
    });

    await upsertTranslation(db, material.id, 'it', {
      title: 'Materiale di test',
      description: 'Solo in italiano',
    });

    // Request in German should return 404 or handle gracefully
    const response = await testApp.app.handle(
      new Request(`http://localhost/api/v1/materials/${material.slug}?lang=de`)
    );

    // Should either return 404 or fallback to another language
    expect([200, 404]).toContain(response.status);
  });
});
