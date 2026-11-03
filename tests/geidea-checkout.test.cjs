const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function checkoutModule(Sdk, sessionStorage) {
  const source = fs.readFileSync(path.join(__dirname, '../lib/geidea.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, window: { GeideaCheckout: Sdk, sessionStorage }, URL, setTimeout, clearTimeout };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const session = { sessionId: 'session-1', scriptUrl: 'https://www.ksamerchant.geidea.net/hpp/geideaCheckout.min.js' };

test('Geidea UI success waits for backend confirmation', async () => {
  let confirmed = false;
  let started;
  class Sdk {
    constructor(success) { this.success = success; }
    startPayment(id) { started = id; this.success({ orderId: 'order-1' }); }
  }
  const { payWithGeidea } = checkoutModule(Sdk);
  await payWithGeidea(session, async (id) => {
    assert.equal(id, 'order-1');
    await Promise.resolve();
    confirmed = true;
    return { paid: true };
  });
  assert.equal(started, 'session-1');
  assert.equal(confirmed, true);
});

test('unconfirmed browser success is not reported as paid', async () => {
  class Sdk { constructor(success) { this.success = success; } startPayment() { this.success({ orderId: 'order-1' }); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => ({ paid: false })), /pending/);
});

test('cancellation never calls the backend verification or payment success', async () => {
  class Sdk { constructor(_success, _error, cancel) { this.cancel = cancel; } startPayment() { this.cancel({}); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => { assert.fail('Verification after cancel'); }), /cancelled/);
});

test('declined checkout reports failure', async () => {
  class Sdk { constructor(_success, error) { this.error = error; } startPayment() { this.error({}); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => { assert.fail('Verification after error'); }), /failed/);
});

test('duplicate SDK events trigger a single verification', async () => {
  let calls = 0;
  class Sdk { constructor(success) { this.success = success; } startPayment() { this.success({ orderId: 'order-1' }); this.success({ orderId: 'order-1' }); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await payWithGeidea(session, async () => { calls++; return { paid: true }; });
  assert.equal(calls, 1);
});

test('rejects a checkout script outside Geidea even if an SDK is already present', async () => {
  const { payWithGeidea } = checkoutModule(class {});
  await assert.rejects(payWithGeidea({ ...session, scriptUrl: 'https://untrusted.example/sdk.js' }, async () => ({ paid: true })), /script/);
});

test('pending orders survive a new checkout instance and stay scoped to the customer and item', () => {
  const records = new Map();
  const storage = { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) };
  const first = checkoutModule(class {}, storage);
  const key = first.geideaPendingKey('user-1', { walletTopupAmount: 50 });
  const order = '0b02b503-fbf8-49dd-cdec-08dcdb056790';
  first.saveGeideaPending(key, order);
  const reloaded = checkoutModule(class {}, storage);
  assert.equal(reloaded.readGeideaPending(key), order);
  assert.notEqual(key, first.geideaPendingKey('user-2', { walletTopupAmount: 50 }));
  assert.notEqual(key, first.geideaPendingKey('user-1', { subscriptionId: 'subscription-1' }));
  reloaded.saveGeideaPending(key, null);
  assert.equal(reloaded.readGeideaPending(key), null);
});

test('a verified failed order allows the UI to report failure instead of waiting forever', async () => {
  class Sdk { constructor(success) { this.success = success; } startPayment() { this.success({ orderId: 'order-1' }); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => ({ paid: false, status: 'failed' })), /failed/);
});

test('wallet failure retains safe gateway codes and support reference without exposing payment data', async () => {
  class Sdk {
    constructor(_success, error) { this.error = error; }
    startPayment() { this.error({ responseCode: '100', detailedResponseCode: '042', reference: '0b02b503-fbf8-49dd-cdec-08dcdb056790', cardNumber: 'private-card-data', detailedResponseMessage: '<script>private-provider-payload</script>' }); }
  }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => { assert.fail('No order to verify'); }), error => {
    assert.equal(error.responseCode, '100');
    assert.equal(error.detailedResponseCode, '042');
    assert.equal(error.reference, '0b02b503-fbf8-49dd-cdec-08dcdb056790');
    assert.ok(!JSON.stringify(error).includes('private'));
    return true;
  });
});

test('an SDK error carrying an order is checked with the backend before allowing another payment', async () => {
  class Sdk { constructor(_success, error) { this.error = error; } startPayment() { this.error({ orderId: 'order-1' }); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await payWithGeidea(session, async id => { assert.equal(id, 'order-1'); return { paid: true }; });
});

test('network uncertainty on an SDK error is retained as pending', async () => {
  class Sdk { constructor(_success, error) { this.error = error; } startPayment() { this.error({ orderId: 'order-1' }); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => { throw new Error('network'); }), /pending/);
});

test('empty SDK cancellation still releases checkout with a cancellation result', async () => {
  class Sdk { constructor(_success, _error, cancel) { this.cancel = cancel; } startPayment() { this.cancel(); } }
  const { payWithGeidea } = checkoutModule(Sdk);
  await assert.rejects(payWithGeidea(session, async () => { assert.fail('No order to verify'); }), /cancelled/);
});
