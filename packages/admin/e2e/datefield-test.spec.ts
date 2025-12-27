import { test, expect } from '@playwright/test';

const ADMIN_URL = 'http://localhost:5173';

test.describe('DateField Custom Calendar Tests', () => {
  test.beforeEach(async ({ page }) => {
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

  test('DateField opens calendar popup with custom styling', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/projects/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find the Start Date field
    const startDateButton = page.locator('button#startDate');
    expect(await startDateButton.count()).toBeGreaterThan(0);

    // Click to open calendar
    await startDateButton.click();
    await page.waitForTimeout(500);

    // Take screenshot of the calendar popup
    await page.screenshot({ path: 'e2e/screenshots/datefield-calendar-open.png', fullPage: true });

    // Verify calendar popup is visible
    const calendarDialog = page.locator('[role="dialog"]');
    expect(await calendarDialog.count()).toBeGreaterThan(0);

    // Verify month/year header exists
    const monthHeader = calendarDialog.locator('span.font-medium');
    const headerText = await monthHeader.textContent();
    console.log('Calendar header:', headerText);
    expect(headerText).toContain('2025');

    // Verify day buttons exist
    const dayButtons = calendarDialog.locator('button:not([aria-label])');
    console.log('Day buttons found:', await dayButtons.count());

    // Click on day 15
    await page.click('[role="dialog"] button:has-text("15")');
    await page.waitForTimeout(500);

    // Verify calendar closed and date is set
    const newValue = await startDateButton.textContent();
    console.log('Selected date:', newValue);
    expect(newValue).toContain('15');

    await page.screenshot({ path: 'e2e/screenshots/datefield-date-selected.png', fullPage: true });
  });

  test('DateField Today button works', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/projects/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Open End Date calendar
    await page.click('button#endDate');
    await page.waitForTimeout(500);

    // Click Today button
    await page.click('[role="dialog"] button:has-text("Today")');
    await page.waitForTimeout(500);

    // Verify date is set to today
    const endDateButton = page.locator('button#endDate');
    const selectedValue = await endDateButton.textContent();
    console.log('Today selected:', selectedValue);

    // Should contain today's date in dd/mm/yyyy format
    const today = new Date();
    const expectedDay = today.getDate().toString().padStart(2, '0');
    expect(selectedValue).toContain(expectedDay);
  });
});
