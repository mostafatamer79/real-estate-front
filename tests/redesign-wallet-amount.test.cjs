const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load() {
  const context = { exports: {} };
  const source = fs.readFileSync(require.resolve('../lib/redesign-wallet-amount.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('normalizes Arabic and Persian digits and decimal separators', () => {
  const { normalizeNumericString } = load();
  assert.equal(normalizeNumericString('١٢٣٫٤٥'), '123.45');
  assert.equal(normalizeNumericString('  ۱۲۳,۴۵  '), '12345');
  assert.equal(normalizeNumericString('٥٠'), '50');
});

test('type guard correctly identifies confirmed balance states', () => {
  const { isConfirmedBalance } = load();
  assert.equal(isConfirmedBalance(0), true);
  assert.equal(isConfirmedBalance(150.75), true);
  assert.equal(isConfirmedBalance(null), false);
  assert.equal(isConfirmedBalance(undefined), false);
  assert.equal(isConfirmedBalance(NaN), false);
  assert.equal(isConfirmedBalance(-10), false);
  assert.equal(isConfirmedBalance('100'), false);
});

test('rejects negative, zero, and sub-cent withdrawal amounts', () => {
  const { validateWithdrawal } = load();

  // Negative amounts
  const resNeg = validateWithdrawal('-50', 500);
  assert.equal(resNeg.ok, false);
  assert.equal(resNeg.error, 'ZERO_OR_NEGATIVE');

  const resNegCent = validateWithdrawal('-0.01', 500);
  assert.equal(resNegCent.ok, false);
  assert.equal(resNegCent.error, 'ZERO_OR_NEGATIVE');

  // Zero amounts
  const resZero = validateWithdrawal('0', 500);
  assert.equal(resZero.ok, false);
  assert.equal(resZero.error, 'ZERO_OR_NEGATIVE');

  const resZeroDecimal = validateWithdrawal('0.00', 500);
  assert.equal(resZeroDecimal.ok, false);
  assert.equal(resZeroDecimal.error, 'ZERO_OR_NEGATIVE');

  // Sub-cent precision (more than 2 decimal places)
  const resSubCent1 = validateWithdrawal('10.005', 500);
  assert.equal(resSubCent1.ok, false);
  assert.equal(resSubCent1.error, 'SUB_CENT');

  const resSubCent2 = validateWithdrawal('10.1234', 500);
  assert.equal(resSubCent2.ok, false);
  assert.equal(resSubCent2.error, 'SUB_CENT');

  // Invalid formats
  const resAlpha = validateWithdrawal('abc', 500);
  assert.equal(resAlpha.ok, false);
  assert.equal(resAlpha.error, 'INVALID_FORMAT');

  const resEmpty = validateWithdrawal('', 500);
  assert.equal(resEmpty.ok, false);
  assert.equal(resEmpty.error, 'INVALID_FORMAT');

  const resMultiDot = validateWithdrawal('12..34', 500);
  assert.equal(resMultiDot.ok, false);
  assert.equal(resMultiDot.error, 'INVALID_FORMAT');
});

test('disallows withdrawal when confirmed balance is unknown or null', () => {
  const { validateWithdrawal } = load();

  const resNull = validateWithdrawal('100.00', null);
  assert.equal(resNull.ok, false);
  assert.equal(resNull.error, 'BALANCE_UNAVAILABLE');

  const resUndef = validateWithdrawal('100.00', undefined);
  assert.equal(resUndef.ok, false);
  assert.equal(resUndef.error, 'BALANCE_UNAVAILABLE');

  const resNan = validateWithdrawal('100.00', NaN);
  assert.equal(resNan.ok, false);
  assert.equal(resNan.error, 'BALANCE_UNAVAILABLE');

  // Stale / unconfirmed balance when isAvailable is false
  const resStale = validateWithdrawal('50.00', 500, false);
  assert.equal(resStale.ok, false);
  assert.equal(resStale.error, 'BALANCE_UNAVAILABLE');
});

test('enforces upper bound against confirmed balance with precision', () => {
  const { validateWithdrawal } = load();

  // Exceeds balance
  const resExceed1 = validateWithdrawal('100.01', 100);
  assert.equal(resExceed1.ok, false);
  assert.equal(resExceed1.error, 'EXCEEDS_BALANCE');

  const resExceed2 = validateWithdrawal('500', 250);
  assert.equal(resExceed2.ok, false);
  assert.equal(resExceed2.error, 'EXCEEDS_BALANCE');

  // Exact balance match
  const resExact1 = validateWithdrawal('100.00', 100);
  assert.equal(resExact1.ok, true);
  assert.equal(resExact1.amount, 100);

  const resExact2 = validateWithdrawal('250.75', 250.75);
  assert.equal(resExact2.ok, true);
  assert.equal(resExact2.amount, 250.75);

  // Within balance
  const resWithin1 = validateWithdrawal('50.25', 100);
  assert.equal(resWithin1.ok, true);
  assert.equal(resWithin1.amount, 50.25);

  const resWithin2 = validateWithdrawal('0.01', 100);
  assert.equal(resWithin2.ok, true);
  assert.equal(resWithin2.amount, 0.01);

  // Arabic numerals within balance
  const resArabic = validateWithdrawal('٥٠٫٢٥', 100);
  assert.equal(resArabic.ok, true);
  assert.equal(resArabic.amount, 50.25);
});

test('validates topup bounds within min and max limits', () => {
  const { validateTopupAmount } = load();

  const resBelow = validateTopupAmount('0.5', 1, 10000);
  assert.equal(resBelow.ok, false);
  assert.equal(resBelow.error, 'BELOW_MIN');

  const resAbove = validateTopupAmount('15000', 1, 10000);
  assert.equal(resAbove.ok, false);
  assert.equal(resAbove.error, 'EXCEEDS_MAX');

  const resSubCent = validateTopupAmount('100.555', 1, 10000);
  assert.equal(resSubCent.ok, false);
  assert.equal(resSubCent.error, 'SUB_CENT');

  const resValid = validateTopupAmount('500', 1, 10000);
  assert.equal(resValid.ok, true);
  assert.equal(resValid.amount, 500);

  const resMax = validateTopupAmount('10000.00', 1, 10000);
  assert.equal(resMax.ok, true);
  assert.equal(resMax.amount, 10000);
});

test('formats confirmed balance with explicit fallback for unknown/unavailable state', () => {
  const { formatConfirmedBalance } = load();
  assert.equal(formatConfirmedBalance(null, 'en-US', 'غير متاح'), 'غير متاح');
  assert.equal(formatConfirmedBalance(undefined), '—');
  assert.equal(formatConfirmedBalance(NaN), '—');
  assert.equal(formatConfirmedBalance(0), '0.00');
  assert.equal(formatConfirmedBalance(1234.5), '1,234.50');
});
