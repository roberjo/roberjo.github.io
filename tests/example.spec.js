// @ts-check
const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/John B. Roberts/);
});

test('navigation links work', async ({ page }) => {
    await page.goto('/');

    // Click the get started link.
    await page.getByRole('link', { name: 'Projects' }).first().click();

    // Expects page to have a heading with the name of Installation.
    await expect(page.getByRole('heading', { name: 'Featured Projects' })).toBeVisible();
});

test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');

    // Check default theme (should be dark based on HTML)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Click toggle
    await page.locator('#theme-toggle').click();

    // Should be light now
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
