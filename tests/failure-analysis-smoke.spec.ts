import { test, expect } from 'tamash-playwright';

// Temporary smoke test for tamash-playwright@0.13.0-beta.3's new AI-powered failure analysis
// (FAILURE_ANALYSIS_ENABLED, on by default) -- verifies, through the REAL published package
// (installed from npm, not a same-repo source import), that a genuinely-failed expect() assertion
// gets classified once every configured retry is exhausted. This repo's own playwright.config.ts
// sets retries: 2 in CI, so this fails 3 times total before the final-attempt analysis runs.
//
// Deliberately, genuinely fails -- "Order confirmed" never appears on this real login page, on any
// attempt -- exactly the case failure analysis is meant to classify (expect() is never healed).
// Not run as part of the main `test` job (see playwright.yml's own test-failure-analysis-smoke
// job) so this one intentional red test doesn't turn the whole CI run red.
//
// Remove this file, its dedicated workflow job, and revert the tamash-playwright version pin once
// CI confirms this and the beta is promoted to stable.
test('beta smoke: a genuinely-failed assertion gets classified by failure analysis', { tag: '@sample' }, async ({ page }) => {
  await page.goto('/');

  const txtUserName = page.getByRole('textbox', { name: 'Username' }).describe('User Name Textbox');
  await txtUserName.fill('testadmin');

  const txtPassword = page.locator("input[placeholder='Password']").describe('Password Textbox');
  await txtPassword.fill('Vibetestq@123#');

  const btnLogin = page.locator("button[type='submit']").describe('Login Button');
  await btnLogin.click();

  // Deliberately wrong expectation -- a real login lands on "Dashboard", never "Order confirmed" --
  // so this assertion fails identically on every attempt, triggering failure analysis once
  // retries are exhausted. See the run's console output / HTML report for the real verdict.
  await expect(page.locator('h6')).toHaveText('Order confirmed');
});
