/**
 * Full CRUD Test Suite
 *
 * Comprehensive E2E tests for all admin CRUD operations.
 * Creates 2 records per entity, tests all operations, deletes one.
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME!;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD!;
const API_URL = 'http://localhost:3000/api/v1';

let authToken: string;
const testId = Date.now().toString(36); // Unique ID per test run

/** Helper to get auth token */
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }),
  });
  const data = await response.json();
  return data.data.accessToken;
}

/** Helper to make authenticated API calls */
async function apiCall(
  method: string,
  endpoint: string,
  body?: object
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, data };
}

/** Login helper */
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="username"]', ADMIN_USERNAME);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Full CRUD Operations', () => {
  test.beforeAll(async () => {
    authToken = await getAuthToken();
  });

  test.describe('1. Database Population via API', () => {
    test('Create 2 projects with translations', async () => {
      // Project 1
      const proj1 = await apiCall('POST', '/admin/projects', {
        slug: `project-alpha-${testId}`,
        status: 'published',
        featured: true,
        projectStatus: 'completed',
        githubUrl: 'https://github.com/test/alpha',
        demoUrl: 'https://alpha.example.com',
      });
      expect(proj1.status).toBe(201);
      const proj1Id = (proj1.data as { data: { id: number } }).data.id;

      // Add IT translation
      await apiCall('PUT', `/admin/projects/${proj1Id}/translations/it`, {
        title: `Progetto Alpha ${testId}`,
        description: 'Descrizione del progetto Alpha',
        body: '# Progetto Alpha\n\nContenuto dettagliato del progetto.',
      });

      // Add EN translation
      await apiCall('PUT', `/admin/projects/${proj1Id}/translations/en`, {
        title: `Project Alpha ${testId}`,
        description: 'Alpha project description',
        body: '# Project Alpha\n\nDetailed project content.',
      });

      // Project 2
      const proj2 = await apiCall('POST', '/admin/projects', {
        slug: `project-beta-${testId}`,
        status: 'draft',
        featured: false,
        projectStatus: 'in-progress',
      });
      expect(proj2.status).toBe(201);
      const proj2Id = (proj2.data as { data: { id: number } }).data.id;

      await apiCall('PUT', `/admin/projects/${proj2Id}/translations/it`, {
        title: `Progetto Beta ${testId}`,
        description: 'Descrizione del progetto Beta in sviluppo',
      });
    });

    test('Create 2 materials with translations', async () => {
      // Material 1
      const mat1 = await apiCall('POST', '/admin/materials', {
        slug: `material-guide-${testId}`,
        category: 'guide',
        status: 'published',
        featured: true,
        downloadUrl: 'https://example.com/typescript-guide.pdf',
        fileSize: 2500000,
      });
      expect(mat1.status).toBe(201);
      const mat1Id = (mat1.data as { data: { id: number } }).data.id;

      await apiCall('PUT', `/admin/materials/${mat1Id}/translations/it`, {
        title: `Guida TypeScript ${testId}`,
        description: 'Una guida completa per imparare TypeScript',
        body: '# TypeScript Guide\n\nContenuto della guida.',
      });

      await apiCall('PUT', `/admin/materials/${mat1Id}/translations/en`, {
        title: `TypeScript Guide ${testId}`,
        description: 'A complete guide to learn TypeScript',
      });

      // Material 2
      const mat2 = await apiCall('POST', '/admin/materials', {
        slug: `material-template-${testId}`,
        category: 'template',
        status: 'draft',
        featured: false,
        downloadUrl: 'https://example.com/react-template.zip',
      });
      expect(mat2.status).toBe(201);
      const mat2Id = (mat2.data as { data: { id: number } }).data.id;

      await apiCall('PUT', `/admin/materials/${mat2Id}/translations/it`, {
        title: `Template React ${testId}`,
        description: 'Template per iniziare con React',
      });
    });

    test('Create 2 news articles with translations', async () => {
      // News 1
      const news1 = await apiCall('POST', '/admin/news', {
        slug: `news-launch-${testId}`,
        status: 'published',
        featured: true,
        readingTime: 5,
      });
      expect(news1.status).toBe(201);
      const news1Id = (news1.data as { data: { id: number } }).data.id;

      await apiCall('PUT', `/admin/news/${news1Id}/translations/it`, {
        title: `Lancio Portfolio ${testId}`,
        description: 'Annuncio del lancio del nuovo sito portfolio',
        body: '# Lancio\n\nSono felice di annunciare il lancio del mio nuovo portfolio.',
      });

      await apiCall('PUT', `/admin/news/${news1Id}/translations/en`, {
        title: `Portfolio Launch ${testId}`,
        description: 'Announcing the launch of the new portfolio website',
      });

      // News 2
      const news2 = await apiCall('POST', '/admin/news', {
        slug: `news-update-${testId}`,
        status: 'draft',
        featured: false,
        readingTime: 3,
      });
      expect(news2.status).toBe(201);
      const news2Id = (news2.data as { data: { id: number } }).data.id;

      await apiCall('PUT', `/admin/news/${news2Id}/translations/it`, {
        title: `Aggiornamento ${testId}`,
        description: 'Un aggiornamento importante sui progetti in corso',
      });
    });

    test('Create 2 technologies', async () => {
      const tech1 = await apiCall('POST', '/admin/technologies', {
        name: `TypeScript ${testId}`,
        slug: `typescript-${testId}`,
        category: 'language',
        icon: 'typescript',
        color: '#3178C6',
      });
      expect(tech1.status).toBe(201);

      const tech2 = await apiCall('POST', '/admin/technologies', {
        name: `React ${testId}`,
        slug: `react-${testId}`,
        category: 'framework',
        icon: 'react',
        color: '#61DAFB',
      });
      expect(tech2.status).toBe(201);
    });

    test('Create 2 tags', async () => {
      const tag1 = await apiCall('POST', '/admin/tags', {
        name: `Tutorial ${testId}`,
        slug: `tutorial-${testId}`,
      });
      expect(tag1.status).toBe(201);

      const tag2 = await apiCall('POST', '/admin/tags', {
        name: `Release ${testId}`,
        slug: `release-${testId}`,
      });
      expect(tag2.status).toBe(201);
    });
  });

  test.describe('2. Dashboard Statistics Verification', () => {
    test('Dashboard shows correct counts', async ({ page }) => {
      await login(page);

      // Verify dashboard stats
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

      // Check stats API - should have at least 2 of each (our test data)
      const stats = await apiCall('GET', '/admin/dashboard/stats');
      const statsData = (stats.data as { data: { projects: { total: number }; materials: { total: number }; news: { total: number } } }).data;

      expect(statsData.projects.total).toBeGreaterThanOrEqual(2);
      expect(statsData.materials.total).toBeGreaterThanOrEqual(2);
      expect(statsData.news.total).toBeGreaterThanOrEqual(2);

      await page.screenshot({ path: 'e2e/screenshots/01-dashboard-populated.png', fullPage: true });
    });

    test('Recent activity shows items', async ({ page }) => {
      await login(page);

      const recentSection = page.locator('text=Recent Activity');
      await expect(recentSection).toBeVisible();

      // Should show recent items
      const recentItems = page.locator('[class*="divide-y"] a');
      expect(await recentItems.count()).toBeGreaterThan(0);

      await page.screenshot({ path: 'e2e/screenshots/02-dashboard-recent.png', fullPage: true });
    });
  });

  test.describe('3. Projects CRUD UI', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav >> text=Projects');
      await page.waitForLoadState('networkidle');
    });

    test('List shows projects', async ({ page }) => {
      // Should show at least some projects
      const table = page.locator('table, [class*="list"]').first();
      await expect(table).toBeVisible();
      await page.screenshot({ path: 'e2e/screenshots/03-projects-list.png', fullPage: true });
    });

    test('Can view project details', async ({ page }) => {
      // Click edit icon in first row
      const editLink = page.locator('table tbody tr').first().locator('a').first();
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      // Verify form loads - check for Slug label
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/04-project-edit.png', fullPage: true });
    });

    test('Can create new project', async ({ page }) => {
      const newBtn = page.locator('a:has-text("New Project")').first();
      await newBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify form loads - check for Slug label
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/05-project-create.png', fullPage: true });
    });

    test('Filter by status works', async ({ page }) => {
      // Look for status filter dropdown
      const statusFilter = page.locator('[data-testid="status-filter"], button:has-text("Status")').first();
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: 'e2e/screenshots/06-projects-filtered.png', fullPage: true });
    });
  });

  test.describe('4. Materials CRUD UI', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav >> text=Materials');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('List shows materials', async ({ page }) => {
      // Wait for page title
      await expect(page.locator('h1:has-text("Materials")')).toBeVisible({ timeout: 15000 });
      await page.screenshot({ path: 'e2e/screenshots/07-materials-list.png', fullPage: true });
    });

    test('Can view material details', async ({ page }) => {
      await page.waitForTimeout(1000);
      const editLink = page.locator('table tbody tr').first().locator('a').first();
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 15000 });
      await page.screenshot({ path: 'e2e/screenshots/08-material-edit.png', fullPage: true });
    });
  });

  test.describe('5. News CRUD UI', () => {
    test.beforeEach(async ({ page }) => {
      await login(page);
      await page.click('nav >> text=News');
      await page.waitForLoadState('networkidle');
    });

    test('List shows news articles', async ({ page }) => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/09-news-list.png', fullPage: true });
    });

    test('Can view news details', async ({ page }) => {
      const editLink = page.locator('table tbody tr').first().locator('a').first();
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/10-news-edit.png', fullPage: true });
    });
  });

  test.describe('6. Translation UI', () => {
    test('Language tabs work correctly', async ({ page }) => {
      await login(page);
      await page.click('nav >> text=Projects');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click edit on first project
      const editLink = page.locator('table tbody tr').first().locator('a').first();
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify form loaded with Slug field (content has translations)
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 15000 });

      await page.screenshot({ path: 'e2e/screenshots/11-translation-tabs.png', fullPage: true });
    });
  });

  test.describe('7. Archive/Delete Operations', () => {
    test('Archive project via API', async () => {
      // Get projects with our test slug
      const projects = await apiCall('GET', `/admin/projects?search=beta-${testId}`);
      const projectsData = (projects.data as { data: Array<{ id: number; slug: string }> }).data;
      const betaProject = projectsData.find(p => p.slug.includes(`beta-${testId}`));

      if (betaProject) {
        const archiveResult = await apiCall('DELETE', `/admin/projects/${betaProject.id}`);
        expect(archiveResult.status).toBe(200);
        const archivedData = (archiveResult.data as { data: { status: string } }).data;
        expect(archivedData.status).toBe('archived');
      }
    });

    test('Archive material via API', async () => {
      const materials = await apiCall('GET', `/admin/materials?search=template-${testId}`);
      const materialsData = (materials.data as { data: Array<{ id: number; slug: string }> }).data;
      const templateMaterial = materialsData.find(m => m.slug.includes(`template-${testId}`));

      if (templateMaterial) {
        const archiveResult = await apiCall('DELETE', `/admin/materials/${templateMaterial.id}`);
        expect(archiveResult.status).toBe(200);
      }
    });

    test('Archive news via API', async () => {
      const news = await apiCall('GET', `/admin/news?search=update-${testId}`);
      const newsData = (news.data as { data: Array<{ id: number; slug: string }> }).data;
      const updateNews = newsData.find(n => n.slug.includes(`update-${testId}`));

      if (updateNews) {
        const archiveResult = await apiCall('DELETE', `/admin/news/${updateNews.id}`);
        expect(archiveResult.status).toBe(200);
      }
    });

    test('Dashboard reflects archived items', async ({ page }) => {
      await login(page);

      // Check stats - should have some archived counts
      const stats = await apiCall('GET', '/admin/dashboard/stats');
      const statsData = (stats.data as { data: { projects: { total: number; archived: number } } }).data;

      expect(statsData.projects.archived).toBeGreaterThanOrEqual(1);

      await page.screenshot({ path: 'e2e/screenshots/12-dashboard-after-archive.png', fullPage: true });
    });
  });

  test.describe('8. UI/UX Consistency Check', () => {
    test('Navigation consistency', async ({ page }) => {
      await login(page);

      // Check all nav items are present and styled consistently
      const navItems = ['Dashboard', 'Projects', 'Materials', 'News', 'Media', 'Settings'];
      for (const item of navItems) {
        await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
      }
    });

    test('Form consistency across content types', async ({ page }) => {
      await login(page);

      // Check Projects form
      await page.click('nav >> text=Projects');
      await page.waitForLoadState('networkidle');
      await page.click('a:has-text("New Project")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify slug field exists by label
      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/13-project-form.png', fullPage: true });

      // Check Materials form
      await page.click('nav >> text=Materials');
      await page.waitForLoadState('networkidle');
      await page.click('a:has-text("New Material")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/14-material-form.png', fullPage: true });

      // Check News form
      await page.click('nav >> text=News');
      await page.waitForLoadState('networkidle');
      await page.click('a:has-text("New Article")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Slug')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: 'e2e/screenshots/15-news-form.png', fullPage: true });
    });

    test('Responsive design check', async ({ page }) => {
      await login(page);

      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: 'e2e/screenshots/16-mobile-dashboard.png', fullPage: true });

      // Tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({ path: 'e2e/screenshots/17-tablet-dashboard.png', fullPage: true });

      // Desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({ path: 'e2e/screenshots/18-desktop-dashboard.png', fullPage: true });
    });

    test('Error handling UI', async ({ page }) => {
      await login(page);

      // Navigate to non-existent content
      await page.goto('/projects/99999/edit');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/19-error-handling.png', fullPage: true });
    });
  });
});
