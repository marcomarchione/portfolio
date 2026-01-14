/**
 * Database Query Utilities Tests
 *
 * Tests for content query helper functions.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeEach, beforeAll, afterAll } from 'bun:test';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from './test-utils';
import {
  getContentById,
  getContentBySlug,
  listContent,
  countContent,
  updateContentStatus,
  archiveContent,
  getProjectWithTranslation,
  getProjectWithAllTranslations,
  listProjects,
  countProjects,
  createProject,
  createMaterial,
  createNews,
  upsertTranslation,
  listTechnologies,
  getTechnologyById,
  createTechnology,
  deleteTechnology,
  isTechnologyReferenced,
  assignTechnologies,
  getProjectByContentId,
} from './queries';
import * as schema from './schema';

describe('Database Query Utilities', () => {
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

  describe('getProjectWithTranslation', () => {
    test('returns correct structure with project and translation', async () => {
      // Create a project
      const project = await createProject(db, {
        slug: 'test-project',
        status: 'published',
      });

      // Add translation
      await upsertTranslation(db, project.id, 'en', {
        title: 'Test Project',
        description: 'A test project',
      });

      const result = await getProjectWithTranslation(db, 'test-project', 'en');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('test-project');
      expect(result!.status).toBe('published');
      expect(result!.translation).not.toBeNull();
      expect(result!.translation!.title).toBe('Test Project');
      expect(result!.technologies).toEqual([]);
    });

    test('returns null for non-existent project', async () => {
      const result = await getProjectWithTranslation(db, 'non-existent', 'en');
      expect(result).toBeNull();
    });
  });

  describe('listProjects pagination', () => {
    test('respects limit and offset', async () => {
      // Create multiple projects
      await createProject(db, { slug: 'project-1', status: 'published' });
      await createProject(db, { slug: 'project-2', status: 'published' });
      await createProject(db, { slug: 'project-3', status: 'published' });

      const page1 = await listProjects(db, { limit: 2, offset: 0, publishedOnly: true });
      expect(page1.length).toBe(2);

      const page2 = await listProjects(db, { limit: 2, offset: 2, publishedOnly: true });
      expect(page2.length).toBe(1);
    });
  });

  describe('listProjects filters by published status', () => {
    test('publishedOnly returns only published content', async () => {
      const draft = await createProject(db, { slug: 'draft-project', status: 'draft' });
      await createProject(db, { slug: 'published-project', status: 'published' });
      const archived = await createProject(db, { slug: 'archived-project' });
      await archiveContent(db, archived.id); // Archive the last one

      const published = await listProjects(db, { publishedOnly: true });
      expect(published.length).toBe(1);
      expect(published[0].slug).toBe('published-project');

      const all = await listProjects(db, {});
      expect(all.length).toBe(3);
    });
  });

  describe('createProject uses transaction pattern', () => {
    test('creates content_base and projects extension together', async () => {
      const project = await createProject(db, {
        slug: 'new-project',
        status: 'draft',
        featured: true,
        githubUrl: 'https://github.com/test/repo',
        projectStatus: 'in-progress',
      });

      expect(project.id).toBeDefined();
      expect(project.slug).toBe('new-project');
      expect(project.featured).toBe(true);
      expect(project.githubUrl).toBe('https://github.com/test/repo');

      // Verify both tables have records
      const content = await getContentById(db, project.id);
      expect(content).not.toBeUndefined();
      expect(content!.type).toBe('project');

      const projectRecord = await getProjectByContentId(db, project.id);
      expect(projectRecord).not.toBeUndefined();
    });
  });

  describe('updateContentStatus', () => {
    test('sets archived status correctly', async () => {
      const project = await createProject(db, {
        slug: 'to-archive',
        status: 'published',
      });

      const archived = await archiveContent(db, project.id);

      expect(archived).not.toBeUndefined();
      expect(archived!.status).toBe('archived');
    });

    test('sets publishedAt when first published', async () => {
      const project = await createProject(db, {
        slug: 'draft-to-publish',
        status: 'draft',
      });

      expect(project.publishedAt).toBeNull();

      const published = await updateContentStatus(db, project.id, 'published');
      expect(published!.publishedAt).not.toBeNull();
    });
  });

  describe('technology reference check', () => {
    test('isTechnologyReferenced returns true when technology is used', async () => {
      // Create technology
      const tech = await createTechnology(db, { name: 'React' });

      // Create project and assign technology
      const project = await createProject(db, { slug: 'react-project' });
      const projectRecord = await getProjectByContentId(db, project.id);
      await assignTechnologies(db, projectRecord!.id, [tech.id]);

      const isReferenced = await isTechnologyReferenced(db, tech.id);
      expect(isReferenced).toBe(true);
    });

    test('deleteTechnology fails when referenced', async () => {
      const tech = await createTechnology(db, { name: 'Vue' });
      const project = await createProject(db, { slug: 'vue-project' });
      const projectRecord = await getProjectByContentId(db, project.id);
      await assignTechnologies(db, projectRecord!.id, [tech.id]);

      const deleted = await deleteTechnology(db, tech.id);
      expect(deleted).toBe(false);

      // Technology should still exist
      const stillExists = await getTechnologyById(db, tech.id);
      expect(stillExists).not.toBeUndefined();
    });

    test('deleteTechnology succeeds when not referenced', async () => {
      const tech = await createTechnology(db, { name: 'Angular' });

      const deleted = await deleteTechnology(db, tech.id);
      expect(deleted).toBe(true);

      const shouldNotExist = await getTechnologyById(db, tech.id);
      expect(shouldNotExist).toBeUndefined();
    });
  });

  describe('countContent', () => {
    test('counts content correctly with filters', async () => {
      await createProject(db, { slug: 'project-a', status: 'published', featured: true });
      await createProject(db, { slug: 'project-b', status: 'published', featured: false });
      await createProject(db, { slug: 'project-c', status: 'draft' });

      expect(await countProjects(db, { publishedOnly: true })).toBe(2);
      expect(await countProjects(db, { publishedOnly: true, featured: true })).toBe(1);
      expect(await countProjects(db, {})).toBe(3);
    });
  });
});
