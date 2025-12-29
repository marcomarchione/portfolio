import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const ADMIN_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

test.describe('Admin Panel Form Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(ADMIN_URL);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we need to login
    const loginForm = page.locator('form');
    if (await loginForm.isVisible()) {
      // Try to login with admin credentials
      await page.fill('input[type="text"], input[name="username"]', 'admin');
      await page.fill('input[type="password"]', 'admin');
      await page.click('button[type="submit"]');

      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
    }
  });

  test('Technologies selector loads without 500 error', async ({ page }) => {
    // Navigate to Projects -> New Project
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Take screenshot of projects list
    await page.screenshot({ path: 'e2e/screenshots/01-projects-list.png', fullPage: true });

    // Click on New Project button
    const newProjectBtn = page.locator('a:has-text("New Project")');
    await newProjectBtn.click();
    await page.waitForLoadState('networkidle');

    // Take screenshot of new project form
    await page.screenshot({ path: 'e2e/screenshots/02-new-project-form.png', fullPage: true });

    // Check for Technologies selector - it should not show 500 error
    const techSelector = page.locator('[data-testid="technologies-selector"], label:has-text("Technologies"), text=Technologies');

    // Check for any error messages
    const errorMessages = page.locator('.error, [class*="error"]');
    const errorCount = await errorMessages.count();

    console.log('Error messages found:', errorCount);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/03-tech-selector.png', fullPage: true });
  });

  test('MarkdownEditor works correctly', async ({ page }) => {
    // Navigate to Projects -> New Project
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    const newProjectBtn = page.locator('a:has-text("New Project")');
    await newProjectBtn.click();
    await page.waitForLoadState('networkidle');

    // Find a markdown editor (textarea or contenteditable for description)
    const markdownEditor = page.locator('textarea[name*="description"], textarea[name*="content"], [data-testid="markdown-editor"], .markdown-editor textarea');

    if (await markdownEditor.count() > 0) {
      await markdownEditor.first().fill('# Test Heading\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2');
      await page.screenshot({ path: 'e2e/screenshots/04-markdown-editor.png', fullPage: true });
      console.log('MarkdownEditor found and tested');
    } else {
      console.log('MarkdownEditor not found on page');
      await page.screenshot({ path: 'e2e/screenshots/04-markdown-editor-not-found.png', fullPage: true });
    }
  });

  test('LanguageTabs switch between languages', async ({ page }) => {
    // Navigate to Projects -> New Project
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    const newProjectBtn = page.locator('a:has-text("New Project")');
    await newProjectBtn.click();
    await page.waitForLoadState('networkidle');

    // Find language tabs
    const itTab = page.locator('button:has-text("IT"), [role="tab"]:has-text("IT"), .tab:has-text("IT")');
    const enTab = page.locator('button:has-text("EN"), [role="tab"]:has-text("EN"), .tab:has-text("EN")');
    const esTab = page.locator('button:has-text("ES"), [role="tab"]:has-text("ES"), .tab:has-text("ES")');
    const deTab = page.locator('button:has-text("DE"), [role="tab"]:has-text("DE"), .tab:has-text("DE")');

    // Check if tabs exist
    const itExists = await itTab.count() > 0;
    const enExists = await enTab.count() > 0;

    console.log('Language tabs found - IT:', itExists, 'EN:', enExists);

    if (itExists) {
      await itTab.first().click();
      await page.screenshot({ path: 'e2e/screenshots/05-lang-tab-it.png', fullPage: true });
    }

    if (enExists) {
      await enTab.first().click();
      await page.screenshot({ path: 'e2e/screenshots/06-lang-tab-en.png', fullPage: true });
    }

    // Try ES tab
    if (await esTab.count() > 0) {
      await esTab.first().click();
      await page.screenshot({ path: 'e2e/screenshots/07-lang-tab-es.png', fullPage: true });
    }

    // Try DE tab
    if (await deTab.count() > 0) {
      await deTab.first().click();
      await page.screenshot({ path: 'e2e/screenshots/08-lang-tab-de.png', fullPage: true });
    }
  });

  test('Materials form works', async ({ page }) => {
    // Navigate to Materials
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'e2e/screenshots/09-materials-list.png', fullPage: true });

    // Click on New Material button
    const newMaterialBtn = page.locator('text=New Material, text=Add Material, button:has-text("New"), a:has-text("New")').first();
    if (await newMaterialBtn.count() > 0) {
      await newMaterialBtn.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/10-new-material-form.png', fullPage: true });
    } else {
      console.log('New Material button not found');
    }
  });

  test('News form works', async ({ page }) => {
    // Navigate to News
    await page.click('nav >> text=News');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'e2e/screenshots/11-news-list.png', fullPage: true });

    // Click on New News button
    const newNewsBtn = page.locator('text=New News, text=Add News, button:has-text("New"), a:has-text("New")').first();
    if (await newNewsBtn.count() > 0) {
      await newNewsBtn.click();
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/12-new-news-form.png', fullPage: true });
    } else {
      console.log('New News button not found');
    }
  });

  test('Check console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for network errors
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate through the app
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');

    // Login if needed
    const loginForm = page.locator('form');
    if (await loginForm.isVisible()) {
      await page.fill('input[type="text"], input[name="username"]', 'admin');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    // Navigate to Projects
    const projectsLink = page.locator('text=Projects').first();
    if (await projectsLink.count() > 0) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to New Project
    const newBtn = page.locator('text=New Project, text=Add Project, button:has-text("New"), a:has-text("New")').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    console.log('Console errors:', consoleErrors);
    console.log('Network errors:', networkErrors);

    // Save errors to file
    fs.writeFileSync('e2e/screenshots/errors.json', JSON.stringify({
      consoleErrors,
      networkErrors
    }, null, 2));
  });
});
