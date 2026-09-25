import { test, expect } from '../src/fixture/basetest';
import creds from "../src/testdata/creds.json" with {type: "json"};

// Page Object Model example: page objects are injected as fixtures and own their locators.

test('Create employee using Page Object Model', async ({ basePage, loginPage, dashboardPage, addEmpPage, pimPage, personalDetailsPage }) => {
    await basePage.navigateToURL("/");
    await loginPage.EnterUserName(creds.admin.username);
    await loginPage.EnterPassword(creds.admin.password);
    await loginPage.ClickLogin();

    await dashboardPage.verifyDashboardPage();
    await dashboardPage.ClickPIM();

    await pimPage.verifyPIMPage();
    await pimPage.ClickAdd();

    await addEmpPage.EnterFirstName("John");
    await addEmpPage.EnterLastName("Smith");
    await addEmpPage.ClickSave();

    await personalDetailsPage.verifyPersonalDetailsPage();
});
