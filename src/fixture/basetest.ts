import { test as base } from 'tamash-playwright';
import { BasePage } from '../pages/basepage';
import LoginPage from '../pages/loginpage';
import DashboardPage from '../pages/dashboardpage';
import PIMPage from '../pages/pimpage';
import AddEmployeePage from '../pages/addemppage';
import PersonalDetailsPage from '../pages/personaldetailspage';

export type POMFixtures = {
  basePage: BasePage;
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  pimPage: PIMPage;
  addEmpPage: AddEmployeePage;
  personalDetailsPage: PersonalDetailsPage;
};

export const fTest = base.extend<POMFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  pimPage: async ({ page }, use) => {
    await use(new PIMPage(page));
  },
  addEmpPage: async ({ page }, use) => {
    await use(new AddEmployeePage(page));
  },
  personalDetailsPage: async ({ page }, use) => {
    await use(new PersonalDetailsPage(page));
  },
});
