import { expect, test } from '@playwright/test';

/** Exercises backend-provided discovery content and explicit booking selections. */
test('selects a backend-provided movie, mapped theatre, and fixed seats', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bloody Romeo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OG2' })).toBeVisible();
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await expect(page).toHaveURL(/\/theatres$/);
  await expect(page.getByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sudharsham 70mm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Allu Cinemas' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  await expect(page).toHaveURL(/\/seats$/);
  await expect(page.getByText('Selected seats: None')).toBeVisible();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/payment$/);
  expect(consoleErrors).toEqual([]);
});