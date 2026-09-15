import { expect, test } from '@playwright/test';

/** Captures browser failures so a rendered page cannot hide client-side errors. */
function captureBrowserErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    const isExpectedValidationResourceError = message.type() === 'error' && message.text().includes('server responded with a status of 400');
    if (message.type() === 'error' && !isExpectedValidationResourceError) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('starts access, rejects an invalid OTP visibly, then continues with the live API', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Start access' }).click();
  await page.getByLabel('Mobile identifier').fill('demo-actor');

  const loginResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/login') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Continue to code' }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/otp$/);

  await page.getByLabel('One-time passcode').fill('0000');
  const rejectedOtp = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/verify') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  expect((await rejectedOtp).status()).toBe(400);
  await expect(page.getByText('The one-time passcode was not accepted.', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/otp$/);

  await page.getByLabel('One-time passcode').fill('1234');
  const acceptedOtp = page.waitForResponse((response) => (
    response.url().endsWith('/api/auth/verify') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  expect((await acceptedOtp).status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(browserErrors).toEqual([]);
});
