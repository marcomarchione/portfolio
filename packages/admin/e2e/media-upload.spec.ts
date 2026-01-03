/**
 * Media Upload E2E Test
 *
 * Tests the media upload functionality in the admin panel,
 * capturing network and console errors to debug upload issues.
 */
import { test, expect, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADMIN_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3000';
const ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin';

// Store captured errors
interface NetworkError {
  url: string;
  method: string;
  status: number;
  statusText: string;
  responseBody?: string;
}

interface ConsoleError {
  type: string;
  text: string;
}

/**
 * Helper to login
 */
async function login(page: Page) {
  await page.goto(`${ADMIN_URL}/login`);
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="username"]', ADMIN_USERNAME);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

/**
 * Create a test image file
 */
function createTestImagePath(): string {
  const testDir = path.join(__dirname, 'test-assets');
  const testImagePath = path.join(testDir, 'test-image.png');

  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a minimal valid PNG file (1x1 pixel, red)
  if (!fs.existsSync(testImagePath)) {
    // Minimal PNG: 1x1 red pixel
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, // bit depth: 8
      0x02, // color type: RGB
      0x00, 0x00, 0x00, // compression, filter, interlace
      0x90, 0x77, 0x53, 0xde, // IHDR CRC
      0x00, 0x00, 0x00, 0x0c, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, // compressed data
      0x01, 0xa0, 0x01, 0x02, // IDAT data cont.
      0x12, 0xdb, 0x4e, 0xa5, // IDAT CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4e, 0x44, // IEND
      0xae, 0x42, 0x60, 0x82, // IEND CRC
    ]);
    fs.writeFileSync(testImagePath, pngData);
  }

  return testImagePath;
}

test.describe('Media Upload Debug', () => {
  let networkErrors: NetworkError[] = [];
  let consoleErrors: ConsoleError[] = [];
  let allRequests: { url: string; method: string; status?: number }[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset error collectors
    networkErrors = [];
    consoleErrors = [];
    allRequests = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
        });
      }
    });

    // Capture all network requests and responses
    page.on('request', (request) => {
      allRequests.push({
        url: request.url(),
        method: request.method(),
      });
    });

    page.on('response', async (response) => {
      const request = response.request();
      const url = request.url();
      const method = request.method();
      const status = response.status();

      // Update request with status
      const reqIndex = allRequests.findIndex(
        (r) => r.url === url && r.method === method && r.status === undefined
      );
      if (reqIndex !== -1) {
        allRequests[reqIndex].status = status;
      }

      // Capture failed requests (4xx and 5xx errors)
      if (status >= 400) {
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch {
          responseBody = 'Could not read response body';
        }

        networkErrors.push({
          url,
          method,
          status,
          statusText: response.statusText(),
          responseBody,
        });
      }
    });

    // Capture request failures (network errors)
    page.on('requestfailed', (request) => {
      networkErrors.push({
        url: request.url(),
        method: request.method(),
        status: 0,
        statusText: request.failure()?.errorText || 'Unknown network error',
      });
    });
  });

  test('Navigate to media page and attempt upload', async ({ page }) => {
    // Login
    await login(page);
    console.log('Logged in successfully');

    // Navigate to Media page
    await page.click('nav >> text=Media');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1:has-text("Media")')).toBeVisible({ timeout: 10000 });
    console.log('Navigated to Media page');

    // Take screenshot of media page
    await page.screenshot({ path: 'e2e/screenshots/media-01-page-loaded.png', fullPage: true });

    // Create test image
    const testImagePath = createTestImagePath();
    console.log('Test image path:', testImagePath);

    // Find the drop zone or file input
    const dropZone = page.locator('[aria-label="Drop files here to upload"]');
    const dropZoneVisible = await dropZone.isVisible().catch(() => false);
    console.log('Drop zone visible:', dropZoneVisible);

    if (dropZoneVisible) {
      // Find the hidden file input inside the drop zone
      const fileInput = page.locator('input[type="file"]').first();

      // Upload file via file input
      console.log('Attempting file upload...');
      await fileInput.setInputFiles(testImagePath);

      // Wait for upload to start and network activity
      await page.waitForTimeout(2000);

      // Take screenshot after upload attempt
      await page.screenshot({ path: 'e2e/screenshots/media-02-after-upload-attempt.png', fullPage: true });

      // Wait for any pending network requests
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Take final screenshot
      await page.screenshot({ path: 'e2e/screenshots/media-03-final-state.png', fullPage: true });
    }

    // Wait longer for upload to complete
    await page.waitForTimeout(3000);

    // Log all captured errors
    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length === 0) {
      console.log('No network errors captured');
    } else {
      networkErrors.forEach((err, i) => {
        console.log(`\nError ${i + 1}:`);
        console.log(`  URL: ${err.url}`);
        console.log(`  Method: ${err.method}`);
        console.log(`  Status: ${err.status} ${err.statusText}`);
        if (err.responseBody) {
          console.log(`  Response: ${err.responseBody.substring(0, 500)}`);
        }
      });
    }

    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length === 0) {
      console.log('No console errors captured');
    } else {
      consoleErrors.forEach((err, i) => {
        console.log(`\n${err.type.toUpperCase()} ${i + 1}: ${err.text}`);
      });
    }

    console.log('\n=== ALL API REQUESTS ===');
    const apiRequests = allRequests.filter((r) => r.url.includes('/api/'));
    apiRequests.forEach((req) => {
      console.log(`${req.method} ${req.url} => ${req.status ?? 'pending'}`);
    });

    // Check for upload-related requests
    const uploadRequests = allRequests.filter(
      (r) => r.url.includes('/media') && r.method === 'POST'
    );
    console.log('\n=== UPLOAD REQUESTS ===');
    if (uploadRequests.length === 0) {
      console.log('No upload requests detected - upload may not have been triggered');
    } else {
      uploadRequests.forEach((req) => {
        console.log(`${req.method} ${req.url} => ${req.status ?? 'pending'}`);
      });
    }

    // Assertions
    // We expect either successful upload or detailed error information
    const uploadFailed = networkErrors.some(
      (e) => e.url.includes('/media') && e.method === 'POST'
    );

    if (uploadFailed) {
      const uploadError = networkErrors.find(
        (e) => e.url.includes('/media') && e.method === 'POST'
      );
      console.log('\n=== UPLOAD FAILED ===');
      console.log('Upload error details:', JSON.stringify(uploadError, null, 2));
    }

    // Check upload queue component for status
    const uploadQueueItems = page.locator('[class*="upload"]');
    const queueCount = await uploadQueueItems.count();
    console.log('\n=== UPLOAD QUEUE STATUS ===');
    console.log('Queue items count:', queueCount);

    // Check if there's any upload success or error message visible
    const successMessage = page.locator('text=uploaded, text=complete, text=success').first();
    const errorMessage = page.locator('text=failed, text=error').first();
    if (await successMessage.isVisible().catch(() => false)) {
      console.log('Success message visible');
    }
    if (await errorMessage.isVisible().catch(() => false)) {
      console.log('Error message visible');
    }
  });

  test('Test API upload endpoint directly', async ({ page }) => {
    // First login to get auth token
    await page.goto(`${ADMIN_URL}/login`);
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Get the auth token from localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('access_token');
    });
    console.log('Auth token retrieved:', token ? 'Yes' : 'No');

    // Test the API endpoint directly using fetch
    const testImagePath = createTestImagePath();
    const imageBuffer = fs.readFileSync(testImagePath);

    // Create FormData and make request via page context
    const result = await page.evaluate(
      async ({ apiUrl, imageData, authToken }) => {
        try {
          // Convert array to Uint8Array then to Blob
          const uint8Array = new Uint8Array(imageData);
          const blob = new Blob([uint8Array], { type: 'image/png' });
          const formData = new FormData();
          formData.append('file', blob, 'test-image.png');

          const response = await fetch(`${apiUrl}/api/v1/admin/media`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
            body: formData,
          });

          const responseText = await response.text();
          return {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseText,
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      },
      {
        apiUrl: API_URL,
        imageData: Array.from(imageBuffer),
        authToken: token,
      }
    );

    console.log('\n=== DIRECT API TEST RESULT ===');
    console.log(JSON.stringify(result, null, 2));

    // Parse and display result
    if ('error' in result) {
      console.log('Request failed with error:', result.error);
    } else {
      console.log(`Status: ${result.status} ${result.statusText}`);
      console.log('Response body:', result.body);

      if (result.status >= 200 && result.status < 300) {
        console.log('Upload successful!');
      } else {
        console.log('Upload failed with status:', result.status);
      }
    }
  });

  test('Debug upload flow step by step', async ({ page }) => {
    await login(page);

    // Navigate to Media
    await page.click('nav >> text=Media');
    await page.waitForLoadState('networkidle');

    // Check page structure
    console.log('\n=== PAGE STRUCTURE ANALYSIS ===');

    // Check for drop zone
    const dropZone = page.locator('[aria-label="Drop files here to upload"]');
    console.log('Drop zone found:', await dropZone.count());

    // Check for file inputs
    const fileInputs = page.locator('input[type="file"]');
    console.log('File inputs found:', await fileInputs.count());

    // Check for upload button
    const uploadButton = page.locator('button:has-text("Upload"), a:has-text("Upload")');
    console.log('Upload buttons found:', await uploadButton.count());

    // Check for upload queue component
    const uploadQueue = page.locator('[class*="upload"], [class*="queue"]');
    console.log('Upload queue elements found:', await uploadQueue.count());

    // Get the page HTML to understand structure
    const mediaPageContent = await page.content();

    // Check if API URL is correct in the frontend
    const apiUrlInPage = await page.evaluate(() => {
      // @ts-ignore
      return window.__VITE_API_URL__ || import.meta?.env?.VITE_API_URL || 'Not found';
    }).catch(() => 'Could not evaluate');
    console.log('VITE_API_URL in page:', apiUrlInPage);

    // Check localStorage for any stored API URL
    const storedConfig = await page.evaluate(() => {
      return {
        apiUrl: localStorage.getItem('api_url'),
        accessToken: localStorage.getItem('access_token') ? 'present' : 'missing',
      };
    });
    console.log('Stored config:', storedConfig);

    // Try upload and monitor network
    const testImagePath = createTestImagePath();
    const fileInput = page.locator('input[type="file"]').first();

    // Set up request interception to log details
    page.on('request', (request) => {
      if (request.url().includes('media')) {
        console.log('\n=== MEDIA REQUEST ===');
        console.log('URL:', request.url());
        console.log('Method:', request.method());
        console.log('Headers:', JSON.stringify(request.headers(), null, 2));
        console.log('Post data type:', request.postDataBuffer() ? 'binary' : 'none');
      }
    });

    console.log('\nAttempting upload...');
    await fileInput.setInputFiles(testImagePath);

    // Wait for network activity
    await page.waitForTimeout(3000);

    // Check upload queue status
    const queueItems = page.locator('[class*="upload"]');
    const queueCount = await queueItems.count();
    console.log('Queue items after upload:', queueCount);

    await page.screenshot({
      path: 'e2e/screenshots/media-04-debug-upload.png',
      fullPage: true,
    });
  });
});
