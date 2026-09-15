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

/** Completes the real access flow before a discovery journey. */
async function accessDashboard(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start access' }).click();
  await page.getByLabel('Mobile identifier').fill('demo-actor');
  await page.getByRole('button', { name: 'Continue to code' }).click();
  await page.getByLabel('One-time passcode').fill('1234');
  await page.getByRole('button', { name: 'Verify and continue' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('renders backend discovery records and carries the explicit selection to fixed seats', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  const moviesResponse = page.waitForResponse((response) => response.url().endsWith('/api/movies'));
  await accessDashboard(page);
  expect((await moviesResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bloody Romeo' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'OG2' })).toBeVisible();

  const theatresResponse = page.waitForResponse((response) => response.url().endsWith('/api/theatres'));
  await page.getByRole('button', { name: 'Select Paradise' }).click();
  await expect(page).toHaveURL(/\/theatres$/);
  expect((await theatresResponse).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sandhya 70mm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sudharsham 70mm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Allu Cinemas' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Select Sandhya 70mm' }).click();
  await expect(page).toHaveURL(/\/seats$/);
  await expect(page.getByText('Selected seats: None')).toBeVisible();
  await page.getByRole('button', { name: 'Select Seats' }).click();
  await expect(page).toHaveURL(/\/payment$/);
  expect(browserErrors).toEqual([]);
});

test('renders a delayed loading state followed by an explicit empty catalogue response', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page);
  await page.route('**/api/movies', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { movies: [] } })
    });
  });

  await accessDashboard(page);
  await expect(page.getByText('Loading movies…')).toBeVisible();
  await expect(page.getByText('No movies are currently available.')).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test('keeps discovery usable at a mobile viewport', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const browserErrors = captureBrowserErrors(page);
  try {
    await accessDashboard(page);
    await expect(page.getByRole('heading', { name: 'Paradise' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select Paradise' })).toBeVisible();
  } finally {
    await page.close();
  }
  expect(browserErrors).toEqual([]);
});
