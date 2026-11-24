const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load() {
  const context = { exports: {} };
  const source = fs.readFileSync(require.resolve('../lib/redesign-chat03-checkout.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('validates single valid UUID target correctly', () => {
  const { isValidCheckoutTarget, getTargetMetadata } = load();

  const validInvoice = { invoiceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' };
  assert.equal(isValidCheckoutTarget(validInvoice), true);
  const metaInv = getTargetMetadata(validInvoice);
  assert.equal(metaInv.type, 'invoice');
  assert.equal(metaInv.id, '3fa85f64-5717-4562-b3fc-2c963f66afa6');

  const validBooking = { bookingId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' };
  assert.equal(isValidCheckoutTarget(validBooking), true);
  const metaBk = getTargetMetadata(validBooking);
  assert.equal(metaBk.type, 'booking');
  assert.equal(metaBk.id, '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');

  const validSub = { subscriptionId: '12345678-1234-1234-1234-123456789abc' };
  assert.equal(isValidCheckoutTarget(validSub), true);
  const metaSub = getTargetMetadata(validSub);
  assert.equal(metaSub.type, 'subscription');
  assert.equal(metaSub.id, '12345678-1234-1234-1234-123456789abc');
});

test('rejects multi-target, invalid UUID, and malformed targets', () => {
  const { isValidCheckoutTarget, getTargetMetadata } = load();

  // Multi-target collision
  assert.equal(isValidCheckoutTarget({
    invoiceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    bookingId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  }), false);

  // Non-UUID string
  assert.equal(isValidCheckoutTarget({ invoiceId: 'not-a-uuid' }), false);
  assert.equal(isValidCheckoutTarget({ invoiceId: '12345' }), false);

  // Empty or null
  assert.equal(isValidCheckoutTarget(null), false);
  assert.equal(isValidCheckoutTarget({}), false);
  assert.equal(isValidCheckoutTarget({ randomParam: 'hello' }), false);

  const nullMeta = getTargetMetadata(null);
  assert.equal(nullMeta.type, null);
  assert.equal(nullMeta.id, null);
});

test('builds validated guest login URLs preserving single target', () => {
  const { buildGuestLoginUrl } = load();

  const targetInvoice = { invoiceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' };
  const loginUrlInv = buildGuestLoginUrl(targetInvoice);
  assert.equal(
    loginUrlInv,
    '/login?next=%2Fcheckout%3FinvoiceId%3D3fa85f64-5717-4562-b3fc-2c963f66afa6'
  );

  const targetBooking = { bookingId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' };
  const loginUrlBk = buildGuestLoginUrl(targetBooking);
  assert.equal(
    loginUrlBk,
    '/login?next=%2Fcheckout%3FbookingId%3D9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  );

  // Fallback on invalid target
  assert.equal(buildGuestLoginUrl(null), '/login?next=%2Fwallet');
  assert.equal(buildGuestLoginUrl({ invoiceId: 'invalid' }), '/login?next=%2Fwallet');
});

test('returns localized target labels in Arabic and English', () => {
  const { getTargetDisplayLabel } = load();

  assert.equal(getTargetDisplayLabel('invoice', 'ar'), 'سداد فاتورة منصة');
  assert.equal(getTargetDisplayLabel('invoice', 'en'), 'Platform Invoice Payment');

  assert.equal(getTargetDisplayLabel('booking', 'ar'), 'سداد حجز عقاري');
  assert.equal(getTargetDisplayLabel('booking', 'en'), 'Property Booking Payment');

  assert.equal(getTargetDisplayLabel('subscription', 'ar'), 'سداد اشتراك باقة');
  assert.equal(getTargetDisplayLabel('subscription', 'en'), 'Package Subscription Payment');

  assert.equal(getTargetDisplayLabel(null, 'ar'), 'دفع إلكتروني آمن');
});
