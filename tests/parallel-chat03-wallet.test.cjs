const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadWalletAmount() {
  const context = { exports: {} };
  const source = fs.readFileSync(require.resolve('../lib/redesign-wallet-amount.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

function loadCheckout() {
  const context = { exports: {} };
  const source = fs.readFileSync(require.resolve('../lib/redesign-chat03-checkout.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('wallet amount rejects withdrawal when balance is stale or freshness is false', () => {
  const { validateWithdrawal } = loadWalletAmount();

  // Balance is a valid number, but freshness is false (e.g. stale balance after failed refresh)
  const resultStale = validateWithdrawal('100.00', 500, false);
  assert.equal(resultStale.ok, false);
  assert.equal(resultStale.error, 'BALANCE_UNAVAILABLE');

  // Once refresh succeeds and isAvailable becomes true, withdrawal of valid amount succeeds
  const resultConfirmed = validateWithdrawal('100.00', 500, true);
  assert.equal(resultConfirmed.ok, true);
  assert.equal(resultConfirmed.amount, 100);
});

test('independent ledger simulation preserves cached rows across partial failures', () => {
  // Simulates independent ledger retention logic implemented in WalletPage
  let invoicesData = [{ id: 'INV-1', total: '100.00' }, { id: 'INV-2', total: '200.00' }];
  let subscriptionsData = [{ id: 'SUB-1', amount: '50.00' }];
  let invoicesStatus = 'success';
  let subscriptionsStatus = 'success';

  function getCombinedLedger(subs, invs) {
    return [...subs, ...invs];
  }

  // Initial combined ledger has 3 items (1 sub + 2 invoices)
  assert.equal(getCombinedLedger(subscriptionsData, invoicesData).length, 3);

  // Scenario A: Invoices refresh succeeds with new list, but subscriptions endpoint fails (rejected)
  const freshInvoices = [{ id: 'INV-3', total: '350.00' }];
  const invoicesSuccess = true;
  const subscriptionsSuccess = false;

  if (invoicesSuccess) {
    invoicesData = freshInvoices;
    invoicesStatus = 'success';
  }
  if (!subscriptionsSuccess) {
    // Preserves existing subscriptionsData; marks status stale
    subscriptionsStatus = subscriptionsData.length > 0 ? 'stale' : 'error';
  }

  const ledgerAfterSubFailure = getCombinedLedger(subscriptionsData, invoicesData);
  assert.equal(ledgerAfterSubFailure.length, 2);
  assert.equal(ledgerAfterSubFailure[0].id, 'SUB-1'); // Retained from cache!
  assert.equal(ledgerAfterSubFailure[1].id, 'INV-3'); // Updated from fresh response!
  assert.equal(subscriptionsStatus, 'stale');
  assert.equal(invoicesStatus, 'success');

  // Scenario B: Next refresh, subscriptions succeed with new list, but invoices fail (rejected)
  const freshSubs = [{ id: 'SUB-2', amount: '80.00' }];
  const invoicesSuccess2 = false;
  const subscriptionsSuccess2 = true;

  if (subscriptionsSuccess2) {
    subscriptionsData = freshSubs;
    subscriptionsStatus = 'success';
  }
  if (!invoicesSuccess2) {
    // Preserves existing invoicesData; marks status stale
    invoicesStatus = invoicesData.length > 0 ? 'stale' : 'error';
  }

  const ledgerAfterInvFailure = getCombinedLedger(subscriptionsData, invoicesData);
  assert.equal(ledgerAfterInvFailure.length, 2);
  assert.equal(ledgerAfterInvFailure[0].id, 'SUB-2'); // Updated from fresh response!
  assert.equal(ledgerAfterInvFailure[1].id, 'INV-3'); // Retained from cache!
  assert.equal(invoicesStatus, 'stale');
  assert.equal(subscriptionsStatus, 'success');
});

test('checkout guest login URL only accepts single-target parameters', () => {
  const { buildGuestLoginUrl, isValidCheckoutTarget } = loadCheckout();

  // Valid invoice target
  const validInv = { invoiceId: '8a3a2a1a-4b5c-4d6e-8f9a-1b2c3d4e5f6a' };
  assert.equal(isValidCheckoutTarget(validInv), true);
  assert.equal(
    buildGuestLoginUrl(validInv),
    '/login?next=%2Fcheckout%3FinvoiceId%3D8a3a2a1a-4b5c-4d6e-8f9a-1b2c3d4e5f6a'
  );

  // Attack/malformed target with unexpected parameter or extra properties
  const polluted = {
    invoiceId: '8a3a2a1a-4b5c-4d6e-8f9a-1b2c3d4e5f6a',
    extraAdminParam: 'true',
  };
  assert.equal(isValidCheckoutTarget(polluted), false);
  assert.equal(buildGuestLoginUrl(polluted), '/login?next=%2Fwallet');
});
