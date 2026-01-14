/**
 * Materials Detail Page Tests
 *
 * Tests for the material detail page with featured badge, category badge,
 * download button, and glass morphism styling.
 */
import { test, expect } from '@playwright/test';

test.describe('Materials Detail Page', () => {
  // Test with a known material slug from the seed data
  const testSlug = 'react-best-practices';

  test.beforeEach(async ({ page }) => {
    // Navigate to a material detail page
    await page.goto(`/en/materials/${testSlug}`);
  });

  test('page loads and displays material information', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="material-detail"]', { timeout: 10000 });

    // Check title is visible
    const title = page.locator('[data-testid="material-title"]');
    await expect(title).toBeVisible();

    // Check description is visible
    const description = page.locator('[data-testid="material-description"]');
    await expect(description).toBeVisible();
  });

  test('download button is visible and has correct attributes', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check download button exists
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();

    // Verify it has download attribute
    const hasDownloadAttr = await downloadButton.evaluate(
      (el) => el.hasAttribute('download')
    );
    expect(hasDownloadAttr).toBeTruthy();

    // Verify it has href to file
    const href = await downloadButton.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toContain('/downloads/');
  });

  test('file size is displayed', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check file size is visible
    const fileSize = page.locator('[data-testid="file-size"]');
    await expect(fileSize).toBeVisible();

    // Verify it contains KB or MB
    const text = await fileSize.textContent();
    expect(text).toMatch(/\d+(\.\d+)?\s*(KB|MB)/i);
  });

  test('category badge displays with correct styling', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check category badge exists
    const categoryBadge = page.locator('[data-testid="material-category"]');
    await expect(categoryBadge).toBeVisible();

    // Get badge classes
    const classes = await categoryBadge.getAttribute('class');

    // Verify it has category-specific color classes
    // Guide: blue, Template: green, Resource: purple, Tool: orange
    const hasColorClass =
      classes?.includes('blue') ||
      classes?.includes('green') ||
      classes?.includes('purple') ||
      classes?.includes('orange');
    expect(hasColorClass).toBeTruthy();
  });

  test('category badge shows correct category (guide = blue)', async ({ page }) => {
    // Navigate to a guide material
    await page.goto('/en/materials/react-best-practices');
    await page.waitForSelector('[data-testid="material-category"]');

    const categoryBadge = page.locator('[data-testid="material-category"]');
    const classes = await categoryBadge.getAttribute('class');

    // Guide should have blue colors
    expect(classes).toMatch(/blue/i);
  });

  test('glass morphism container styling is applied', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    const container = page.locator('[data-testid="material-detail"]');
    const classes = await container.getAttribute('class');

    // Check for glass morphism classes
    expect(classes).toMatch(/bg-neutral-800\/30|backdrop-blur-sm/);
  });

  test('featured badge appears for featured materials', async ({ page }) => {
    // First, check if current material is featured
    const featuredBadge = page.locator('[data-testid="featured-badge"]');
    const isFeatured = await featuredBadge.isVisible().catch(() => false);

    if (isFeatured) {
      // Verify featured badge has correct styling
      await expect(featuredBadge).toBeVisible();
      await expect(featuredBadge).toContainText(/featured/i);

      const classes = await featuredBadge.getAttribute('class');
      expect(classes).toMatch(/primary|featured/);
    } else {
      // Featured badge should not be visible for non-featured materials
      await expect(featuredBadge).not.toBeVisible();
    }
  });

  test.skip('i18n - Italian language displays correct labels', async ({ page }) => {
    await page.goto(`/it/materiali/${testSlug}`);
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check download button has Italian text
    const downloadButton = page.locator('[data-testid="download-button"]');
    const text = await downloadButton.textContent();
    expect(text).toMatch(/scarica/i);
  });

  test.skip('i18n - Spanish language displays correct labels', async ({ page }) => {
    await page.goto(`/es/materials/${testSlug}`);
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check download button has Spanish text
    const downloadButton = page.locator('[data-testid="download-button"]');
    const text = await downloadButton.textContent();
    expect(text).toMatch(/descargar/i);
  });

  test.skip('i18n - German language displays correct labels', async ({ page }) => {
    await page.goto(`/de/materials/${testSlug}`);
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check download button has German text
    const downloadButton = page.locator('[data-testid="download-button"]');
    const text = await downloadButton.textContent();
    expect(text).toMatch(/herunterladen|download/i);
  });

  test('back link to materials listing works', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    // Look for back link
    const backLink = page.locator('a[href*="/materials"]:not([data-testid="material-card"])').first();

    if (await backLink.isVisible()) {
      await backLink.click();
      // Wait for navigation - URL should end with /materials/ (with trailing slash)
      await page.waitForURL(/\/materials\/$/);
      expect(page.url()).toMatch(/\/materials\/$/);
    }
  });

  test('metadata and SEO elements are present', async ({ page }) => {
    await page.waitForSelector('[data-testid="material-detail"]');

    // Check meta title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });

  test('responsive design - mobile view displays correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.waitForSelector('[data-testid="material-detail"]');

    // Check that main content is visible
    const title = page.locator('[data-testid="material-title"]');
    await expect(title).toBeVisible();

    // Check download button is still accessible
    const downloadButton = page.locator('[data-testid="download-button"]');
    await expect(downloadButton).toBeVisible();
  });

  test('responsive design - tablet view displays correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.waitForSelector('[data-testid="material-detail"]');

    // Check that main content is visible
    const title = page.locator('[data-testid="material-title"]');
    await expect(title).toBeVisible();
  });

  test('404 handling for non-existent material', async ({ page }) => {
    // Navigate to non-existent material
    const response = await page.goto('/en/materials/non-existent-material-slug-12345');

    // Should get 404 response
    expect(response?.status()).toBe(404);
  });
});
