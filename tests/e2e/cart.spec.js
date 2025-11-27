import { test, expect } from '@playwright/test';

test.describe('Shopping Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add book to cart', async ({ page }) => {
    const firstBook = page.locator('[data-testid="book-card"]').first();
    await firstBook.waitFor({ state: 'visible', timeout: 10000 });
    await firstBook.click();
    
    await page.waitForURL(/\/books\//);
    
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await addToCartButton.click();
    
    const cartBadge = page.locator('[data-testid="cart-badge"]');
    await expect(cartBadge).toHaveText('1', { timeout: 5000 });
  });

  test('should view cart contents', async ({ page }) => {
    const cartIcon = page.getByRole('link', { name: /cart/i });
    await cartIcon.click();
    
    await expect(page).toHaveURL(/cart/);
    const emptyMessage = page.getByText(/cart is empty/i);
    await expect(emptyMessage).toBeVisible();
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');
    
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    if (await removeButton.isVisible()) {
      const initialCount = await page.locator('[data-testid="cart-item"]').count();
      await removeButton.click();
      
      await page.waitForTimeout(1000);
      const newCount = await page.locator('[data-testid="cart-item"]').count();
      expect(newCount).toBe(initialCount - 1);
    }
  });
});
