import { chromium } from '@playwright/test';
import * as fs from 'fs';

const ADMIN_URL = 'http://localhost:5174';

async function runTests() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  const allMessages: string[] = [];

  // Listen for all console messages
  page.on('console', msg => {
    allMessages.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Listen for network errors
  page.on('requestfailed', request => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Listen for response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      allMessages.push(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });

  try {
    // 1. Navigate to admin panel
    console.log('1. Navigating to admin panel...');
    await page.goto(ADMIN_URL);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/01-initial.png', fullPage: true });

    // 2. Login with correct password (admin/admin)
    console.log('2. Logging in with admin/admin...');
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]');

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'e2e/screenshots/02-after-login.png', fullPage: true });

    // Check if we're logged in (should see Dashboard or main content)
    const pageUrl = page.url();
    console.log('Current URL:', pageUrl);

    // 3. Navigate directly to the New Project form
    console.log('3. Navigating directly to /projects/new...');
    await page.goto(`${ADMIN_URL}/projects/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);  // Wait for form to load
    await page.screenshot({ path: 'e2e/screenshots/03-new-project-form.png', fullPage: true });

    // Check page content
    const projectFormContent = await page.textContent('body');
    console.log('Project form page contains:');
    console.log('- "Technologies":', projectFormContent?.includes('Technologies'));
    console.log('- "Title":', projectFormContent?.includes('Title'));
    console.log('- "Description":', projectFormContent?.includes('Description'));
    console.log('- "Error":', projectFormContent?.includes('Error'));
    console.log('- "500":', projectFormContent?.includes('500'));

    // 4. Check for Technologies selector
    console.log('4. Checking for form components...');

    // Check for language tabs
    const langTabs = await page.locator('button:has-text("IT"), button:has-text("EN"), button:has-text("ES"), button:has-text("DE")').count();
    console.log('Language tabs found:', langTabs);

    // Check for any input fields
    const inputFields = await page.locator('input, textarea, select').count();
    console.log('Input fields found:', inputFields);

    // Check for specific labels
    const techLabel = await page.locator('text=Technologies').count();
    console.log('Technologies label found:', techLabel);

    // 5. Test Language Tabs if present
    if (langTabs > 0) {
      console.log('5. Testing Language Tabs...');
      const itTab = page.locator('button:has-text("IT")').first();
      const enTab = page.locator('button:has-text("EN")').first();

      if (await itTab.isVisible()) {
        await itTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/04-tab-it.png', fullPage: true });
        console.log('Clicked IT tab');
      }

      if (await enTab.isVisible()) {
        await enTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/05-tab-en.png', fullPage: true });
        console.log('Clicked EN tab');
      }
    }

    // 6. Test textarea (MarkdownEditor)
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log('6. Textareas found:', textareaCount);

    if (textareaCount > 0) {
      await textareas.first().fill('# Test Heading\n\nThis is **bold** text.');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/06-markdown-test.png', fullPage: true });
    }

    // 7. Navigate to New Material form
    console.log('7. Navigating to /materials/new...');
    await page.goto(`${ADMIN_URL}/materials/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/07-new-material-form.png', fullPage: true });

    const materialContent = await page.textContent('body');
    console.log('Material form contains Title:', materialContent?.includes('Title'));

    // 8. Navigate to New News form
    console.log('8. Navigating to /news/new...');
    await page.goto(`${ADMIN_URL}/news/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/08-new-news-form.png', fullPage: true });

    const newsContent = await page.textContent('body');
    console.log('News form contains Title:', newsContent?.includes('Title'));

    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Console errors:', consoleErrors.length > 0 ? consoleErrors : 'None');
    console.log('Network errors:', networkErrors.length > 0 ? networkErrors : 'None');
    console.log('\nAll HTTP errors and console messages:');
    allMessages.filter(m => m.includes('error') || m.includes('Error') || m.includes('HTTP 4') || m.includes('HTTP 5')).forEach(m => console.log(m));

    // Save all logs to file
    fs.writeFileSync('e2e/screenshots/logs.json', JSON.stringify({
      consoleErrors,
      networkErrors,
      allMessages: allMessages.filter(m => m.includes('error') || m.includes('Error') || m.includes('HTTP'))
    }, null, 2));

    console.log('\nScreenshots saved to e2e/screenshots/');
    console.log('Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'e2e/screenshots/error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

runTests();
