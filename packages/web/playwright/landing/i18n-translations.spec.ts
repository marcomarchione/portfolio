/**
 * i18n Translation Tests
 *
 * Tests for landing page translation keys across all 4 supported languages.
 */
import { test, expect } from '@playwright/test';

const LANGUAGES = ['it', 'en', 'es', 'de'] as const;

test.describe('Landing Page Translation Keys', () => {
  test('landing.about.title exists in all 4 languages', async ({ page }) => {
    for (const lang of LANGUAGES) {
      await page.goto(`/${lang}`);

      // Find the About section heading
      const aboutSection = page.locator('#about');
      await expect(aboutSection).toBeVisible();

      const aboutHeading = aboutSection.locator('h3').first();
      await expect(aboutHeading).toBeVisible();

      // Verify the heading text is not empty and not showing the key
      const headingText = await aboutHeading.textContent();
      expect(headingText).toBeTruthy();
      expect(headingText).not.toContain('landing.about.title');
    }
  });

  test('landing.skills.title exists in all 4 languages', async ({ page }) => {
    for (const lang of LANGUAGES) {
      await page.goto(`/${lang}`);

      // Find the Skills section heading
      const skillsSection = page.locator('#skills');
      await expect(skillsSection).toBeVisible();

      const skillsHeading = skillsSection.locator('h3').first();
      await expect(skillsHeading).toBeVisible();

      // Verify the heading text is not empty and not showing the key
      const headingText = await skillsHeading.textContent();
      expect(headingText).toBeTruthy();
      expect(headingText).not.toContain('landing.skills.title');
    }
  });

  test('landing.about.text placeholder exists in all 4 languages', async ({ page }) => {
    for (const lang of LANGUAGES) {
      await page.goto(`/${lang}`);

      // Find the About section
      const aboutSection = page.locator('#about');
      await expect(aboutSection).toBeVisible();

      // Find the text content (paragraph inside the GlassCard)
      const aboutText = aboutSection.locator('p').first();
      await expect(aboutText).toBeVisible();

      // Verify the text is not empty (placeholder text should be present)
      const textContent = await aboutText.textContent();
      expect(textContent).toBeTruthy();
      expect(textContent!.length).toBeGreaterThan(10);
    }
  });
});
