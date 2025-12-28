import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';

test.describe('SelectField Component Tests', () => {
  test('Test login and SelectField rendering', async ({ page }) => {
    // Capture console messages and errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else {
        consoleMessages.push(text);
      }
    });

    // Navigate to admin
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/select-01-initial.png', fullPage: true });

    // Check if we're on login page
    const loginFormVisible = await page.locator('form').isVisible();
    console.log('Login form visible:', loginFormVisible);

    if (loginFormVisible) {
      // Fill login form
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'admin');

      await page.screenshot({ path: 'e2e/screenshots/select-02-login-filled.png', fullPage: true });

      // Click sign in
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'e2e/screenshots/select-03-after-login.png', fullPage: true });
    }

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Try to navigate to an existing project if we're logged in
    const projectsLink = page.locator('a:has-text("Projects"), nav >> text=Projects').first();
    if (await projectsLink.isVisible()) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'e2e/screenshots/select-04-projects-list.png', fullPage: true });

      // Look for edit button on first project or new project button
      const editOrNewBtn = page.locator('a:has-text("Edit"), a:has-text("New"), button:has-text("New")').first();
      if (await editOrNewBtn.isVisible()) {
        await editOrNewBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'e2e/screenshots/select-05-project-form.png', fullPage: true });

        // Now look for the SelectField (Project Status dropdown)
        const projectStatusSelect = page.locator('#projectStatus, select[id="projectStatus"]');
        const statusVisible = await projectStatusSelect.isVisible();
        console.log('Project Status SelectField visible:', statusVisible);

        if (statusVisible) {
          // Get the current value
          const currentValue = await projectStatusSelect.inputValue();
          console.log('Project Status current value:', currentValue);

          // Click to open and take screenshot
          await projectStatusSelect.click();
          await page.screenshot({ path: 'e2e/screenshots/select-06-status-dropdown.png', fullPage: true });
        }

        // Look for any select elements on page
        const allSelects = await page.locator('select').all();
        console.log('Total select elements on page:', allSelects.length);

        for (let i = 0; i < allSelects.length; i++) {
          const selectId = await allSelects[i].getAttribute('id');
          const selectValue = await allSelects[i].inputValue();
          console.log(`Select #${i}: id=${selectId}, value=${selectValue}`);
        }
      }
    }

    // Log any errors
    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(e => console.log('  - ', e));
    }

    // Save final state
    await page.screenshot({ path: 'e2e/screenshots/select-07-final.png', fullPage: true });

    // Output summary
    console.log('\n=== Summary ===');
    console.log('Console errors:', consoleErrors.length);
    console.log('Console messages:', consoleMessages.length);
  });
});
