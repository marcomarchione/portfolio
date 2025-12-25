/**
 * Admin Panel E2E Tests
 *
 * Tests the login flow, navigation, protected routes, and responsive behavior.
 */
import { test, expect } from '@playwright/test';

// Load credentials from environment variables
const ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME!;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD!;

test.describe('Login Flow', () => {
  test('should display login page when not authenticated', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login form should be visible
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in credentials
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Dashboard content should be visible
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in wrong credentials
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="password"]', 'wrong');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.text-red-400')).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Sidebar should be visible on desktop
    await expect(page.locator('aside')).toBeVisible();

    // Navigation items should be visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Materials' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'News' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Media' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('should navigate to Projects page', async ({ page }) => {
    await page.click('text=Projects');
    await expect(page).toHaveURL('/projects');
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
  });

  test('should navigate to Materials page', async ({ page }) => {
    await page.click('text=Materials');
    await expect(page).toHaveURL('/materials');
    await expect(page.getByRole('heading', { name: 'Materials' })).toBeVisible();
  });

  test('should navigate to News page', async ({ page }) => {
    await page.click('text=News');
    await expect(page).toHaveURL('/news');
    await expect(page.getByRole('heading', { name: 'News' })).toBeVisible();
  });

  test('should navigate to Media page', async ({ page }) => {
    await page.click('text=Media');
    await expect(page).toHaveURL('/media');
    await expect(page.getByRole('heading', { name: 'Media' })).toBeVisible();
  });

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should highlight active navigation link', async ({ page }) => {
    // Navigate to Projects
    await page.click('text=Projects');

    // Projects link should have active styling (gradient background)
    const projectsLink = page.getByRole('link', { name: 'Projects' });
    await expect(projectsLink).toHaveClass(/from-primary-500/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login after logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Click logout
    await page.click('button[aria-label="Logout"]');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Trying to go back to dashboard should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Responsive Behavior', () => {
  test('should show hamburger menu on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Desktop sidebar should not be visible
    await expect(page.locator('aside').first()).not.toBeVisible();

    // Hamburger menu button should be visible
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible();
  });

  test('should open mobile sidebar when hamburger is clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Click hamburger menu
    await page.click('button[aria-label="Toggle menu"]');

    // Mobile sidebar should be visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Navigation items should be visible in mobile sidebar
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('should close mobile sidebar when navigation link is clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/login');
    await page.fill('input[name="username"]', ADMIN_USERNAME);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Open mobile sidebar
    await page.click('button[aria-label="Toggle menu"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click on Projects link
    await page.click('text=Projects');

    // Should navigate to Projects
    await expect(page).toHaveURL('/projects');

    // Mobile sidebar should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
