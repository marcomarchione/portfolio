/**
 * Admin Dashboard Routes Tests
 *
 * Tests for dashboard statistics and recent items endpoints.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  testJsonRequest,
  type AuthTestApp,
} from '../../test-utils';
import { seedProject, seedMaterial, seedNews } from '../../db/test-utils';

describe('Admin Dashboard Routes', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('GET /api/v1/admin/dashboard/stats', () => {
    test('returns content statistics grouped by type and status', async () => {
      // Seed test data with various statuses
      await seedProject(testApp.db, {
        slug: 'project-draft',
        status: 'draft',
        translations: [{ lang: 'it', title: 'Progetto Bozza' }],
      });
      await seedProject(testApp.db, {
        slug: 'project-published',
        status: 'published',
        translations: [{ lang: 'it', title: 'Progetto Pubblicato' }],
      });
      await seedMaterial(testApp.db, {
        slug: 'material-published',
        category: 'guide',
        downloadUrl: 'https://example.com/file.pdf',
        status: 'published',
        translations: [{ lang: 'it', title: 'Materiale Pubblicato' }],
      });
      await seedNews(testApp.db, {
        slug: 'news-archived',
        status: 'archived',
        translations: [{ lang: 'it', title: 'News Archiviata' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: {
          projects: { total: number; draft: number; published: number; archived: number };
          materials: { total: number; draft: number; published: number; archived: number };
          news: { total: number; draft: number; published: number; archived: number };
        };
      }>(testApp.app, '/api/v1/admin/dashboard/stats', accessToken);

      expect(status).toBe(200);
      expect(body.data.projects.total).toBe(2);
      expect(body.data.projects.draft).toBe(1);
      expect(body.data.projects.published).toBe(1);
      expect(body.data.materials.total).toBe(1);
      expect(body.data.materials.published).toBe(1);
      expect(body.data.news.total).toBe(1);
      expect(body.data.news.archived).toBe(1);
    });

    test('returns zero counts when no content exists', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: {
          projects: { total: number };
          materials: { total: number };
          news: { total: number };
        };
      }>(testApp.app, '/api/v1/admin/dashboard/stats', accessToken);

      expect(status).toBe(200);
      expect(body.data.projects.total).toBe(0);
      expect(body.data.materials.total).toBe(0);
      expect(body.data.news.total).toBe(0);
    });

    test('requires authentication', async () => {
      const { status } = await testJsonRequest(testApp.app, '/api/v1/admin/dashboard/stats');
      expect(status).toBe(401);
    });
  });

  describe('GET /api/v1/admin/dashboard/recent', () => {
    test('returns recent items sorted by updatedAt descending', async () => {
      // Seed test data with different update times
      await seedProject(testApp.db, {
        slug: 'project-old',
        status: 'published',
        translations: [{ lang: 'it', title: 'Progetto Vecchio' }],
      });

      // Wait a brief moment to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await seedNews(testApp.db, {
        slug: 'news-new',
        status: 'published',
        translations: [{ lang: 'it', title: 'News Recente' }],
      });

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{
          id: number;
          type: string;
          slug: string;
          status: string;
          title: string | null;
          updatedAt: string;
        }>;
      }>(testApp.app, '/api/v1/admin/dashboard/recent', accessToken);

      expect(status).toBe(200);
      expect(body.data.length).toBe(2);
      // Most recent should be first
      expect(body.data[0].slug).toBe('news-new');
      expect(body.data[0].type).toBe('news');
      expect(body.data[0].title).toBe('News Recente');
      expect(body.data[1].slug).toBe('project-old');
    });

    test('respects limit parameter', async () => {
      // Seed multiple items
      for (let i = 0; i < 5; i++) {
        await seedProject(testApp.db, {
          slug: `project-${i}`,
          status: 'draft',
          translations: [{ lang: 'it', title: `Progetto ${i}` }],
        });
      }

      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ id: number }>;
      }>(testApp.app, '/api/v1/admin/dashboard/recent?limit=3', accessToken);

      expect(status).toBe(200);
      expect(body.data.length).toBe(3);
    });

    test('requires authentication', async () => {
      const { status } = await testJsonRequest(testApp.app, '/api/v1/admin/dashboard/recent');
      expect(status).toBe(401);
    });
  });
});
