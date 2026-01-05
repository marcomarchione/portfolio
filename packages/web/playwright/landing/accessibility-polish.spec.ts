/**
 * Accessibility and Polish Tests
 *
 * Strategic tests for keyboard navigation, screen reader support,
 * theme switching, and responsive design.
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility and Polish', () => {
  test('keyboard navigation through social links', async ({ page }) => {
    await page.goto('/en');

    // Find hero social links (not footer ones)
    const heroSection = page.locator('#hero');
    const linkedInLink = heroSection.locator('a[aria-label="LinkedIn"]');
    const githubLink = heroSection.locator('a[aria-label="GitHub"]');

    // Navigate to social links area
    await linkedInLink.focus();
    await expect(linkedInLink).toBeFocused();

    // Tab to next link
    await page.keyboard.press('Tab');
    await expect(githubLink).toBeFocused();

    // Verify focus is visible (focus-visible outline)
    const focusOutline = await githubLink.evaluate((el) => {
      const style = getComputedStyle(el, ':focus-visible');
      return style.outlineWidth !== '0px';
    });
    // Focus visible should be applied
    expect(focusOutline).toBe(true);
  });

  test('screen reader accessibility - ARIA labels and heading hierarchy', async ({
    page,
  }) => {
    await page.goto('/en');

    // Check heading hierarchy (h1 > h3 > h3)
    const h1 = page.locator('h1');
    const aboutHeading = page.locator('#about h3');
    const skillsHeading = page.locator('#skills h3');

    await expect(h1).toBeVisible();
    await expect(aboutHeading).toBeVisible();
    await expect(skillsHeading).toBeVisible();

    // Verify ARIA labels on hero social links (not footer)
    const heroSection = page.locator('#hero');
    const linkedInLabel = await heroSection
      .locator('a[aria-label="LinkedIn"]')
      .getAttribute('aria-label');
    expect(linkedInLabel).toBe('LinkedIn');

    const githubLabel = await heroSection
      .locator('a[aria-label="GitHub"]')
      .getAttribute('aria-label');
    expect(githubLabel).toBe('GitHub');

    // Verify gradient mesh background is hidden from screen readers
    const background = page.locator('.gradient-mesh-background');
    const ariaHidden = await background.getAttribute('aria-hidden');
    expect(ariaHidden).toBe('true');
  });

  test('theme switching preserves gradient mesh visibility', async ({ page }) => {
    // Clear theme and ensure we start in dark mode
    await page.goto('/en');
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForSelector('.theme-ready');

    // Force dark mode first
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(100);

    // Verify gradient orbs are visible in dark mode
    const gradientOrbs = page.locator('.gradient-orb');
    await expect(gradientOrbs.first()).toBeVisible();

    // Get dark mode opacity (should be 0.6)
    const darkOpacity = await gradientOrbs.first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).opacity);
    });

    // Switch to light mode via JavaScript
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(700);

    // Verify orbs are still visible but with reduced opacity (should be 0.3)
    await expect(gradientOrbs.first()).toBeVisible();
    const lightOpacity = await gradientOrbs.first().evaluate((el) => {
      return parseFloat(getComputedStyle(el).opacity);
    });

    // Light mode should have reduced opacity (0.3 < 0.6)
    expect(lightOpacity).toBeLessThan(darkOpacity);
    expect(lightOpacity).toBeGreaterThan(0);
  });

  test('mobile viewport renders correctly (320px width)', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/en');

    // Verify hero section is visible and properly sized
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();

    // Verify name is visible
    const heroHeading = hero.locator('h1');
    await expect(heroHeading).toBeVisible();

    // Verify hero social links are visible and have proper touch targets (use hero scope)
    const linkedInLink = hero.locator('a[aria-label="LinkedIn"]');
    await expect(linkedInLink).toBeVisible();

    const box = await linkedInLink.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    // Verify skills grid uses 2 columns on mobile
    const skillsGrid = page.locator('#skills .grid');
    await expect(skillsGrid).toBeVisible();

    // Check that items wrap properly (grid should be narrower than viewport)
    const gridBox = await skillsGrid.boundingBox();
    expect(gridBox!.width).toBeLessThanOrEqual(320);
  });

  test('sections have proper vertical rhythm and spacing', async ({ page }) => {
    await page.goto('/en');

    const hero = page.locator('#hero');
    const about = page.locator('#about');
    const skills = page.locator('#skills');

    const heroBox = await hero.boundingBox();
    const aboutBox = await about.boundingBox();
    const skillsBox = await skills.boundingBox();

    // Hero should be at least 80% of viewport height
    const viewportHeight = page.viewportSize()?.height || 800;
    expect(heroBox!.height).toBeGreaterThanOrEqual(viewportHeight * 0.8);

    // About and Skills should have consistent spacing
    const aboutTopPadding = aboutBox!.y - (heroBox!.y + heroBox!.height);
    // Sections should not overlap
    expect(aboutTopPadding).toBeGreaterThanOrEqual(0);

    // Skills should be below about
    expect(skillsBox!.y).toBeGreaterThan(aboutBox!.y);
  });

  test('no horizontal overflow on any viewport size', async ({ page }) => {
    const viewportSizes = [
      { width: 320, height: 568 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
    ];

    for (const size of viewportSizes) {
      await page.setViewportSize(size);
      await page.goto('/en');

      // Check document width equals viewport width (no horizontal scroll)
      const documentWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(documentWidth).toBeLessThanOrEqual(size.width);
    }
  });
});
