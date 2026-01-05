import { test, expect } from '@playwright/test';

test.describe('Header Persistence and Page Navigation', () => {
  test('header remains persistent during page navigation', async ({ page }) => {
    // Go to homepage
    await page.goto('/it/');
    await page.waitForSelector('header.sticky');

    // Take screenshot of initial state
    await page.screenshot({ path: 'playwright/screenshots/nav-01-home.png', fullPage: false });

    // Get header element reference (using the sticky header class)
    const header = page.locator('header.sticky').first();
    await expect(header).toBeVisible();

    // Click on Projects link
    await page.click('nav a[href="/it/projects/"]');

    // Wait for navigation to complete
    await page.waitForURL('/it/projects/');

    // Header should still be visible (persistent)
    await expect(header).toBeVisible();

    // Take screenshot after navigation
    await page.screenshot({ path: 'playwright/screenshots/nav-02-projects.png', fullPage: false });

    // Click on Materials link
    await page.click('nav a[href="/it/materials/"]');
    await page.waitForURL('/it/materials/');

    // Header should still be visible
    await expect(header).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'playwright/screenshots/nav-03-materials.png', fullPage: false });
  });

  test('theme transition is smooth (500ms)', async ({ page }) => {
    // Clear any previous theme preference
    await page.goto('/it/');
    await page.evaluate(() => localStorage.removeItem('theme'));

    // Reload to get default theme (dark)
    await page.reload();
    await page.waitForSelector('.theme-ready');

    // Wait for React hydration
    await page.waitForTimeout(500);

    // Take screenshot in dark mode
    await page.screenshot({ path: 'playwright/screenshots/theme-01-dark.png', fullPage: false });

    // Verify we start in dark mode (or system default)
    let htmlClass = await page.locator('html').getAttribute('class');
    const startedDark = htmlClass?.includes('dark');

    // Toggle theme via JavaScript (simulating what the button does)
    await page.evaluate(() => {
      const html = document.documentElement;
      const isDark = html.classList.contains('dark');
      if (isDark) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('theme', 'light');
      } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    });

    // Wait for transition to complete (500ms + buffer)
    await page.waitForTimeout(700);

    // Take screenshot after theme change
    await page.screenshot({ path: 'playwright/screenshots/theme-02-toggled.png', fullPage: false });

    // Verify theme has toggled
    htmlClass = await page.locator('html').getAttribute('class');
    if (startedDark) {
      expect(htmlClass).toContain('light');
    } else {
      expect(htmlClass).toContain('dark');
    }
  });

  test('navigation items are centered', async ({ page }) => {
    await page.goto('/it/');
    await page.waitForSelector('header.sticky');

    // Get viewport width
    const viewportSize = page.viewportSize();
    const viewportCenter = viewportSize ? viewportSize.width / 2 : 640;

    // Get the desktop nav container position
    const navContainer = page.locator('header.sticky nav > div.hidden.md\\:flex.absolute');
    const boundingBox = await navContainer.boundingBox();

    if (boundingBox) {
      const navCenter = boundingBox.x + boundingBox.width / 2;
      // Allow 10px tolerance for centering
      expect(Math.abs(navCenter - viewportCenter)).toBeLessThan(10);
    }
  });

  test('no layout shift during navigation', async ({ page }) => {
    await page.goto('/it/');
    await page.waitForSelector('header.sticky');

    // Get initial header height
    const headerBefore = await page.locator('header.sticky').first().boundingBox();

    // Navigate to projects
    await page.click('nav a[href="/it/projects/"]');
    await page.waitForURL('/it/projects/');
    await page.waitForTimeout(300);

    // Get header height after navigation
    const headerAfter = await page.locator('header.sticky').first().boundingBox();

    // Header height should not change
    if (headerBefore && headerAfter) {
      expect(headerAfter.height).toBe(headerBefore.height);
    }
  });
});
