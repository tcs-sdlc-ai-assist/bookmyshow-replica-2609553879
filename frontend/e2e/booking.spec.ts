import { expect, test } from '@playwright/test';

/** Captures browser failures so a rendered page cannot hide client-side errors. */
function captureBrowserErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Completes the real access and selection path required before payment. */
async function reachPayment(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start access' }).click();
  await page.getByLabel('Mobile identifier').fill('demo-actor');
  await page.getByRole('button', { name: 'Continue to code' }).click();
  await page.getByLabel('One-time passcode').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/payment$/);
}

test('creates a backend booking after processing and renders the canonical confirmation', async ({ page }, testInfo) => {
  const browserErrors = captureBrowserErrors(page);
  await reachPayment(page);
  await expect(page.getByLabel('Card', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Card Number')).toBeVisible();
  await page.getByLabel('UPI').check();
  await expect(page.getByLabel('UPI ID')).toBeVisible();
  await page.getByLabel('Card', { exact: true }).check();

  const bookingResponse = page.waitForResponse((response) => (
    response.url().endsWith('/api/bookings') && response.request().method() === 'POST'
  ));
  await page.getByRole('button', { name: 'Pay ₹450' }).click();
  await expect(page).toHaveURL(/\/processing$/);
  await expect(page.getByText('Processing Payment...')).toBeVisible();

  const response = await bookingResponse;
  expect(response.status()).toBe(201);
  const confirmation = await response.json() as {
    data: {
      confirmationId: string;
      booking: {
        id: number;
        movie: string;
        theatre: string;
        seats: string[];
        paymentMethod: string;
        totalPrice: number;
      };
    };
  };
  await expect(page).toHaveURL(/\/confirmation$/);

  const confirmationPath = `/confirmation/${confirmation.data.booking.id}`;
  const loadedConfirmation = page.waitForResponse((getResponse) => (
    getResponse.url().endsWith(`/api/bookings/${confirmation.data.booking.id}`) &&
    getResponse.request().method() === 'GET'
  ));
  await page.getByRole('link', { name: 'View booking confirmation details' }).click();
  await expect(page).toHaveURL(confirmationPath);
  expect((await loadedConfirmation).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Congratulations!' })).toBeVisible();
  await expect(page.getByText(confirmation.data.confirmationId)).toBeVisible();
  await expect(page.getByText(confirmation.data.booking.movie, { exact: true })).toBeVisible();
  await expect(page.getByText(confirmation.data.booking.theatre, { exact: true })).toBeVisible();
  await expect(page.getByText(confirmation.data.booking.seats.join(', '), { exact: true })).toBeVisible();

  const reloadedConfirmation = page.waitForResponse((getResponse) => (
    getResponse.url().endsWith(`/api/bookings/${confirmation.data.booking.id}`) &&
    getResponse.request().method() === 'GET'
  ));
  await page.reload();
  expect((await reloadedConfirmation).status()).toBe(200);
  await expect(page.getByText(confirmation.data.confirmationId)).toBeVisible();
  await expect(page.getByText(confirmation.data.booking.movie, { exact: true })).toBeVisible();
  await expect(page.getByText(confirmation.data.booking.theatre, { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('booking-confirmation.png'), fullPage: true });
  expect(browserErrors).toEqual([]);
});
