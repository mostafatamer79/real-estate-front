const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function load(file) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require, Date });
  return module.exports;
}
test('license status requires evidence and agrees with review and expiry', () => {
  const { getLicenseState } = load('lib/license-state.ts');
  const now = new Date('2026-11-06T12:00:00Z');
  assert.equal(getLicenseState({ agentVerificationStatus: 'pending' }, now), 'missing');
  assert.equal(getLicenseState({ agentVerificationStatus: 'verified' }, now), 'missing');
  assert.equal(getLicenseState({ licenseDocument: 'license.pdf', agentVerificationStatus: 'pending' }, now), 'pending');
  assert.equal(getLicenseState({ licenseDocument: 'license.pdf', agentVerificationStatus: 'verified', falLicenseExpiry: '2026-11-05' }, now), 'expired');
  assert.equal(getLicenseState({ licenseDocument: 'license.pdf', agentVerificationStatus: 'verified', falLicenseExpiry: '2027-01-01' }, now), 'verified');
  assert.equal(getLicenseState({ licenseDocument: 'license.pdf', agentVerificationStatus: 'rejected' }, now), 'rejected');
});
test('service renames retain the original submitted value and historical price key', () => {
  const c = load('lib/service-catalog.ts');
  const changes = [{ id: 'base-gas', category: 'postPurchase', name: 'الغاز', displayName: 'خدمات الغاز', status: 'enabled' }];
  assert.equal(c.getServiceDisplayName('postPurchase', 'الغاز', changes), 'خدمات الغاز');
  assert.ok(c.getServiceNamesForCategory('postPurchase', changes).includes('الغاز'));
  assert.ok(!c.getServiceNamesForCategory('postPurchase', changes).includes('خدمات الغاز'));
  const removed = [{ ...changes[0], deleted: true }];
  assert.ok(!c.getServiceNamesForCategory('postPurchase', removed).includes('الغاز'));
  assert.equal(c.makeServicePriceKey('postPurchase', 'الغاز'), 'service_price_postpurchase_الغاز');
});
test('legal subservice labels update without changing conditional form values', () => {
  const { applyCatalogToForm } = load('lib/service-catalog.ts');
  const def = { version: 1, fields: [{ id: 'disputeType', type: 'select', target: 'metadata.disputeType', options: [{ value: 'اخرى', label: 'اخرى' }, { value: 'نزاعات الملكية', label: 'نزاعات الملكية' }] }] };
  const result = applyCatalogToForm(def, 'legal_disputes', [{ id: 'other', category: 'legal_disputes', name: 'أخرى', displayName: 'موضوع آخر', status: 'enabled' }, { id: 'ownership', category: 'legal_disputes', name: 'نزاعات الملكية', status: 'disabled', deleted: true }]);
  assert.equal(result.fields[0].options.length, 1);
  assert.equal(result.fields[0].options[0].value, 'اخرى');
  assert.equal(result.fields[0].options[0].label, 'موضوع آخر');
});
