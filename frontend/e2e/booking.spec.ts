import { expect, test } from '@playwright/test';

/** Exercises the live booking journey while surfacing browser console and page errors. */
test('completes a booking and renders the backend confirmation', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/');
  await page.getByRole('link', { name: /login/i }).click();
  await page.getByLabel(/mobile/i).fill('9999999999');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByLabel(/otp/i).fill('123456');
  await page.getByRole('button', { name: /verify/i }).click();
  await page.getByRole('button', { name: /select/i }).first().click();
  await page.getByRole('button', { name: /select/i }).first().click();
  await page.getByRole('link', { name: /payment/i }).click();
  await page.getByRole('button', { name: /pay/i }).click();
  await expect(page.getByText('Processing Payment...')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/BMS-/)).toBeVisible();
  expect(browserErrors).toEqual([]);
});
