import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  timeout: 80000,
  testDir: './tests',
  expect: {
    timeout: 10000,
  },
  /* The shared hosted OrangeHRM demo doesn't tolerate concurrent form submissions well —
   * run tests serially to keep the example deterministic. */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.APP_BASE_URL ?? 'https://qtpsudhakar-vibetestq-hrm.up.railway.app/',
    trace: 'on-first-retry',

    /* Actions fail fast so the self-healer has real time left within the overall test
     * timeout to capture an ARIA snapshot, consult the provider, and retry. */
    actionTimeout: 8000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
