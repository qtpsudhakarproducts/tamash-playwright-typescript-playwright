import type { Browser, BrowserContext, Page } from '@playwright/test';
import { test, expect } from 'tamash-playwright';

// Temporary smoke test for tamash-playwright@0.13.0-beta.1's bindBrowser() fix -- verifies,
// through the REAL published package (installed from npm, not a same-repo source import), that a
// context/page built directly off the `browser` fixture in test.beforeAll (bypassing the
// context/page fixtures entirely -- the exact pattern a real support report used) still heals.
// Remove this file and revert the tamash-playwright version pin once CI confirms this.
let sharedContext: BrowserContext;
let sharedPage: Page;

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  sharedContext = await browser.newContext();
  sharedPage = await sharedContext.newPage();
});

test.afterAll(async () => {
  await sharedContext.close();
});

test('beta smoke: a page built via browser.newContext()/newPage() in beforeAll heals', { tag: '@sample' }, async () => {
  await sharedPage.goto('https://qtpsudhakar-vibetestq-hrm.up.railway.app/');

  // Deliberately broken -- the real field is named "Username", not "Username1" -- to force a
  // genuine heal, same as this repo's own samplelogintest.spec.ts pattern.
  const txtUserName = sharedPage.getByRole("textbox", { name: "Username" }).describe('User Name Textbox');
  await txtUserName.fill('testadmin');

  const txtPassword = sharedPage.locator("input[placeholder='Password']").describe('Password Textbox');
  await txtPassword.fill('Vibetestq@123#');

  const btnLogin = sharedPage.locator("button[type='submit']").describe('Login Button');
  await btnLogin.click();

  await expect(sharedPage.locator('h6')).toHaveText('Dashboard');
});
