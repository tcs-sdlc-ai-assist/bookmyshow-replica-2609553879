import { expect, test } from '@playwright/test';

/** Exercises the live login and OTP journey while failing on browser errors. */
test('authenticates the demo actor through the live API', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  await page.goto('/login');
  await page.getByLabel('Mobile identifier').fill('demo-actor');
  await page.getByRole('button', { name: 'Continue to code' }).click();
  await expect(page).toHaveURL(/\/otp$/);
  await page.getByLabel('One-time passcode').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(consoleErrors).toEqual([]);
});
