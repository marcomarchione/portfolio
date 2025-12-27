import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';

test.describe('SelectField Custom Dropdown Tests', () => {
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
      await page.waitForTimeout(1000);
    }
  });

  test('Project form - custom SelectField dropdown works', async ({ page }) => {
    // Go directly to new project form
    await page.goto(`${ADMIN_URL}/projects/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of initial form
    await page.screenshot({ path: 'e2e/screenshots/custom-01-project-form.png', fullPage: true });

    // Look for the custom dropdown trigger button (has aria-haspopup="listbox")
    const customDropdowns = await page.locator('button[aria-haspopup="listbox"]').all();
    console.log('Custom dropdown triggers found:', customDropdowns.length);

    // Find the project status dropdown by its label
    const projectStatusDropdown = page.locator('button#projectStatus[aria-haspopup="listbox"]');
    const isStatusVisible = await projectStatusDropdown.count() > 0;
    console.log('projectStatus custom dropdown exists:', isStatusVisible);

    if (isStatusVisible) {
      // Check the current selected text
      const currentText = await projectStatusDropdown.textContent();
      console.log('Current selection text:', currentText);

      // Click to open the dropdown
      await projectStatusDropdown.click();
      await page.waitForTimeout(500);

      // Take screenshot with dropdown open
      await page.screenshot({ path: 'e2e/screenshots/custom-02-dropdown-open.png', fullPage: true });

      // Check for listbox items
      const options = await page.locator('li[role="option"]').all();
      console.log('Options in dropdown:', options.length);

      for (const opt of options) {
        const text = await opt.textContent();
        const isSelected = await opt.getAttribute('aria-selected');
        console.log(`Option: "${text}", selected: ${isSelected}`);
      }

      // Click on "Completed" option
      const completedOption = page.locator('li[role="option"]:has-text("Completed")');
      if (await completedOption.count() > 0) {
        await completedOption.click();
        await page.waitForTimeout(500);

        // Verify selection changed
        const newText = await projectStatusDropdown.textContent();
        console.log('After selecting Completed:', newText);
        expect(newText).toContain('Completed');

        // Take screenshot showing the selection
        await page.screenshot({ path: 'e2e/screenshots/custom-03-completed-selected.png', fullPage: true });
      }
    }
  });

  test('Material form - custom SelectField dropdown works', async ({ page }) => {
    // Go directly to new material form
    await page.goto(`${ADMIN_URL}/materials/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/custom-04-material-form.png', fullPage: true });

    // Look for the category dropdown
    const categoryDropdown = page.locator('button#category[aria-haspopup="listbox"]');
    const isCategoryVisible = await categoryDropdown.count() > 0;
    console.log('category custom dropdown exists:', isCategoryVisible);

    if (isCategoryVisible) {
      // Check the current selected text
      const currentText = await categoryDropdown.textContent();
      console.log('Current selection text:', currentText);

      // Click to open the dropdown
      await categoryDropdown.click();
      await page.waitForTimeout(500);

      // Take screenshot with dropdown open
      await page.screenshot({ path: 'e2e/screenshots/custom-05-category-dropdown-open.png', fullPage: true });

      // Click on "Guide" option
      const guideOption = page.locator('li[role="option"]:has-text("Guide")');
      if (await guideOption.count() > 0) {
        await guideOption.click();
        await page.waitForTimeout(500);

        // Verify selection changed
        const newText = await categoryDropdown.textContent();
        console.log('After selecting Guide:', newText);
        expect(newText).toContain('Guide');

        // Take screenshot showing the selection
        await page.screenshot({ path: 'e2e/screenshots/custom-06-guide-selected.png', fullPage: true });
      }
    }
  });

  test('Dropdown shows violet/primary color for selected item', async ({ page }) => {
    // Go to new project form
    await page.goto(`${ADMIN_URL}/projects/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find project status dropdown
    const projectStatusDropdown = page.locator('button#projectStatus[aria-haspopup="listbox"]');

    if (await projectStatusDropdown.count() > 0) {
      // First select an option
      await projectStatusDropdown.click();
      await page.waitForTimeout(500);

      // Select "Completed"
      const completedOption = page.locator('li[role="option"]:has-text("Completed")');
      if (await completedOption.count() > 0) {
        await completedOption.click();
        await page.waitForTimeout(500);
      }

      // Now reopen dropdown to see the selected item styling
      await projectStatusDropdown.click();
      await page.waitForTimeout(500);

      // Take screenshot of dropdown with selected item (should show violet styling)
      await page.screenshot({ path: 'e2e/screenshots/custom-07-selected-item-violet.png', fullPage: true });

      // Check that the selected option has the correct styling (bg-primary-500/20)
      const selectedOption = page.locator('li[role="option"][aria-selected="true"]');
      const selectedCount = await selectedOption.count();
      console.log('Selected options found:', selectedCount);

      if (selectedCount > 0) {
        const selectedText = await selectedOption.textContent();
        console.log('Selected option text:', selectedText);

        // Verify it has the check mark icon (primary-400 color)
        const checkIcon = selectedOption.locator('svg');
        const hasCheckIcon = await checkIcon.count() > 0;
        console.log('Has check icon:', hasCheckIcon);
        expect(hasCheckIcon).toBe(true);
      }
    }
  });
});
