const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');
const id = '3b834bd0-dc9d-4e58-9936-67d845b6015e';
function compile(file, imports = {}) {
  const source = fs.readFileSync(require.resolve('../' + file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { exports: {}, URLSearchParams, require: name => imports[name], window: { location: { assign: path => imports.navigate(path) } } };
  vm.runInNewContext(code, context);
  return context.exports;
}
const parser = () => compile('lib/checkout-target.ts');
for (const key of ['invoiceId', 'bookingId', 'subscriptionId']) {
  test('handoff preserves only the ' + key + ' reference, never a caller-supplied amount', () => {
    const result = parser().checkoutTarget(new URLSearchParams(`${key}=${id}&amount=0.01&currency=USD`));
    assert.equal(JSON.stringify(result), JSON.stringify({ [key]: id }));
  });
}
for (const query of ['', 'invoiceId=bad', `invoiceId=${id}&bookingId=${id}`, `invoiceId=${id}&invoiceId=${id}`]) {
  test('rejects invalid or ambiguous handoff ' + query, () => {
    assert.equal(parser().checkoutTarget(new URLSearchParams(query)), null);
  });
}
function render({ authenticated = true, paid = true, query = `invoiceId=${id}` } = {}) {
  const calls = [];
  const component = compile('components/Payment/CheckoutHandoff.tsx', {
    'react/jsx-runtime': jsx,
    'next/navigation': { useSearchParams: () => new URLSearchParams(query) },
    '@/hooks/useAuth': { useAuth: () => ({ isAuthenticated: authenticated, isLoading: false }) },
    '@/context/LanguageContext': { useLanguage: () => ({ language: 'en' }) },
    '@/lib/checkout-target': parser(),
    '@/components/ui/button': { Button: 'button' },
    '@/hooks/useGeideaCheckout': { geideaEnabled: true, useGeideaCheckout: () => ({ processing: false, pending: false, error: null, pay: async target => { calls.push(['geidea', JSON.stringify(target)]); return paid; } }) },
    navigate: path => calls.push(['navigate', path]),
  }).default;
  const all = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (node && typeof node === 'object') { all.push(node); visit(node.props?.children); }
  }
  visit(component());
  return { calls, button: all.find(x => x.type === 'button') };
}
test('handoff uses verified Geidea checkout before returning to the wallet', async () => {
  const { button, calls } = render();
  assert.equal(button.props.disabled, false);
  await button.props.onClick();
  assert.deepEqual(calls, [['geidea', JSON.stringify({ invoiceId: id })], ['navigate', '/wallet']]);
});
test('an unconfirmed payment stays in checkout', async () => {
  const { button, calls } = render({ paid: false });
  await button.props.onClick();
  assert.equal(calls.some(x => x[0] === 'navigate'), false);
});
test('handoff cannot start payment without authentication', async () => {
  const { button, calls } = render({ authenticated: false });
  assert.equal(button.props.disabled, true);
  await button.props.onClick();
  assert.deepEqual(calls, []);
});
test('invalid handoff does not offer a payment action', () => {
  assert.equal(render({ query: 'invoiceId=bad' }).button, undefined);
});
