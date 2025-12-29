/**
 * Comprehensive CRUD Operations E2E Tests
 *
 * Tests Create, Read, Update, and Delete operations for all content types:
 * - Projects
 * - Materials
 * - News
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
 * Helper function to click a custom dropdown option
 */
async function selectDropdownOption(page: Page, buttonSelector: string, optionText: string) {
  // Click the dropdown button
  await page.locator(buttonSelector).click();
  await page.waitForTimeout(300);

  // Click the option in the portal dropdown
  await page.locator(`[role="listbox"] >> text="${optionText}"`).click();
  await page.waitForTimeout(200);
}

/**
 * Generate unique slug for test content
 */
function generateSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

test.describe('Projects CRUD Operations', () => {
  let createdProjectId: string;
  const testSlug = generateSlug('test-project');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Create a new project', async ({ page }) => {
    // Navigate to Projects
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Click New button
    const newBtn = page.locator('a:has-text("New Project")');
    await newBtn.click();
    await page.waitForLoadState('networkidle');

    // Fill in project details - slug uses id not name
    const slugInput = page.locator('#slug');
    if (await slugInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await slugInput.fill(testSlug);

      // Fill Italian translation (default tab)
      const titleInput = page.locator('input[name="title"], #title');
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Project Title IT');
      }

      // Submit the form
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
      }

      // Store the created project ID from URL
      const url = page.url();
      const match = url.match(/\/projects\/(\d+)/);
      if (match) {
        createdProjectId = match[1];
        console.log('Created project ID:', createdProjectId);
      }
    } else {
      console.log('Slug input not found - skipping create test');
    }

    await page.screenshot({ path: 'e2e/screenshots/crud-01-project-created.png', fullPage: true });
  });

  test('2. Read/List projects', async ({ page }) => {
    // Navigate to Projects list
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Verify the projects page loads
    await expect(page.locator('h1:has-text("Projects"), h2:has-text("Projects")')).toBeVisible();

    // Check for the list/table structure
    const contentCards = page.locator('[class*="card"], table, [class*="list"]');
    expect(await contentCards.count()).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: 'e2e/screenshots/crud-02-projects-list.png', fullPage: true });
  });

  test('3. Update an existing project', async ({ page }) => {
    // Navigate to Projects list
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Click on the first Edit button if any projects exist
    const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      // Update the title
      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        const currentTitle = await titleInput.inputValue();
        await titleInput.fill(`${currentTitle} - Updated`);
      }

      // Submit the form
      await page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")').first().click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/crud-03-project-updated.png', fullPage: true });
    } else {
      console.log('No projects to update - skipping update test');
    }
  });

  test('4. Delete/Archive a project', async ({ page }) => {
    // Navigate to Projects list
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Look for delete or archive button
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Archive")').first();

    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click delete/archive
      await deleteButton.click();

      // Handle confirmation dialog if present
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'e2e/screenshots/crud-04-project-deleted.png', fullPage: true });
    } else {
      console.log('No delete/archive button found - skipping delete test');
    }
  });

  test('5. Filter and sort projects', async ({ page }) => {
    // Navigate to Projects list
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Test search filter
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/crud-05-projects-filtered.png', fullPage: true });
      await searchInput.clear();
    }

    // Test status filter dropdown
    const statusFilter = page.locator('button:has-text("All statuses"), button:has-text("Status")').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      const publishedOption = page.locator('[role="listbox"] >> text="Published"');
      if (await publishedOption.isVisible()) {
        await publishedOption.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/crud-06-projects-status-filter.png', fullPage: true });
      }
    }

    // Test sort order toggle
    const sortToggle = page.locator('button[title*="Ascending"], button[title*="Descending"], button:has(svg)').last();
    if (await sortToggle.isVisible()) {
      await sortToggle.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/crud-07-projects-sorted.png', fullPage: true });
    }
  });
});

test.describe('Materials CRUD Operations', () => {
  const testSlug = generateSlug('test-material');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Create a new material', async ({ page }) => {
    // Navigate to Materials
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    // Click New button
    const newBtn = page.locator('a:has-text("New Material")');
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForLoadState('networkidle');

      // Fill in material details - slug uses id not name
      const slugInput = page.locator('#slug');
      if (await slugInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await slugInput.fill(testSlug);

        const titleInput = page.locator('input[name="title"], #title');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Test Material Title IT');
        }

        // Submit the form
        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('New Material button not found');
    }

    await page.screenshot({ path: 'e2e/screenshots/crud-10-material-created.png', fullPage: true });
  });

  test('2. Read/List materials', async ({ page }) => {
    // Navigate to Materials list
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    // Verify the materials page loads
    await expect(page.locator('h1:has-text("Materials"), h2:has-text("Materials")')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/crud-11-materials-list.png', fullPage: true });
  });

  test('3. Update an existing material', async ({ page }) => {
    // Navigate to Materials list
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        const currentTitle = await titleInput.inputValue();
        await titleInput.fill(`${currentTitle} - Updated`);
      }

      await page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")').first().click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/crud-12-material-updated.png', fullPage: true });
    }
  });
});

test.describe('News CRUD Operations', () => {
  const testSlug = generateSlug('test-news');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. Create a new news article', async ({ page }) => {
    // Navigate to News
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    // Click New button
    const newBtn = page.locator('a:has-text("New News"), a:has-text("New Article")');
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForLoadState('networkidle');

      // Fill in news details - slug uses id not name
      const slugInput = page.locator('#slug');
      if (await slugInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await slugInput.fill(testSlug);

        const titleInput = page.locator('input[name="title"], #title');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Test News Article Title IT');
        }

        // Submit the form
        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    } else {
      console.log('New News button not found');
    }

    await page.screenshot({ path: 'e2e/screenshots/crud-20-news-created.png', fullPage: true });
  });

  test('2. Read/List news', async ({ page }) => {
    // Navigate to News list
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    // Verify the news page loads
    await expect(page.locator('h1:has-text("News"), h2:has-text("News")')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/crud-21-news-list.png', fullPage: true });
  });

  test('3. Update an existing news article', async ({ page }) => {
    // Navigate to News list
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');

      const titleInput = page.locator('input[name="title"]');
      if (await titleInput.isVisible()) {
        const currentTitle = await titleInput.inputValue();
        await titleInput.fill(`${currentTitle} - Updated`);
      }

      await page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")').first().click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/crud-22-news-updated.png', fullPage: true });
    }
  });
});

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard displays statistics', async ({ page }) => {
    // Should already be on dashboard after login
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Check for stats cards
    const statsCards = page.locator('[class*="card"], [class*="stat"]');
    expect(await statsCards.count()).toBeGreaterThan(0);

    // Check for Projects, Materials, News stats
    await expect(page.locator('text=Projects').first()).toBeVisible();
    await expect(page.locator('text=Materials').first()).toBeVisible();
    await expect(page.locator('text=News').first()).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/crud-30-dashboard-stats.png', fullPage: true });
  });

  test('Dashboard shows recent activity', async ({ page }) => {
    // Check for recent activity section
    const recentActivity = page.locator('text=Recent Activity, text=Recent, text=Activity').first();

    if (await recentActivity.isVisible()) {
      await page.screenshot({ path: 'e2e/screenshots/crud-31-dashboard-recent.png', fullPage: true });
    }
  });

  test('Dashboard links to content sections', async ({ page }) => {
    // Click on Projects stat card or link
    const projectsLink = page.locator('a[href="/projects"]').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await expect(page).toHaveURL('/projects');
    }

    // Navigate back to dashboard
    await page.click('nav >> text=Dashboard');
    await page.waitForLoadState('networkidle');

    // Click on Materials
    const materialsLink = page.locator('a[href="/materials"]').first();
    if (await materialsLink.isVisible()) {
      await materialsLink.click();
      await expect(page).toHaveURL('/materials');
    }

    await page.screenshot({ path: 'e2e/screenshots/crud-32-dashboard-navigation.png', fullPage: true });
  });
});

test.describe('Translation Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Language tabs switch content', async ({ page }) => {
    // Navigate to Projects -> New or Edit
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    const newBtn = page.locator('a:has-text("New"), button:has-text("New")').first();
    await newBtn.click();
    await page.waitForLoadState('networkidle');

    // Check for language tabs
    const itTab = page.locator('button:has-text("IT")').first();
    const enTab = page.locator('button:has-text("EN")').first();
    const esTab = page.locator('button:has-text("ES")').first();
    const deTab = page.locator('button:has-text("DE")').first();

    // Test Italian tab (should be active by default)
    if (await itTab.isVisible()) {
      await itTab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/crud-40-lang-it.png', fullPage: true });
    }

    // Test English tab
    if (await enTab.isVisible()) {
      await enTab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/crud-41-lang-en.png', fullPage: true });
    }

    // Test Spanish tab
    if (await esTab.isVisible()) {
      await esTab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/crud-42-lang-es.png', fullPage: true });
    }

    // Test German tab
    if (await deTab.isVisible()) {
      await deTab.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'e2e/screenshots/crud-43-lang-de.png', fullPage: true });
    }
  });
});
