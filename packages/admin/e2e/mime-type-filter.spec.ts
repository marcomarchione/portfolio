import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';

test.describe('MimeTypeFilter Custom Dropdown Tests', () => {
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

  test('MimeTypeFilter dropdown opens above DropZone', async ({ page }) => {
    // Navigate to media page
    await page.goto(`${ADMIN_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-01-initial.png', fullPage: true });

    // Find the MimeTypeFilter dropdown trigger
    const filterButton = page.locator('button[aria-label="Filter by file type"]');
    const isFilterVisible = await filterButton.count() > 0;
    console.log('MimeTypeFilter button found:', isFilterVisible);
    expect(isFilterVisible).toBe(true);

    // Get initial text
    const initialText = await filterButton.textContent();
    console.log('Initial filter text:', initialText);
    expect(initialText).toContain('All Files');

    // Click to open dropdown
    await filterButton.click();
    await page.waitForTimeout(500);

    // Take screenshot with dropdown open (should be visible above DropZone)
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-02-dropdown-open.png', fullPage: true });

    // Verify dropdown options are visible
    const options = await page.locator('li[role="option"]').all();
    console.log('Dropdown options found:', options.length);
    expect(options.length).toBe(3);

    // Check option texts
    for (const opt of options) {
      const text = await opt.textContent();
      console.log('Option:', text);
    }
  });

  test('MimeTypeFilter dropdown options are clickable over DropZone', async ({ page }) => {
    // Navigate to media page
    await page.goto(`${ADMIN_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find and click the filter button
    const filterButton = page.locator('button[aria-label="Filter by file type"]');
    await filterButton.click();
    await page.waitForTimeout(500);

    // Click on "Images" option
    const imagesOption = page.locator('li[role="option"]:has-text("Images")');
    const imagesCount = await imagesOption.count();
    console.log('Images option found:', imagesCount > 0);
    expect(imagesCount).toBeGreaterThan(0);

    await imagesOption.click();
    await page.waitForTimeout(500);

    // Verify the selection changed
    const newText = await filterButton.textContent();
    console.log('After selecting Images:', newText);
    expect(newText).toContain('Images');

    // Take screenshot showing the selection
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-03-images-selected.png', fullPage: true });

    // Verify URL parameter changed
    const url = page.url();
    console.log('Current URL:', url);
    expect(url).toContain('filter=image');
  });

  test('MimeTypeFilter dropdown can filter to Documents', async ({ page }) => {
    // Navigate to media page
    await page.goto(`${ADMIN_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open dropdown and select Documents
    const filterButton = page.locator('button[aria-label="Filter by file type"]');
    await filterButton.click();
    await page.waitForTimeout(500);

    const documentsOption = page.locator('li[role="option"]:has-text("Documents")');
    await documentsOption.click();
    await page.waitForTimeout(500);

    // Verify the selection
    const newText = await filterButton.textContent();
    expect(newText).toContain('Documents');

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-04-documents-selected.png', fullPage: true });

    // Verify URL parameter
    const url = page.url();
    expect(url).toContain('filter=document');
  });

  test('MimeTypeFilter dropdown shows selected item with check mark', async ({ page }) => {
    // Navigate to media page
    await page.goto(`${ADMIN_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // First select an option
    const filterButton = page.locator('button[aria-label="Filter by file type"]');
    await filterButton.click();
    await page.waitForTimeout(500);

    // Select "Images"
    const imagesOption = page.locator('li[role="option"]:has-text("Images")');
    await imagesOption.click();
    await page.waitForTimeout(500);

    // Reopen dropdown
    await filterButton.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-05-selected-with-check.png', fullPage: true });

    // Verify the selected option has check icon
    const selectedOption = page.locator('li[role="option"][aria-selected="true"]');
    const selectedCount = await selectedOption.count();
    console.log('Selected options found:', selectedCount);
    expect(selectedCount).toBe(1);

    // Verify it has the check mark icon
    const checkIcon = selectedOption.locator('svg');
    const hasCheckIcon = await checkIcon.count() > 0;
    console.log('Has check icon:', hasCheckIcon);
    expect(hasCheckIcon).toBe(true);
  });

  test('MimeTypeFilter dropdown keyboard navigation', async ({ page }) => {
    // Navigate to media page
    await page.goto(`${ADMIN_URL}/media`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Focus the filter button
    const filterButton = page.locator('button[aria-label="Filter by file type"]');
    await filterButton.focus();

    // Press Enter to open
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify dropdown opened
    const options = await page.locator('li[role="option"]').all();
    console.log('Options after Enter:', options.length);
    expect(options.length).toBe(3);

    // Take screenshot with dropdown open via keyboard
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-06-keyboard-open.png', fullPage: true });

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify dropdown closed
    const optionsAfterEsc = await page.locator('li[role="option"]').all();
    console.log('Options after Escape:', optionsAfterEsc.length);
    expect(optionsAfterEsc.length).toBe(0);

    // Take screenshot after closing
    await page.screenshot({ path: 'e2e/screenshots/mime-filter-07-keyboard-closed.png', fullPage: true });
  });
});
