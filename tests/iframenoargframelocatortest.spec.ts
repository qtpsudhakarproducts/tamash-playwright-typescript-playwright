import { test, expect } from 'tamash-playwright';

// Playwright 1.63 made page.frameLocator()'s selector optional (no arg = "match in any frame").
// This example proves the healing wrapper handles that form: a broken locator reached through a
// no-arg frameLocator() still heals when the page has one frame, and steps aside cleanly (no
// wrong-frame guess) when it has several. Uses page.setContent() so it needs no live site.

const FRAME_SRCDOC = `
  <label for=&quot;country&quot;>Country</label>
  <select id=&quot;country&quot;>
    <option value=&quot;&quot;>Choose...</option>
    <option value=&quot;us&quot;>United States</option>
    <option value=&quot;in&quot;>India</option>
  </select>`;

const ONE_FRAME = `<html><body><iframe id="f" srcdoc="${FRAME_SRCDOC}"></iframe></body></html>`;

const TWO_FRAMES = `<html><body>
  <iframe id="fa" srcdoc="<p>unrelated</p>"></iframe>
  <iframe id="fb" srcdoc="${FRAME_SRCDOC}"></iframe>
</body></html>`;

test('no-arg frameLocator(): a broken locator inside a single-frame page still heals', async ({ page }) => {
  await page.setContent(ONE_FRAME);
  const frame = page.frameLocator();
  const countrySelect = frame.locator('#country-broken').describe('Country Select (in iframe)');
  await countrySelect.selectOption('in');
  await expect(frame.locator('#country')).toHaveValue('in');
});

test('no-arg frameLocator(): a broken locator on a multi-frame page fails cleanly, never misheals', async ({ page }) => {
  await page.setContent(TWO_FRAMES);
  const frame = page.frameLocator();
  const countrySelect = frame.locator('#country-broken').describe('Country Select (ambiguous frame)');

  await expect(countrySelect.selectOption('in')).rejects.toThrow(/Timeout|multiple frames/);
  await expect(page.frameLocator('#fb').locator('#country')).toHaveValue('');
});
