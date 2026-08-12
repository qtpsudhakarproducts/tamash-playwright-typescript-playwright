# tamash-playwright-typescript-playwright

Example usage of [`tamash-playwright`](https://www.npmjs.com/package/tamash-playwright) with the native **Playwright Test** runner in TypeScript — with and without the Page Object Model.

Tests run against a live OrangeHRM demo instance and include intentionally broken selectors (e.g. a placeholder renamed to `"Username1"`) so you can see the AI self-healer recover them in real time.

## Structure

- `tests/sampletest.spec.ts` — no page objects; locators declared directly in the test body.
- `tests/pomtest.spec.ts` — Page Object Model; page objects are injected via `src/fixture/basetest.ts`.
- `src/pages/` — page object classes (`BasePage`, `LoginPage`, `DashboardPage`, `PIMPage`, `AddEmployeePage`, `PersonalDetailsPage`).
- `src/fixture/basetest.ts` — extends `tamash-playwright`'s `test` with the page object fixtures above.

## Setup

```bash
npm install
cp .env.example .env
# fill in an AI provider key in .env (Ollama/OpenAI/Anthropic/Gemini)
npx playwright install
```

## Run

```bash
npm test           # headless
npm run test:headed
npm run report
```

## How self-healing shows up

When a selector fails, `tamash-playwright` captures an ARIA snapshot, asks the configured AI provider for a replacement, retries the action once, and prints a line like:

```
[self-healer] Recovered using ollama:gpt-oss:120b (placeholder "Username").
```

It also attaches a `self-healed` annotation to the test result, visible in `npm run report`.
