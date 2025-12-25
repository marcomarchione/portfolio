/**
 * Admin Lookup and Junction Table Endpoint Tests
 *
 * Tests for technologies, tags CRUD and project/news associations.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  type AuthTestApp,
} from '../test-utils';

describe('Admin Lookup and Junction Endpoints', () => {
  let testApp: AuthTestApp;
  let token: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    token = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('POST /admin/technologies', () => {
    test('creates technology', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: { id: number; name: string; icon: string | null; color: string };
      }>(testApp.app, '/api/v1/admin/technologies', token, {
        method: 'POST',
        body: JSON.stringify({
          name: 'React',
          icon: 'react-icon',
          color: '#61dafb',
        }),
      });

      expect(status).toBe(201);
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('React');
      expect(body.data.color).toBe('#61dafb');
    });
  });

  describe('DELETE /admin/technologies/:id', () => {
    test('returns 409 if referenced by project', async () => {
      // Create technology
      const techRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'TypeScript' }),
        }
      );
      const techId = techRes.body.data.id;

      // Create project
      const projectRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'ts-project' }),
        }
      );
      const projectId = projectRes.body.data.id;

      // Assign technology to project
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/technologies`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ technologyIds: [techId] }),
        }
      );

      // Try to delete technology
      const { status, body } = await testAuthJsonRequest<{ error: string; message: string }>(
        testApp.app,
        `/api/v1/admin/technologies/${techId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      expect(status).toBe(409);
      expect(body.message).toContain('referenced');
    });

    test('succeeds if not referenced', async () => {
      // Create technology
      const techRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Unused Tech' }),
        }
      );
      const techId = techRes.body.data.id;

      // Delete technology
      const { status, body } = await testAuthJsonRequest<{ data: { message: string } }>(
        testApp.app,
        `/api/v1/admin/technologies/${techId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      expect(status).toBe(200);
      expect(body.data.message).toContain('deleted');
    });
  });

  describe('POST /admin/projects/:id/technologies', () => {
    test('assigns technologies to project', async () => {
      // Create technologies
      const tech1Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'React' }),
        }
      );

      const tech2Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Node.js' }),
        }
      );

      // Create project
      const projectRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'tech-project' }),
        }
      );
      const projectId = projectRes.body.data.id;

      // Assign technologies
      const { status, body } = await testAuthJsonRequest<{
        data: { technologies: Array<{ id: number; name: string }> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/technologies`, token, {
        method: 'POST',
        body: JSON.stringify({
          technologyIds: [tech1Res.body.data.id, tech2Res.body.data.id],
        }),
      });

      expect(status).toBe(200);
      expect(body.data.technologies.length).toBe(2);
      const techNames = body.data.technologies.map((t) => t.name);
      expect(techNames).toContain('React');
      expect(techNames).toContain('Node.js');
    });
  });

  describe('DELETE /admin/projects/:id/technologies/:techId', () => {
    test('removes technology association', async () => {
      // Create technology
      const techRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/technologies',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Vue' }),
        }
      );
      const techId = techRes.body.data.id;

      // Create project and assign technology
      const projectRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/projects',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'vue-project' }),
        }
      );
      const projectId = projectRes.body.data.id;

      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/technologies`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({ technologyIds: [techId] }),
        }
      );

      // Remove technology
      const { status, body } = await testAuthJsonRequest<{
        data: { technologies: Array<{ id: number }> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/technologies/${techId}`, token, {
        method: 'DELETE',
      });

      expect(status).toBe(200);
      expect(body.data.technologies.length).toBe(0);
    });
  });

  describe('POST /admin/tags', () => {
    test('creates tag with slug', async () => {
      const { status, body } = await testAuthJsonRequest<{
        data: { id: number; name: string; slug: string };
      }>(testApp.app, '/api/v1/admin/tags', token, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Web Development',
          slug: 'web-development',
        }),
      });

      expect(status).toBe(201);
      expect(body.data.id).toBeDefined();
      expect(body.data.name).toBe('Web Development');
      expect(body.data.slug).toBe('web-development');
    });
  });

  describe('DELETE /admin/tags/:id', () => {
    test('returns 409 if referenced by news', async () => {
      // Create tag
      const tagRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/tags',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'Tutorial', slug: 'tutorial' }),
        }
      );
      const tagId = tagRes.body.data.id;

      // Create news
      const newsRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/news',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'tagged-news' }),
        }
      );
      const newsId = newsRes.body.data.id;

      // Assign tag to news
      await testAuthJsonRequest(testApp.app, `/api/v1/admin/news/${newsId}/tags`, token, {
        method: 'POST',
        body: JSON.stringify({ tagIds: [tagId] }),
      });

      // Try to delete tag
      const { status, body } = await testAuthJsonRequest<{ error: string; message: string }>(
        testApp.app,
        `/api/v1/admin/tags/${tagId}`,
        token,
        {
          method: 'DELETE',
        }
      );

      expect(status).toBe(409);
      expect(body.message).toContain('referenced');
    });
  });

  describe('POST /admin/news/:id/tags', () => {
    test('assigns tags to news', async () => {
      // Create tags
      const tag1Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/tags',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'JavaScript', slug: 'javascript' }),
        }
      );

      const tag2Res = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/tags',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ name: 'TypeScript', slug: 'typescript' }),
        }
      );

      // Create news
      const newsRes = await testAuthJsonRequest<{ data: { id: number } }>(
        testApp.app,
        '/api/v1/admin/news',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ slug: 'js-ts-news' }),
        }
      );
      const newsId = newsRes.body.data.id;

      // Assign tags
      const { status, body } = await testAuthJsonRequest<{
        data: { tags: Array<{ id: number; name: string; slug: string }> };
      }>(testApp.app, `/api/v1/admin/news/${newsId}/tags`, token, {
        method: 'POST',
        body: JSON.stringify({
          tagIds: [tag1Res.body.data.id, tag2Res.body.data.id],
        }),
      });

      expect(status).toBe(200);
      expect(body.data.tags.length).toBe(2);
      const tagSlugs = body.data.tags.map((t) => t.slug);
      expect(tagSlugs).toContain('javascript');
      expect(tagSlugs).toContain('typescript');
    });
  });
});
