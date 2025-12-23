/**
 * Integration Tests
 *
 * End-to-end database operations validating complete workflows.
 * These tests supplement the focused tests from Task Groups 1-4.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, and } from 'drizzle-orm';
import {
  createTestDatabase,
  resetDatabase,
  closeDatabase,
  seedProject,
  seedNews,
  seedMaterial,
  seedMedia,
} from './test-utils';
import {
  contentBase,
  contentTranslations,
  projects,
  materials,
  news,
  technologies,
  tags,
  media,
  projectTechnologies,
  newsTags,
} from './schema';
import type { Database } from 'bun:sqlite';

describe('Integration Tests', () => {
  let sqlite: Database;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(() => {
    const testDb = createTestDatabase();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  afterAll(() => {
    closeDatabase(sqlite);
  });

  beforeEach(() => {
    resetDatabase(sqlite);
  });

  test('creates a complete project with translations and technologies (end-to-end)', async () => {
    const result = await seedProject(db, {
      slug: 'complete-project',
      status: 'published',
      featured: true,
      translations: [
        {
          lang: 'it',
          title: 'Progetto Completo',
          description: 'Una descrizione del progetto',
          body: '# Contenuto Markdown',
        },
        {
          lang: 'en',
          title: 'Complete Project',
          description: 'A project description',
          body: '# Markdown Content',
        },
      ],
      technologies: ['TypeScript', 'React', 'Drizzle'],
    });

    // Verify content_base
    const contentResult = db.select().from(contentBase).where(eq(contentBase.id, result.contentId)).all();
    expect(contentResult).toHaveLength(1);
    expect(contentResult[0].type).toBe('project');
    expect(contentResult[0].status).toBe('published');
    expect(contentResult[0].featured).toBe(true);
    expect(contentResult[0].publishedAt).not.toBeNull();

    // Verify translations
    const translationsResult = db
      .select()
      .from(contentTranslations)
      .where(eq(contentTranslations.contentId, result.contentId))
      .all();
    expect(translationsResult).toHaveLength(2);
    expect(translationsResult.find((t) => t.lang === 'it')?.title).toBe('Progetto Completo');
    expect(translationsResult.find((t) => t.lang === 'en')?.title).toBe('Complete Project');

    // Verify project extension
    const projectResult = db.select().from(projects).where(eq(projects.id, result.projectId)).all();
    expect(projectResult).toHaveLength(1);

    // Verify technologies
    const techResult = db.select().from(technologies).all();
    expect(techResult).toHaveLength(3);

    // Verify links
    const linksResult = db
      .select()
      .from(projectTechnologies)
      .where(eq(projectTechnologies.projectId, result.projectId))
      .all();
    expect(linksResult).toHaveLength(3);
  });

  test('creates a complete news article with translations and tags (end-to-end)', async () => {
    const result = await seedNews(db, {
      slug: 'complete-news',
      status: 'published',
      translations: [
        {
          lang: 'it',
          title: 'Articolo Completo',
          description: 'Una descrizione',
          body: '# Contenuto dell\'articolo',
        },
        {
          lang: 'en',
          title: 'Complete Article',
          description: 'A description',
          body: '# Article content',
        },
        {
          lang: 'es',
          title: 'Articulo Completo',
          description: 'Una descripcion',
          body: '# Contenido del articulo',
        },
        {
          lang: 'de',
          title: 'Vollstandiger Artikel',
          description: 'Eine Beschreibung',
          body: '# Artikelinhalt',
        },
      ],
      tags: [
        { name: 'Tech', slug: 'tech' },
        { name: 'Tutorial', slug: 'tutorial' },
      ],
      readingTime: 10,
    });

    // Verify content_base
    const contentResult = db.select().from(contentBase).where(eq(contentBase.id, result.contentId)).all();
    expect(contentResult).toHaveLength(1);
    expect(contentResult[0].type).toBe('news');
    expect(contentResult[0].status).toBe('published');

    // Verify translations (all 4 languages)
    const translationsResult = db
      .select()
      .from(contentTranslations)
      .where(eq(contentTranslations.contentId, result.contentId))
      .all();
    expect(translationsResult).toHaveLength(4);

    // Verify news extension
    const newsResult = db.select().from(news).where(eq(news.id, result.newsId)).all();
    expect(newsResult).toHaveLength(1);
    expect(newsResult[0].readingTime).toBe(10);

    // Verify tags
    const tagsResult = db.select().from(tags).all();
    expect(tagsResult).toHaveLength(2);

    // Verify links
    const linksResult = db.select().from(newsTags).where(eq(newsTags.newsId, result.newsId)).all();
    expect(linksResult).toHaveLength(2);
  });

  test('creates material with all fields populated', async () => {
    const result = await seedMaterial(db, {
      slug: 'complete-material',
      category: 'guide',
      downloadUrl: 'https://example.com/guide.pdf',
      fileSize: 1024 * 1024 * 5, // 5MB
      status: 'published',
      translations: [
        { lang: 'it', title: 'Guida Completa', description: 'Una guida dettagliata' },
        { lang: 'en', title: 'Complete Guide', description: 'A detailed guide' },
      ],
    });

    // Verify content_base
    const contentResult = db.select().from(contentBase).where(eq(contentBase.id, result.contentId)).all();
    expect(contentResult).toHaveLength(1);
    expect(contentResult[0].type).toBe('material');

    // Verify translations
    const translationsResult = db
      .select()
      .from(contentTranslations)
      .where(eq(contentTranslations.contentId, result.contentId))
      .all();
    expect(translationsResult).toHaveLength(2);

    // Verify material extension
    const materialResult = db.select().from(materials).where(eq(materials.id, result.materialId)).all();
    expect(materialResult).toHaveLength(1);
    expect(materialResult[0].category).toBe('guide');
    expect(materialResult[0].downloadUrl).toBe('https://example.com/guide.pdf');
    expect(materialResult[0].fileSize).toBe(5242880);
  });

  test('media table insertion and storage_key retrieval', async () => {
    const result1 = await seedMedia(db, {
      filename: 'image1.png',
      mimeType: 'image/png',
      size: 1024,
      storageKey: 'uploads/2024/01/image1.png',
      altText: 'First image',
    });

    const result2 = await seedMedia(db, {
      filename: 'document.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      storageKey: 'uploads/2024/01/document.pdf',
    });

    // Retrieve by storage_key
    const mediaResult = db.select().from(media).where(eq(media.storageKey, 'uploads/2024/01/image1.png')).all();

    expect(mediaResult).toHaveLength(1);
    expect(mediaResult[0].filename).toBe('image1.png');
    expect(mediaResult[0].mimeType).toBe('image/png');
    expect(mediaResult[0].size).toBe(1024);
    expect(mediaResult[0].altText).toBe('First image');
    expect(mediaResult[0].id).toBe(result1.mediaId);

    // Retrieve all media
    const allMedia = db.select().from(media).all();
    expect(allMedia).toHaveLength(2);
  });

  test('querying content with joins across related tables', async () => {
    // Create a project with related data
    await seedProject(db, {
      slug: 'join-test-project',
      status: 'published',
      translations: [
        { lang: 'it', title: 'Titolo Italiano', description: 'Descrizione' },
        { lang: 'en', title: 'English Title', description: 'Description' },
      ],
      technologies: ['Vue', 'Nuxt'],
    });

    // Query with joins: content_base -> content_translations
    const queryResult = db
      .select({
        id: contentBase.id,
        slug: contentBase.slug,
        status: contentBase.status,
        title: contentTranslations.title,
        lang: contentTranslations.lang,
      })
      .from(contentBase)
      .innerJoin(contentTranslations, eq(contentBase.id, contentTranslations.contentId))
      .where(and(eq(contentBase.slug, 'join-test-project'), eq(contentTranslations.lang, 'en')))
      .all();

    expect(queryResult).toHaveLength(1);
    expect(queryResult[0].title).toBe('English Title');
    expect(queryResult[0].status).toBe('published');

    // Query project with technologies
    const projectData = db.select().from(projects).all()[0];

    const techLinks = db
      .select({
        techName: technologies.name,
      })
      .from(projectTechnologies)
      .innerJoin(technologies, eq(projectTechnologies.technologyId, technologies.id))
      .where(eq(projectTechnologies.projectId, projectData.id))
      .all();

    expect(techLinks).toHaveLength(2);
    expect(techLinks.map((t) => t.techName)).toContain('Vue');
    expect(techLinks.map((t) => t.techName)).toContain('Nuxt');
  });

  test('content update modifies updated_at timestamp', async () => {
    const now = new Date();

    // Create content
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'timestamp-test',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const created = db.select().from(contentBase).where(eq(contentBase.slug, 'timestamp-test')).all()[0];

    const originalUpdatedAt = created.updatedAt;

    // Wait a bit and update
    await new Promise((resolve) => setTimeout(resolve, 10));

    const laterTime = new Date();
    db.update(contentBase)
      .set({ status: 'published', updatedAt: laterTime, publishedAt: laterTime })
      .where(eq(contentBase.id, created.id))
      .run();

    const updated = db.select().from(contentBase).where(eq(contentBase.id, created.id)).all()[0];

    expect(updated.status).toBe('published');
    expect(updated.updatedAt).not.toEqual(originalUpdatedAt);
    expect(updated.publishedAt).not.toBeNull();
  });
});
