const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const invoice = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'invoice.tsx'),
  'utf8'
);

test('wallet invoice uses the cover image behind the on-screen content', () => {
  assert.match(invoice, /invoice-modal-backdrop/);
  assert.match(invoice, /invoice-content[\s\S]*invoice-cover-background/);
  assert.match(invoice, /backgroundImage: "url\('\/cover\.jpeg'\)"/);
  assert.match(invoice, /backgroundPosition: 'center -96px'/);
  assert.match(invoice, /backgroundAttachment: 'local'/);
  assert.match(invoice, /invoice-modal-toolbar/);
  assert.match(invoice, /scroll-smooth/);
});
