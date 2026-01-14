/**
 * Public Materials API Tests
 *
 * Tests for search, sorting, and filtering functionality in public materials endpoint.
 */
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'bun:test';
import {
  createTestApp,
  testJsonRequest,
  type TestApp,
} from '../test-utils';
import { seedMaterial } from '../db/test-utils';

describe('Public Materials API - Search and Sort', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = createTestApp();
  });

  beforeEach(async () => {
    await testApp.reset();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  describe('GET /api/v1/materials - search parameter', () => {
    test('filters materials by title search term', async () => {
      // Seed test data with Italian translations
      await seedMaterial(testApp.db, {
        slug: 'react-guide',
        category: 'guide',
        downloadUrl: 'https://example.com/react-guide.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Guida React Completa', description: 'Una guida completa per React' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'vue-template',
        category: 'template',
        downloadUrl: 'https://example.com/vue-template.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'Template Vue.js', description: 'Template per progetti Vue' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'angular-resource',
        category: 'resource',
        downloadUrl: 'https://example.com/angular.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Risorse Angular', description: 'Risorse utili per Angular' }],
      });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; translation: { title: string } }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/materials?search=React');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('react-guide');
    });

    test('filters materials by description search term', async () => {
      await seedMaterial(testApp.db, {
        slug: 'typescript-guide',
        category: 'guide',
        downloadUrl: 'https://example.com/ts-guide.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Guida TypeScript', description: 'Impara TypeScript da zero con esempi pratici' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'nodejs-template',
        category: 'template',
        downloadUrl: 'https://example.com/node-template.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'Template Node.js', description: 'Template base per server Node' }],
      });

      // Verify data was inserted by fetching all materials first
      const { body: allMaterials } = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/materials');
      expect(allMaterials.pagination.total).toBe(2);

      // Search for a term only in description
      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/materials?search=esempi');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('typescript-guide');
    });
  });

  describe('GET /api/v1/materials - sortBy parameter', () => {
    test('sorts materials by newest (createdAt desc)', async () => {
      await seedMaterial(testApp.db, {
        slug: 'old-material',
        category: 'guide',
        downloadUrl: 'https://example.com/old.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Materiale Vecchio' }],
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedMaterial(testApp.db, {
        slug: 'new-material',
        category: 'guide',
        downloadUrl: 'https://example.com/new.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Materiale Nuovo' }],
      });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string }>;
      }>(testApp.app, '/api/v1/materials?sortBy=newest');

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.data[0].slug).toBe('new-material');
      expect(body.data[1].slug).toBe('old-material');
    });

    test('sorts materials by oldest (createdAt asc)', async () => {
      await seedMaterial(testApp.db, {
        slug: 'first-material',
        category: 'resource',
        downloadUrl: 'https://example.com/first.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Primo Materiale' }],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedMaterial(testApp.db, {
        slug: 'second-material',
        category: 'resource',
        downloadUrl: 'https://example.com/second.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Secondo Materiale' }],
      });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string }>;
      }>(testApp.app, '/api/v1/materials?sortBy=oldest');

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.data[0].slug).toBe('first-material');
      expect(body.data[1].slug).toBe('second-material');
    });

    test('sorts materials by title alphabetically', async () => {
      await seedMaterial(testApp.db, {
        slug: 'zebra-material',
        category: 'tool',
        downloadUrl: 'https://example.com/zebra.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'Zebra Tools' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'apple-material',
        category: 'tool',
        downloadUrl: 'https://example.com/apple.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'Apple Utilities' }],
      });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; translation: { title: string } }>;
      }>(testApp.app, '/api/v1/materials?sortBy=title');

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.data[0].slug).toBe('apple-material');
      expect(body.data[1].slug).toBe('zebra-material');
    });
  });

  describe('GET /api/v1/materials - combined filters', () => {
    test('combines category, search, and sort parameters', async () => {
      // Seed multiple materials with different categories
      await seedMaterial(testApp.db, {
        slug: 'react-guide-1',
        category: 'guide',
        downloadUrl: 'https://example.com/react1.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Prima Guida React', description: 'Introduzione a React' }],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedMaterial(testApp.db, {
        slug: 'react-guide-2',
        category: 'guide',
        downloadUrl: 'https://example.com/react2.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Seconda Guida React', description: 'React avanzato' }],
      });

      await seedMaterial(testApp.db, {
        slug: 'react-template',
        category: 'template',
        downloadUrl: 'https://example.com/react-template.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'React Template', description: 'Template React' }],
      });

      // Filter by category=guide, search=React, sortBy=oldest
      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; category: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/materials?category=guide&search=React&sortBy=oldest');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(2);
      expect(body.data.length).toBe(2);
      // All should be guides
      expect(body.data.every((m) => m.category === 'guide')).toBe(true);
      // Should be sorted oldest first
      expect(body.data[0].slug).toBe('react-guide-1');
      expect(body.data[1].slug).toBe('react-guide-2');
    });

    test('pagination with filters returns correct total count', async () => {
      // Seed 5 guide materials with "React" in title
      for (let i = 1; i <= 5; i++) {
        await seedMaterial(testApp.db, {
          slug: `react-guide-${i}`,
          category: 'guide',
          downloadUrl: `https://example.com/react${i}.pdf`,
          status: 'published',
          translations: [{ lang: 'it', title: `Guida React ${i}` }],
        });
      }

      // Seed 3 template materials (different category)
      for (let i = 1; i <= 3; i++) {
        await seedMaterial(testApp.db, {
          slug: `vue-template-${i}`,
          category: 'template',
          downloadUrl: `https://example.com/vue${i}.zip`,
          status: 'published',
          translations: [{ lang: 'it', title: `Template Vue ${i}` }],
        });
      }

      // Request page 1 with limit 2, filter by search=React
      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number; limit: number; offset: number; hasMore: boolean };
      }>(testApp.app, '/api/v1/materials?search=React&limit=2&offset=0');

      expect(status).toBe(200);
      // Total should reflect all matching materials (5 with React), not just the page
      expect(body.pagination.total).toBe(5);
      expect(body.pagination.limit).toBe(2);
      expect(body.pagination.offset).toBe(0);
      expect(body.pagination.hasMore).toBe(true);
      expect(body.data.length).toBe(2);
    });
  });
});
