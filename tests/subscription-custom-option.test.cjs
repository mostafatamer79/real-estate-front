const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const subscriptionsPage = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'subscriptions', 'new', 'page.tsx'),
  'utf8'
);

test('subscription page does not render the custom subscription option', () => {
  assert.doesNotMatch(subscriptionsPage, />\s*اشتراك مخصص\s*<\/button>/);
});
