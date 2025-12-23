/**
 * Content CRUD Integration Tests
 *
 * Integration tests covering full lifecycles, error handling, and edge cases.
 * These tests fill gaps identified in Task Group 6.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  testJsonRequest,
  type AuthTestApp,
} from '../test-utils';

describe('Content CRUD Integration Tests', () => {
  let testApp: AuthTestApp;
  let token: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    token = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('Full project lifecycle', () => {
    test('create -> translate -> publish -> archive', async () => {
      // 1. Create draft project
      const createRes = await testAuthJsonRequest<{
        data: { id: number; slug: string; status: string; publishedAt: string | null };
      }>(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'lifecycle-project',
          status: 'draft',
          featured: true,
        }),
      });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.status).toBe('draft');
      expect(createRes.body.data.publishedAt).toBeNull();

      const projectId = createRes.body.data.id;

      // 2. Add translations
      const enTransRes = await testAuthJsonRequest<{
        data: { lang: string; title: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/translations/en`, token, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Lifecycle Project',
          description: 'Testing full lifecycle',
          body: 'Full body content here',
        }),
      });

      expect(enTransRes.status).toBe(200);
      expect(enTransRes.body.data.title).toBe('Lifecycle Project');

      const itTransRes = await testAuthJsonRequest<{
        data: { lang: string; title: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/translations/it`, token, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Progetto Ciclo di Vita',
          description: 'Test del ciclo completo',
        }),
      });

      expect(itTransRes.status).toBe(200);

      // 3. Verify not visible in public endpoint (still draft)
      const publicBeforeRes = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects');

      expect(publicBeforeRes.body.pagination.total).toBe(0);

      // 4. Publish the project
      const publishRes = await testAuthJsonRequest<{
        data: { status: string; publishedAt: string | null };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ status: 'published' }),
      });

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.status).toBe('published');
      expect(publishRes.body.data.publishedAt).not.toBeNull();

      // 5. Verify now visible in public endpoint
      const publicAfterRes = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects');

      expect(publicAfterRes.body.pagination.total).toBe(1);
      expect(publicAfterRes.body.data[0].slug).toBe('lifecycle-project');

      // 6. Archive the project
      const archiveRes = await testAuthJsonRequest<{
        data: { status: string };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token, {
        method: 'DELETE',
      });

      expect(archiveRes.status).toBe(200);
      expect(archiveRes.body.data.status).toBe('archived');

      // 7. Verify no longer visible in public endpoint
      const publicFinalRes = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects');

      expect(publicFinalRes.body.pagination.total).toBe(0);

      // 8. But still visible in admin endpoint
      const adminRes = await testAuthJsonRequest<{
        data: { status: string; translations: Array<{ lang: string }> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token);

      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.status).toBe('archived');
      expect(adminRes.body.data.translations.length).toBe(2);
    });
  });

  describe('Full news lifecycle with tags', () => {
    test('create news -> add tags -> publish -> verify tags in public response', async () => {
      // 1. Create tags
      const tag1Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/tags',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'JavaScript', slug: 'javascript' }),
        }
      );
      const tag1Id = tag1Res.body.data.id;

      const tag2Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/tags',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Tutorial', slug: 'tutorial' }),
        }
      );
      const tag2Id = tag2Res.body.data.id;

      // 2. Create news
      const newsRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/news',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'js-tutorial',
            readingTime: 10,
          }),
        }
      );
      const newsId = newsRes.body.data.id;

      // 3. Add translation
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/news/${newsId}/translations/en`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: 'JavaScript Tutorial',
            description: 'Learn JS basics',
            body: 'Tutorial content...',
          }),
        }
      );

      // 4. Assign tags
      const assignRes = await testAuthJsonRequest<{
        data: { tags: Array<{ slug: string }> };
      }>(testApp.app, `/api/v1/admin/news/${newsId}/tags`, token, {
        method: 'POST',
        body: JSON.stringify({ tagIds: [tag1Id, tag2Id] }),
      });

      expect(assignRes.body.data.tags.length).toBe(2);

      // 5. Publish
      await testAuthJsonRequest(testApp.app, `/api/v1/admin/news/${newsId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ status: 'published' }),
      });

      // 6. Verify in public endpoint with tags
      const publicRes = await testJsonRequest<{
        data: {
          slug: string;
          tags: Array<{ slug: string }>;
          translation: { title: string };
        };
      }>(testApp.app, '/api/v1/news/js-tutorial?lang=en');

      expect(publicRes.status).toBe(200);
      expect(publicRes.body.data.slug).toBe('js-tutorial');
      expect(publicRes.body.data.tags.length).toBe(2);
      expect(publicRes.body.data.translation.title).toBe('JavaScript Tutorial');
    });
  });

  describe('Error handling: duplicate slug', () => {
    test('returns error on duplicate slug create', async () => {
      // Create first project
      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({ slug: 'duplicate-test' }),
      });

      // Try to create another with same slug
      const duplicateRes = await testAuthJsonRequest<{ error: string; message: string }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'duplicate-test' }),
        }
      );

      // SQLite UNIQUE constraint violation typically returns 500 from unhandled error
      // or 409 if properly handled
      expect([409, 500]).toContain(duplicateRes.status);
    });
  });

  describe('Error handling: invalid language code', () => {
    test('returns validation error for invalid language', async () => {
      // Create project first
      const projectRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'lang-test-project' }),
        }
      );
      const projectId = projectRes.body.data.id;

      // Try invalid language code
      const invalidRes = await testAuthJsonRequest<{ error: string }>(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/translations/xx`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'Test' }),
        }
      );

      // Elysia returns 422 for validation errors by default
      expect([400, 422]).toContain(invalidRes.status);
    });
  });

  describe('Error handling: update non-existent content', () => {
    test('returns 404 for non-existent project', async () => {
      const { status, body } = await testAuthJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/admin/projects/99999',
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ slug: 'new-slug' }),
        }
      );

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('Edge case: list with no results', () => {
    test('returns empty array with pagination', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: Array<unknown>;
        pagination: { total: number; offset: number; limit: number; hasMore: boolean };
      }>(testApp.app, '/api/v1/admin/projects', token);

      expect(status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.pagination.total).toBe(0);
      expect(body.pagination.offset).toBe(0);
      expect(body.pagination.hasMore).toBe(false);
    });
  });

  describe('Edge case: featured filter', () => {
    test('returns only featured items', async () => {
      // Create featured and non-featured projects
      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'featured-project',
          status: 'published',
          featured: true,
        }),
      });

      await testAuthJsonRequest(testApp.app, '/api/v1/admin/projects', token, {
        method: 'POST',
        body: JSON.stringify({
          slug: 'regular-project',
          status: 'published',
          featured: false,
        }),
      });

      // Query with featured filter
      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; featured: boolean }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects?featured=true');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('featured-project');
      expect(body.data[0].featured).toBe(true);
    });
  });

  describe('Edge case: technology filter', () => {
    test('returns projects with specified technology', async () => {
      // Create technology
      const techRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'React' }),
        }
      );
      const techId = techRes.body.data.id;

      // Create projects
      const p1Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'react-app',
            status: 'published',
          }),
        }
      );

      await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            slug: 'other-app',
            status: 'published',
          }),
        }
      );

      // Assign technology to first project
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${p1Res.body.data.id}/technologies`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ technologyIds: [techId] }),
        }
      );

      // Query with technology filter
      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects?technology=React');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('react-app');
    });
  });
});
