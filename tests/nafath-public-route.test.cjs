const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name =>
  fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('Nafath verification is offered on the profile instead of login', () => {
  assert.doesNotMatch(
    read('app/login/page.tsx'),
    /\/nafath-login|تسجيل الدخول عبر نفاذ/
  );

  assert.match(
    read('app/profile/page.tsx'),
    /NafathVerification/
  );

  assert.doesNotMatch(
    read('app/profile/page.tsx'),
    /mockNationalId|send-otp|\/user\/nafath\/verify/
  );
});

test('incomplete profiles do not prevent signed-in browsing', () => {
  assert.doesNotMatch(
    read('app/src/components/PageWrapper.tsx'),
    /needsProfileCompletion/
  );
});

test('legacy Nafath login links redirect to the profile', () => {
  assert.match(
    read('app/nafath-login/page.tsx'),
    /redirect\(['"]\/profile['"]\)/
  );
});