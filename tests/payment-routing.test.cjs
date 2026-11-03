const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');

function dialog(method, enabled = true, target = { invoiceId: 'invoice' }) {
  const calls = [];
  let state = 0;
  const states = [200, false, false, method, '0500000000'];
  const react = { useState: () => [states[state++], () => {}], useEffect: () => {} };
  const ui = new Proxy({}, { get: (_, key) => key });
  const api = {
    financialApi: { payInvoice: async (...args) => calls.push(['wallet', ...args]) },
    paylinkApi: { createInvoice: async () => { calls.push(['paylink']); return { data: { paymentUrl: 'https://example.test/pay' } }; } },
  };
  const imports = {
    react, 'react/jsx-runtime': jsx,
    '@/context/LanguageContext': { useLanguage: () => ({ t: key => key, language: 'en' }) },
    '@/hooks/useAuth': { useAuth: () => ({ user: { phone: '0500000000' } }) },
    '@/hooks/useGeideaCheckout': { geideaEnabled: enabled, useGeideaCheckout: () => ({ pay: async params => { calls.push(['geidea', params]); return true; } }) },
    '@/lib/api': api, '@/lib/safe-url': { safeHttpUrl: x => x },
    'react-hot-toast': { success: () => {}, error: x => calls.push(['error', x]) },
  };
  const source = fs.readFileSync(require.resolve('../components/Payment/PaymentMethodsModal.tsx'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { exports: {}, require: name => imports[name] || ui, window: { location: { assign: () => calls.push(['redirect']) } } };
  vm.runInNewContext(code, context);
  const tree = context.exports.default({ isOpen: true, onClose() {}, onPaymentSuccess() {}, price: 50, ...target });
  function find(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Button') return node;
    return [node.props?.children].flat(Infinity).map(find).find(Boolean);
  }
  return { calls, button: find(tree) };
}
for (const target of [{ invoiceId: 'invoice' }, { subscriptionId: 'subscription' }, { bookingId: 'booking' }]) {
  test('card payment uses Geidea for ' + Object.keys(target)[0], async () => {
    const { calls, button } = dialog('credit', true, target);
    await button.props.onClick();
    assert.equal(calls[0][0], 'geidea');
    assert.equal(calls.some(x => x[0] === 'paylink' || x[0] === 'redirect'), false);
  });
}
test('disabled Geidea never falls back to Paylink', async () => {
  const { calls, button } = dialog('credit', false);
  await button.props.onClick();
  assert.equal(calls.some(x => ['paylink', 'redirect', 'geidea'].includes(x[0])), false);
});
test('wallet-balance invoice payment remains available', async () => {
  const { calls, button } = dialog('balance', false);
  await button.props.onClick();
  assert.deepEqual(calls, [['wallet', 'invoice', 'balance']]);
});
