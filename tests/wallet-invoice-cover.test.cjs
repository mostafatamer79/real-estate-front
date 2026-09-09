const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const invoice = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'invoice.tsx'),
  'utf8'
);

test('wallet invoice uses the watermark-only background behind on-screen content', () => {
  assert.match(invoice, /invoice-modal-backdrop/);
  assert.match(invoice, /invoice-content[\s\S]*invoice-cover-background/);
  assert.match(invoice, /invoice-watermark-layer/);
  assert.match(invoice, /invoice-section-card/);
  assert.match(invoice, /invoice-total-card/);
  assert.match(invoice, /bg-white/);
  assert.match(invoice, /invoice-modal-toolbar/);
  assert.match(invoice, /scroll-smooth/);
});
