import { defineConfig, devices } from '@playwright/test';

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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

    /* tamash-playwright reuses this same value as the self-healer's own budget for capturing
     * an ARIA snapshot AND the AI provider call (see resolveActionTimeoutMs in its source) — it
     * isn't just how fast the original action fails. A subprocess-based provider like
     * claude-subscription/copilot-subscription spawns a fresh CLI process per call (spin-up +
     * OAuth validation + the actual request), which measurably doesn't reliably fit in 8s under
     * CI's shared/constrained runners (confirmed live: ~80% of calls were aborted mid-flight at
     * 8s, succeeding only when the runner happened to be fast that moment) — misreported by the
     * provider's own warning as "not authenticated?" when it was actually just timing out. 20s
     * gives it real room while staying well under the 80s overall test timeout above. */
    actionTimeout: 20000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
