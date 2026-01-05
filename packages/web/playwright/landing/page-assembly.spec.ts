/**
 * Page Assembly Tests
 *
 * Tests for the landing page structure and integration.
 */
import { test, expect } from '@playwright/test';

test.describe('Landing Page Assembly', () => {
  test('page renders all sections in correct order (Hero, About, Skills)', async ({
    page,
  }) => {
    await page.goto('/en');

    // Get all main sections
    const hero = page.locator('#hero');
    const about = page.locator('#about');
    const skills = page.locator('#skills');

    // Verify all sections exist
    await expect(hero).toBeVisible();
    await expect(about).toBeVisible();
    await expect(skills).toBeVisible();

    // Verify order by comparing vertical positions
    const heroBox = await hero.boundingBox();
    const aboutBox = await about.boundingBox();
    const skillsBox = await skills.boundingBox();

    expect(heroBox!.y).toBeLessThan(aboutBox!.y);
    expect(aboutBox!.y).toBeLessThan(skillsBox!.y);
  });

  test('page uses BaseLayout with correct lang prop', async ({ page }) => {
    await page.goto('/it');

    // Check the html lang attribute is set correctly
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('it');

    // Navigate to English and verify
    await page.goto('/en');
    const htmlLangEn = await page.locator('html').getAttribute('lang');
    expect(htmlLangEn).toBe('en');
  });

  test('gradient mesh background is included', async ({ page }) => {
    await page.goto('/en');

    // Check for gradient orbs
    const gradientOrbs = page.locator('.gradient-orb');
    const orbCount = await gradientOrbs.count();
    expect(orbCount).toBeGreaterThanOrEqual(2);
  });

  test('page has correct meta title and description', async ({ page }) => {
    await page.goto('/en');

    // Check title
    const title = await page.title();
    expect(title).toContain('Marco Marchione');

    // Check meta description
    const description = await page
      .locator('meta[name="description"]')
      .getAttribute('content');
    expect(description).toBeTruthy();
    expect(description!.length).toBeGreaterThan(10);
  });
});
