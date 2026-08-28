import { test, expect } from 'tamash-playwright';

// Non-POM example: a page opened in a new tab/popup is just as healing-aware as the main page,
// with zero extra setup -- tamash-playwright's own `context` fixture is already healing-aware.
// Real target: the login page's own "OrangeHRM, Inc" footer link opens the real orangehrm.com
// marketing site in a new tab.

test('a broken locator on a popup opened via context.waitForEvent("page") still heals', async ({ page, context }) => {
    await page.goto("https://qtpsudhakar-vibetestq-hrm.up.railway.app/");

    const newPagePromise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'OrangeHRM, Inc' }).describe('OrangeHRM, Inc footer link').click();
    const newPage = await newPagePromise;

    // orangehrm.com runs real interstitials that can cover the page -- a cookie-consent banner,
    // and (confirmed live, reproducible from a GitHub Actions runner specifically) a promotional
    // event banner ("Going to HR Florida 2026?..."). Dismiss both if present, don't fail if either
    // never shows up (already-set cookies, timing, different runner IP).
    await newPage.locator('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll').click({ timeout: 5000 }).catch(() => {});
    await newPage.getByRole('button', { name: '×' }).click({ timeout: 5000 }).catch(() => {});

    // Deliberately broken -- no such id exists on orangehrm.com's real homepage -- to demonstrate
    // a real self-heal on a page opened in a new tab.
    const txtHomepageEmail = newPage.locator('#doesNotExistEmailField').describe('Your email address field');
    await txtHomepageEmail.fill('test@vibetestq.com');
    await expect(newPage.getByPlaceholder('Your email address')).toHaveValue('test@vibetestq.com');

    // Switching back to the original (still the login page -- never logged in here) proves
    // handling the popup didn't disturb the main page's own healing awareness.
    await page.bringToFront();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
});
