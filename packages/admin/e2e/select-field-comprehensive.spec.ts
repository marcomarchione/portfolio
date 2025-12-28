import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';

test.describe('SelectField Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');

    // Login
    const loginFormVisible = await page.locator('form').isVisible();
    if (loginFormVisible) {
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }
  });

  test('Project Status SelectField renders and changes value', async ({ page }) => {
    // Navigate to Projects
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    // Click on first Edit button or New Project
    const editBtn = page.locator('a:has-text("Edit")').first();
    const newBtn = page.locator('a:has-text("New"), button:has-text("New")').first();

    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else if (await newBtn.isVisible()) {
      await newBtn.click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of form
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-01-project-form.png', fullPage: true });

    // Find the Project Status select
    const projectStatusSelect = page.locator('select#projectStatus');
    await expect(projectStatusSelect).toBeVisible();

    // Get current value
    const initialValue = await projectStatusSelect.inputValue();
    console.log('Initial Project Status:', initialValue);

    // Take screenshot with dropdown value
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-02-status-initial.png', fullPage: true });

    // Change value to 'completed'
    await projectStatusSelect.selectOption('completed');
    const newValue = await projectStatusSelect.inputValue();
    console.log('New Project Status:', newValue);

    expect(newValue).toBe('completed');

    // Take screenshot after change
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-03-status-completed.png', fullPage: true });

    // Change to 'archived'
    await projectStatusSelect.selectOption('archived');
    const archivedValue = await projectStatusSelect.inputValue();
    console.log('Archived Status:', archivedValue);

    expect(archivedValue).toBe('archived');
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-04-status-archived.png', fullPage: true });
  });

  test('Material Category SelectField renders and changes value', async ({ page }) => {
    // Navigate to Materials
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    // Click on first Edit button or New Material
    const editBtn = page.locator('a:has-text("Edit")').first();
    const newBtn = page.locator('a:has-text("New"), button:has-text("New")').first();

    if (await editBtn.isVisible()) {
      await editBtn.click();
    } else if (await newBtn.isVisible()) {
      await newBtn.click();
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Take screenshot of form
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-05-material-form.png', fullPage: true });

    // Find the Category select
    const categorySelect = page.locator('select#category');
    await expect(categorySelect).toBeVisible();

    // Get current value
    const initialValue = await categorySelect.inputValue();
    console.log('Initial Category:', initialValue);

    // Take screenshot with dropdown value
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-06-category-initial.png', fullPage: true });

    // Change value to 'guide'
    await categorySelect.selectOption('guide');
    const guideValue = await categorySelect.inputValue();
    console.log('Guide Category:', guideValue);

    expect(guideValue).toBe('guide');

    // Take screenshot after change
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-07-category-guide.png', fullPage: true });

    // Change to 'template'
    await categorySelect.selectOption('template');
    const templateValue = await categorySelect.inputValue();
    console.log('Template Category:', templateValue);

    expect(templateValue).toBe('template');
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-08-category-template.png', fullPage: true });

    // Change to 'tool'
    await categorySelect.selectOption('tool');
    const toolValue = await categorySelect.inputValue();
    console.log('Tool Category:', toolValue);

    expect(toolValue).toBe('tool');
    await page.screenshot({ path: 'e2e/screenshots/comprehensive-09-category-tool.png', fullPage: true });
  });

  test('Check for console errors on forms', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to Projects form
    await page.click('nav >> text=Projects');
    await page.waitForLoadState('networkidle');

    const newProjectBtn = page.locator('a:has-text("New"), button:has-text("New")').first();
    if (await newProjectBtn.isVisible()) {
      await newProjectBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Navigate to Materials form
    await page.click('nav >> text=Materials');
    await page.waitForLoadState('networkidle');

    const newMaterialBtn = page.locator('a:has-text("New"), button:has-text("New")').first();
    if (await newMaterialBtn.isVisible()) {
      await newMaterialBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    console.log('Console errors found:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('Errors:');
      consoleErrors.forEach(e => console.log('  -', e));
    }

    // No errors expected
    expect(consoleErrors.length).toBe(0);
  });
});
