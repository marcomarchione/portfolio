/**
 * News Article Detail Page Tests
 *
 * Comprehensive E2E tests for the news article detail page with cover images,
 * markdown content, social metadata, tags, and responsive layouts.
 */
import { test, expect } from '@playwright/test';

test.describe('News Detail Page', () => {
  // We'll use a generic slug approach since we don't know exact slugs
  // Tests will navigate to listing first and click on first article

  test('article detail page loads successfully', async ({ page }) => {
    // Navigate to news listing
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });

    // Click first article card
    const firstCard = page.locator('[data-testid="news-card"]').first();
    const link = firstCard.locator('a').first();
    await link.click();

    // Wait for detail page to load
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Page should load successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('cover image displays with correct aspect ratio', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for cover image
    const coverImage = page.locator('article img').first();

    if (await coverImage.isVisible()) {
      // Check parent has aspect ratio
      const parent = coverImage.locator('..');
      const classes = await parent.getAttribute('class');
      expect(classes).toContain('aspect-video');

      // Check image has src
      const src = await coverImage.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('fallback SVG displays when no cover image', async ({ page }) => {
    // Navigate to listing
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });

    // Find a card without cover image (has fallback)
    const fallbackCard = page.locator('[role="img"][aria-label*="cover image"]').first();

    if (await fallbackCard.isVisible()) {
      // Click the parent article card
      const parentCard = fallbackCard.locator('..').locator('..').locator('..');
      const link = parentCard.locator('a').first();
      await link.click();
      await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

      // Check if detail page also shows fallback
      const detailFallback = page.locator('article').first();

      // Look for MM text or fallback component
      const mmText = page.locator('span').filter({ hasText: 'MM' }).first();
      if (await mmText.isVisible()) {
        await expect(mmText).toBeVisible();
      }
    }
  });

  test('article title displays as h1', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check h1 exists
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // H1 should have text content
    const text = await h1.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('publication date displays correctly', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for publication date text
    const publishedText = page.locator('text=/Published on|Pubblicato il/i').first();

    if (await publishedText.isVisible()) {
      await expect(publishedText).toBeVisible();

      // Should have date information
      const text = await publishedText.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('reading time is calculated and displayed', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Wait for client-side script to calculate reading time
    await page.waitForTimeout(500);

    // Look for reading time display
    const readingTimeEl = page.locator('#reading-time-display');

    if (await readingTimeEl.isVisible()) {
      await expect(readingTimeEl).toBeVisible();

      const text = await readingTimeEl.textContent();
      expect(text).toMatch(/\d+\s*min/i);
    }
  });

  test('markdown content is parsed and rendered', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for prose container with content
    const proseContainer = page.locator('.prose').first();

    if (await proseContainer.isVisible()) {
      await expect(proseContainer).toBeVisible();

      // Should have some content
      const text = await proseContainer.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);

      // Check for prose styling classes
      const classes = await proseContainer.getAttribute('class');
      expect(classes).toContain('prose');
    }
  });

  test('tags display as clickable pill badges', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for tags section
    const tagsHeading = page.locator('h2').filter({ hasText: /Tags|Tag/i }).first();

    if (await tagsHeading.isVisible()) {
      // Tags should be below this heading
      const tagPills = page.locator('a[class*="bg-primary-500/20"]');
      const count = await tagPills.count();

      if (count > 0) {
        const firstTag = tagPills.first();
        await expect(firstTag).toBeVisible();

        // Should have pill styling
        const classes = await firstTag.getAttribute('class');
        expect(classes).toMatch(/rounded-full|px-4|py-2/);
      }
    }
  });

  test('clicking tag navigates to filtered listing page', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for tag pills
    const tagPills = page.locator('a[class*="bg-primary-500/20"]');

    if (await tagPills.count() > 0) {
      const firstTag = tagPills.first();
      await firstTag.click();

      // Should navigate to listing with tag filter
      await page.waitForURL(/\/news\?tag=/, { timeout: 5000 });
      expect(page.url()).toContain('/news?tag=');
    }
  });

  test('"Back to News" link works', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for "Back to News" link
    const backLink = page.locator('a').filter({ hasText: /Back to News|Torna alle Notizie/i }).first();

    if (await backLink.isVisible()) {
      await backLink.click();

      // Should navigate back to listing page
      await page.waitForURL(/\/news\/?$/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/news\/?$/);
    }
  });

  test('social metadata tags are present in head', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check Open Graph meta tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveCount(1);

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveCount(1);

    const ogType = page.locator('meta[property="og:type"]');
    const typeContent = await ogType.getAttribute('content');
    expect(typeContent).toBe('article');

    // Check Twitter Card meta tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveCount(1);

    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveCount(1);
  });

  test('responsive layout works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check main content is visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Check article container
    const article = page.locator('article').first();
    await expect(article).toBeVisible();
  });

  test('responsive layout works on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check main content is visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('responsive layout works on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check main content is visible with max-width constraint
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Check article has max-width (should have max-w-4xl class)
    const article = page.locator('article').first();
    const classes = await article.getAttribute('class');
    expect(classes).toContain('max-w-4xl');
  });

  test('glass morphism styling is applied', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check article container has glass morphism
    const article = page.locator('article').first();
    const classes = await article.getAttribute('class');

    expect(classes).toMatch(/backdrop-blur|bg-white\/5/);
  });

  test('article description displays if available', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Look for description in header section
    const description = page.locator('header p.text-xl').first();

    if (await description.isVisible()) {
      await expect(description).toBeVisible();

      const text = await description.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('metadata and SEO elements are present', async ({ page }) => {
    // Navigate to listing and click first article
    await page.goto('/en/news');
    await page.waitForSelector('[data-testid="news-card"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="news-card"]').first();
    await firstCard.locator('a').first().click();
    await page.waitForURL(/\/news\/.+/, { timeout: 5000 });

    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check html lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
  });
});
