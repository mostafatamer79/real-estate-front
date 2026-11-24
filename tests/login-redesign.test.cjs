const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const signInSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'auth', 'SignIn.tsx'),
  'utf8',
);
const cssSource = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'auth', 'sign-in.module.css'),
  'utf8',
);

test('SignIn passes AbortController signal to fetchWithTimeout', () => {
  assert.match(signInSource, /signal:\s*controller\.signal/);
  assert.match(signInSource, /pendingRequest\.current\?\.abort\(\)/);
});

test('SignIn does not log user identifier, sensitive payload, or credentials', () => {
  assert.doesNotMatch(signInSource, /console\.(log|error|warn)\([^)]*(payload|userIdentifier|phone|email|token)/i);
});

test('SignIn tablist provides keyboard ARIA, roving tabIndex and input preservation', () => {
  assert.match(signInSource, /role="tablist"/);
  assert.match(signInSource, /role="tab"/);
  assert.match(signInSource, /tabIndex=\{!isPhoneMode \? 0 : -1\}/);
  assert.match(signInSource, /tabIndex=\{isPhoneMode \? 0 : -1\}/);
  assert.match(signInSource, /handleTabKeyDown/);
  // User input preserved on mode toggle: phone/email not erased
  assert.doesNotMatch(signInSource, /setIsPhoneMode\([^)]*\);\s*(setPhone\(""\)|setEmail\(""\))/);
});

test('SignIn Back action handles direct entry by falling back to root', () => {
  assert.match(signInSource, /const handleBack =/);
  assert.match(signInSource, /router\.push\('\/'\)/);
});

test('SignIn Close action avoids protected login loops when redirecting', () => {
  assert.match(signInSource, /const handleClose =/);
  assert.match(signInSource, /safeReturnTo/);
  assert.match(signInSource, /publicLoginExit\(returnTo\)/);
});

test('SignIn mounts the selected SVG service doorway without a borrowed backdrop', () => {
  assert.match(signInSource, /<LoginServiceDoor\s*\/>/);
  assert.doesNotMatch(signInSource, /login-gateway-v1/);
  assert.match(signInSource, /styles\.architecturalShowcase/);
  // The mobile showcase must stretch inside the centered flex column.
  assert.match(cssSource, /@media \(max-width: 1023px\)\s*\{\s*\.architecturalShowcase\s*\{\s*width: 100%/);
  assert.doesNotMatch(signInSource, /trusted by \d+|100% guarantee|\d+ sold|\d+ reviews/i);
});

test('sign-in.module.css defines scoped pearl, navy, and gold palette coherent with /details', () => {
  assert.match(cssSource, /--login-bg:\s*#f5f4f0/);
  assert.match(cssSource, /--login-navy:\s*#0b192c/);
  assert.match(cssSource, /--login-gold:\s*#c5a880/);
  assert.match(cssSource, /:global\(\.dark\)/);
  assert.match(cssSource, /min-height:\s*44px/);
  assert.match(cssSource, /min-height:\s*52px/);
  assert.match(cssSource, /prefers-reduced-motion/);
});
