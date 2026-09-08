import { test, expect } from 'tamash-playwright';

// Playwright 1.63 made page.frameLocator()'s selector optional — with no argument it matches
// inside any frame on the page. Anything chained off it is healing-aware just like an explicit
// page.frameLocator('#id'). Uses page.setContent() so it needs no live site.
//
// A *broken* locator reached through a no-arg frameLocator() heals at runtime on a single-frame
// page, but the fix is transient (no frame selector string for apply-heals to persist), and on a
// multi-frame page the healer can't tell which frame was meant and steps aside cleanly. Both are
// covered in tamash-playwright's own test suite; this file is just the positive usage example.

const FRAME_SRCDOC = `
  <label for=&quot;country&quot;>Country</label>
  <select id=&quot;country&quot;>
    <option value=&quot;&quot;>Choose...</option>
    <option value=&quot;us&quot;>United States</option>
    <option value=&quot;in&quot;>India</option>
  </select>`;

const ONE_FRAME = `<html><body><iframe id="f" srcdoc="${FRAME_SRCDOC}"></iframe></body></html>`;

test('no-arg frameLocator() resolves and acts on an element inside an iframe', async ({ page }) => {
  await page.setContent(ONE_FRAME);
  const frame = page.frameLocator();
  await frame.locator('#country').describe('Country dropdown').selectOption('in');
  await expect(frame.locator('#country')).toHaveValue('in');
});
