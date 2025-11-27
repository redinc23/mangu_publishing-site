import { test, expect } from '@playwright/test';

test.describe('Admin CRUD flow', () => {
  test('admin can create, edit, and delete a book', async ({ page }) => {
    page.on('dialog', (dialog) => dialog.accept());

    const adminEmail = 'admin@mangu.studio';
    const initialTitle = `Playwright Admin Book ${Date.now()}`;
    const updatedTitle = `${initialTitle} (Updated)`;
    const initialGenre = 'Playwright Genre';
    const updatedGenre = 'Playwright Updated Genre';
    const authorName = 'Playwright Author';
    const coverUrl = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&w=240';

    // Step 1: Sign in
    await page.goto('/signin');
    
    // Fill in sign-in form (getByLabel auto-waits for elements, works with both mock and real auth)
    // Wait for form inputs to be ready (more reliable than heading text)
    const nameInput = page.getByLabel(/display name/i);
    const emailInput = page.getByLabel(/email/i);
    await nameInput.waitFor({ state: 'visible', timeout: 30000 });
    
    // Fill the form
    await nameInput.fill('Admin Tester');
    await emailInput.fill(adminEmail);
    
    // Verify we're on the sign-in page (works with both "Mock sign-in" and "Sign in to MANGU")
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible({ timeout: 5000 });
    
    const submitButton = page.getByRole('button', { name: /save session|sign in/i });
    await submitButton.click();
    
    // Wait for redirect to library
    await page.waitForURL('/library', { timeout: 10000 });
    await expect(page).toHaveURL(/\/library/);

    await page.goto('/admin/books');
    await expect(page.getByRole('heading', { name: /manage books/i })).toBeVisible();

    await page.getByRole('link', { name: /\+ add new book/i }).click();
    await expect(page.getByRole('heading', { name: /add new book/i })).toBeVisible();

    await page.getByLabel(/title/i).fill(initialTitle);
    await page.getByLabel(/author/i).fill(authorName);
    await page.getByLabel(/genre/i).fill(initialGenre);
    await page.getByLabel(/year/i).fill('2024');
    await page.getByLabel(/rating/i).fill('4.5');
    await page.getByLabel(/cover image url/i).fill(coverUrl);
    await page.getByLabel(/description/i).fill('Automated admin flow book description.');

    await page.getByRole('button', { name: /add book/i }).click();

    const createdRow = page.locator('tbody tr').filter({ hasText: initialTitle });
    await expect(createdRow).toBeVisible({ timeout: 15000 });

    await createdRow.getByRole('button', { name: /edit/i }).click();
    await expect(page.getByRole('heading', { name: /edit book/i })).toBeVisible();

    await page.getByLabel(/title/i).fill(updatedTitle);
    await page.getByLabel(/genre/i).fill(updatedGenre);
    await page.getByRole('button', { name: /update book/i }).click();

    const updatedRow = page.locator('tbody tr').filter({ hasText: updatedTitle });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
    await expect(updatedRow).toContainText(updatedGenre);

    await updatedRow.getByRole('button', { name: /delete/i }).click();

    await expect(page.locator('tbody tr').filter({ hasText: updatedTitle })).toHaveCount(0, {
      timeout: 15000,
    });
  });
});
