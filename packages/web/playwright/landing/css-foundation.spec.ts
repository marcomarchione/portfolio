/**
 * CSS Foundation Tests
 *
 * Tests for animation system, gradient mesh background, and accessibility features.
 */
import { test, expect } from '@playwright/test';

test.describe('CSS Foundation and Animation System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('gradient background renders in dark mode', async ({ page }) => {
    // Verify the gradient mesh background is present
    const gradientOrbs = page.locator('.gradient-orb');
    const orbCount = await gradientOrbs.count();
    expect(orbCount).toBeGreaterThanOrEqual(2);

    // Verify orbs have proper CSS for fixed positioning
    const firstOrb = gradientOrbs.first();
    await expect(firstOrb).toBeVisible();
    const position = await firstOrb.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('gradient background renders in light mode with reduced opacity', async ({ page }) => {
    // Ensure we start in dark mode by clearing localStorage
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForSelector('.theme-ready');

    // Force dark mode and get opacity
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(100);

    const gradientOrbs = page.locator('.gradient-orb');
    const darkOpacity = await gradientOrbs.first().evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity)
    );

    // Switch to light mode via JavaScript
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    });
    await page.waitForTimeout(700);

    // Verify the gradient mesh is still visible but with reduced opacity
    const firstOrb = gradientOrbs.first();
    await expect(firstOrb).toBeVisible();

    // In light mode, opacity should be reduced compared to dark mode (0.3 vs 0.6)
    const lightOpacity = await firstOrb.evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity)
    );
    expect(lightOpacity).toBeLessThan(darkOpacity);
  });

  test('prefers-reduced-motion disables animations', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/en');

    // Check that animated elements have animation disabled or are instant
    const animatedElements = page.locator('[class*="animate-"]');
    const count = await animatedElements.count();

    if (count > 0) {
      const firstAnimated = animatedElements.first();
      const animationDuration = await firstAnimated.evaluate(
        (el) => getComputedStyle(el).animationDuration
      );
      // Animation should be 0s or very short when reduced motion is preferred
      expect(['0s', '0.01s', '0.001s', '']).toContain(animationDuration);
    }
  });

  test('CSS keyframes for page animations exist', async ({ page }) => {
    // Check that the fade-in-up animation is defined
    const animationExists = await page.evaluate(() => {
      const styleSheets = document.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            if (rules[j] instanceof CSSKeyframesRule) {
              if (rules[j].name === 'fade-in-up' || rules[j].name === 'float-slow') {
                return true;
              }
            }
          }
        } catch {
          // Skip cross-origin stylesheets
        }
      }
      return false;
    });
    expect(animationExists).toBe(true);
  });
});
