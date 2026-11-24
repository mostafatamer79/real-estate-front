const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const signIn = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'auth', 'SignIn.tsx'),
  'utf8',
);
const globals = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'globals.css'),
  'utf8',
);

assert.match(signIn, /<label htmlFor=\{isPhoneMode \? 'login-phone' : 'login-email'\}/);
assert.match(signIn, /aria-describedby="login-method-note"/);
assert.match(signIn, /role="alert"/);
assert.match(signIn, /aria-selected=\{!isPhoneMode\}/);
assert.match(signIn, /autoComplete="email"/);
assert.match(signIn, /autoComplete="tel"/);
assert.doesNotMatch(signIn, /from "framer-motion"/);
assert.match(signIn, /const validateIdentifier = \(\)/);
assert.match(signIn, /inputRef\.current\?\.focus\(\)/);
assert.match(signIn, /aria-invalid=\{Boolean\(error\)\}/);
assert.doesNotMatch(signIn, /<ChevronDown/);
assert.match(globals, /body\[data-hide-header="true"\].*footer/);

console.log('login page semantic polish contract passed');
