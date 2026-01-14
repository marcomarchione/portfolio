/**
 * Force Delete API Tests
 *
 * Tests for force delete functionality with cascade deletion.
 */
import { describe, test, expect, beforeEach, beforeAll, afterAll, afterEach } from 'bun:test';
import {
  createTestAppWithAuth,
  testAuthJsonRequest,
  type AuthTestApp,
} from '../../test-utils';
import { seedProject, seedNews } from '../../db/test-utils';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

describe('Force Delete Technologies', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeAll(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  beforeEach(async () => {
    await testApp.reset();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  test('force delete technology removes project_technologies junction records', async () => {
    // Create a project with a technology
    const { technologyIds } = await seedProject(testApp.db, {
      slug: 'test-project-with-tech',
      status: 'published',
      translations: [{ lang: 'it', title: 'Test Project' }],
      technologies: ['React'],
    });

    const techId = technologyIds[0];

    // Verify technology is referenced
    const refsBefore = await testApp.db
      .select()
      .from(schema.projectTechnologies)
      .where(eq(schema.projectTechnologies.technologyId, techId));
    expect(refsBefore.length).toBeGreaterThan(0);

    // Force delete the technology
    const { status, body } = await testAuthJsonRequest<{
      data: { message: string; id: number };
    }>(
      testApp.app,
      `/api/v1/admin/technologies/${techId}?force=true`,
      accessToken,
      { method: 'DELETE' }
    );

    expect(status).toBe(200);
    expect(body.data.message).toContain('deleted');

    // Verify junction records are removed
    const refsAfter = await testApp.db
      .select()
      .from(schema.projectTechnologies)
      .where(eq(schema.projectTechnologies.technologyId, techId));
    expect(refsAfter.length).toBe(0);

    // Verify technology is deleted
    const techResult = await testApp.db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.id, techId));
    expect(techResult.length).toBe(0);
  });

  test('force=true bypasses reference check for technologies', async () => {
    // Create a referenced technology
    await seedProject(testApp.db, {
      slug: 'project-ref',
      status: 'draft',
      translations: [{ lang: 'it', title: 'Project' }],
      technologies: ['TypeScript'],
    });

    // Get the technology ID
    const techResult = await testApp.db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, 'TypeScript'));
    const tech = techResult[0];

    // Without force, should get 409 Conflict
    const { status: normalStatus } = await testAuthJsonRequest<unknown>(
      testApp.app,
      `/api/v1/admin/technologies/${tech!.id}`,
      accessToken,
      { method: 'DELETE' }
    );
    expect(normalStatus).toBe(409);

    // With force=true, should succeed
    const { status: forceStatus, body } = await testAuthJsonRequest<{
      data: { message: string };
    }>(
      testApp.app,
      `/api/v1/admin/technologies/${tech!.id}?force=true`,
      accessToken,
      { method: 'DELETE' }
    );
    expect(forceStatus).toBe(200);
    expect(body.data.message).toContain('deleted');
  });

  test('force=false (default) preserves existing 409 Conflict behavior for technologies', async () => {
    // Create a referenced technology
    await seedProject(testApp.db, {
      slug: 'project-conflict',
      status: 'published',
      translations: [{ lang: 'it', title: 'Project' }],
      technologies: ['Vue'],
    });

    const techResult = await testApp.db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, 'Vue'));
    const tech = techResult[0];

    // Default (no force param) should return 409
    const { status, body } = await testAuthJsonRequest<{
      error: string;
      message: string;
    }>(
      testApp.app,
      `/api/v1/admin/technologies/${tech!.id}`,
      accessToken,
      { method: 'DELETE' }
    );

    expect(status).toBe(409);
    expect(body.message).toContain('referenced');
  });
});

describe('Force Delete Tags', () => {
  let testApp: AuthTestApp;
  let accessToken: string;

  beforeAll(async () => {
    testApp = createTestAppWithAuth();
    accessToken = await testApp.generateAccessToken();
  });

  beforeEach(async () => {
    await testApp.reset();
  });

  afterAll(async () => {
    await testApp.cleanup();
  });

  test('force delete tag removes news_tags junction records', async () => {
    // Create a news item with a tag
    const { tagIds } = await seedNews(testApp.db, {
      slug: 'test-news-with-tag',
      status: 'published',
      translations: [{ lang: 'it', title: 'Test News' }],
      tags: [{ name: 'Technology', slug: 'technology' }],
    });

    const tagId = tagIds[0];

    // Verify tag is referenced
    const refsBefore = await testApp.db
      .select()
      .from(schema.newsTags)
      .where(eq(schema.newsTags.tagId, tagId));
    expect(refsBefore.length).toBeGreaterThan(0);

    // Force delete the tag
    const { status, body } = await testAuthJsonRequest<{
      data: { message: string; id: number };
    }>(
      testApp.app,
      `/api/v1/admin/tags/${tagId}?force=true`,
      accessToken,
      { method: 'DELETE' }
    );

    expect(status).toBe(200);
    expect(body.data.message).toContain('deleted');

    // Verify junction records are removed
    const refsAfter = await testApp.db
      .select()
      .from(schema.newsTags)
      .where(eq(schema.newsTags.tagId, tagId));
    expect(refsAfter.length).toBe(0);

    // Verify tag is deleted
    const tagResult = await testApp.db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.id, tagId));
    expect(tagResult.length).toBe(0);
  });

  test('force=false (default) preserves existing 409 Conflict behavior for tags', async () => {
    // Create a referenced tag
    await seedNews(testApp.db, {
      slug: 'news-conflict',
      status: 'draft',
      translations: [{ lang: 'it', title: 'News' }],
      tags: [{ name: 'Tutorial', slug: 'tutorial' }],
    });

    const tagResult = await testApp.db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, 'tutorial'));
    const tag = tagResult[0];

    // Default (no force param) should return 409
    const { status, body } = await testAuthJsonRequest<{
      error: string;
      message: string;
    }>(
      testApp.app,
      `/api/v1/admin/tags/${tag!.id}`,
      accessToken,
      { method: 'DELETE' }
    );

    expect(status).toBe(409);
    expect(body.message).toContain('referenced');
  });
});
