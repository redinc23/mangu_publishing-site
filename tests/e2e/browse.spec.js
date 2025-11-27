import { test, expect } from '@playwright/test';

test.describe('Book Browse Flow', () => {
  test('should display featured books on homepage', async ({ page }) => {
    await page.goto('/');
    
    const bookCards = page.locator('[data-testid="book-card"]');
    await expect(bookCards.first()).toBeVisible({ timeout: 10000 });
    
    const count = await bookCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search for books', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('fiction');
    await searchInput.press('Enter');
    
    await page.waitForURL(/search/);
    const results = page.locator('[data-testid="search-result"]');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter books by category', async ({ page }) => {
    await page.goto('/books');
    
    const categoryFilter = page.getByRole('button', { name: /category/i });
    await categoryFilter.click();
    
    const fictionOption = page.getByRole('option', { name: /fiction/i });
    await fictionOption.click();
    
    await page.waitForLoadState('networkidle');
    const books = page.locator('[data-testid="book-card"]');
    await expect(books.first()).toBeVisible();
  });
});
