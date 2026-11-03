const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const id = '12345678-1234-4234-8234-123456789abc';
function modules({ settings = [], offers = [], offer, status = 200 } = {}) {
  const calls = [];
  const cache = new Map();
  async function fetch(url) {
    calls.push(url);
    const isSettings = url.endsWith('/settings/public');
    const code = isSettings ? 200 : status;
    return { ok: code === 200, status: code, json: async () => isSettings ? settings : url.includes('?') ? offers : offer };
  }
  function load(name) {
    if (name === 'react') return { cache: fn => fn };
    if (name === 'next/navigation') return { notFound: () => { throw new Error('NOT_FOUND'); } };
    if (cache.has(name)) return cache.get(name);
    const file = name.startsWith('@/') ? name.slice(2) + '.ts' : name;
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const context = { exports: {}, require: load, process: { env: { NEXT_PUBLIC_API_URL: 'https://api.example.com/api' } }, URL, AbortSignal, fetch };
    vm.runInNewContext(compiled, context);
    cache.set(name, context.exports);
    return context.exports;
  }
  return { load, calls };
}
test('sitemap includes only enabled pages and active valid public listings with actual dates', async () => {
  const { load } = modules({ settings: [{ key: 'section_offers', value: 'open' }], offers: [
    { id, isActive: true, updatedAt: '2026-10-01T00:00:00Z' },
    { id: '87654321-1234-4234-8234-123456789abc', isActive: false },
  ] });
  const sitemap = await load('app/sitemap.ts').default();
  assert.equal(sitemap.length, 4);
  assert.ok(sitemap.some(item => item.url === `https://www.digitalbrokerage.sa/offers/${id}`));
  assert.ok(!sitemap.some(item => /wallet|profile|checkout|services|contact/.test(item.url)));
  assert.equal(sitemap[3].lastModified.toISOString(), '2026-10-01T00:00:00.000Z');
});
test('closed offers section does not fetch or advertise public listings', async () => {
  const { load, calls } = modules({ settings: [{ key: 'section_offers', value: 'closed' }] });
  const sitemap = await load('app/sitemap.ts').default();
  assert.equal(sitemap.length, 2);
  assert.ok(!calls.some(url => url.includes('/offers')));
});
test('listing API failures fail the sitemap instead of deleting listing inventory', async () => {
  const { load } = modules({ settings: [{ key: 'section_offers', value: 'open' }], status: 503 });
  await assert.rejects(load('app/sitemap.ts').default(), /503/);
});
test('invalid listing IDs cannot be interpolated into API paths', async () => {
  const { load, calls } = modules();
  await assert.rejects(load('@/lib/seo-data').getSeoOffer('../wallet'), /NOT_FOUND/);
  assert.equal(calls.length, 0);
});
test('missing listing responses yield a real not-found instead of generic indexable metadata', async () => {
  const { load } = modules({ status: 404 });
  await assert.rejects(load('@/lib/seo-data').getSeoOffer(id), /NOT_FOUND/);
});
test('metadata for a closed public section stays noindex', async () => {
  const { load } = modules({ settings: [{ key: 'section_offers', value: 'hidden' }] });
  const metadata = await load('@/lib/seo-data').publicPageMetadata('/offers');
  assert.equal(metadata.robots.index, false);
});
test('robots advertises the canonical sitemap and lets crawlers read private noindex tags', () => {
  const robots = modules().load('app/robots.ts').default();
  assert.equal(robots.sitemap, 'https://www.digitalbrokerage.sa/sitemap.xml');
  assert.equal(robots.rules.userAgent, '*');
  assert.equal(robots.rules.allow, '/');
  assert.ok(!robots.rules.disallow.includes('/wallet'));
});
