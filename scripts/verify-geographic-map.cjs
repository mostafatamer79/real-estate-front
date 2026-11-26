const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { user, responseFor } = require('../tests/fixtures/details-ui.cjs');
const base = process.env.E2E_BASE || 'http://127.0.0.1:3017';
const output = process.env.E2E_OUTPUT || '/tmp/real-map-verification';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local fixtures only');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  try {
    for (const width of (process.env.E2E_WEBGL_FALLBACK ? [390] : [1440, 390, 320])) {
      const context = await browser.newContext({
        viewport: { width, height: 950 },
        reducedMotion: width === 1440 ? 'no-preference' : 'reduce',
      });
      await context.addInitScript(({ user, width }) => {
        localStorage.setItem('token', 'synthetic-local');
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('language', width === 1440 ? 'en' : 'ar');
      }, { user, width });
      if (process.env.E2E_WEBGL_FALLBACK) {
        await context.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            return String(type).includes('webgl') ? null : original.call(this, type, ...args);
          };
        });
      }
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (!url.pathname.includes('/api/')) return route.continue();
        if (route.request().method() !== 'GET') return route.fulfill({ status: 503, json: {} });
        return route.fulfill({ json: responseFor(url.pathname, { palette: { enable3d: true, typing: false } }) });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/details`);
      const region = page.locator('#tour-target-map');
      await region.scrollIntoViewIfNeeded();
      if (process.env.E2E_WEBGL_FALLBACK) {
        await region.locator('.leaflet-container').waitFor({ timeout: 90000 });
        assert.equal(await region.locator('.maplibregl-canvas').count(), 0);
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ passed: true, checks: ['WebGL unavailable uses geographic Leaflet fallback'] }));
        await context.close();
        continue;
      }
      await region.locator('.maplibregl-canvas').waitFor({ timeout: 90000 });
      await region.getByRole('button', { name: '3D', exact: true }).waitFor();
      await page.waitForFunction(() => !document.querySelector('#tour-target-map [role="status"]'));
      await page.waitForTimeout(2600);
      assert.equal(await region.getByRole('alert').count(), 0);
      await region.screenshot({ path: `${output}/map-${width}.png` });
      await region.getByRole('button', { name: '3D', exact: true }).click();
      await region.getByRole('button', { name: '2D', exact: true }).waitFor();
      await region.getByRole('button', { name: width === 1440 ? 'Streets' : 'شوارع', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('#tour-target-map [role="status"]'));
      assert.equal(await region.getByRole('alert').count(), 0);
      await region.getByRole('button', { name: '2D', exact: true }).click();
      await region.getByRole('button', { name: '3D', exact: true }).waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, passed: true, checks: ['real tile loading', '2D/3D', 'streets style', 'responsive controls', 'no page errors or overflow'] }));
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
