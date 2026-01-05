/**
 * Landing Page Components Tests
 *
 * Tests for the individual landing page components.
 */
import { test, expect } from '@playwright/test';

test.describe('Landing Page Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('Hero section renders name with GradientText', async ({ page }) => {
    // Find the hero section
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();

    // Find the h1 with Marco Marchione name
    const heroHeading = heroSection.locator('h1');
    await expect(heroHeading).toBeVisible();

    const headingText = await heroHeading.textContent();
    expect(headingText).toContain('Marco Marchione');

    // Check for gradient text styling (the span with gradient classes)
    const gradientSpan = heroHeading.locator('span.bg-gradient-to-r');
    await expect(gradientSpan).toBeVisible();
  });

  test('Hero section displays Agent Software Developer subtitle in English only', async ({
    page,
  }) => {
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();

    // Find the subtitle text
    const subtitle = heroSection.locator('text=Agent Software Developer');
    await expect(subtitle).toBeVisible();

    // Verify it remains English even on different language pages
    await page.goto('/it');
    const italianHero = page.locator('#hero');
    const italianSubtitle = italianHero.locator('text=Agent Software Developer');
    await expect(italianSubtitle).toBeVisible();
  });

  test('Social links have accessible labels and correct hrefs', async ({ page }) => {
    const heroSection = page.locator('#hero');
    await expect(heroSection).toBeVisible();

    // Check LinkedIn link
    const linkedInLink = heroSection.locator('a[aria-label="LinkedIn"]');
    await expect(linkedInLink).toBeVisible();
    await expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com/in/marcomarchione');
    await expect(linkedInLink).toHaveAttribute('target', '_blank');

    // Check GitHub link
    const githubLink = heroSection.locator('a[aria-label="GitHub"]');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/marcomarchione');
    await expect(githubLink).toHaveAttribute('target', '_blank');

    // Check minimum touch target size (44x44px)
    const linkedInBox = await linkedInLink.boundingBox();
    expect(linkedInBox?.width).toBeGreaterThanOrEqual(44);
    expect(linkedInBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('About section renders with GlassCard wrapper', async ({ page }) => {
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();

    // Check for GlassCard styling (backdrop-blur)
    const glassCard = aboutSection.locator('.backdrop-blur-xl');
    await expect(glassCard).toBeVisible();

    // Check for max-width constraint
    const cardWrapper = aboutSection.locator('.max-w-3xl');
    await expect(cardWrapper).toBeVisible();
  });

  test('Skills grid renders all 16 technology items', async ({ page }) => {
    const skillsSection = page.locator('#skills');
    await expect(skillsSection).toBeVisible();

    // Count technology items
    const techItems = skillsSection.locator('[data-tech-item]');
    const count = await techItems.count();
    expect(count).toBe(16);

    // Verify some specific technologies are present
    const expectedTechnologies = [
      'TypeScript',
      'Python',
      'React',
      'Docker',
      'SQLite',
      'Golang',
    ];

    for (const tech of expectedTechnologies) {
      const techItem = skillsSection.locator(`text=${tech}`);
      await expect(techItem).toBeVisible();
    }
  });

  test('Responsive grid classes are applied to skills section', async ({ page }) => {
    const skillsSection = page.locator('#skills');
    await expect(skillsSection).toBeVisible();

    // Check for responsive grid classes
    const grid = skillsSection.locator('.grid');
    await expect(grid).toBeVisible();

    // Verify grid has responsive column classes
    const gridClasses = await grid.getAttribute('class');
    expect(gridClasses).toContain('grid-cols-2');
  });
});
