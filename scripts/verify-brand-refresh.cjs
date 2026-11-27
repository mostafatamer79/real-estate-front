// Local fixtures only: verifies client feedback 10–18 without changing server data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { user, fixture } = require('../tests/fixtures/redesign-final-ui.cjs');
const base = process.env.E2E_BASE || 'http://127.0.0.1:3417';
const out = process.env.E2E_OUTPUT || '/tmp/realestate-brand-refresh';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  try {
    for (const width of [390, 1440]) for (const theme of ['light', 'dark']) for (const language of ['ar', 'en']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', colorScheme: theme, serviceWorkers: 'block' });
      await context.addInitScript(({ user, theme, language }) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', 'synthetic-local');
        localStorage.setItem('language', language);
        localStorage.setItem('digital-brokerage-theme', theme);
        sessionStorage.setItem('db-intro-seen', '1');
      }, { user, theme, language });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.pathname.includes('/api/')) {
          let body = fixture(url.pathname);
          if (url.pathname.endsWith('/settings/public')) body = [...body,
            { key: 'module_wallet_investments', value: 'soon' },
            { key: 'module_services_marketing', value: 'soon' },
            { key: 'module_services_other', value: 'disabled' },
          ];
          if (url.pathname.endsWith('/financial/my-wallet')) body = { balance: 500, transactions: [] };
          if (url.pathname.endsWith('/management-packages')) body = [{ id: 'local-package', isActive: true, name: language === 'ar' ? 'باقة الأعمال' : 'Business package', description: 'Local fixture', price: 100, monthlyPrice: 100, yearlyPrice: 1000, administrations: ['properties', 'legal'] }];
          return route.fulfill({ json: body });
        }
        if (url.origin === base || url.protocol === 'data:') return route.continue();
        return route.abort();
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(30000);
      async function checkPage(path) {
        await page.goto(base + path);
        await page.locator('main, section').first().waitFor();
        await page.waitForTimeout(350);
        assert.equal(await page.locator('[data-theme-toggle]').count(), 0, 'floating night mode button removed');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow: ${path} ${width}`);
        if (path !== '/') assert.equal(await page.locator('footer').count(), 0, `no footer on ${path}`);
      }
      await checkPage('/services');
      const root = page.locator('section[aria-labelledby="services-page-title"]');
      await root.locator('[class*="pageWatermark"] svg').waitFor();
      const initialIcon = await root.locator('[class*="pageWatermark"] svg').getAttribute('class');
      await root.getByRole('button', { name: language === 'ar' ? 'اكتشف الخدمات' : 'Explore services', exact: true }).click();
      await root.locator('button[aria-controls="selected-service"]').filter({ has: page.locator('svg.lucide-scale') }).click();
      await root.locator('[class*="pageWatermark"] svg.lucide-scale').waitFor();
      assert.notEqual(await root.locator('[class*="pageWatermark"] svg').getAttribute('class'), initialIcon);
      assert.equal(await root.locator('a[href*="type=other"]').count(), 0, 'disabled service absent');
      await page.screenshot({ path: `${out}/services-${width}-${theme}-${language}.png`, fullPage: true });
      await checkPage('/wallet');
      const tabs = page.getByRole('tablist');
      await tabs.getByRole('tab').first().waitFor();
      assert.equal(await tabs.getByRole('tab').count(), 4);
      const investment = tabs.getByRole('tab').filter({ hasText: language === 'ar' ? 'الاستثمارات' : 'Investments' });
      await investment.waitFor();
      assert.equal(await investment.isDisabled(), true);
      const files = tabs.getByRole('tab').filter({ hasText: language === 'ar' ? 'الملفات' : 'Files' });
      await files.click();
      assert.equal(await files.getAttribute('aria-selected'), 'true');
      await files.focus();
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.activeElement === document.querySelector('[role="tab"]'));
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('[role="tab"]')?.getAttribute('aria-selected') === 'true');
      const invoice = tabs.getByRole('tab').first();
      assert.equal(await invoice.locator('[class*="tabWatermark"]').count(), 1);
      await page.screenshot({ path: `${out}/wallet-${width}-${theme}-${language}.png`, fullPage: true });
      await checkPage('/department-hub');
      await page.locator('.brand-watermark').first().waitFor();
      await checkPage('/subscriptions/new');
      await page.locator('.brand-watermark').first().waitFor();
      await checkPage('/offers');
      await checkPage('/');
      const footer = page.locator('footer');
      await footer.waitFor();
      assert.equal(await footer.count(), 1);
      assert.equal(await footer.locator('nav a').count(), 4);
      for (const href of ['/info?tab=terms', '/info?tab=usage', '/customerservice/faq', '/customerservice/contact']) assert.equal(await footer.locator(`a[href="${href}"]`).count(), 1);
      await footer.locator('img[src="/sbc-verification-qr.png"]').waitFor();
      assert.equal(await footer.evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(16, 43, 70)');
      await footer.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('footer img')].every(img => img.complete && img.naturalWidth > 0));
      await footer.screenshot({ path: `${out}/footer-${width}-${theme}-${language}.png` });
      assert.deepEqual(errors, []);
      results.push({ width, theme, language, passed: true, checks: ['homepage-only footer + four links + QR', 'navy footer', 'no floating theme toggle', 'service selection changes watermark', 'disabled service hidden', 'wallet tiles + disabled investments + keyboard', 'department and subscription watermarks', 'no overflow or page errors'] });
      fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
      console.log(JSON.stringify(results.at(-1)));
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
