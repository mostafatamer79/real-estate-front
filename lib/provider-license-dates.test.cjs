const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname, 'provider-license-dates.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
const { validLicenseDate, licenseDatesError, formatLicenseDate, providerLicenseExpired } = context.exports;
test('real Gregorian dates, leap years and order', () => {
  assert.equal(validLicenseDate('2024-02-29'), true);
  for (const value of ['2026-02-29', '2026-04-31', '0000-01-01', '2026-1-01', null]) assert.equal(validLicenseDate(value), false);
  assert.equal(licenseDatesError({}), '');
  assert.equal(licenseDatesError({ licenseIssueDate: '2024-02-29' }), '');
  assert.ok(licenseDatesError({ licenseIssueDate: '2027-01-01', licenseExpiryDate: '2026-01-01' }));
});
test('honest calendar labels and absent/invalid display without rollover', () => {
  assert.equal(formatLicenseDate(undefined, false), 'Not provided');
  assert.equal(formatLicenseDate('2026-02-30', false), 'Invalid date');
  const output = formatLicenseDate('2026-11-12', false);
  assert.match(output, /2026-11-12.*Gregorian/);
  assert.match(output, /1448.*Hijri, converted/);
  assert.match(formatLicenseDate('2026-11-12', true), /هجري محوّل/);
});
test('Saudi midnight expiry and legacy compatibility', () => {
  assert.equal(providerLicenseExpired({}, new Date('2026-11-12T21:00:00Z')), false);
  const profile = { licenseExpiryDate: '2026-11-12' };
  assert.equal(providerLicenseExpired(profile, new Date('2026-11-12T20:59:59Z')), false);
  assert.equal(providerLicenseExpired(profile, new Date('2026-11-12T21:00:00Z')), true);
});
