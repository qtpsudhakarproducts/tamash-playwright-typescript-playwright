---
name: generate-pom-tests
description: Generates Page Object Model page classes (src/pages/*.ts) and POM-style Playwright tests (tests/*.spec.ts) for this repo from a plain-English scenario. Use whenever the user describes a user journey to automate, asks to "create a test for X", "add a page/page object for Y", "automate this scenario", or wants a new test written in the same style as tests/pomtest.spec.ts. Always explore src/pages/ first and reuse what exists before creating anything new; always use this skill when producing src/pages/*.ts files or POM-style tests — never freestyle a page object or test without it.
---

# Generate POM Tests Skill

Turns a scenario description into working Page Object Model code for this repo: reuses or extends
`src/pages/`, promotes shared behavior to `BasePage`, wires new pages into the `src/fixture/basetest.ts`
fixture, and writes a test in `tests/` that matches `tests/pomtest.spec.ts`.

Locators are verified against the live app with `playwright-cli` — never guessed or written from memory.

---

## Framework conventions (this is the style to match)

- **File naming:** `src/pages/<pagename>page.ts`, all lowercase, no separators (`personaldetailspage.ts`, not `personal-details-page.ts`).
- **Class:** `class <PageName>Page extends BasePage { ... }`, PascalCase, and the file's **default export**
  (`export default <PageName>Page;`), except `BasePage` itself which is a named export from `basepage.ts`.
- **Locators:** plain class properties with no type annotation, assigned in the constructor:
  ```ts
  this.txtUserName = page.getByPlaceholder("Username").describe("Username Textbox");
  ```
  `.describe("<Human Description>")` is on **every** locator, always — it is what shows up in
  self-healing logs and assertion failures, and it's how `tamash-playwright doctor` audits the suite.
- **Action methods:** PascalCase verbs matching what a human would call the action — `EnterUserName`,
  `ClickLogin`, `ClickAdd`, `EnterFirstName`. Each ends with a `console.log("<past-tense description>")`.
- **Verification methods:** named `verify<PageName>Page()`, assert the page's header/landmark is visible:
  ```ts
  async verifyPIMPage() {
      await expect(this.pimHeader).toBeVisible({ timeout: 10000 });
      console.log("PIM Page is displayed");
  }
  ```
- **Composite/flow methods** (optional): a method that chains several actions on the same page, e.g.
  `loginToApplication(username, password)` on `LoginPage` — add these when a page's actions are always
  used together.
- **Fixtures:** every page object is consumed through `src/fixture/basetest.ts`, never instantiated with
  `new` inside a test. Tests import `{ test, expect }` from `'../src/fixture/basetest'` and destructure
  only the fixtures they use.
- **Test data:** `src/testdata/*.json`, imported with `with { type: "json" }` — never hardcode credentials
  in a test or page object.
- **Shared behavior belongs on `BasePage`** (`src/pages/basepage.ts`), not duplicated across pages. Today
  it only has `navigateToURL`; add to it, don't work around it.

---

## Workflow

### Stage 1 — Break down the scenario

Read the user's scenario and turn it into an ordered list of user actions and expected outcomes,
the same granularity as `pomtest.spec.ts` (navigate → login → verify dashboard → click PIM → verify PIM →
add employee → verify personal details). Identify every distinct page/screen the scenario touches.

### Stage 2 — Inventory existing pages first

Read every file in `src/pages/` before writing anything. For each page the scenario touches, note:

- Does a page class for it already exist? What's it called, what locators/methods does it already have?
- Does an existing method already cover this action? Does a similar method exist that just needs a new
  locator (e.g. `LoginPage` has `EnterUserName`/`EnterPassword` but not `ClickForgotPassword`)?

**Never create a new page object for a page that already has one — extend the existing class.** Only
create a new file for a page genuinely not yet represented in `src/pages/`.

### Stage 3 — Explore the live app for anything missing

For every page/element not already covered by an existing, verified locator, inspect the real app with
`playwright-cli` before writing a single locator. Follow the launch mechanic from
[`../playwright-cli/references/test-generation.md`](../playwright-cli/references/test-generation.md)
(section "0. How generation works" and "1.3 Explore the app"): run the relevant flow through
`npx playwright test --debug=cli` in the background (reuse `tests/pomtest.spec.ts` or the closest existing
seed as the debug target so any app-specific setup runs first), then `playwright-cli attach tw-XXXX` and
`resume`, then:

```bash
playwright-cli snapshot                    # inventory of interactive elements + refs
playwright-cli find "Some Label"           # locate a specific element in a big snapshot
playwright-cli generate-locator e5 --raw   # get the exact locator expression for ref e5
playwright-cli eval "el => el.textContent" e5
```

Stop the background test once exploration for a page is done. **Do not** open the bare app URL with
`playwright-cli open` — always go through a real test run so login/session/base-URL setup happens exactly
as it does for real test runs.

### Stage 4 — Choose each locator

Work down this priority order; only move to the next when the current one isn't available or matches more
than one element (same order the rest of this codebase already follows — see `loginpage.ts`,
`dashboardpage.ts`, `pimpage.ts`):

| Priority | Strategy | Example |
|---|---|---|
| 1 | `getByRole('<role>', { name: '...' })` | `page.getByRole('button', { name: 'Login' })` |
| 2 | `getByLabel('<label>')` | form control with an associated label |
| 3 | `getByPlaceholder('<placeholder>')` | `page.getByPlaceholder('Username')` |
| 4 | `getByTestId('<testId>')` | `data-testid` present |
| 5 | `getByText('<text>')` | non-interactive text, headers |
| 6 | `locator('<css>')` | stable, non-generated CSS |
| 7 | `locator('xpath=<minimal>')` | only when the above can't express it (e.g. `//h6[text()='PIM']`, matching `pimpage.ts`) |
| 8 | `.nth(n)` / `:nth-match` | absolute last resort — comment explaining why |

Every value must come from what `playwright-cli snapshot` / `generate-locator` / `eval` actually returned
in Stage 3, or already exists verified in an existing page object — never assumed. Always finish with
`.describe("<Human Description>")`.

### Stage 5 — Build or extend page objects

New page file template:

```ts
import { expect, type Page } from "@playwright/test";
import { BasePage } from "./basepage";

class <PageName>Page extends BasePage {
    <locatorName>;
    constructor(page: Page) {
        super(page);
        this.<locatorName> = page.<locator>.describe("<Human Description>");
    }

    async <ActionMethod>(<args>) {
        await this.<locatorName>.<action>(<args>);
        console.log("<Past-tense description>");
    }

    async verify<PageName>Page() {
        await expect(this.<headerLocator>).toBeVisible();
        console.log("<PageName> Page is displayed");
    }
}

export default <PageName>Page;
```

Drop the `expect` import if the page has no verify method. When extending an existing page, add the new
locator(s) as new constructor-assigned properties and new methods below the existing ones — don't reorder
or rewrite what's already there.

### Stage 6 — Promote shared behavior to BasePage

If a helper is now duplicated across two or more page classes (a generic wait, a toast/notification check,
a "click and wait for navigation" pattern, etc.), move it onto `BasePage` in `src/pages/basepage.ts` instead
of leaving copies on each page, and update the page classes to call `this.<helper>(...)` via inheritance.
Do this whenever Stage 5 produces that duplication — don't wait to be asked.

### Stage 7 — Wire new pages into the fixture

Edit `src/fixture/basetest.ts` additively — never remove or rename an existing entry:

1. Add the import: `import <PageName>Page from '../pages/<pagename>page';`
2. Add it to `POMFixtures`: `<pageName>Page: <PageName>Page;`
3. Add the factory: `<pageName>Page: async ({ page }, use) => { await use(new <PageName>Page(page)); },`

### Stage 8 — Write the test

Create `tests/<kebab-scenario-name>.spec.ts` in the same shape as `tests/pomtest.spec.ts`:

```ts
import { test, expect } from '../src/fixture/basetest';
import creds from "../src/testdata/creds.json" with {type: "json"};

test('<Scenario description>', async ({ basePage, <pagesUsedAsFixtures> }) => {
    await basePage.navigateToURL("/");
    // one page-object call per user action, in order, using only the fixtures needed
    // a verify<Page>Page() call after each navigation/transition
});
```

Only destructure the fixtures the test actually uses. Import test data from `src/testdata/`, never inline
credentials.

### Stage 9 — Run and confirm

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/<file>.spec.ts
```

If it fails, diagnose using the Heal section of
[`../playwright-cli/references/test-generation.md`](../playwright-cli/references/test-generation.md)
(`--debug=cli` + `attach`) and fix directly — don't hand back a test you haven't run green (unless the
failure is an intentionally-broken locator left for self-healing demo purposes, matching the pattern
already in `loginpage.ts`/`addemppage.ts` — ask the user before adding a new one of those).

---

## Critical rules

- **Reuse before creating.** Read all of `src/pages/` first; never duplicate a page object or a method
  that already exists.
- **Never hallucinate locators.** Every new locator value must come from a live `playwright-cli` snapshot,
  `generate-locator`, or `eval` in Stage 3 — or be copied from an existing, already-working page object.
- **Always `.describe()`** every locator, no exceptions.
- **Promote duplication to `BasePage`**, don't scatter copies of the same helper across pages.
- **Fixture wiring is additive.** Never remove, rename, or reorder existing entries in
  `src/fixture/basetest.ts` — only add new ones.
- **Naming conventions are exact:** lowercase page filenames, PascalCase classes, default export per page
  class, named export for `BasePage`.
- **XPath/`.nth()` are last resorts**, matching the existing style (`pimpage.ts`,
  `personaldetailspage.ts` use minimal XPath for header text) — only after role/label/placeholder/testId
  fail, and only the minimal expression needed.
- **Create and edit files directly** — don't paste generated code into chat for the user to copy.
- **Don't touch unrelated tests or pages** while implementing one scenario.

---

## Done criteria

1. Every page the scenario touches has a page object in `src/pages/` — either reused as-is, extended, or
   newly created following the conventions above.
2. Any behavior duplicated across ≥2 pages has been promoted to `BasePage`.
3. `src/fixture/basetest.ts` has been updated additively for any newly created page object.
4. A new test exists in `tests/` in the same style as `tests/pomtest.spec.ts`, consuming pages only as
   fixtures.
5. Every locator value was observed live via `playwright-cli` (or reused from an existing verified locator)
   — none were assumed.
6. `npx playwright test tests/<file>.spec.ts` passes (or fails only due to an intentional, user-confirmed
   self-healing demo locator).
7. `npx tsc --noEmit` reports no new type errors.
