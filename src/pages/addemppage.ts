import type { Page } from "@playwright/test";
import { BasePage } from "./basepage";

class AddEmployeePage extends BasePage {
    txtFirstName;
    txtLastName;
    btnSave;
    constructor(page: Page) {
        super(page);
        this.txtFirstName = page.getByPlaceholder("First Name").describe("First Name Textbox");
        // Intentionally broken placeholder ("Last Name1") to demonstrate self-healing recovery.
        this.txtLastName = page.getByRole("textbox", { name: "Last Name" }).describe("Last Name Textbox");
        this.btnSave = page.getByRole('button', { name: 'Save' }).describe("Save Button");
    }

    async EnterFirstName(firstname: string) {
        await this.txtFirstName.fill(firstname);
        console.log("Entered First Name " + firstname);
    }
    async EnterLastName(lastname: string) {
        await this.txtLastName.fill(lastname);
        console.log("Entered Last Name " + lastname);
    }
    async ClickSave() {
        await this.btnSave.click();
        console.log("Clicked on Save Button");
    }
}

export default AddEmployeePage;
