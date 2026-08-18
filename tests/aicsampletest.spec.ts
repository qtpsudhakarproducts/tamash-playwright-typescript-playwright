import { expect } from '@playwright/test';
import { fTest as test } from '../src/fixture/basetest';

// Non-POM example: locators are declared directly inside the test body.

test('Login test using CSS selectors', async ({ page }) => {
    await page.goto("/");

    // Intentionally broken selector ("username1") to demonstrate self-healing recovery.
    let txtUserName = page.getByRole("textbox", { name: "Username" }).describe("User Name Textbox");
    await txtUserName.fill("testadmin");

    let txtPassword = page.locator("input[placeholder='Password']").describe("Password Textbox");
    await txtPassword.fill("Vibetestq@123#");

    let btnLogin = page.locator("button[type='submit']").describe("Login Button");
    await btnLogin.click();

    await expect(page.locator("h6")).toHaveText("Dashboard");
});
