/**
 * Admin Content List API Tests
 *
 * Tests for search and sorting functionality in content list endpoints.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  type AuthTestApp,
} from '../../test-utils';
import { seedProject, seedMaterial, seedNews } from '../../db/test-utils';

describe('Admin Content List API Extensions', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('GET /api/v1/admin/projects search functionality', () => {
    test('filters projects by Italian title search term', async () => {
      // Seed test data
      await seedProject(testApp.db, {
        slug: 'project-react',
        status: 'published',
        translations: [{ lang: 'it', title: 'Progetto React Native' }],
      });
      await seedProject(testApp.db, {
        slug: 'project-vue',
        status: 'published',
        translations: [{ lang: 'it', title: 'Progetto Vue.js' }],
      });
      await seedProject(testApp.db, {
        slug: 'project-angular',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Applicazione Angular' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/admin/projects?search=React', accessToken);

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('project-react');
    });

    test('returns empty list when no matches found', async () => {
      await seedProject(testApp.db, {
        slug: 'project-test',
        status: 'published',
        translations: [{ lang: 'it', title: 'Progetto Test' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/admin/projects?search=NonExistent', accessToken);

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(0);
      expect(body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/admin/projects sorting functionality', () => {
    test('sorts projects by createdAt ascending', async () => {
      await seedProject(testApp.db, {
        slug: 'project-first',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Primo Progetto' }],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedProject(testApp.db, {
        slug: 'project-second',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Secondo Progetto' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
      }>(testApp.app, '/api/v1/admin/projects?sortBy=createdAt&sortOrder=asc', accessToken);

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      expect(body.data[0].slug).toBe('project-first');
      expect(body.data[1].slug).toBe('project-second');
    });

    test('sorts projects by updatedAt descending (default)', async () => {
      await seedProject(testApp.db, {
        slug: 'project-old',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Progetto Vecchio' }],
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedProject(testApp.db, {
        slug: 'project-new',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Progetto Nuovo' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
      }>(testApp.app, '/api/v1/admin/projects', accessToken);

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      // Most recent first (descending)
      expect(body.data[0].slug).toBe('project-new');
      expect(body.data[1].slug).toBe('project-old');
    });
  });

  describe('GET /api/v1/admin/materials search and sort', () => {
    test('filters materials by Italian title and sorts by createdAt', async () => {
      await seedMaterial(testApp.db, {
        slug: 'guide-react',
        category: 'guide',
        downloadUrl: 'https://example.com/react-guide.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Guida React' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'template-vue',
        category: 'template',
        downloadUrl: 'https://example.com/vue-template.zip',
        status: 'published',
        translations: [{ lang: 'it', title: 'Template Vue' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/admin/materials?search=Guida', accessToken);

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('guide-react');
    });
  });

  describe('GET /api/v1/admin/news search and sort', () => {
    test('filters news by Italian title search term', async () => {
      await seedNews(testApp.db, {
        slug: 'news-ai',
        status: 'published',
        translations: [{ lang: 'it', title: 'Intelligenza Artificiale nel 2024' }],
      });
      await seedNews(testApp.db, {
        slug: 'news-web',
        status: 'published',
        translations: [{ lang: 'it', title: 'Sviluppo Web Moderno' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/admin/news?search=Artificiale', accessToken);

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('news-ai');
    });
  });
});
