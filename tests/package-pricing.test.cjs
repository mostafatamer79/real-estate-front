const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadPricing() {
  const source = fs.readFileSync(path.join(__dirname, '../lib/package-pricing.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {} };
  vm.runInNewContext(code, context);
  return context.exports;
}

test('package previews apply the discount to the selected billing period only', () => {
  const { getPackagePrice, getPackageDiscount } = loadPricing();
  const plan = { monthlyPrice: '100', yearlyPrice: '1000', discount: '10' };
  for (const [scope, period, price, rate] of [
    ['yearly', 'شهري', 100, 0], ['yearly', 'سنوي', 900, 10],
    ['monthly', 'شهري', 90, 10], ['monthly', 'سنوي', 1000, 0],
    ['both', 'شهري', 90, 10], ['both', 'سنوي', 900, 10],
    [undefined, 'شهري', 90, 10], [undefined, 'سنوي', 900, 10],
  ]) {
    const pkg = { ...plan, discountPeriod: scope };
    assert.equal(getPackagePrice(pkg, period), price);
    assert.equal(getPackageDiscount(pkg, period), rate);
  }
});

test('free and zero-discount packages stay correctly priced', () => {
  const { getPackagePrice } = loadPricing();
  assert.equal(getPackagePrice({ monthlyPrice: 0, yearlyPrice: 0, discount: 20, discountPeriod: 'yearly' }, 'شهري'), 0);
  assert.equal(getPackagePrice({ monthlyPrice: 100, yearlyPrice: 1000, discount: 0 }, 'سنوي'), 1000);
});
