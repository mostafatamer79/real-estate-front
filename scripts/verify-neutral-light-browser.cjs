// Local visual verification only. Defaults to the built preview on port 3360;
// set VERIFY_BASE to target a running dev server instead (cross-origin API calls
// are intercepted, so no fixture server is started).
// PUPPETEER_MODULE and CHROME_PATH point to an existing browser installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');
const base = process.env.VERIFY_BASE || 'http://127.0.0.1:3360';
const usesFixtureServer = base.includes(':3360');
const output = path.resolve(__dirname, '../docs/verification/light-polish-2026-11-08');
const user = { id: 'preview', role: 'admin', firstName: 'Preview', lastName: 'Account', email: 'preview@example.test', city: 'Riyadh', onboardingStatus: 'completed', isVerified: true, departments: ['legal', 'financial'] };
const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
let customSettings = [], emptyCharts = false;
const checks = [];
function fixture(url) {
  const endpoint = new URL(url).pathname;
  if (endpoint.includes('settings')) return [...['services', 'wallet', 'financial', 'offers', 'orders', 'marketing', 'buildingmanagement', 'scan_map', 'legal', 'customerservice', 'details', 'info', 'about', 'chat', 'subscriptions'].map(key => ({ key: `section_${key}`, value: 'open' })), ...customSettings];
  if (endpoint.includes('/financial/chart-data')) return emptyCharts ? [] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.5, 0];
  if (endpoint.includes('/properties/stats')) return emptyCharts ? [] : [{ name: 'building', value: 8 }, { name: 'apartment', value: 5 }, { name: 'land', value: 4 }, { name: 'warehouse', value: 3 }];
  if (endpoint.includes('/activities/me')) return [{ id: 'a1', type: 'user_joined', title: 'New User Joined', description: 'admin joined the system', createdAt: '2026-11-07T12:00:00Z' }, { id: 'a2', type: 'user_joined', title: 'New User Joined', description: 'Preview joined the system', createdAt: '2026-11-08T10:00:00Z' }];
  if (/user\/profile|auth\/me/.test(endpoint)) return { ...user, data: user, user };
  if (/nafath.*(status|availability|config)/.test(endpoint)) return { configured: false, available: false };
  if (endpoint.includes('/subscriptions/status')) return { isActive: true, status: 'active', departments: user.departments };
  if (endpoint.includes('/financial/my-wallet')) return { balance: 0, entries: [] };
  if (endpoint.includes('/service-providers/me')) return null;
  if (/service-providers|provider-requests/.test(endpoint)) return { items: [], total: 0 };
  return [];
}
async function intercept(request) {
  const url = request.url();
  if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
  if (['fetch', 'xhr'].includes(request.resourceType()) && (new URL(url).origin !== base || new URL(url).pathname.startsWith('/api/'))) return request.respond({ headers, contentType: 'application/json', body: JSON.stringify(fixture(url)) });
  if (!url.startsWith(base) && !url.startsWith('data:')) return request.abort();
  return request.continue();
}
async function prepare(page, authenticated) {
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on('request', intercept);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(({ user, authenticated }) => {
    if (!localStorage.getItem('digital-brokerage-theme')) localStorage.setItem('digital-brokerage-theme', 'light');
    if (!localStorage.getItem('language')) localStorage.setItem('language', 'ar');
    if (authenticated) { localStorage.setItem('token', 'preview'); localStorage.setItem('user', JSON.stringify(user)); localStorage.setItem('onboarding_status_preview', 'completed'); }
  }, { user, authenticated });
}
async function visit(page, route) {
  const response = await page.goto(base + route, { waitUntil: 'networkidle0', timeout: 60000 });
  assert.ok([200, 304].includes(response.status()), `${route}: ${response.status()}`);
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name), fullPage: true }); }
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const server = usesFixtureServer
    ? http.createServer((request, response) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(fixture('http://127.0.0.1:3030' + request.url))); })
    : null;
  if (server) await new Promise(resolve => server.listen(3030, resolve));
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage(); await prepare(page, true);
    const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: 1000 }); await visit(page, '/services'); await page.waitForSelector('.services-card');
      const light = await page.$$eval('.services-card', cards => cards.map(card => ({ title: card.querySelector('h2')?.textContent, layout: card.closest('.services-cell')?.dataset.layout })));
      assert.equal(light.length, 5);
      await page.click('.theme-toggle'); await page.waitForFunction(() => document.documentElement.classList.contains('dark'));
      const dark = await page.$$eval('.services-card', cards => cards.map(card => ({ title: card.querySelector('h2')?.textContent, layout: card.closest('.services-cell')?.dataset.layout })));
      assert.deepEqual(light, dark); await screenshot(page, `services-dark-${width}.png`);
      const contrast = await page.evaluate(() => {
        const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = (rgb) => { const [r, g, b] = rgb.map(value => { const channel = value / 255; return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const ratio = (foreground, background) => { const [hi, lo] = [luminance(parse(foreground)), luminance(parse(background))].sort((a, b) => b - a); return (hi + 0.05) / (lo + 0.05); };
        const card = document.querySelector('.services-card');
        const title = document.querySelector('.services-card-title');
        return ratio(getComputedStyle(title).color, getComputedStyle(card).backgroundColor);
      });
      assert.ok(contrast >= 4.5, `card title contrast ${contrast} at ${width}`);
      await page.reload({ waitUntil: 'networkidle0' }); assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark')));
      await page.click('.theme-toggle'); await page.waitForSelector('.services-card'); await screenshot(page, `services-${width}.png`);
      assert.equal(await page.evaluate(() => localStorage.getItem('digital-brokerage-theme')), 'light');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert.equal(overflow, false);
      checks.push({ width, originalServiceLayout: true, darkPersistence: true, lightSwitch: true, overflow, contrast: Number(contrast.toFixed(2)) });
    }
    customSettings = [{ key: 'module_services_marketing', value: 'disabled' }, { key: 'module_services_construction', value: 'soon' }, { key: 'custom_service_categories', value: JSON.stringify([{ id: 'consulting', title: 'استشارات عقارية', description: 'قسم تجريبي مخصص', status: 'enabled' }]) }];
    await visit(page, '/services'); await page.waitForSelector('.services-card');
    const states = await page.$$eval('.services-card', cards => cards.map(card => ({ title: card.querySelector('h2')?.textContent, tag: card.tagName, href: card.getAttribute('href'), status: card.dataset.status || null })));
    assert.equal(states.length, 5); assert.ok(states.some(card => card.title === 'استشارات عقارية')); assert.ok(states.every(card => !card.title.includes('التسويق')));
    const locked = states.filter(card => card.status === 'soon'); assert.equal(locked.length, 1); assert.ok(locked.every(card => card.tag === 'DIV' && card.href === null));
    assert.equal(states.filter(card => card.tag === 'A').length, 4); assert.equal(states.find(card => card.title === 'استشارات عقارية').href, '/services/form?type=consulting');
    await page.click('.services-card-preview'); await page.waitForFunction(() => location.search.includes('preview=1'));
    checks.push({ customCategories: true, hiddenCategories: true, soonDisabled: true, adminPreview: true });
    customSettings = []; await visit(page, '/services'); await page.focus('.services-card[href]'); await page.keyboard.press('Enter'); await page.waitForFunction(() => location.pathname === '/services/form' && location.search.includes('postPurchase')); checks.push({ keyboardRouting: true });
    await page.evaluate(() => localStorage.setItem('language', 'en')); await visit(page, '/services'); await page.waitForSelector('.services-page[dir="ltr"]'); assert.ok((await page.$eval('.services-page', element => element.textContent)).includes('My requests')); await screenshot(page, 'services-english-390.png'); checks.push({ englishLTR: true });
    await page.evaluate(() => localStorage.setItem('language', 'ar')); await visit(page, '/details'); await page.waitForSelector('.chart-point-trigger'); await page.focus('.chart-point-trigger:nth-child(11)'); await page.waitForSelector('[role="tooltip"]'); assert.ok((await page.$eval('[role="tooltip"]', element => element.textContent)).includes('11.5')); checks.push({ keyboardTooltip: true }); await screenshot(page, 'details-tooltip-390.png');
    emptyCharts = true; await page.reload({ waitUntil: 'networkidle0' }); await page.waitForFunction(() => document.querySelectorAll('.calm-chart').length === 2 && [...document.querySelectorAll('.calm-chart')].every(element => element.textContent.includes('لا توجد بيانات'))); checks.push({ emptyCharts: true }); await screenshot(page, 'details-empty-390.png'); emptyCharts = false;
    for (const width of [1440, 390]) { await page.setViewport({ width, height: 1000 }); await visit(page, '/details'); await page.waitForSelector('.chart-point-trigger'); await screenshot(page, `details-${width}.png`); }
    for (const route of ['/about', '/info']) { await visit(page, route); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false); }
    const guestContext = await browser.createBrowserContext(); const guest = await guestContext.newPage(); await prepare(guest, false); const guestResults = []; const guestErrors = []; guest.on('pageerror', error => guestErrors.push(error.message));
    for (const width of [1440, 390]) {
      await guest.setViewport({ width, height: 1000 });
      for (const route of ['/', '/login', '/verify-otp']) {
        guestErrors.length = 0; await visit(guest, route);
        const result = { route, width, ...await guest.evaluate(() => ({ url: location.pathname, overflow: document.documentElement.scrollWidth > innerWidth + 1, content: document.querySelector('[data-appearance-content]')?.innerText.trim().length || 0 })), errors: [...guestErrors] };
        assert.equal(result.overflow, false); assert.deepEqual(result.errors, []); guestResults.push(result);
        if (route === '/') await screenshot(guest, `public-home-${width}.png`);
      }
    }
    assert.deepEqual(pageErrors, []);
    fs.writeFileSync(path.join(output, 'guest-routes.json'), JSON.stringify(guestResults, null, 2)); fs.writeFileSync(path.join(output, 'interactions.json'), JSON.stringify(checks, null, 2)); console.log(JSON.stringify({ checks, guestResults, pageErrors }, null, 2));
  } finally { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
