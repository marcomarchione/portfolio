/**
 * Strategic Tests
 *
 * Additional tests covering edge cases and integration scenarios.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  testAuthRequest,
  type AuthTestApp,
} from '../../test-utils';
import { seedProject, seedMaterial, seedNews } from '../../db/test-utils';

describe('Dashboard Integration', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('stats correctly count mixed content types and statuses', async () => {
    // Seed various content
    await seedProject(testApp.db, {
      slug: 'project-1',
      status: 'published',
      translations: [{ lang: 'it', title: 'P1' }],
    });
    await seedProject(testApp.db, {
      slug: 'project-2',
      status: 'draft',
      translations: [{ lang: 'it', title: 'P2' }],
    });
    await seedMaterial(testApp.db, {
      slug: 'material-1',
      category: 'guide',
      downloadUrl: 'https://example.com/1.pdf',
      status: 'published',
      translations: [{ lang: 'it', title: 'M1' }],
    });
    await seedNews(testApp.db, {
      slug: 'news-1',
      status: 'archived',
      translations: [{ lang: 'it', title: 'N1' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: {
        projects: { total: number; draft: number; published: number };
        materials: { total: number };
        news: { total: number; archived: number };
      };
    }>(testApp.app, '/api/v1/admin/dashboard/stats', accessToken);

    expect(status).toBe(200);
    expect(body.data.projects.total).toBe(2);
    expect(body.data.projects.draft).toBe(1);
    expect(body.data.projects.published).toBe(1);
    expect(body.data.materials.total).toBe(1);
    expect(body.data.news.total).toBe(1);
    expect(body.data.news.archived).toBe(1);
  });

  test('recent items returns correct order with mixed content types', async () => {
    // Create items with controlled timing
    await seedProject(testApp.db, {
      slug: 'old-project',
      status: 'published',
      translations: [{ lang: 'it', title: 'Old Project' }],
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await seedNews(testApp.db, {
      slug: 'new-news',
      status: 'published',
      translations: [{ lang: 'it', title: 'New News' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: Array<{ slug: string; type: string; title: string | null }>;
    }>(testApp.app, '/api/v1/admin/dashboard/recent', accessToken);

    expect(status).toBe(200);
    expect(body.data[0].slug).toBe('new-news');
    expect(body.data[0].type).toBe('news');
    expect(body.data[1].slug).toBe('old-project');
    expect(body.data[1].type).toBe('project');
  });
});

describe('Search Edge Cases', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('case-insensitive search works correctly', async () => {
    await seedProject(testApp.db, {
      slug: 'project-uppercase',
      status: 'draft',
      translations: [{ lang: 'it', title: 'PROGETTO MAIUSCOLO' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: Array<{ slug: string }>;
      pagination: { total: number };
    }>(testApp.app, '/api/v1/admin/projects?search=progetto', accessToken);

    expect(status).toBe(200);
    expect(body.pagination.total).toBe(1);
  });

  test('partial word search matches correctly', async () => {
    await seedProject(testApp.db, {
      slug: 'project-partial',
      status: 'draft',
      translations: [{ lang: 'it', title: 'Applicazione Web Moderna' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: Array<{ slug: string }>;
      pagination: { total: number };
    }>(testApp.app, '/api/v1/admin/projects?search=Web', accessToken);

    expect(status).toBe(200);
    expect(body.pagination.total).toBe(1);
  });

  test('search combined with status filter works', async () => {
    await seedProject(testApp.db, {
      slug: 'draft-project',
      status: 'draft',
      translations: [{ lang: 'it', title: 'Progetto Bozza' }],
    });
    await seedProject(testApp.db, {
      slug: 'published-project',
      status: 'published',
      translations: [{ lang: 'it', title: 'Progetto Pubblicato' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: Array<{ slug: string }>;
      pagination: { total: number };
    }>(
      testApp.app,
      '/api/v1/admin/projects?search=Progetto&status=draft',
      accessToken
    );

    expect(status).toBe(200);
    expect(body.pagination.total).toBe(1);
    expect(body.data[0].slug).toBe('draft-project');
  });
});

describe('Sorting Edge Cases', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('ascending sort by createdAt returns oldest first', async () => {
    await seedMaterial(testApp.db, {
      slug: 'first',
      category: 'guide',
      downloadUrl: 'https://example.com/1.pdf',
      status: 'draft',
      translations: [{ lang: 'it', title: 'First Material' }],
    });

    await new Promise((resolve) => setTimeout(resolve, 10));

    await seedMaterial(testApp.db, {
      slug: 'second',
      category: 'guide',
      downloadUrl: 'https://example.com/2.pdf',
      status: 'draft',
      translations: [{ lang: 'it', title: 'Second Material' }],
    });

    const { status, body } = await testAuthJsonRequest<{
      data: Array<{ slug: string }>;
    }>(
      testApp.app,
      '/api/v1/admin/materials?sortBy=createdAt&sortOrder=asc',
      accessToken
    );

    expect(status).toBe(200);
    expect(body.data[0].slug).toBe('first');
    expect(body.data[1].slug).toBe('second');
  });
});

describe('Archive Edge Cases', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeEach(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('archiving a project changes its status to archived', async () => {
    const project = await seedProject(testApp.db, {
      slug: 'to-archive',
      status: 'published',
      translations: [{ lang: 'it', title: 'To Archive' }],
    });

    // seedProject returns { contentId, projectId, technologyIds }
    const { status, body } = await testAuthJsonRequest<{
      data: { id: number; status: string };
    }>(testApp.app, `/api/v1/admin/projects/${project.contentId}`, accessToken, {
      method: 'DELETE',
    });

    expect(status).toBe(200);
    expect(body.data.status).toBe('archived');
  });

  test('archiving non-existent content returns 404', async () => {
    const { status, body } = await testAuthJsonRequest<{
      error: { message: string };
    }>(testApp.app, '/api/v1/admin/projects/99999', accessToken, {
      method: 'DELETE',
    });

    expect(status).toBe(404);
  });
});
