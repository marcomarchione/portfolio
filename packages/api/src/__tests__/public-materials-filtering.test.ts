/**
 * Public Materials Filtering Tests
 *
 * Tests for materials API endpoints with search, sort, and category filters.
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

// Generate unique slugs to avoid duplicate key errors
const uniqueSlug = (base: string) => `${base}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

describe('GET /api/v1/materials - Filtering and Sorting', () => {
  test('should filter materials by search query (title)', async () => {
    // Seed test data with specific titles
    const { createMaterial, upsertTranslation } = await import('../db/queries');

    const material1 = await createMaterial(db, {
      slug: uniqueSlug('test-guide-typescript'),
      category: 'guide',
      downloadUrl: 'https://example.com/guide.pdf',
      fileSize: 1024000,
      status: 'published',
    });

    const material2 = await createMaterial(db, {
      slug: uniqueSlug('test-template-react'),
      category: 'template',
      downloadUrl: 'https://example.com/template.pdf',
      fileSize: 2048000,
      status: 'published',
    });

    await upsertTranslation(db, material1.id, 'it', {
      title: 'Guida completa a TypeScript',
      description: 'Una guida per imparare TypeScript',
    });

    await upsertTranslation(db, material2.id, 'it', {
      title: 'Template React moderno',
      description: 'Un template per progetti React',
    });

    // Search by title
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&search=TypeScript')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data.some((m: any) => m.translation?.title.includes('TypeScript'))).toBe(true);
  });

  test('should filter materials by search query (description)', async () => {
    const { createMaterial, upsertTranslation } = await import('../db/queries');

    const material = await createMaterial(db, {
      slug: uniqueSlug('test-resource-vue'),
      category: 'resource',
      downloadUrl: 'https://example.com/resource.pdf',
      fileSize: 512000,
      status: 'published',
    });

    await upsertTranslation(db, material.id, 'it', {
      title: 'Risorse Vue.js',
      description: 'Documentazione e risorse per Vue framework',
    });

    // Search by description
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&search=framework')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data.some((m: any) => m.translation?.description?.includes('framework'))).toBe(true);
  });

  test('should sort materials by newest first (default)', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();

    // Verify descending order by checking timestamps
    if (data.data.length > 1) {
      const first = new Date(data.data[0].updatedAt).getTime();
      const second = new Date(data.data[1].updatedAt).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  test('should sort materials by oldest first', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&sortBy=oldest')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();

    // Verify ascending order
    if (data.data.length > 1) {
      const first = new Date(data.data[0].updatedAt).getTime();
      const second = new Date(data.data[1].updatedAt).getTime();
      expect(first).toBeLessThanOrEqual(second);
    }
  });

  test('should sort materials by title alphabetically', async () => {
    const { createMaterial, upsertTranslation } = await import('../db/queries');

    const material1 = await createMaterial(db, {
      slug: uniqueSlug('alpha-material'),
      category: 'guide',
      downloadUrl: 'https://example.com/alpha.pdf',
      status: 'published',
    });

    const material2 = await createMaterial(db, {
      slug: uniqueSlug('zeta-material'),
      category: 'guide',
      downloadUrl: 'https://example.com/zeta.pdf',
      status: 'published',
    });

    await upsertTranslation(db, material1.id, 'it', {
      title: 'Alpha Guide',
      description: 'First alphabetically',
    });

    await upsertTranslation(db, material2.id, 'it', {
      title: 'Zeta Guide',
      description: 'Last alphabetically',
    });

    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&sortBy=title')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();

    // Verify alphabetical order
    if (data.data.length > 1) {
      const titles = data.data.map((m: any) => m.translation?.title).filter(Boolean);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    }
  });

  test('should combine category, search, and sort filters', async () => {
    const { createMaterial, upsertTranslation } = await import('../db/queries');

    const material = await createMaterial(db, {
      slug: uniqueSlug('combo-test-guide'),
      category: 'guide',
      downloadUrl: 'https://example.com/combo.pdf',
      status: 'published',
    });

    await upsertTranslation(db, material.id, 'it', {
      title: 'Guida Combinata Test',
      description: 'Testing combined filters',
    });

    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&category=guide&search=Combinata&sortBy=title')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeArray();
    expect(data.data.some((m: any) =>
      m.category === 'guide' && m.translation?.title?.includes('Combinata')
    )).toBe(true);
  });

  test('should return correct pagination count with filters', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/materials?lang=it&category=guide&limit=5&offset=0')
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBeNumber();
    expect(data.pagination.limit).toBe(5);
    expect(data.pagination.offset).toBe(0);
    expect(data.pagination.hasMore).toBeBoolean();
  });
});
