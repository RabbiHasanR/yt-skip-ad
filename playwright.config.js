import { defineConfig } from '@playwright/test';

// Slow end-to-end tests: real Chromium with the unpacked extension loaded.
// Fixtures live in tests/e2e/fixtures.js. Vitest never runs these files.
export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  // One browser at a time: each test launches its own persistent context.
  workers: 1,
});
