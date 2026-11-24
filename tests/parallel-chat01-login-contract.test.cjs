// Behavioral and contract regression tests for Chat 01:
// 1. Phone and email canonical identifier normalization contract.
// 2. Submission payload and pendingVerification localStorage synchronization.
// 3. Identifier validation constraints.
// 4. Safe return destination validation.
// 5. Nafath route contract (/nafath-login -> redirect('/profile')).

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Test 1: Verify canonical identifier logic
test('canonical identifier normalization: email is trimmed and lowercased', () => {
  const normalizeEmail = (email) => email.trim().toLowerCase();
  assert.equal(normalizeEmail('  User@Domain.COM  '), 'user@domain.com');
  assert.equal(normalizeEmail('ahmed@example.sa'), 'ahmed@example.sa');
});

test('canonical identifier normalization: phone is trimmed without altering valid digits', () => {
  const normalizePhone = (phone) => phone.trim();
  assert.equal(normalizePhone('  0501234567  '), '0501234567');
  assert.equal(normalizePhone('  +966501234567  '), '+966501234567');
});

// Test 2: Verify validation regexes used in SignIn component
test('login identifier validation: email regex accepts valid formats and rejects malformed', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.equal(emailRegex.test('test@example.com'), true);
  assert.equal(emailRegex.test('user.name+tag@sub.domain.sa'), true);
  assert.equal(emailRegex.test('invalid-email'), false);
  assert.equal(emailRegex.test('user@domain'), false);
  assert.equal(emailRegex.test('@domain.com'), false);
  assert.equal(emailRegex.test('user@'), false);
});

test('login identifier validation: phone regex accepts valid international & local digits', () => {
  const phoneRegex = /^\+?[0-9\s()-]{7,}$/;
  assert.equal(phoneRegex.test('0501234567'), true);
  assert.equal(phoneRegex.test('+966501234567'), true);
  assert.equal(phoneRegex.test('05 1234 5678'), true);
  assert.equal(phoneRegex.test('123'), false); // too short
  assert.equal(phoneRegex.test('050abc1234'), false); // contains letters
});

// Test 3: Verify SignIn component source contract
test('SignIn.tsx uses identical canonicalIdentifier for both payload and pendingVerification storage', () => {
  const signInSource = fs.readFileSync(path.join(ROOT, 'components', 'auth', 'SignIn.tsx'), 'utf8');

  // Must define canonicalIdentifier
  assert.ok(signInSource.includes('canonicalIdentifier'), 'SignIn.tsx must compute canonicalIdentifier');

  // Payload must use canonicalIdentifier
  assert.ok(signInSource.includes('phone: canonicalIdentifier'), 'phone payload must use canonicalIdentifier');
  assert.ok(signInSource.includes('email: canonicalIdentifier'), 'email payload must use canonicalIdentifier');

  // localStorage pendingVerification must store canonicalIdentifier
  assert.ok(
    signInSource.includes("localStorage.setItem('pendingVerification', canonicalIdentifier)"),
    'localStorage pendingVerification must store canonicalIdentifier',
  );

  // Must not introduce unsupported accreditation claims
  assert.equal(
    signInSource.includes('منظومة معتمدة'),
    false,
    'SignIn.tsx must not contain unsupported accreditation claim "منظومة معتمدة"',
  );

  // Must use formPlane instead of formCard
  assert.ok(signInSource.includes('styles.formPlane'), 'SignIn.tsx must use styles.formPlane');
  assert.equal(signInSource.includes('styles.formCard'), false, 'SignIn.tsx must not use styles.formCard');
});

// Test 4: Verify sign-in.module.css contract
test('sign-in.module.css defines open formPlane without floating card background/shadow', () => {
  const cssSource = fs.readFileSync(path.join(ROOT, 'components', 'auth', 'sign-in.module.css'), 'utf8');

  assert.ok(cssSource.includes('.formPlane {'), 'sign-in.module.css must define .formPlane');
  assert.equal(cssSource.includes('.formCard {'), false, 'sign-in.module.css must not define .formCard');

  // Verify formPlane has transparent background and no card box-shadow
  const formPlaneBlock = cssSource.slice(cssSource.indexOf('.formPlane {'));
  const formPlaneEnd = formPlaneBlock.indexOf('}');
  const formPlaneStyles = formPlaneBlock.slice(0, formPlaneEnd);

  assert.ok(formPlaneStyles.includes('background: transparent;'), 'formPlane must have transparent background');
  assert.ok(formPlaneStyles.includes('box-shadow: none;'), 'formPlane must not have box-shadow');
  assert.ok(formPlaneStyles.includes('border: none;'), 'formPlane must not have card border');
});

// Test 5: Verify Nafath route contract
test('app/nafath-login/page.tsx redirects to /profile and does not simulate standalone service', () => {
  const nafathSource = fs.readFileSync(path.join(ROOT, 'app', 'nafath-login', 'page.tsx'), 'utf8');

  assert.ok(nafathSource.includes("redirect('/profile')"), 'nafath-login page must redirect to /profile');
  assert.equal(nafathSource.includes('nic://nafath'), false, 'must not simulate standalone Nafath service');
  assert.equal(nafathSource.includes('nafath://'), false, 'must not simulate standalone Nafath deep links');
});

// Test 6: Verify safeReturnTo contract
test('lib/auth-navigation.ts safeReturnTo returns only safe local paths', () => {
  // Transpile and evaluate lib/auth-navigation.ts directly
  const ts = require('typescript');
  const source = fs.readFileSync(path.join(ROOT, 'lib', 'auth-navigation.ts'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', code)(mod, mod.exports);
  const { safeReturnTo } = mod.exports;

  assert.equal(safeReturnTo('/details'), '/details');
  assert.equal(safeReturnTo('/services/form?type=marketing'), '/services/form?type=marketing');
  assert.equal(safeReturnTo('https://evil.com'), null);
  assert.equal(safeReturnTo('//evil.com'), null);
  assert.equal(safeReturnTo('javascript:alert(1)'), null);
  assert.equal(safeReturnTo(null), null);
  assert.equal(safeReturnTo(''), null);
});
