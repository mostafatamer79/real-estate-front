const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageWrapper = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'PageWrapper.tsx'),
  'utf8'
);

test('the shared page wrapper does not render a back button', () => {
  assert.doesNotMatch(pageWrapper, /aria-label=\{language === "ar" \? "رجوع" : "Back"\}/);
  assert.doesNotMatch(pageWrapper, /<ArrowLeft/);
});
