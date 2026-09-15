import { defineConfig } from '@playwright/test';

/** Defines the browser test target for a separately started full-stack environment. */
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  }
});
