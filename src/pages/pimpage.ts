import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basepage";

class PIMPage extends BasePage {
    pimHeader;
    btnAdd;
    constructor(page: Page) {
        super(page);
        this.pimHeader = page.locator("//h6[text()='PIM']").describe("PIM Header");
        this.btnAdd = page.locator("//button[normalize-space()='Add']").describe("Add Button");
    }

    async verifyPIMPage() {
        await expect(this.pimHeader).toBeVisible({ timeout: 10000 });
        console.log("PIM Page is displayed");
    }
    async ClickAdd() {
        await this.btnAdd.click();
        console.log("Clicked on Add Button");
    }
}

export default PIMPage;
