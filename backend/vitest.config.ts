import { defineConfig } from 'vitest/config';

/** Configures the backend test environment. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts']
  }
});
