/**
 * Project Gallery Media Tests
 *
 * Tests for the gallery media management functionality on projects.
 * Covers:
 * - Assigning media to project gallery
 * - Removing media from gallery
 * - Reordering gallery images
 * - Gallery images in responses
 */
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  testJsonRequest,
  type AuthTestApp,
} from '../test-utils';
import { insertMedia } from '../db/queries';

describe('Project Gallery Media', () => {
  let testApp: AuthTestApp;
  let token: string;

  beforeAll(async () => {
    testApp = createTestAppWithAuth();
    token = await testApp.generateAccessToken();
  });

  beforeEach(async () => {
    await testApp.reset();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  /**
   * Helper to create a project and return its ID.
   */
  async function createProject(slug: string): Promise<number> {
    const res = await testAuthJsonRequest<{ data: { id: number } }>(
      testApp.app,
      '/api/v1/admin/projects',
      token,
      {
        method: 'POST',
        body: JSON.stringify({ slug, status: 'draft' }),
      }
    );
    return res.body.data.id;
  }

  /**
   * Helper to create test media directly in database.
   */
  async function createMedia(filename: string): Promise<number> {
    const media = await insertMedia(testApp.db, {
      filename,
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: `test-${filename}-${Date.now()}`,
      createdAt: new Date(),
    });
    return media.id;
  }

  describe('POST /admin/projects/:id/media', () => {
    test('assigns media to project gallery', async () => {
      const projectId = await createProject('gallery-test-1');
      const mediaId1 = await createMedia('image1.jpg');
      const mediaId2 = await createMedia('image2.jpg');

      const res = await testAuthJsonRequest<{
        data: {
          id: number;
          galleryImages: Array<{ id: number; url: string; displayOrder: number }>;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media`, token, {
        method: 'POST',
        body: JSON.stringify({
          mediaItems: [
            { mediaId: mediaId1, displayOrder: 0 },
            { mediaId: mediaId2, displayOrder: 1 },
          ],
        }),
      });

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(2);
      expect(res.body.data.galleryImages[0].id).toBe(mediaId1);
      expect(res.body.data.galleryImages[0].displayOrder).toBe(0);
      expect(res.body.data.galleryImages[1].id).toBe(mediaId2);
      expect(res.body.data.galleryImages[1].displayOrder).toBe(1);
    });

    test('replaces existing gallery when assigning new media', async () => {
      const projectId = await createProject('gallery-replace-test');
      const mediaId1 = await createMedia('old-image.jpg');
      const mediaId2 = await createMedia('new-image.jpg');

      // First assignment
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId: mediaId1, displayOrder: 0 }],
          }),
        }
      );

      // Replace with new media
      const res = await testAuthJsonRequest<{
        data: {
          galleryImages: Array<{ id: number }>;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media`, token, {
        method: 'POST',
        body: JSON.stringify({
          mediaItems: [{ mediaId: mediaId2, displayOrder: 0 }],
        }),
      });

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(1);
      expect(res.body.data.galleryImages[0].id).toBe(mediaId2);
    });

    test('clears gallery when assigning empty array', async () => {
      const projectId = await createProject('gallery-clear-test');
      const mediaId = await createMedia('to-remove.jpg');

      // First add media
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId, displayOrder: 0 }],
          }),
        }
      );

      // Clear gallery
      const res = await testAuthJsonRequest<{
        data: { galleryImages: Array<unknown> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media`, token, {
        method: 'POST',
        body: JSON.stringify({ mediaItems: [] }),
      });

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(0);
    });

    test('returns 404 for non-existent project', async () => {
      const mediaId = await createMedia('orphan.jpg');

      const res = await testAuthJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/admin/projects/99999/media',
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId, displayOrder: 0 }],
          }),
        }
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /admin/projects/:id/media/:mediaId', () => {
    test('removes single media from gallery', async () => {
      const projectId = await createProject('gallery-delete-test');
      const mediaId1 = await createMedia('keep.jpg');
      const mediaId2 = await createMedia('remove.jpg');

      // Add both media
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [
              { mediaId: mediaId1, displayOrder: 0 },
              { mediaId: mediaId2, displayOrder: 1 },
            ],
          }),
        }
      );

      // Remove one
      const res = await testAuthJsonRequest<{
        data: { galleryImages: Array<{ id: number }> };
      }>(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media/${mediaId2}`,
        token,
        { method: 'DELETE' }
      );

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(1);
      expect(res.body.data.galleryImages[0].id).toBe(mediaId1);
    });

    test('returns 404 for non-existent project', async () => {
      const res = await testAuthJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/admin/projects/99999/media/1',
        token,
        { method: 'DELETE' }
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('PUT /admin/projects/:id/media/order', () => {
    test('updates gallery display order', async () => {
      const projectId = await createProject('gallery-order-test');
      const mediaId1 = await createMedia('first.jpg');
      const mediaId2 = await createMedia('second.jpg');
      const mediaId3 = await createMedia('third.jpg');

      // Add media with initial order
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [
              { mediaId: mediaId1, displayOrder: 0 },
              { mediaId: mediaId2, displayOrder: 1 },
              { mediaId: mediaId3, displayOrder: 2 },
            ],
          }),
        }
      );

      // Reorder: move third to first
      const res = await testAuthJsonRequest<{
        data: {
          galleryImages: Array<{ id: number; displayOrder: number }>;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media/order`, token, {
        method: 'PUT',
        body: JSON.stringify({
          mediaItems: [
            { mediaId: mediaId3, displayOrder: 0 },
            { mediaId: mediaId1, displayOrder: 1 },
            { mediaId: mediaId2, displayOrder: 2 },
          ],
        }),
      });

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(3);

      // Verify new order
      const sorted = [...res.body.data.galleryImages].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      expect(sorted[0].id).toBe(mediaId3);
      expect(sorted[1].id).toBe(mediaId1);
      expect(sorted[2].id).toBe(mediaId2);
    });

    test('returns 404 for non-existent project', async () => {
      const res = await testAuthJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/admin/projects/99999/media/order',
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ mediaItems: [] }),
        }
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('Gallery images in project responses', () => {
    test('admin GET includes galleryImages', async () => {
      const projectId = await createProject('gallery-response-test');
      const mediaId = await createMedia('included.jpg');

      // Add media to gallery
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId, displayOrder: 0 }],
          }),
        }
      );

      // Fetch project
      const res = await testAuthJsonRequest<{
        data: {
          id: number;
          galleryImages: Array<{ id: number; url: string; alt: string | null }>;
        };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}`, token);

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(1);
      expect(res.body.data.galleryImages[0].id).toBe(mediaId);
      expect(res.body.data.galleryImages[0].url).toContain('/media/');
    });

    test('public GET includes galleryImages when published', async () => {
      const projectId = await createProject('gallery-public-test');
      const mediaId = await createMedia('public-image.jpg');

      // Add translation (required for public endpoint)
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/translations/it`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ title: 'Test Galleria' }),
        }
      );

      // Add media to gallery
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId, displayOrder: 0 }],
          }),
        }
      );

      // Publish project
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'published' }),
        }
      );

      // Fetch from public endpoint
      const res = await testJsonRequest<{
        data: {
          slug: string;
          galleryImages: Array<{ id: number; url: string }>;
        };
      }>(testApp.app, '/api/v1/projects/gallery-public-test?lang=it');

      expect(res.status).toBe(200);
      expect(res.body.data.galleryImages).toHaveLength(1);
      expect(res.body.data.galleryImages[0].id).toBe(mediaId);
    });

    test('admin list includes galleryImages', async () => {
      const projectId = await createProject('gallery-list-test');
      const mediaId = await createMedia('list-image.jpg');

      // Add media to gallery
      await testAuthJsonRequest(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media`,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            mediaItems: [{ mediaId, displayOrder: 0 }],
          }),
        }
      );

      // Fetch list
      const res = await testAuthJsonRequest<{
        data: Array<{
          id: number;
          galleryImages: Array<{ id: number }>;
        }>;
      }>(testApp.app, '/api/v1/admin/projects', token);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].galleryImages).toHaveLength(1);
      expect(res.body.data[0].galleryImages[0].id).toBe(mediaId);
    });
  });

  describe('Full gallery lifecycle', () => {
    test('create -> add media -> reorder -> remove -> clear', async () => {
      // 1. Create project
      const projectId = await createProject('gallery-lifecycle');
      const media1 = await createMedia('lifecycle-1.jpg');
      const media2 = await createMedia('lifecycle-2.jpg');
      const media3 = await createMedia('lifecycle-3.jpg');

      // 2. Add media
      const addRes = await testAuthJsonRequest<{
        data: { galleryImages: Array<{ id: number; displayOrder: number }> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media`, token, {
        method: 'POST',
        body: JSON.stringify({
          mediaItems: [
            { mediaId: media1, displayOrder: 0 },
            { mediaId: media2, displayOrder: 1 },
            { mediaId: media3, displayOrder: 2 },
          ],
        }),
      });

      expect(addRes.body.data.galleryImages).toHaveLength(3);

      // 3. Reorder (reverse)
      const reorderRes = await testAuthJsonRequest<{
        data: { galleryImages: Array<{ id: number; displayOrder: number }> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media/order`, token, {
        method: 'PUT',
        body: JSON.stringify({
          mediaItems: [
            { mediaId: media3, displayOrder: 0 },
            { mediaId: media2, displayOrder: 1 },
            { mediaId: media1, displayOrder: 2 },
          ],
        }),
      });

      const sortedAfterReorder = [...reorderRes.body.data.galleryImages].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      expect(sortedAfterReorder[0].id).toBe(media3);
      expect(sortedAfterReorder[2].id).toBe(media1);

      // 4. Remove middle item
      const removeRes = await testAuthJsonRequest<{
        data: { galleryImages: Array<{ id: number }> };
      }>(
        testApp.app,
        `/api/v1/admin/projects/${projectId}/media/${media2}`,
        token,
        { method: 'DELETE' }
      );

      expect(removeRes.body.data.galleryImages).toHaveLength(2);
      expect(
        removeRes.body.data.galleryImages.find((g) => g.id === media2)
      ).toBeUndefined();

      // 5. Clear all
      const clearRes = await testAuthJsonRequest<{
        data: { galleryImages: Array<unknown> };
      }>(testApp.app, `/api/v1/admin/projects/${projectId}/media`, token, {
        method: 'POST',
        body: JSON.stringify({ mediaItems: [] }),
      });

      expect(clearRes.body.data.galleryImages).toHaveLength(0);
    });
  });
});
