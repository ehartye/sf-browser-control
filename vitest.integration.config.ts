import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.integration.test.ts'],
    testTimeout: 60000, // Integration tests need more time
    hookTimeout: 30000,
    // Run integration tests sequentially since they share browser state
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
