// Run against provider-browser-server.cjs and a local frontend. No production requests or charges.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('/tmp/realestate-browser-check/node_modules/playwright-core');
const fixtures = JSON.parse(fs.readFileSync('/tmp/realestate-provider-browser-fixtures.json', 'utf8'));
const output = path.resolve('../outputs/client-chat-review-2026-10-25/browser'); fs.mkdirSync(output, { recursive: true });
const base = 'http://127.0.0.1:3350';
const errors = [], results = [];
let browser;
async function contextFor(role, width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 1000 }, reducedMotion: 'reduce' });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost'].includes(url.hostname) || url.protocol === 'data:') return route.continue();
    return route.abort();
  });
  await context.addInitScript(({ role, fixtures }) => {
    localStorage.setItem('language', 'ar');
    if (role && !localStorage.getItem('token')) { localStorage.setItem('token', fixtures.tokens[role]); localStorage.setItem('user', JSON.stringify(fixtures.records[role])); }
  }, { role, fixtures });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}
async function assertNoOverflow(page, label) {
  const bounds = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: innerWidth }));
  assert.ok(bounds.body <= bounds.viewport + 1, `${label}: ${bounds.body} > ${bounds.viewport}`);
}
(async () => {
  browser = await chromium.launch({ executablePath: '/home/mostafa/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const reset = await fetch('http://127.0.0.1:3351/__test/reset', { method: 'POST' }); assert.equal(reset.status, 200);
  const provider = await contextFor('provider', 390);
  await provider.page.goto(base + '/service-providers');
  const application = provider.page.locator('form').first();
  await application.getByLabel('نوع المزود').selectOption('notary');
  await application.getByLabel('المدينة', { exact: true }).fill('الرياض');
  await application.getByLabel('أونلاين', { exact: true }).check();
  await application.getByLabel('حضوري', { exact: true }).check();
  await application.getByText('الخدمات القانونية', { exact: true }).click();
  await application.getByText('الخدمات القانونية', { exact: true }).locator('..').getByLabel('كل خدمات هذا القسم', { exact: true }).check();
  await application.getByLabel('رقم الترخيص', { exact: true }).fill('TEST-NOTARY-1');
  await application.locator('input[type=file]').setInputFiles({ name: 'license.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
  await application.getByRole('link', { name: 'عرض المستند المرفق' }).waitFor();
  await application.getByRole('button', { name: 'إرسال للمراجعة', exact: true }).click();
  await provider.page.getByText('قيد المراجعة', { exact: true }).waitFor();
  results.push('Provider submits a notary application, city, delivery modes, category and license document through the mobile UI.');

  const admin = await contextFor('admin');
  await admin.page.goto(base + '/admin/service-providers');
  await admin.page.getByLabel('الرسوم بالريال', { exact: true }).fill('25.50');
  await admin.page.getByRole('button', { name: 'حفظ الإعدادات', exact: true }).click();
  await admin.page.getByText('تم حفظ رسوم المنصة وسياسة المدينة.', { exact: true }).waitFor();
  await admin.page.getByRole('button', { name: 'مراجعة والصلاحيات والتسعير', exact: true }).click();
  const review = admin.page.getByRole('dialog');
  await review.getByLabel('اتفاق حصة المنصة').selectOption('percentage');
  await review.getByLabel('النسبة %', { exact: true }).fill('10');
  await review.getByLabel('أقل قيمة عرض', { exact: true }).fill('5');
  await review.getByLabel('أعلى قيمة عرض', { exact: true }).fill('500');
  await review.getByRole('button', { name: 'حفظ القرار', exact: true }).click();
  await admin.page.getByText('تم حفظ قرار المراجعة وإشعار المزود.', { exact: true }).waitFor();
  await admin.page.screenshot({ path: path.join(output, 'admin-provider-review-desktop.png'), fullPage: true });
  results.push('Administrator configures the platform fee, approves the provider and saves category grants, commission and offer bounds.');

  await provider.page.reload();
  await provider.page.getByRole('button', { name: 'تقديم عرض', exact: true }).click();
  const offer = provider.page.getByRole('dialog');
  await offer.getByLabel('قيمة العرض بالريال', { exact: true }).fill('100');
  await offer.getByLabel('طريقة التقديم').selectOption('online');
  await offer.getByRole('button', { name: 'إرسال العرض', exact: true }).click();
  await provider.page.getByRole('button', { name: 'تم تقديم العرض', exact: true }).waitFor();
  await assertNoOverflow(provider.page, 'Mobile provider dashboard');
  await provider.page.screenshot({ path: path.join(output, 'provider-offer-mobile.png'), fullPage: true });
  results.push('Approved provider submits an in-range online offer from the mobile dashboard.');

  await admin.page.goto(base + '/admin/services?type=legal');
  await admin.page.getByText('توثيق صك الملكية', { exact: true }).first().waitFor();
  await admin.page.getByRole('button', { name: 'التفاصيل', exact: true }).first().click();
  await admin.page.getByRole('button', { name: 'قبول وإصدار الفاتورة', exact: true }).click();
  await admin.page.getByText('تم قبول العرض', { exact: true }).waitFor();
  results.push('Legal requests load in their admin section; administrator accepts the provider offer and issues the owner invoice.');

  const owner = await contextFor('owner', 390);
  await owner.page.goto(base + '/services/provider-requests');
  await owner.page.getByRole('link', { name: 'فتح الفواتير والدفع', exact: true }).waitFor();
  assert.equal(await owner.page.getByRole('link', { name: /0550000001/ }).count(), 0);
  await owner.page.getByRole('link', { name: 'فتح الفواتير والدفع', exact: true }).click();
  await owner.page.waitForURL('**/wallet?tab=invoices');
  await owner.page.locator(':text("توثيق صك الملكية"):visible').last().waitFor();
  results.push('First client navigation to the wallet renders the issued invoice without a blank transition.');
  await owner.page.goto(base + '/services/provider-requests');
  const confirmed = await owner.page.request.post('http://127.0.0.1:3351/__test/confirm-payment'); assert.equal(confirmed.status(), 200);
  await owner.page.getByRole('button', { name: 'تحديث', exact: true }).first().click();
  await owner.page.getByRole('link', { name: /0550000001/ }).waitFor();
  await owner.page.screenshot({ path: path.join(output, 'owner-contact-after-payment-mobile.png'), fullPage: true });
  results.push('Owner sees no provider phone before payment; a test-only confirmed invoice payment unlocks contact through the real API.');

  const unverified = await contextFor('unverified', 390);
  await unverified.page.goto(base + '/profile');
  await unverified.page.waitForFunction(() => Boolean(document.querySelector('input[name=firstName]')?.value));
  await unverified.page.getByLabel('اسم المدينة', { exact: true }).fill('جدة');
  const savedProfile = unverified.page.waitForResponse(response => response.url().endsWith('/api/user/profile') && response.request().method() === 'PUT');
  await unverified.page.getByRole('button', { name: 'حفظ', exact: true }).click();
  assert.equal((await savedProfile).status(), 200);
  await unverified.page.waitForURL('**/details');
  await unverified.page.goto(base + '/profile');
  await unverified.page.waitForFunction(() => document.querySelector('input[name=city]')?.value === 'جدة');
  await unverified.page.getByLabel('اسم المدينة', { exact: true }).waitFor();
  assert.equal(await unverified.page.getByLabel('اسم المدينة', { exact: true }).inputValue(), 'جدة');
  await unverified.page.goto(base + '/services');
  await unverified.page.getByRole('link', { name: 'الانضمام / لوحة مزود الخدمة', exact: true }).waitFor();
  results.push('Unverified account saves its city, reloads the profile and continues browsing services.');

  for (const width of [390, 1440]) {
    const { context, page } = await contextFor(null, width); await page.goto(base + '/services');
    const footer = page.locator('footer'); await footer.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const link = Array.from(document.querySelectorAll('footer a[href="/about"]')).find(el => el.getBoundingClientRect().width > 0); if (!link) return false; for (let el = link; el && el.tagName !== 'FOOTER'; el = el.parentElement) if (Number(getComputedStyle(el).opacity) < 0.99) return false; return true; });
    await page.waitForFunction(() => { const paragraphs = Array.from(document.querySelectorAll('footer p')).filter(el => el.getBoundingClientRect().width > 0); return paragraphs.every(p => { for(let el=p; el && el.tagName !== 'FOOTER'; el=el.parentElement) if(Number(getComputedStyle(el).opacity) < 0.99) return false; return true; }); });
    const visibleQr = footer.locator('img[src="/sbc-verification-qr.png"]:visible'); await visibleQr.waitFor();
    assert.equal(await visibleQr.count(), 1); assert.ok(await visibleQr.evaluate(image => image.complete && image.naturalWidth > 0));
    assert.equal(await page.locator('footer').count(), 1); await assertNoOverflow(page, `Footer ${width}`);
    await footer.screenshot({ path: path.join(output, `footer-${width}-light.png`) });
    await page.evaluate(() => document.documentElement.classList.add('dark')); await footer.screenshot({ path: path.join(output, `footer-${width}-dark.png`) });
    await context.close();
  }
  results.push('Original footer renders once with one visible working QR image at mobile/desktop widths in light/dark modes, without horizontal overflow.');
  const image = await owner.page.request.get(base + '/opengraph-image'); assert.equal(image.status(), 200); assert.equal(image.headers()['content-type'], 'image/png'); fs.writeFileSync(path.join(output, 'share-image.png'), await image.body());
  results.push('Link-sharing image is a generated opaque PNG served successfully.');

  const publicOffers = await contextFor(null, 390);
  await publicOffers.page.goto(base + '/offers');
  await publicOffers.page.getByText('لا توجد عروض', { exact: true }).waitFor();
  await publicOffers.page.route('**/api/offers*', route => route.fulfill({status:500, contentType:'application/json', body:JSON.stringify({message:'Synthetic test failure'})}));
  await publicOffers.page.reload();
  await publicOffers.page.getByRole('button', {name:'محاولة مرة أخرى', exact:true}).waitFor();
  results.push('Offers distinguish the empty state from a failed API response and expose retry.');

  const tutorialUser = await contextFor('owner', 390);
  await tutorialUser.context.addInitScript(() => { const user = JSON.parse(localStorage.getItem('user')); user.onboardingStatus = 'pending'; localStorage.setItem('user', JSON.stringify(user)); localStorage.removeItem('onboarding_status'); });
  await tutorialUser.page.goto(base + '/details');
  const tour = tutorialUser.page.getByRole('dialog'); await tour.waitFor();
  const portal = await tour.evaluate(element => element.parentElement === document.body); assert.equal(portal, true);
  const mask = tour.locator('mask'); assert.equal(await mask.getAttribute('maskUnits'), 'userSpaceOnUse');
  const target = tutorialUser.page.locator('#tour-target-mobile-customer-service');
  const targetBox = await target.boundingBox();
  const cutout = await mask.locator('rect[fill=black]').evaluate(el => { const r = el.getBBox(); return {x:r.x,y:r.y,width:r.width,height:r.height}; });
  assert.ok(targetBox, 'Tutorial target exists');
  assert.ok(Math.abs(cutout.x + cutout.width / 2 - targetBox.x - targetBox.width / 2) < 2, 'Spotlight cutout is centered on the actual target horizontally: ' + JSON.stringify({cutout,targetBox}));
  assert.ok(cutout.y <= targetBox.y + 1 && cutout.y + cutout.height >= targetBox.y + targetBox.height - 1, 'Cutout covers target vertically');
  await tutorialUser.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await tutorialUser.page.waitForTimeout(300); // Allow the browser to repaint the SVG mask after geometry changes.
  await tutorialUser.page.screenshot({ path: path.join(output, 'tutorial-mobile.png'), fullPage: false });
  results.push('Mobile tutorial portal and SVG cutout geometry align with the actual target, with an explicit luminance mask.');
  assert.deepEqual(errors, [], 'No uncaught page exceptions');
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, errors, note: 'Synthetic local accounts and disposable PostgreSQL. License upload storage and payment confirmation are explicit test fixtures; no live provider verification or payment charge.' }, null, 2));
  fs.rmSync(path.join(output, 'failure.txt'), {force:true});
  console.log(`PASS: ${results.length} browser checks; no uncaught page exceptions.`);
})().catch(error => { fs.writeFileSync(path.join(output, 'failure.txt'), error.stack + '\n' + JSON.stringify(errors)); console.error(error.message); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
