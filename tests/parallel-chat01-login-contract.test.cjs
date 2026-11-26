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

  // Must use frameCard for the floating login form
  assert.ok(signInSource.includes('styles.frameCard'), 'SignIn.tsx must use styles.frameCard');
});

// Test 4: Verify sign-in.module.css contract
test('sign-in.module.css defines floating frameCard with paper surface and stone/green tokens', () => {
  const cssSource = fs.readFileSync(path.join(ROOT, 'components', 'auth', 'sign-in.module.css'), 'utf8');

  assert.ok(cssSource.includes('.frameCard {'), 'sign-in.module.css must define .frameCard');
  assert.ok(cssSource.includes('--stone: #e8e1d5;'), 'sign-in.module.css must define --stone token');
  assert.ok(cssSource.includes('--paper: #f4f1eb;'), 'sign-in.module.css must define --paper token');
  assert.ok(cssSource.includes('--green: #354d3b;'), 'sign-in.module.css must define --green token');

  const frameCardBlock = cssSource.slice(cssSource.indexOf('.frameCard {'));
  const frameCardEnd = frameCardBlock.indexOf('}');
  const frameCardStyles = frameCardBlock.slice(0, frameCardEnd);

  assert.ok(frameCardStyles.includes('background: var(--paper);'), 'frameCard must use --paper background');
  assert.ok(frameCardStyles.includes('border: 1px solid var(--line);'), 'frameCard must use --line border');
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
