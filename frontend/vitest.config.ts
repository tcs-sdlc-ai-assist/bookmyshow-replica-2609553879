import { defineConfig } from 'vitest/config';

/** Configures browser-like component tests for the App Router client components. */
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.tsx'],
    setupFiles: ['./test.setup.ts']
  }
});
