import { test, expect } from 'tamash-playwright';

// Non-POM example: a page opened in a new tab/popup is just as healing-aware as the main page,
// with zero extra setup -- tamash-playwright's own `context` fixture is already healing-aware.
// Real target: the login page's own footer link to vibetestq.com opens in a new tab; from there
// we go to its real Contact form, which has a genuine (if unlabeled) email field to break.
//
// (Updated 2026-09-13: the login page's footer changed since this test was first written -- the
// old "OrangeHRM, Inc" link pointing at orangehrm.com is gone, replaced by the three links below.)

test('a broken locator on a popup opened via context.waitForEvent("page") still heals', async ({ page, context }) => {
    await page.goto("https://qtpsudhakar-vibetestq-hrm.up.railway.app/");

    const newPagePromise = context.waitForEvent('page');
    await page.getByRole('link', { name: 'Visit VibeTestQ for New Test Automation and GenAI training programs' }).describe('VibeTestQ footer link').click();
    const newPage = await newPagePromise;

    // The footer link lands on vibetestq.com's homepage, which has no form of its own -- navigate
    // within the same new tab to its real Contact page for a genuine field to heal against.
    await newPage.goto('https://vibetestq.com/contact', { waitUntil: 'domcontentloaded' });

    // Deliberately broken -- no such id exists on vibetestq.com's real contact form -- to
    // demonstrate a real self-heal on a page opened in a new tab. The real field has a visible
    // "Email Address" label that isn't programmatically linked to it (no `for`/`aria-labelledby`),
    // exactly the "nameless field, nearby label" shape this package's structural healing targets.
    const txtEmail = newPage.locator("input[name=\"email\"]").describe('Email Address field');
    await txtEmail.fill('test@vibetestq.com');
    await expect(newPage.locator('input[name="email"]')).toHaveValue('test@vibetestq.com');

    // Switching back to the original (still the login page -- never logged in here) proves
    // handling the popup didn't disturb the main page's own healing awareness.
    await page.bringToFront();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
});
