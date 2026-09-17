const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageWrapper = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'PageWrapper.tsx'),
  'utf8'
);

test('Nafath login is available without an existing platform session', () => {
  assert.match(pageWrapper, /['"]\/nafath-login['"]/);
});
