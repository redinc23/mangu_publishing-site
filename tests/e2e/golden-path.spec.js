/**
 * Golden Path E2E Test
 * 
 * Tests the main reader flow: signin → library → book detail → cart → profile
 * 
 * Note: Stripe checkout redirect is stubbed at the network level to avoid
 * brittle redirects. We verify the API call is made instead of following
 * the full Stripe redirect flow.
 */

import { test, expect } from '@playwright/test';

test.describe('Golden Path - Main Reader Flow', () => {
  test('complete flow: signin → library → book detail → cart → profile', async ({ page, context }) => {
    // Intercept Stripe checkout API call to avoid actual redirect
    let checkoutApiCalled = false;
    let checkoutPayload = null;
    
    await context.route('**/api/payments/create-checkout-session', async (route) => {
      checkoutApiCalled = true;
      const request = route.request();
      checkoutPayload = request.postDataJSON();
      // Return a mock response to prevent redirect
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/test' })
      });
    });

    // Step 1: Sign in
    await page.goto('/signin');
    await expect(page.locator('h1')).toContainText(/sign in/i, { timeout: 5000 });
    
    // Fill in sign-in form (mock auth mode)
    const emailInput = page.getByLabel(/email/i);
    const nameInput = page.getByLabel(/display name/i);
    const submitButton = page.getByRole('button', { name: /save session|sign in/i });
    
    await emailInput.fill('test@mangu.studio');
    await nameInput.fill('Test Reader');
    await submitButton.click();
    
    // Wait for redirect to library
    await page.waitForURL('/library', { timeout: 10000 });
    await expect(page).toHaveURL(/\/library/);

    // Step 2: Library page - verify books are displayed
    await expect(page.locator('h1, h2')).toContainText(/library|trending|books/i, { timeout: 10000 });
    
    // Find and click the first book card/link
    const firstBookLink = page.locator('a[href*="/book/"]').first();
    await expect(firstBookLink).toBeVisible({ timeout: 5000 });
    
    const bookHref = await firstBookLink.getAttribute('href');
    const bookId = bookHref?.match(/\/book\/([^\/]+)/)?.[1] || '1';
    
    await firstBookLink.click();
    
    // Step 3: Book detail page
    await page.waitForURL(new RegExp(`/book/${bookId}`), { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(`/book/${bookId}`));
    
    // Verify book details are visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Click "Add to Cart" button
    const addToCartButton = page.getByRole('button', { name: /add to cart/i });
    await expect(addToCartButton).toBeVisible({ timeout: 5000 });
    await addToCartButton.click();
    
    // Small delay to ensure cart state updates
    await page.waitForTimeout(500);
    
    // Navigate to cart
    await page.goto('/cart');
    await page.waitForURL('/cart', { timeout: 5000 });
    
    // Step 4: Cart page - verify item appears
    await expect(page.locator('h1')).toContainText(/cart/i, { timeout: 5000 });
    
    // Verify cart has at least one item
    const cartItems = page.locator('article, [class*="cart-item"], [class*="book"]');
    await expect(cartItems.first()).toBeVisible({ timeout: 5000 });
    
    // Click checkout button
    const checkoutButton = page.getByRole('button', { name: /checkout/i });
    await expect(checkoutButton).toBeVisible({ timeout: 5000 });
    await expect(checkoutButton).toBeEnabled();
    
    await checkoutButton.click();
    
    // Verify checkout API was called
    await page.waitForTimeout(1000); // Give time for API call
    expect(checkoutApiCalled).toBe(true);
    expect(checkoutPayload).toBeTruthy();
    expect(checkoutPayload.items).toBeDefined();
    expect(Array.isArray(checkoutPayload.items)).toBe(true);
    
    // Step 5: Profile page
    await page.goto('/profile');
    await page.waitForURL('/profile', { timeout: 5000 });
    
    // Verify signed-in state is visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });
    
    // Verify user info is displayed (name or email)
    const userInfo = page.locator('text=/test|reader|@/i');
    await expect(userInfo.first()).toBeVisible({ timeout: 5000 });
    
    // Verify library and cart stats are shown
    const statsSection = page.locator('text=/library|cart|items/i');
    await expect(statsSection.first()).toBeVisible({ timeout: 5000 });
  });
});

