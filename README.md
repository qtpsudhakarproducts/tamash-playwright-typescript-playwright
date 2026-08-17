# tamash-playwright-typescript-playwright

A worked example of [`tamash-playwright`](https://www.npmjs.com/package/tamash-playwright) — a plug-and-play, AI-powered self-healing add-on for Playwright — used with the **native Playwright Test** runner in TypeScript, both **with** and **without** the Page Object Model.

Tests run against a live, publicly hosted [OrangeHRM](https://www.orangehrm.com/) demo instance and include an intentionally broken selector (a username field renamed from `"username"` to `"username1"`) so you can watch `tamash-playwright` detect the failure, ask an AI model where the element actually went, and recover the test automatically — no retry logic or maintenance required from you.

## What `tamash-playwright` does

Websites change. A button gets renamed, moved, or restyled, and a selector that used to work suddenly can't find it — even though the app is fine for real users. Normally that's a broken test and a maintenance chore.

`tamash-playwright` fixes this at the point of failure: when a Playwright action can't find its element, it takes an ARIA snapshot of the current page, asks a configured AI provider (Ollama, OpenAI, Anthropic, or Gemini) to identify the element's new location, and retries the action once. If the AI finds it, your test keeps going. If not, it fails exactly as it would have without the package.

It's a drop-in replacement for Playwright's own `test`/`expect` imports — you don't rewrite your tests to use it.

## Repository structure

```
tests/
  sampletest.spec.ts   # No Page Object Model — locators declared directly in the test body
  pomtest.spec.ts      # Page Object Model — page objects injected as fixtures
src/
  pages/                # Page object classes: BasePage, LoginPage, DashboardPage, PIMPage, AddEmployeePage, PersonalDetailsPage
  fixture/basetest.ts   # Extends tamash-playwright's `test` with the page object fixtures above
playwright.config.ts     # Points baseURL at the hosted OrangeHRM demo
.env.example             # Template for self-healing configuration
```

The two spec files show the same package used two different ways:

- **`sampletest.spec.ts`** — the quickest way to see self-healing: `page.locator(...)` calls written straight in the test, one of them intentionally broken.
- **`pomtest.spec.ts`** — a more realistic setup, where locators live inside page object classes (`src/pages/`) and are exposed to tests as fixtures via `src/fixture/basetest.ts`.

## Step-by-step: run this example yourself

### 1. Clone and install

```bash
git clone https://github.com/qtpsudhakarproducts/tamash-playwright-typescript-playwright.git
cd tamash-playwright-typescript-playwright
npm install
npx playwright install
```

`npm install` pulls in `tamash-playwright` itself (already listed in [package.json](package.json)) along with `@playwright/test`.

### 2. Configure an AI provider

Self-healing needs an AI model to consult when a selector breaks. Copy the example env file and pick a provider:

```bash
cp .env.example .env
```

```dotenv
# Master on/off switch for self-healing.
HEALER_ENABLED=true

# Pick one: ollama | openai | anthropic | gemini
HEALER_PROVIDER=ollama

# --- Ollama Cloud (https://ollama.com) ---
OLLAMA_MODEL=gpt-oss:120b
OLLAMA_API_KEY=

# --- OpenAI ---
# OPENAI_MODEL=gpt-4.1-mini
# OPENAI_API_KEY=

# --- Anthropic (Claude) ---
# ANTHROPIC_MODEL=claude-haiku-4-5
# ANTHROPIC_API_KEY=

# --- Google Gemini ---
# GEMINI_MODEL=
# GEMINI_API_KEY=
```

Fill in the API key for whichever provider you choose and leave the rest commented out.

**Fastest way to get a free key — Ollama Cloud:**

1. Create an account at [ollama.com](https://ollama.com/).
2. Go to [ollama.com/settings/keys](https://ollama.com/settings/keys) and create a new API key.
3. Paste it into `.env` as `OLLAMA_API_KEY`.

That's all that's required — `HEALER_PROVIDER=ollama` and `OLLAMA_MODEL=gpt-oss:120b` are already set in `.env.example`.

### 3. Verify your setup

`tamash-playwright` ships a doctor command that checks your configuration before you rely on it:

```bash
npx tamash-playwright doctor
```

It confirms the configured provider/API key actually work, checks that `playwright.config.ts` has `actionTimeout` set well below the test `timeout` (see `playwright.config.ts` in this repo for the pattern — without it, a broken locator can retry silently for the whole test timeout and self-healing never gets a turn), reports whether vision fallback and action recovery are available, and scans `tests/` for locators missing `.describe()` labels or defined inline instead of in a page object.

### 4. Run the tests

```bash
npm test              # headless
npm run test:headed   # watch it run in a real browser window
npm run report         # open the HTML report after a run
```

Both specs log in to the hosted OrangeHRM demo using a selector that no longer matches the page (`input[name="username1"]`). Watch the console: instead of failing immediately, you'll see something like

```
[self-healer] src/pages/loginpage.ts:11 — locator.fill "User Name Textbox" -> HEALED [provider=ollama:gpt-oss:120b, vision=no, actionRecovery=no, suggested="role:textbox:Username", 620 tokens (489 input + 131 output)] — locator.fill: Timeout 8000ms exceeded.
```

The test then continues and passes. Run `npm run report` to see the same detail as an annotation on the test, plus a JSON attachment with the full healing record (provider, tokens used, suggested selector, and exactly which file/line the original locator came from).

### 5. Turning a heal into a real code fix

Runtime healing above fixes things for that one run only — it doesn't touch this repo's source. To make a heal permanent:

```bash
npx tamash-playwright apply-heals --dry-run   # preview the fix
npx tamash-playwright apply-heals             # write it
```

This repo's CI ([.github/workflows/playwright.yml](.github/workflows/playwright.yml)) does this automatically after every push to `main`/`master`: it uploads whatever got healed as an artifact, then a separate `apply-heals` job downloads it, applies the fix on a fresh branch, **re-runs the suite against just that fix (with healing turned off, to prove the fix works on its own)**, and only then opens a PR — labeled with whether verification passed or failed either way. Nothing gets committed without a human looking at the diff first. See the "Running `apply-heals` in CI" section of [tamash-playwright's own README](https://www.npmjs.com/package/tamash-playwright) for the general pattern, including how it scales to sharded test suites.

## Using `tamash-playwright` in your own project

Adopting it takes one import change — everything else about how you write Playwright tests stays the same:

```ts
// Before
import { test, expect } from '@playwright/test';

// After
import { test, expect } from 'tamash-playwright';
```

For best healing results, label locators built from plain CSS/XPath so the AI knows what it's looking for:

```ts
const txtUserName = page.locator('input[name="username"]').describe('User Name Textbox');
```

`.describe()` is optional — Playwright's own semantic locators (`getByRole`, `getByPlaceholder`, etc.) already carry enough context without it.

## What else heals automatically

Once a provider is configured, all of the following work with no extra setup:

- Popups and extra tabs opened via `context.newPage()`, `window.open`, or `target="_blank"`.
- Elements inside `<iframe>`s via `page.frameLocator(...)`.
- Most of the Playwright API surface — `click`, `fill`, `check`, `selectOption`, `dragTo`, `dispatchEvent`, read methods like `textContent`/`getAttribute`, `screenshot`, and more.
- A screenshot-based **vision fallback** for elements with no useful text to match on, when your configured model supports image input (e.g. `gpt-4o`, `claude-haiku-4-5`, `gemini-2.0-flash`).
- Optional **action recovery** (`HEALER_ACTION_RECOVERY_ENABLED=true`) for cases where the right element was found but the action on it still fails (covered by an overlay, needs scrolling, etc.).

## Learn more

- Package: [npmjs.com/package/tamash-playwright](https://www.npmjs.com/package/tamash-playwright)
- Full package documentation, including the doctor command, vision fallback, and action recovery, ships in `node_modules/tamash-playwright/README.md` after `npm install`.

## Questions, doubts, issues, or feature requests

Open an issue at [github.com/qtpsudhakarproducts/tamash-playwright-support/issues](https://github.com/qtpsudhakarproducts/tamash-playwright-support/issues).
