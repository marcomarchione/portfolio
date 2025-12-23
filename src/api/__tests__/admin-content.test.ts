/**
 * Admin Content CRUD Endpoint Tests
 *
 * Tests for authenticated admin endpoints for projects, materials, and news.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  testJsonRequest,
  type AuthTestApp,
} from '../test-utils';

describe('Admin Content CRUD Endpoints', () => {
  let testApp: AuthTestApp;
  let token: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    token = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('Authentication', () => {
    test('admin routes require authentication (401 without token)', async () => {
      const { status, body } = await testJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/admin/projects'
      );

      expect(status).toBe(401);
      expect(body.error).toBe('UNAUTHORIZED');
    });

    test('admin routes accept valid token', async () => {
      const { status } = await testAuthJsonRequest(
        testApp.app,
        '/api/v1/admin/projects',
        token
      );

      expect(status).toBe(200);
    });
  });

  describe('POST /admin/projects', () => {
    test('creates content_base + projects in transaction', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: {
          id: number;
          slug: string;
          status: string;
          type: string;
          featured: boolean;
          githubUrl: string;
        };
      }>(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'new-test-project',
          status: 'draft',
          featured: true,
          githubUrl: 'https://github.com/test/repo',
          projectStatus: 'in-progress',
        }),
      });

      expect(status).toBe(201);
      expect(body.data.id).toBeDefined();
      expect(body.data.slug).toBe('new-test-project');
      expect(body.data.status).toBe('draft');
      expect(body.data.type).toBe('project');
      expect(body.data.featured).toBe(true);
      expect(body.data.githubUrl).toBe('https://github.com/test/repo');
    });
  });

  describe('PUT /admin/projects/:id', () => {
    test('updates project fields', async () => {
      // First create a project
      const createRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'update-test-project' }),
        }
      );

      const projectId = createRes.body.data.id;

      // Update the project
      const { status, body } = await testAuthJsonRequest<{
        data: { slug: string; featured: boolean; status: string; publishedAt: string | null };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token, {
        method: 'PUT',
        body: JSON.stringify({
          featured: true,
          status: 'published',
        }),
      });

      expect(status).toBe(200);
      expect(body.data.featured).toBe(true);
      expect(body.data.status).toBe('published');
      expect(body.data.publishedAt).not.toBeNull();
    });
  });

  describe('PUT /admin/projects/:id/translations/:lang', () => {
    test('creates/updates translation', async () => {
      // Create a project
      const createRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'translation-test-project' }),
        }
      );

      const projectId = createRes.body.data.id;

      // Create translation
      const { status, body } = await testAuthJsonRequest<{
        data: {
          id: number;
          lang: string;
          title: string;
          description: string;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/translations/en`, token, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Test Project Title',
          description: 'Test description',
          body: 'Full body content',
        }),
      });

      expect(status).toBe(200);
      expect(body.data.lang).toBe('en');
      expect(body.data.title).toBe('Test Project Title');
      expect(body.data.description).toBe('Test description');

      // Update existing translation
      const updateRes = await testAuthJsonRequest<{
        data: { title: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/translations/en`, token, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Updated Title',
        }),
      });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /admin/projects/:id', () => {
    test('sets status to archived (not hard delete)', async () => {
      // Create a project
      const createRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'delete-test-project',
            status: 'published',
          }),
        }
      );

      const projectId = createRes.body.data.id;

      // Delete (archive) the project
      const deleteRes = await testAuthJsonRequest<{
        data: { id: number; status: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.status).toBe('archived');

      // Verify project still exists but is archived
      const getRes = await testAuthJsonRequest<{
        data: { status: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.status).toBe('archived');
    });
  });

  describe('GET /admin/projects', () => {
    test('includes drafts and archived', async () => {
      // Create projects with different statuses
      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({ slug: 'draft-project', status: 'draft' }),
      });

      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({ slug: 'published-project', status: 'published' }),
      });

      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({ slug: 'archived-project', status: 'archived' }),
      });

      // Get all projects
      const { status, body } = await testAuthJsonRequest<{
        data: Array<{ slug: string; status: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/admin/projects', token);

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(3);

      const statuses = body.data.map((p) => p.status);
      expect(statuses).toContain('draft');
      expect(statuses).toContain('published');
      expect(statuses).toContain('archived');
    });
  });

  describe('GET /admin/projects/:id', () => {
    test('returns all translations', async () => {
      // Create a project
      const createRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'multi-lang-project' }),
        }
      );

      const projectId = createRes.body.data.id;

      // Add translations
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/translations/en`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'English Title' }),
        }
      );

      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/translations/it`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'Titolo Italiano' }),
        }
      );

      // Get project with all translations
      const { status, body } = await testAuthJsonRequest<{
        data: {
          translations: Array<{ lang: string; title: string }>;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token);

      expect(status).toBe(200);
      expect(body.data.translations.length).toBe(2);

      const langs = body.data.translations.map((t) => t.lang);
      expect(langs).toContain('en');
      expect(langs).toContain('it');
    });
  });

  describe('Materials CRUD', () => {
    test('POST /admin/materials creates material', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: {
          id: number;
          slug: string;
          category: string;
          downloadUrl: string;
        };
      }>(testApp.app, '/api/v1/admin/materials', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'test-material',
          category: 'guide',
          downloadUrl: 'https://example.com/download.pdf',
          fileSize: 1024,
        }),
      });

      expect(status).toBe(201);
      expect(body.data.slug).toBe('test-material');
      expect(body.data.category).toBe('guide');
      expect(body.data.downloadUrl).toBe('https://example.com/download.pdf');
    });
  });

  describe('News CRUD', () => {
    test('POST /admin/news creates news', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: {
          id: number;
          slug: string;
          coverImage: string | null;
          readingTime: number | null;
        };
      }>(testApp.app, '/api/v1/admin/news', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'test-news',
          coverImage: '/images/cover.jpg',
          readingTime: 5,
        }),
      });

      expect(status).toBe(201);
      expect(body.data.slug).toBe('test-news');
      expect(body.data.coverImage).toBe('/images/cover.jpg');
      expect(body.data.readingTime).toBe(5);
    });
  });
});
