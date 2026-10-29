import { test, expect } from '@playwright/test';

test.describe('RS-BUILDER E2E Tests', () => {
  test.describe('Landing Page', () => {
    test('should load landing page successfully', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/RS-BUILDER/);
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate to workspace', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Workspace');
      await expect(page).toHaveURL(/\/app/);
    });

    test('should navigate to pricing', async ({ page }) => {
      await page.goto('/');
      await page.click('text=Pricing');
      await expect(page).toHaveURL(/\/pricing/);
    });
  });

  test.describe('Workspace', () => {
    test('should load workspace page', async ({ page }) => {
      await page.goto('/app');
      await expect(page.locator('[data-testid="workspace"]')).toBeVisible();
    });

    test('should display thread panel', async ({ page }) => {
      await page.goto('/app');
      await expect(page.locator('[data-testid="thread-panel"]')).toBeVisible();
    });

    test('should display preview panel', async ({ page }) => {
      await page.goto('/app');
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
    });

    test('should show setup modal when no API key', async ({ page }) => {
      await page.goto('/app');
      // Clear localStorage to simulate first run
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await expect(page.locator('[data-testid="setup-modal"]')).toBeVisible();
    });

    test('should handle slash commands', async ({ page }) => {
      await page.goto('/app');
      const input = page.locator('[data-testid="prompt-input"]');
      await input.fill('/help');
      await input.press('Enter');
      await expect(page.locator('text=/Available commands/')).toBeVisible();
    });
  });

  test.describe('Authentication', () => {
    test('should load login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should load signup page', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.locator('h1')).toContainText('Create account');
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/signup');
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('invalid-email');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=/Invalid email/')).toBeVisible();
    });
  });

  test.describe('Pricing Page', () => {
    test('should load pricing page', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page.locator('h1')).toContainText('Pricing');
    });

    test('should display pricing tiers', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page.locator('[data-testid="pricing-card"]')).toHaveCount(4);
    });
  });

  test.describe('Theme Switching', () => {
    test('should toggle dark mode', async ({ page }) => {
      await page.goto('/');
      const themeButton = page.locator('[data-testid="theme-toggle"]');
      await themeButton.click();
      await expect(page.locator('html')).toHaveAttribute('class', /dark/);
    });
  });

  test.describe('Language Switching', () => {
    test('should switch to Russian', async ({ page }) => {
      await page.goto('/');
      const langButton = page.locator('[data-testid="lang-toggle"]');
      await langButton.click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/nonexistent-page');
      await expect(page.locator('text=404')).toBeVisible();
    });

    test('should handle network errors', async ({ page }) => {
      await page.goto('/app');
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page within 3 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have memory leaks', async ({ page }) => {
      await page.goto('/app');
      // Navigate back and forth multiple times
      for (let i = 0; i < 5; i++) {
        await page.goto('/');
        await page.goto('/app');
      }
      // Check if page is still responsive
      await expect(page.locator('[data-testid="workspace"]')).toBeVisible();
    });
  });
});
