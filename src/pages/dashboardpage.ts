import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basepage";

class DashboardPage extends BasePage {
    dashboardHeader;
    lnkPIM;
    constructor(page: Page) {
        super(page);
        this.dashboardHeader = page.getByRole('heading', { name: 'Dashboard' }).describe("Dashboard Header");
        this.lnkPIM = page.getByRole('link', { name: 'PIM' }).describe("PIM Link");
    }

    async ClickPIM() {
        await this.lnkPIM.click();
        console.log("Clicked on PIM Link");
    }
    async verifyDashboardPage() {
        await expect(this.dashboardHeader).toBeVisible();
        console.log("Dashboard Page is displayed");
    }
}

export default DashboardPage;
