import { test,expect } from 'tamash-playwright';

// Non-POM example: locators are declared directly inside the test body.

test('login test using CSS Selectors', { tag: "@sample" }, async ({ page }) => {
    
    // Navigate to Application
    await page.goto("https://qtpsudhakar-vibetestq-hrm.up.railway.app/");
   
    // using page.locator() method to locate the username input field and fill it
    let txtUserName = page.getByRole("textbox", { name: "Username1" }).describe("User Name Textbox")
    await txtUserName.fill("testadmin");

    // using page.fill() method to locate the password input field and fill it
    let txtPassword = page.locator("input[placeholder='Password']").describe("Password Textbox");
    await txtPassword.fill("Vibetestq@123#");

    let btnLogin = page.locator("button[type='submit']").describe("Login Button");
    await btnLogin.click();

    // verify login successful
    await expect(page.locator("h6")).toHaveText("Dashboard");

})