const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
async function openOffers(token) {
  const effects = [];
  const calls = { listings: [], incomingBookings: 0, myBookings: 0 };
  const noop = () => {};
  const react = { useState: initial => [initial, noop], useEffect: effect => effects.push(effect) };
  const api = {
    offersApi: { findAll: async options => { calls.listings.push(options); return { data: [] }; } },
    bookingsApi: {
      findIncoming: async () => { calls.incomingBookings++; return { data: [] }; },
      findAll: async () => { calls.myBookings++; return { data: [] }; },
    },
  };
  const source = fs.readFileSync(path.join(__dirname, '../app/offers/OffersClient.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const otherUi = new Proxy({}, { get: () => noop });
  const context = {
    exports: {}, console,
    localStorage: { getItem: key => key === 'token' ? token : token ? JSON.stringify({ id: 'user-1', role: 'owner' }) : null },
    require: name => {
      if (name === 'react') return { ...react, default: react };
      if (name === 'react/jsx-runtime') return { jsx: noop, jsxs: noop };
      if (name === 'next/navigation') return { useRouter: () => ({ push: noop }) };
      if (name === '@/context/LanguageContext') return { useLanguage: () => ({ t: key => key, language: 'ar' }) };
      if (name === '@/hooks/useSectionGuard') return { useSectionGuard: () => ({ isOpen: false }) };
      if (name === '@/lib/api') return api;
      return otherUi;
    },
  };
  vm.runInNewContext(compiled, context);
  context.exports.default();
  effects.forEach(effect => effect());
  await Promise.resolve();
  await Promise.resolve();
  return calls;
}
test('guest listing browsing does not call private appointment endpoints', async () => {
  const calls = await openOffers(null);
  assert.equal(calls.listings.length, 1);
  assert.equal(calls.incomingBookings, 0);
  assert.equal(calls.myBookings, 0);
  assert.equal(calls.listings[0].isActive, true);
});
test('signed-in listing browsing retains incoming and personal appointments', async () => {
  const calls = await openOffers('existing-token');
  assert.equal(calls.incomingBookings, 1);
  assert.equal(calls.myBookings, 1);
  assert.equal(calls.listings.length, 1);
});
