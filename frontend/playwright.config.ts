import { defineConfig } from '@playwright/test';

/** Defines live full-stack browser tests with separately supervised API and web servers. */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  webServer: [
    {
      command: 'node node_modules/typescript/bin/tsc && node dist/index.js',
      cwd: '../backend',
      env: {
        PORT: '3001',
        TOKEN_SECRET: 'e2e-demo-secret',
        CORS_ORIGIN: 'http://127.0.0.1:3000',
        DATABASE_PATH: '/tmp/bookmyshow-e2e.sqlite'
      },
      url: 'http://127.0.0.1:3001/api/health',
      timeout: 30_000,
      reuseExistingServer: false
    },
    {
      command: 'node node_modules/next/dist/bin/next dev -p 3000',
      cwd: '.',
      env: {
        NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:3001'
      },
      url: 'http://127.0.0.1:3000',
      timeout: 30_000,
      reuseExistingServer: false
    }
  ]
});
