const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const profilePage = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'profile', 'page.tsx'),
  'utf8'
);

test('profile does not enable extra page-level notifications', () => {
  assert.doesNotMatch(profilePage, /<MobileAppHeader[^>]*showNotifications/);
});
