/**
 * Project Media Query Tests
 *
 * Unit tests for the project gallery media query functions.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'bun:test';
import { eq } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from '../test-utils';
import {
  assignProjectMedia,
  removeProjectMedia,
  updateProjectMediaOrder,
} from './relations';
import { getProjectGalleryImages } from './projects';
import { insertMedia } from './media';
import * as schema from '../schema';

describe('Project Media Query Functions', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(async () => {
    const testDb = createTestDatabase();
    client = testDb.client;
    db = testDb.db;
  });

  beforeEach(async () => {
    await resetDatabase(db);
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  /**
   * Helper to create a project directly in database.
   */
  async function createProject(slug: string): Promise<{ contentId: number; projectId: number }> {
    // Insert content_base
    const [content] = await db.insert(schema.contentBase)
      .values({
        type: 'project',
        slug,
        status: 'draft',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Insert project
    const [project] = await db.insert(schema.projects)
      .values({
        contentId: content.id,
        projectStatus: 'in-progress',
      })
      .returning();

    return { contentId: content.id, projectId: project.id };
  }

  /**
   * Helper to create media directly in database.
   */
  async function createMedia(filename: string): Promise<number> {
    const media = await insertMedia(db, {
      filename,
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: `test-${filename}-${Date.now()}`,
      createdAt: new Date(),
    });
    return media.id;
  }

  describe('assignProjectMedia', () => {
    test('inserts media items with display order', async () => {
      const { projectId } = await createProject('test-assign');
      const media1 = await createMedia('img1.jpg');
      const media2 = await createMedia('img2.jpg');

      await assignProjectMedia(db, projectId, [
        { mediaId: media1, displayOrder: 0 },
        { mediaId: media2, displayOrder: 1 },
      ]);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(2);
      expect(gallery[0].id).toBe(media1);
      expect(gallery[0].displayOrder).toBe(0);
      expect(gallery[1].id).toBe(media2);
      expect(gallery[1].displayOrder).toBe(1);
    });

    test('replaces existing media when called again', async () => {
      const { projectId } = await createProject('test-replace');
      const media1 = await createMedia('old.jpg');
      const media2 = await createMedia('new.jpg');

      // First assignment
      await assignProjectMedia(db, projectId, [{ mediaId: media1, displayOrder: 0 }]);

      // Replace
      await assignProjectMedia(db, projectId, [{ mediaId: media2, displayOrder: 0 }]);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(1);
      expect(gallery[0].id).toBe(media2);
    });

    test('clears gallery when passed empty array', async () => {
      const { projectId } = await createProject('test-clear');
      const media = await createMedia('to-clear.jpg');

      await assignProjectMedia(db, projectId, [{ mediaId: media, displayOrder: 0 }]);
      await assignProjectMedia(db, projectId, []);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(0);
    });
  });

  describe('removeProjectMedia', () => {
    test('removes single media item', async () => {
      const { projectId } = await createProject('test-remove');
      const media1 = await createMedia('keep.jpg');
      const media2 = await createMedia('remove.jpg');

      await assignProjectMedia(db, projectId, [
        { mediaId: media1, displayOrder: 0 },
        { mediaId: media2, displayOrder: 1 },
      ]);

      await removeProjectMedia(db, projectId, media2);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(1);
      expect(gallery[0].id).toBe(media1);
    });

    test('does nothing if media not in gallery', async () => {
      const { projectId } = await createProject('test-remove-missing');
      const media = await createMedia('only.jpg');

      await assignProjectMedia(db, projectId, [{ mediaId: media, displayOrder: 0 }]);

      // Try to remove non-existent media
      await removeProjectMedia(db, projectId, 99999);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(1);
    });
  });

  describe('updateProjectMediaOrder', () => {
    test('updates display order of items', async () => {
      const { projectId } = await createProject('test-order');
      const media1 = await createMedia('first.jpg');
      const media2 = await createMedia('second.jpg');
      const media3 = await createMedia('third.jpg');

      await assignProjectMedia(db, projectId, [
        { mediaId: media1, displayOrder: 0 },
        { mediaId: media2, displayOrder: 1 },
        { mediaId: media3, displayOrder: 2 },
      ]);

      // Reverse order
      await updateProjectMediaOrder(db, projectId, [
        { mediaId: media1, displayOrder: 2 },
        { mediaId: media2, displayOrder: 1 },
        { mediaId: media3, displayOrder: 0 },
      ]);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery[0].id).toBe(media3);
      expect(gallery[0].displayOrder).toBe(0);
      expect(gallery[1].id).toBe(media2);
      expect(gallery[1].displayOrder).toBe(1);
      expect(gallery[2].id).toBe(media1);
      expect(gallery[2].displayOrder).toBe(2);
    });
  });

  describe('getProjectGalleryImages', () => {
    test('returns images ordered by displayOrder', async () => {
      const { projectId } = await createProject('test-get-order');
      const media1 = await createMedia('a.jpg');
      const media2 = await createMedia('b.jpg');
      const media3 = await createMedia('c.jpg');

      // Insert out of order
      await assignProjectMedia(db, projectId, [
        { mediaId: media2, displayOrder: 1 },
        { mediaId: media3, displayOrder: 2 },
        { mediaId: media1, displayOrder: 0 },
      ]);

      const gallery = await getProjectGalleryImages(db, projectId);

      // Should be sorted by displayOrder
      expect(gallery[0].id).toBe(media1);
      expect(gallery[1].id).toBe(media2);
      expect(gallery[2].id).toBe(media3);
    });

    test('returns empty array for project without gallery', async () => {
      const { projectId } = await createProject('test-empty');

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery).toHaveLength(0);
    });

    test('includes url with media path', async () => {
      const { projectId } = await createProject('test-url');
      const media = await createMedia('with-url.jpg');

      await assignProjectMedia(db, projectId, [{ mediaId: media, displayOrder: 0 }]);

      const gallery = await getProjectGalleryImages(db, projectId);
      expect(gallery[0].url).toContain('/media/');
    });
  });
});
