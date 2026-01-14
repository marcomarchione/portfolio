/**
 * Public News API Tests
 *
 * Focused tests for the news section feature.
 * Tests API endpoints, query parameters, pagination, and sortBy functionality.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createTestApp } from '../test-utils';
import type { Language } from '../db/schema';

describe('Public News API', () => {
  const testApp = createTestApp();
  const BASE_URL = 'http://localhost/api/v1/news';

  beforeAll(async () => {
    // Create test news articles with different dates for sorting tests
    const now = new Date();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Article 1: oldest (5 days ago)
    await testApp.db.execute(`
      INSERT INTO content_base (id, type, slug, status, featured, published_at, created_at, updated_at)
      VALUES (1001, 'news', 'test-article-1', 'published', false, '${new Date(now.getTime() - 5 * dayInMs).toISOString()}', '${now.toISOString()}', '${now.toISOString()}')
    `);
    await testApp.db.execute(`
      INSERT INTO news (content_id, cover_image, reading_time)
      VALUES (1001, 'https://example.com/cover1.jpg', 5)
    `);
    await testApp.db.execute(`
      INSERT INTO content_translations (content_id, lang, title, description, body)
      VALUES (1001, 'en', 'Alpha Article', 'First article', 'Content 1')
    `);

    // Article 2: newest (1 day ago)
    await testApp.db.execute(`
      INSERT INTO content_base (id, type, slug, status, featured, published_at, created_at, updated_at)
      VALUES (1002, 'news', 'test-article-2', 'published', false, '${new Date(now.getTime() - 1 * dayInMs).toISOString()}', '${now.toISOString()}', '${now.toISOString()}')
    `);
    await testApp.db.execute(`
      INSERT INTO news (content_id, cover_image, reading_time)
      VALUES (1002, null, 3)
    `);
    await testApp.db.execute(`
      INSERT INTO content_translations (content_id, lang, title, description, body)
      VALUES (1002, 'en', 'Zulu Article', 'Second article', 'Content 2')
    `);

    // Article 3: middle (3 days ago)
    await testApp.db.execute(`
      INSERT INTO content_base (id, type, slug, status, featured, published_at, created_at, updated_at)
      VALUES (1003, 'news', 'test-article-3', 'published', true, '${new Date(now.getTime() - 3 * dayInMs).toISOString()}', '${now.toISOString()}', '${now.toISOString()}')
    `);
    await testApp.db.execute(`
      INSERT INTO news (content_id)
      VALUES (1003)
    `);
    await testApp.db.execute(`
      INSERT INTO content_translations (content_id, lang, title, description, body)
      VALUES (1003, 'en', 'Beta Article', 'Third article', 'Content 3')
    `);

    // Create tags
    await testApp.db.execute(`
      INSERT INTO tags (id, name, slug) VALUES (1001, 'Tech', 'tech')
    `);
    await testApp.db.execute(`
      INSERT INTO tags (id, name, slug) VALUES (1002, 'Design', 'design')
    `);

    // Associate tags with news
    const [newsRow1] = await testApp.db.execute(`SELECT id FROM news WHERE content_id = 1001`);
    const [newsRow2] = await testApp.db.execute(`SELECT id FROM news WHERE content_id = 1002`);

    await testApp.db.execute(`INSERT INTO news_tags (news_id, tag_id) VALUES (${(newsRow1 as any).id}, 1001)`);
    await testApp.db.execute(`INSERT INTO news_tags (news_id, tag_id) VALUES (${(newsRow2 as any).id}, 1002)`);
  });

  afterAll(() => {
    testApp.cleanup();
  });

  test('GET /news returns news list with default parameters', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeArray();
    expect(data.pagination).toBeDefined();
    expect(data.pagination.hasMore).toBeBoolean();
    expect(data.data.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /news supports limit and offset pagination', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&limit=2&offset=0`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeArray();
    expect(data.data.length).toBeLessThanOrEqual(2);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.offset).toBe(0);
    expect(data.pagination.hasMore).toBeDefined();
  });

  test('GET /news hasMore boolean is calculated correctly', async () => {
    // Test when there are more items
    const response1 = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&limit=2&offset=0`)
    );
    const data1 = await response1.json();
    expect(data1.pagination.hasMore).toBe(data1.pagination.total > 2);

    // Test when no more items
    const response2 = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&limit=100&offset=0`)
    );
    const data2 = await response2.json();
    expect(data2.pagination.hasMore).toBe(false);
  });

  test('GET /news supports tag filtering', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&tag=tech`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeArray();
    // Should return only articles with 'tech' tag
    expect(data.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /news supports sortBy=newest (default)', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&sortBy=newest`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeArray();
    if (data.data.length >= 2) {
      const first = new Date(data.data[0].publishedAt);
      const second = new Date(data.data[1].publishedAt);
      expect(first.getTime()).toBeGreaterThanOrEqual(second.getTime());
    }
  });

  test('GET /news supports sortBy=oldest', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}?lang=en&sortBy=oldest`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeArray();
    if (data.data.length >= 2) {
      const first = new Date(data.data[0].publishedAt);
      const second = new Date(data.data[1].publishedAt);
      expect(first.getTime()).toBeLessThanOrEqual(second.getTime());
    }
  });

  test('GET /news/:slug returns single article with translations and tags', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}/test-article-1?lang=en`)
    );

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.data).toBeDefined();
    expect(data.data.slug).toBe('test-article-1');
    expect(data.data.translation).toBeDefined();
    expect(data.data.translation.title).toBe('Alpha Article');
    expect(data.data.tags).toBeArray();
  });

  test('GET /news/:slug returns 404 for non-existent article', async () => {
    const response = await testApp.app.handle(
      new Request(`${BASE_URL}/non-existent-article?lang=en`)
    );

    expect(response.status).toBe(404);
  });
});
