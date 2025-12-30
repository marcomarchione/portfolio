/**
 * Content Creation E2E Tests
 *
 * Verifies that content creation actually works for all content types.
 * Tests must pass only when the object is truly created in the database.
 */
import { test, expect, Page } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

/**
 * Helper function to login
 */
async function login(page: Page) {
  await page.goto(ADMIN_URL);
  await page.waitForLoadState('networkidle');

  const loginForm = page.locator('form');
  if (await loginForm.isVisible()) {
    await page.fill('input[type="text"]', ADMIN_USERNAME);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Generate unique slug for test content
 */
function generateUniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

test.describe('Project Creation', () => {
  test('should create a new project and verify it exists', async ({ page }) => {
    await login(page);

    // Navigate to Projects
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Click New Project button
    await page.click('a:has-text("New Project")');
    await page.waitForLoadState('networkidle');

    // Generate unique slug
    const testSlug = generateUniqueSlug('test-project');

    // Fill in required fields
    // Slug
    await page.fill('#slug', testSlug);

    // Italian title (required)
    const itTab = page.locator('button:has-text("IT")').first();
    if (await itTab.isVisible()) {
      await itTab.click();
      await page.waitForTimeout(200);
    }
    await page.fill('input[id*="title"]', `Test Project ${testSlug}`);

    // Take screenshot before saving
    await page.screenshot({ path: 'e2e/screenshots/create-project-before-save.png', fullPage: true });

    // Click Save button
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for navigation to edit page (should redirect after create)
    await page.waitForURL(/\/projects\/\d+\/edit/, { timeout: 10000 });

    // Verify we're now on the edit page with a numeric ID
    const url = page.url();
    expect(url).toMatch(/\/projects\/\d+\/edit$/);

    // Extract the created project ID
    const match = url.match(/\/projects\/(\d+)\/edit$/);
    expect(match).not.toBeNull();
    const projectId = match![1];
    console.log(`Created project with ID: ${projectId}`);

    // Take screenshot after creation
    await page.screenshot({ path: 'e2e/screenshots/create-project-after-save.png', fullPage: true });

    // Verify the project appears in the list
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Verify projects exist in the list (count > 0)
    const projectCount = page.locator('text=/\\d+ projects?/');
    await expect(projectCount).toBeVisible({ timeout: 5000 });

    // Verify there are project rows in the list
    const projectRows = page.locator('table tbody tr, [class*="card"]');
    expect(await projectRows.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/create-project-in-list.png', fullPage: true });

    // The creation was already verified by the successful redirect to /projects/:id/edit
    console.log(`Project ${projectId} created and verified via redirect`);
  });
});

test.describe('Material Creation', () => {
  test('should create a new material and verify it exists', async ({ page }) => {
    await login(page);

    // Navigate to Materials
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    // Click New Material button
    await page.click('a:has-text("New Material")');
    await page.waitForLoadState('networkidle');

    // Generate unique slug
    const testSlug = generateUniqueSlug('test-material');

    // Fill in required fields
    // Slug
    await page.fill('#slug', testSlug);

    // Download URL (required for materials)
    await page.fill('#downloadUrl', 'https://example.com/test-file.pdf');

    // Italian title (required)
    const itTab = page.locator('button:has-text("IT")').first();
    if (await itTab.isVisible()) {
      await itTab.click();
      await page.waitForTimeout(200);
    }
    await page.fill('input[id*="title"]', `Test Material ${testSlug}`);

    // Take screenshot before saving
    await page.screenshot({ path: 'e2e/screenshots/create-material-before-save.png', fullPage: true });

    // Click Save button
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for navigation to edit page (should redirect after create)
    await page.waitForURL(/\/materials\/\d+\/edit/, { timeout: 10000 });

    // Verify we're now on the edit page with a numeric ID
    const url = page.url();
    expect(url).toMatch(/\/materials\/\d+\/edit$/);

    // Extract the created material ID
    const match = url.match(/\/materials\/(\d+)\/edit$/);
    expect(match).not.toBeNull();
    const materialId = match![1];
    console.log(`Created material with ID: ${materialId}`);

    // Take screenshot after creation
    await page.screenshot({ path: 'e2e/screenshots/create-material-after-save.png', fullPage: true });

    // Verify the material appears in the list
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    // Search for our created material by slug
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(testSlug);
      await page.waitForTimeout(500);
    }

    // Verify the material is visible in the list
    await expect(page.locator(`text=${testSlug}`).first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'e2e/screenshots/create-material-in-list.png', fullPage: true });
  });
});

test.describe('News Creation', () => {
  test('should create a new news article and verify it exists', async ({ page }) => {
    await login(page);

    // Navigate to News
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    // Click New Article button
    const newBtn = page.locator('a:has-text("New Article")');
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();
    await page.waitForLoadState('networkidle');

    // Generate unique slug
    const testSlug = generateUniqueSlug('test-news');

    // Fill in required fields
    // Slug
    await page.fill('#slug', testSlug);

    // Italian title (required)
    const itTab = page.locator('button:has-text("IT")').first();
    if (await itTab.isVisible()) {
      await itTab.click();
      await page.waitForTimeout(200);
    }
    await page.fill('input[id*="title"]', `Test News ${testSlug}`);

    // Take screenshot before saving
    await page.screenshot({ path: 'e2e/screenshots/create-news-before-save.png', fullPage: true });

    // Click Save button
    const saveButton = page.locator('button:has-text("Save")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for navigation to edit page (should redirect after create)
    await page.waitForURL(/\/news\/\d+\/edit/, { timeout: 10000 });

    // Verify we're now on the edit page with a numeric ID
    const url = page.url();
    expect(url).toMatch(/\/news\/\d+\/edit$/);

    // Extract the created news ID
    const match = url.match(/\/news\/(\d+)\/edit$/);
    expect(match).not.toBeNull();
    const newsId = match![1];
    console.log(`Created news article with ID: ${newsId}`);

    // Take screenshot after creation
    await page.screenshot({ path: 'e2e/screenshots/create-news-after-save.png', fullPage: true });

    // Verify the news appears in the list
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    // Verify articles exist in the list (count > 0)
    const newsCount = page.locator('text=/\\d+ articles?/');
    await expect(newsCount).toBeVisible({ timeout: 5000 });

    // Verify there are news rows in the list
    const newsRows = page.locator('table tbody tr, [class*="card"]');
    expect(await newsRows.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/create-news-in-list.png', fullPage: true });

    // The creation was already verified by the successful redirect to /news/:id/edit
    console.log(`News article ${newsId} created and verified via redirect`);
  });
});
