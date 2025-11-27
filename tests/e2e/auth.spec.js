import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/MANGU/i);
    const loginButton = page.getByRole('button', { name: /sign in/i });
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await signupLink.click();
    await expect(page).toHaveURL(/signup/);
  });

  test('should show validation errors on empty login', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /sign in/i });
    await loginButton.click();
    
    const emailError = page.getByText(/email.*required/i);
    await expect(emailError).toBeVisible({ timeout: 3000 });
  });
});
