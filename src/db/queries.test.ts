/**
 * Database Query Utilities Tests
 *
 * Tests for content query helper functions.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
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
import type { Database } from 'bun:sqlite';

describe('Database Query Utilities', () => {
  let sqlite: Database;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeEach(() => {
    const testDb = createTestDatabase();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  afterEach(() => {
    closeDatabase(sqlite);
  });

  describe('getProjectWithTranslation', () => {
    test('returns correct structure with project and translation', () => {
      // Create a project
      const project = createProject(db, {
        slug: 'test-project',
        status: 'published',
      });

      // Add translation
      upsertTranslation(db, project.id, 'en', {
        title: 'Test Project',
        description: 'A test project',
      });

      const result = getProjectWithTranslation(db, 'test-project', 'en');

      expect(result).not.toBeNull();
      expect(result!.slug).toBe('test-project');
      expect(result!.status).toBe('published');
      expect(result!.translation).not.toBeNull();
      expect(result!.translation!.title).toBe('Test Project');
      expect(result!.technologies).toEqual([]);
    });

    test('returns null for non-existent project', () => {
      const result = getProjectWithTranslation(db, 'non-existent', 'en');
      expect(result).toBeNull();
    });
  });

  describe('listProjects pagination', () => {
    test('respects limit and offset', () => {
      // Create multiple projects
      createProject(db, { slug: 'project-1', status: 'published' });
      createProject(db, { slug: 'project-2', status: 'published' });
      createProject(db, { slug: 'project-3', status: 'published' });

      const page1 = listProjects(db, { limit: 2, offset: 0, publishedOnly: true });
      expect(page1.length).toBe(2);

      const page2 = listProjects(db, { limit: 2, offset: 2, publishedOnly: true });
      expect(page2.length).toBe(1);
    });
  });

  describe('listProjects filters by published status', () => {
    test('publishedOnly returns only published content', () => {
      createProject(db, { slug: 'draft-project', status: 'draft' });
      createProject(db, { slug: 'published-project', status: 'published' });
      createProject(db, { slug: 'archived-project' });
      archiveContent(db, 3); // Archive the last one

      const published = listProjects(db, { publishedOnly: true });
      expect(published.length).toBe(1);
      expect(published[0].slug).toBe('published-project');

      const all = listProjects(db, {});
      expect(all.length).toBe(3);
    });
  });

  describe('createProject uses transaction pattern', () => {
    test('creates content_base and projects extension together', () => {
      const project = createProject(db, {
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
      const content = getContentById(db, project.id);
      expect(content).not.toBeUndefined();
      expect(content!.type).toBe('project');

      const projectRecord = getProjectByContentId(db, project.id);
      expect(projectRecord).not.toBeUndefined();
    });
  });

  describe('updateContentStatus', () => {
    test('sets archived status correctly', () => {
      const project = createProject(db, {
        slug: 'to-archive',
        status: 'published',
      });

      const archived = archiveContent(db, project.id);

      expect(archived).not.toBeUndefined();
      expect(archived!.status).toBe('archived');
    });

    test('sets publishedAt when first published', () => {
      const project = createProject(db, {
        slug: 'draft-to-publish',
        status: 'draft',
      });

      expect(project.publishedAt).toBeNull();

      const published = updateContentStatus(db, project.id, 'published');
      expect(published!.publishedAt).not.toBeNull();
    });
  });

  describe('technology reference check', () => {
    test('isTechnologyReferenced returns true when technology is used', () => {
      // Create technology
      const tech = createTechnology(db, { name: 'React' });

      // Create project and assign technology
      const project = createProject(db, { slug: 'react-project' });
      const projectRecord = getProjectByContentId(db, project.id)!;
      assignTechnologies(db, projectRecord.id, [tech.id]);

      expect(isTechnologyReferenced(db, tech.id)).toBe(true);
    });

    test('deleteTechnology fails when referenced', () => {
      const tech = createTechnology(db, { name: 'Vue' });
      const project = createProject(db, { slug: 'vue-project' });
      const projectRecord = getProjectByContentId(db, project.id)!;
      assignTechnologies(db, projectRecord.id, [tech.id]);

      const deleted = deleteTechnology(db, tech.id);
      expect(deleted).toBe(false);

      // Technology should still exist
      const stillExists = getTechnologyById(db, tech.id);
      expect(stillExists).not.toBeUndefined();
    });

    test('deleteTechnology succeeds when not referenced', () => {
      const tech = createTechnology(db, { name: 'Angular' });

      const deleted = deleteTechnology(db, tech.id);
      expect(deleted).toBe(true);

      const shouldNotExist = getTechnologyById(db, tech.id);
      expect(shouldNotExist).toBeUndefined();
    });
  });

  describe('countContent', () => {
    test('counts content correctly with filters', () => {
      createProject(db, { slug: 'project-a', status: 'published', featured: true });
      createProject(db, { slug: 'project-b', status: 'published', featured: false });
      createProject(db, { slug: 'project-c', status: 'draft' });

      expect(countProjects(db, { publishedOnly: true })).toBe(2);
      expect(countProjects(db, { publishedOnly: true, featured: true })).toBe(1);
      expect(countProjects(db, {})).toBe(3);
    });
  });
});
