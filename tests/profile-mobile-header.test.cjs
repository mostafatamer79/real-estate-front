const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const profilePage = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'profile', 'page.tsx'),
  'utf8'
);

test('profile mobile header hides notifications', () => {
  assert.match(
    profilePage,
    /<MobileAppHeader theme="light" title=\{t\('profile\.title'\)\} onBack=\{handleBack\} \/>/
  );
  assert.doesNotMatch(profilePage, /<MobileAppHeader[^>]*showNotifications/);
});
