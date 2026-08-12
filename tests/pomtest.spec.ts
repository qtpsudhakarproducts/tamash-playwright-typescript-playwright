import { fTest as test } from '../src/fixture/basetest';

// Page Object Model example: page objects are injected as fixtures and own their locators.

test('Create employee using Page Object Model', async ({ basePage, loginPage, dashboardPage, addEmpPage, pimPage, personalDetailsPage }) => {
    await basePage.navigateToURL("/");
    await loginPage.EnterUserName('testadmin');
    await loginPage.EnterPassword('Vibetestq@123#');
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
