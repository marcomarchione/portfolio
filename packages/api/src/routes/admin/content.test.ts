/**
 * Admin Content Routes Tests
 *
 * Tests for content status (publish/unpublish) endpoints.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  type AuthTestApp,
} from '../../test-utils';
import { createProject, createMaterial, createNews, getContentById } from '../../db/queries';

describe('Admin Content Routes - Publish/Unpublish', () => {
  let testApp: AuthTestApp;
  let token: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    token = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('PATCH /api/v1/admin/:contentType/:id/publish', () => {
    test('publishing content (draft to published) sets publishedAt timestamp', async () => {
      // Create a draft project
      const project = createProject(testApp.db, {
        slug: 'test-project',
        status: 'draft',
      });

      // Verify publishedAt is null initially
      const beforePublish = getContentById(testApp.db, project.id);
      expect(beforePublish?.publishedAt).toBeNull();

      // Publish the project
      const response = await testAuthJsonRequest<{ data: { status: string; publishedAt: string } }>(
        testApp.app,
        `/api/v1/admin/projects/${project.id}/publish`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'published' }),
        }
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).not.toBeNull();

      // Verify in database
      const afterPublish = getContentById(testApp.db, project.id);
      expect(afterPublish?.status).toBe('published');
      expect(afterPublish?.publishedAt).not.toBeNull();
    });

    test('unpublishing content (published to draft) preserves publishedAt', async () => {
      // Create a published project
      const project = createProject(testApp.db, {
        slug: 'test-published-project',
        status: 'published',
      });

      // Get the publishedAt timestamp
      const beforeUnpublish = getContentById(testApp.db, project.id);
      const originalPublishedAt = beforeUnpublish?.publishedAt;
      expect(originalPublishedAt).not.toBeNull();

      // Unpublish the project (set to draft)
      const response = await testAuthJsonRequest<{ data: { status: string; publishedAt: string } }>(
        testApp.app,
        `/api/v1/admin/projects/${project.id}/publish`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'draft' }),
        }
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('draft');
      // publishedAt should be preserved
      expect(response.body.data.publishedAt).not.toBeNull();

      // Verify in database - publishedAt should be preserved
      const afterUnpublish = getContentById(testApp.db, project.id);
      expect(afterUnpublish?.status).toBe('draft');
      expect(afterUnpublish?.publishedAt?.getTime()).toBe(originalPublishedAt?.getTime());
    });

    test('archiving content works correctly', async () => {
      // Create a news item
      const newsItem = createNews(testApp.db, {
        slug: 'test-news',
        status: 'published',
      });

      // Archive the news item
      const response = await testAuthJsonRequest<{ data: { status: string } }>(
        testApp.app,
        `/api/v1/admin/news/${newsItem.id}/publish`,
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'archived' }),
        }
      );

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('archived');

      // Verify in database
      const afterArchive = getContentById(testApp.db, newsItem.id);
      expect(afterArchive?.status).toBe('archived');
    });

    test('returns 404 for non-existent content', async () => {
      const response = await testAuthJsonRequest<{ error: string; message: string }>(
        testApp.app,
        '/api/v1/admin/materials/99999/publish',
        token,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'published' }),
        }
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NOT_FOUND');
    });
  });
});
