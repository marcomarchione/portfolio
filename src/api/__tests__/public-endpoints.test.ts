/**
 * Public Content Endpoint Tests
 *
 * Tests for public read-only endpoints for projects, materials, news, and technologies.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestApp,
  testJsonRequest,
  type TestApp,
} from '../test-utils';
import {
  createProject,
  createMaterial,
  createNews,
  createTechnology,
  createTag,
  upsertTranslation,
  assignTechnologies,
  assignTags,
  getProjectByContentId,
  getNewsByContentId,
} from '../../db/queries';

describe('Public Content Endpoints', () => {
  let testApp: TestApp;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  describe('GET /projects', () => {
    test('returns only published content', async () => {
      // Create projects with different statuses
      createProject(testApp.db, { slug: 'draft-project', status: 'draft' });
      createProject(testApp.db, { slug: 'published-project', status: 'published' });
      createProject(testApp.db, { slug: 'archived-project', status: 'archived' });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; status: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/projects');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('published-project');
      expect(body.data[0].status).toBe('published');
    });

    test('returns projects with translations for requested language', async () => {
      const project = createProject(testApp.db, { slug: 'test-project', status: 'published' });
      upsertTranslation(testApp.db, project.id, 'en', {
        title: 'English Title',
        description: 'English description',
      });
      upsertTranslation(testApp.db, project.id, 'it', {
        title: 'Titolo Italiano',
        description: 'Descrizione italiana',
      });

      const enResponse = await testJsonRequest<{
        data: Array<{ translation: { title: string } }>;
      }>(testApp.app, '/api/v1/projects?lang=en');

      expect(enResponse.body.data[0].translation.title).toBe('English Title');

      const itResponse = await testJsonRequest<{
        data: Array<{ translation: { title: string } }>;
      }>(testApp.app, '/api/v1/projects?lang=it');

      expect(itResponse.body.data[0].translation.title).toBe('Titolo Italiano');
    });
  });

  describe('GET /projects/:slug', () => {
    test('returns correct translation with ?lang= parameter', async () => {
      const project = createProject(testApp.db, { slug: 'lang-test', status: 'published' });
      upsertTranslation(testApp.db, project.id, 'en', {
        title: 'English Project',
      });
      upsertTranslation(testApp.db, project.id, 'es', {
        title: 'Proyecto en Espanol',
      });

      const { status, body } = await testJsonRequest<{
        data: { translation: { title: string; lang: string } };
      }>(testApp.app, '/api/v1/projects/lang-test?lang=es');

      expect(status).toBe(200);
      expect(body.data.translation.lang).toBe('es');
      expect(body.data.translation.title).toBe('Proyecto en Espanol');
    });

    test('returns 404 for non-published project', async () => {
      createProject(testApp.db, { slug: 'draft-only', status: 'draft' });

      const { status, body } = await testJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/projects/draft-only'
      );

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    });

    test('returns 404 for non-existent project', async () => {
      const { status, body } = await testJsonRequest<{ error: string }>(
        testApp.app,
        '/api/v1/projects/does-not-exist'
      );

      expect(status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    });
  });

  describe('GET /materials', () => {
    test('with ?category= filter', async () => {
      createMaterial(testApp.db, {
        slug: 'guide-1',
        category: 'guide',
        downloadUrl: 'https://example.com/guide1.pdf',
        status: 'published',
      });
      createMaterial(testApp.db, {
        slug: 'template-1',
        category: 'template',
        downloadUrl: 'https://example.com/template1.zip',
        status: 'published',
      });

      const { status, body } = await testJsonRequest<{
        data: Array<{ slug: string; category: string }>;
        pagination: { total: number };
      }>(testApp.app, '/api/v1/materials?category=guide');

      expect(status).toBe(200);
      expect(body.pagination.total).toBe(1);
      expect(body.data[0].slug).toBe('guide-1');
      expect(body.data[0].category).toBe('guide');
    });
  });

  describe('GET /news', () => {
    test('with pagination (limit/offset)', async () => {
      // Create 5 news items
      for (let i = 1; i <= 5; i++) {
        createNews(testApp.db, { slug: `news-${i}`, status: 'published' });
      }

      // First page
      const page1 = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { total: number; offset: number; limit: number; hasMore: boolean };
      }>(testApp.app, '/api/v1/news?limit=2&offset=0');

      expect(page1.body.data.length).toBe(2);
      expect(page1.body.pagination.total).toBe(5);
      expect(page1.body.pagination.hasMore).toBe(true);

      // Second page
      const page2 = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { hasMore: boolean };
      }>(testApp.app, '/api/v1/news?limit=2&offset=2');

      expect(page2.body.data.length).toBe(2);
      expect(page2.body.pagination.hasMore).toBe(true);

      // Third page
      const page3 = await testJsonRequest<{
        data: Array<{ slug: string }>;
        pagination: { hasMore: boolean };
      }>(testApp.app, '/api/v1/news?limit=2&offset=4');

      expect(page3.body.data.length).toBe(1);
      expect(page3.body.pagination.hasMore).toBe(false);
    });

    test('includes tags in response', async () => {
      const newsItem = createNews(testApp.db, { slug: 'tagged-news', status: 'published' });
      const tag1 = createTag(testApp.db, { name: 'JavaScript', slug: 'javascript' });
      const tag2 = createTag(testApp.db, { name: 'Tutorial', slug: 'tutorial' });
      const newsRecord = getNewsByContentId(testApp.db, newsItem.id)!;
      assignTags(testApp.db, newsRecord.id, [tag1.id, tag2.id]);

      const { status, body } = await testJsonRequest<{
        data: { tags: Array<{ name: string; slug: string }> };
      }>(testApp.app, '/api/v1/news/tagged-news');

      expect(status).toBe(200);
      expect(body.data.tags.length).toBe(2);
      expect(body.data.tags.map((t) => t.slug)).toContain('javascript');
      expect(body.data.tags.map((t) => t.slug)).toContain('tutorial');
    });
  });

  describe('GET /technologies', () => {
    test('returns all technologies', async () => {
      createTechnology(testApp.db, { name: 'React', color: '#61dafb' });
      createTechnology(testApp.db, { name: 'Vue', color: '#42b883' });
      createTechnology(testApp.db, { name: 'Angular', color: '#dd0031' });

      const { status, body } = await testJsonRequest<{
        data: Array<{ id: number; name: string; color: string | null }>;
      }>(testApp.app, '/api/v1/technologies');

      expect(status).toBe(200);
      expect(body.data.length).toBe(3);

      const names = body.data.map((t) => t.name);
      expect(names).toContain('React');
      expect(names).toContain('Vue');
      expect(names).toContain('Angular');
    });
  });

  describe('GET /projects with technology filter', () => {
    test('filters by technology name', async () => {
      const tech = createTechnology(testApp.db, { name: 'React' });

      const project1 = createProject(testApp.db, { slug: 'react-app', status: 'published' });
      const project2 = createProject(testApp.db, { slug: 'vue-app', status: 'published' });

      const projectRecord = getProjectByContentId(testApp.db, project1.id)!;
      assignTechnologies(testApp.db, projectRecord.id, [tech.id]);

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
