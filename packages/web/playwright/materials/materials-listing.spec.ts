/**
 * Materials Listing Page Tests
 *
 * Tests for the materials listing page with filtering, search, sort, and pagination.
 */
import { test, expect } from '@playwright/test';

test.describe('Materials Listing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/materials');
  });

  test('page loads and renders materials grid', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Materials/i);

    // Wait for materials to load
    await page.waitForSelector('[data-testid="materials-grid"]', { timeout: 10000 });

    // Check that materials are displayed
    const materialCards = page.locator('[data-testid="material-card"]');
    await expect(materialCards.first()).toBeVisible();
  });

  test('category filter displays all categories', async ({ page }) => {
    // Wait for filters to load
    await page.waitForSelector('[data-testid="category-filter"]');

    // Check all category pills exist
    const allButton = page.locator('[data-testid="category-all"]');
    const guideButton = page.locator('[data-testid="category-guide"]');
    const templateButton = page.locator('[data-testid="category-template"]');
    const resourceButton = page.locator('[data-testid="category-resource"]');
    const toolButton = page.locator('[data-testid="category-tool"]');

    await expect(allButton).toBeVisible();
    await expect(guideButton).toBeVisible();
    await expect(templateButton).toBeVisible();
    await expect(resourceButton).toBeVisible();
    await expect(toolButton).toBeVisible();
  });

  test('clicking category filter updates materials and URL', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="category-filter"]');

    // Click on "guide" category
    await page.click('[data-testid="category-guide"]');

    // Wait for materials to update
    await page.waitForTimeout(500);

    // Check URL contains category parameter
    expect(page.url()).toContain('category=guide');

    // Verify active styling on selected category
    const guideButton = page.locator('[data-testid="category-guide"]');
    const classes = await guideButton.getAttribute('class');
    expect(classes).toContain('bg-primary-500');
  });

  test('clicking "All" category clears filter', async ({ page }) => {
    // Wait for filters
    await page.waitForSelector('[data-testid="category-filter"]');

    // First, select a category
    await page.click('[data-testid="category-guide"]');
    await page.waitForTimeout(300);
    expect(page.url()).toContain('category=guide');

    // Then click "All"
    await page.click('[data-testid="category-all"]');
    await page.waitForTimeout(300);

    // Check URL does not contain category parameter
    expect(page.url()).not.toContain('category=');

    // Verify "All" button has active styling
    const allButton = page.locator('[data-testid="category-all"]');
    const classes = await allButton.getAttribute('class');
    expect(classes).toContain('bg-primary-500');
  });

  test('search input filters materials', async ({ page }) => {
    // Wait for React island to hydrate - search input is in the island
    await page.waitForSelector('astro-island[uid] input[type="text"][placeholder*="Search"]', {
      timeout: 10000,
    });

    // Type in search box
    const searchInput = page.locator('input[type="text"][placeholder*="Search"]').first();
    await searchInput.fill('guide');

    // Wait for debounce (300ms) + processing + re-render
    await page.waitForTimeout(1000);

    // Check URL contains search parameter
    expect(page.url()).toContain('search=guide');

    // Verify grid still exists (materials may or may not be found depending on data)
    const grid = page.locator('[data-testid="materials-grid"]');
    await expect(grid).toBeVisible();
  });

  test('search clear button appears and works', async ({ page }) => {
    // Wait for React island to hydrate
    await page.waitForSelector('astro-island[uid] input[type="text"][placeholder*="Search"]', {
      timeout: 10000,
    });

    const searchInput = page.locator('input[type="text"][placeholder*="Search"]').first();
    const clearButton = page.locator('button[aria-label="Clear search"]');

    // Clear button should not be visible initially
    await expect(clearButton).not.toBeVisible();

    // Type in search box
    await searchInput.fill('test');
    await page.waitForTimeout(100);

    // Clear button should now be visible
    await expect(clearButton).toBeVisible();

    // Click clear button
    await clearButton.click();

    // Search input should be empty
    await expect(searchInput).toHaveValue('');

    // Clear button should be hidden again
    await expect(clearButton).not.toBeVisible();
  });

  test('sort dropdown changes material order', async ({ page }) => {
    // Wait for sort dropdown
    await page.waitForSelector('[data-testid="sort-dropdown"]');

    // Click dropdown to open it
    await page.click('[data-testid="sort-dropdown"]');
    await page.waitForTimeout(200);

    // Click "Title (A-Z)" option
    const titleOption = page.locator('text=Title').first();
    await titleOption.click();
    await page.waitForTimeout(500);

    // Check URL contains sortBy parameter
    expect(page.url()).toContain('sortBy=title');
  });

  test('combined filters work together', async ({ page }) => {
    // Wait for all controls
    await page.waitForSelector('[data-testid="category-filter"]');
    await page.waitForSelector('astro-island[uid] input[type="text"][placeholder*="Search"]', {
      timeout: 10000,
    });

    // Apply category filter
    await page.click('[data-testid="category-guide"]');
    await page.waitForTimeout(300);

    // Apply search
    const searchInput = page.locator('input[type="text"][placeholder*="Search"]').first();
    await searchInput.fill('react');
    await page.waitForTimeout(500);

    // Check URL contains both parameters
    const url = page.url();
    expect(url).toContain('category=guide');
    expect(url).toContain('search=react');
  });

  test.skip('browser back button restores previous state', async ({ page }) => {
    // Wait for filters
    await page.waitForSelector('[data-testid="category-filter"]');

    // Apply a filter
    await page.click('[data-testid="category-guide"]');
    await page.waitForTimeout(500);

    const urlWithFilter = page.url();
    expect(urlWithFilter).toContain('category=guide');

    // Click "All" to clear filter
    await page.click('[data-testid="category-all"]');
    await page.waitForTimeout(500);

    expect(page.url()).not.toContain('category=');

    // Go back
    await page.goBack();
    // Wait for page to reload and React to re-hydrate
    await page.waitForTimeout(1000);

    // URL should have category again
    expect(page.url()).toContain('category=guide');

    // Wait for category filter to be visible after navigation
    await page.waitForSelector('[data-testid="category-filter"]');

    // Verify category button has active state
    const guideButton = page.locator('[data-testid="category-guide"]');
    const classes = await guideButton.getAttribute('class');
    expect(classes).toContain('bg-primary-500');
  });

  test('material cards display required information', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-card"]');

    const firstCard = page.locator('[data-testid="material-card"]').first();

    // Check card has title
    const title = firstCard.locator('[data-testid="material-title"]');
    await expect(title).toBeVisible();

    // Check card has description
    const description = firstCard.locator('[data-testid="material-description"]');
    await expect(description).toBeVisible();

    // Check card has category badge
    const categoryBadge = firstCard.locator('[data-testid="material-category"]');
    await expect(categoryBadge).toBeVisible();
  });

  test('clicking material card navigates to detail page', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-card"]');

    const firstCard = page.locator('[data-testid="material-card"]').first();
    await firstCard.click();

    // Wait for navigation
    await page.waitForURL(/\/materials\/.+/);

    // Check we're on a detail page
    expect(page.url()).toMatch(/\/materials\/.+/);
  });

  test('glass morphism styling is applied', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-card"]');

    const firstCard = page.locator('[data-testid="material-card"]').first();

    // Check for glass morphism classes
    const classes = await firstCard.getAttribute('class');
    expect(classes).toMatch(/backdrop-blur|bg-neutral-800/);
  });
});
