const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
function load(env = {}) {
  const file = path.join(__dirname, '../lib/seo.ts');
  assert.ok(fs.existsSync(file), 'SEO helpers must exist');
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const context = { exports: {}, URL, process: { env } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}
const id = '12345678-1234-4234-8234-123456789abc';
test('guest browsing only opens exact public pages and UUID listing details', () => {
  const { isPublicBrowsingPath } = load();
  for (const route of ['/', '/about', '/offers', `/offers/${id}`, '/services', '/customerservice/faq']) {
    assert.equal(isPublicBrowsingPath(route), true, route);
  }
  for (const route of ['/offers/new', '/offers/private', '/services/form', '/services/my-requests', '/wallet', '/profile', '/admin', '/orders', '/internal', '/checkout', '/about-private']) {
    assert.equal(isPublicBrowsingPath(route), false, route);
  }
});
test('canonical origin strips paths and rejects unsafe protocols and credentials', () => {
  assert.equal(load({ SITE_URL: 'https://example.com/path/?x=1' }).getSiteUrl(), 'https://example.com');
  for (const value of ['javascript:alert(1)', 'https://user:secret@example.com', 'invalid']) {
    assert.equal(load({ SITE_URL: value }).getSiteUrl(), 'https://www.digitalbrokerage.sa');
  }
});
test('metadata uses a canonical public URL and complete share previews', () => {
  const metadata = load().buildPageMetadata('/about', 'عن المنصة', 'تعرف على المنصة');
  assert.equal(metadata.alternates.canonical, 'https://www.digitalbrokerage.sa/about');
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.twitter.card, 'summary_large_image');
  assert.ok(metadata.openGraph.images.length);
});
test('private and closed pages explicitly override public parent indexing', () => {
  const seo = load();
  assert.equal(seo.buildPageMetadata('/offers/new', 'إضافة عرض', 'إضافة').robots.index, false);
  assert.equal(seo.buildPageMetadata('/offers', 'العروض', 'العروض', { index: false }).robots.index, false);
});
test('section visibility excludes closed sections and absent guarded sections', () => {
  const seo = load();
  assert.equal(seo.isPageEnabled('/offers', [{ key: 'section_offers', value: 'open' }]), true);
  assert.equal(seo.isPageEnabled('/offers', [{ key: 'section_offers', value: 'hidden' }]), false);
  assert.equal(seo.isPageEnabled('/services/legal', [{ key: 'section_services', value: 'closed' }]), false);
  assert.equal(seo.isPageEnabled('/offers', []), false);
  assert.equal(seo.isPageEnabled('/about', []), true);
});
test('only active valid listings may enter the sitemap', () => {
  const seo = load();
  assert.equal(seo.isIndexableOffer({ id, isActive: true }), true);
  for (const offer of [{ id, isActive: false }, { id, isActive: 'true' }, { id: '../wallet', isActive: true }, { id }]) {
    assert.equal(seo.isIndexableOffer(offer), false);
  }
});
test('listing metadata reflects location and filters markup and unsafe images', () => {
  const seo = load();
  const metadata = seo.buildOfferMetadata({ id, isActive: true, propertyType: 'فيلا', city: 'الرياض', neighborhood: 'النرجس', additionalNotes: '<b>فيلا واسعة</b>', area: 300, price: '1500000', mediaFiles: ['javascript:alert(1)', 'https://example.com/villa.jpg'] });
  assert.match(metadata.title, /فيلا.*الرياض.*النرجس/);
  assert.doesNotMatch(metadata.description, /<b>/);
  assert.equal(metadata.openGraph.images[0].url, 'https://example.com/villa.jpg');
  assert.equal(metadata.alternates.canonical, `https://www.digitalbrokerage.sa/offers/${id}`);
  assert.equal(seo.buildOfferMetadata({ id, isActive: false }).robots.index, false);
});
test('JSON-LD escapes script terminators and preserves actual text', () => {
  const seo = load();
  const text = '</script><script>alert(1)</script>';
  const serialized = seo.serializeJsonLd({ name: text });
  assert.doesNotMatch(serialized, /</);
  assert.equal(JSON.parse(serialized).name, text);
});
test('breadcrumbs contain absolute URLs and ordered positions', () => {
  const schema = load().breadcrumbSchema('/offers', 'العروض العقارية');
  assert.equal(schema.itemListElement[0].item, 'https://www.digitalbrokerage.sa/');
  assert.equal(schema.itemListElement[1].item, 'https://www.digitalbrokerage.sa/offers');
  assert.equal(schema.itemListElement[1].position, 2);
});
test('contact aliases canonicalize to the actual customer service page', () => {
  const metadata = load().buildPageMetadata('/customerservice/contact', 'اتصل بنا', 'التواصل');
  assert.equal(metadata.alternates.canonical, 'https://www.digitalbrokerage.sa/customerservice');
});
