import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basepage";

class PersonalDetailsPage extends BasePage {
    personalDetailsHeader;
    constructor(page: Page) {
        super(page);
        this.personalDetailsHeader = page.locator("//h6[text()='Personal Details']").describe("Personal Details Header");
    }
    async verifyPersonalDetailsPage() {
        await expect(this.personalDetailsHeader).toBeVisible({ timeout: 10000 });
        console.log("Personal Details Page is displayed");
    }
}

export default PersonalDetailsPage;
