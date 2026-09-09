const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const footer = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'Footer.tsx'),
  'utf8'
);

test('mobile footer exposes desktop-style contact details', () => {
  assert.match(footer, /className="mobile-contact-block/);
  assert.match(footer, /\{t\("footer\.contact"\)\}/);
  assert.match(footer, /href={`mailto:\$\{settings\.contactEmail\}`}/);
  assert.match(footer, /settings\.contactTwitter/);
});
