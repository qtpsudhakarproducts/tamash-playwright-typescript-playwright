import { test,expect } from 'tamash-playwright';

// Non-POM example: locators are declared directly inside the test body.

test('login test using CSS Selectors', { tag: "@sample" }, async ({ page }) => {
    
    // Navigate to Application
    await page.goto("https://qtpsudhakar-vibetestq-hrm.up.railway.app/");
   
    // using page.locator() method to locate the username input field and fill it
    let txtUserName = page.getByRole("textbox", { name: "Username" }).describe("User Name Textbox")
    await txtUserName.fill("testadmin");

    // using page.fill() method to locate the password input field and fill it
    let txtPassword = page.locator("input[placeholder='Password']").describe("Password Textbox");
    await txtPassword.fill("Vibetestq@123#");

    let btnLogin = page.locator("button[type='submit']").describe("Login Button");
    await btnLogin.click();

    // verify login successful
    await expect(page.locator("h6")).toHaveText("Dashboard");

    // click on PIM link
    let lnkPIM = page.getByRole("link", { name: "PIM" }).describe("PIM Link");
    await lnkPIM.click();

    // click on Add Employee link
    let lnkAddEmployee = page.getByRole("link", { name: "Add Employee" }).describe("Add Employee Link");
    await lnkAddEmployee.click();

    // Enter First Name
    let txtFirstName = page.getByPlaceholder("First Name").describe("First Name Textbox");
    await txtFirstName.fill("John");

    // Enter Last Name
    let txtLastName = page.getByPlaceholder("Last Name").describe("Last Name Textbox");
    await txtLastName.fill("Doe");

    // Enter Employee ID
    // Deliberately broken (no placeholder actually exists on this field) — temporary, to exercise
    // a real self-heal via claude-subscription in CI. Revert to the xpath-based locator above once
    // that's confirmed.
    let txtEmployeeId = page.getByText("Employee Id").locator("xpath=../..").getByRole("textbox").describe("Employee Id Textbox");

    //create a random number between 10000 and 99999
    let randomNumber = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    await txtEmployeeId.fill(randomNumber.toString());

    // Click on Save button
    let btnSave = page.getByRole("button", { name: "Save" }).describe("Save Button");
    await btnSave.click();
})