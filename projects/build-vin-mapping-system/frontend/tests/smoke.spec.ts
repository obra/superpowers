import { expect, test } from '@playwright/test';

test('protected route redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'VIN Mapping System' })).toBeVisible();
});

test('admin can sign in and view dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByText('Coverage')).toBeVisible();
});

test('VIN verification flow returns a result', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Vehicle Verification' }).click();
  await expect(page.getByRole('heading', { name: 'Vehicle Verification' })).toBeVisible();
  await page.getByRole('button', { name: 'Verify VIN' }).click();
  await expect(page.getByText('MAPPED')).toBeVisible();
  await expect(page.getByText(/TOYOTA/)).toBeVisible();
});
