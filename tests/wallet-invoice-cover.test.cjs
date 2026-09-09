const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const invoice = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'invoice.tsx'),
  'utf8'
);

test('wallet invoice exports every page without the unsupported CSS parser', () => {
  assert.match(invoice, /invoice-modal-backdrop/);
  assert.match(invoice, /invoice-content[\s\S]*invoice-cover-background/);
  assert.match(invoice, /invoice-watermark-layer/);
  assert.match(invoice, /opacity-\[0\.14\]/);
  assert.match(invoice, /brightness-0/);
  assert.match(invoice, /bg-transparent/);
  assert.match(invoice, /import \{ toPng \} from 'html-to-image';/);
  assert.doesNotMatch(invoice, /html2canvas/);
  assert.match(invoice, /toPng\(invoiceElement/);
  assert.match(invoice, /cacheBust: true/);
  assert.match(invoice, /backgroundColor: '#ffffff'/);
  assert.match(invoice, /style\.height = `\$\{invoiceElement\.scrollHeight\}px`/);
  assert.match(invoice, /maxHeight = 'none'/);
  assert.match(invoice, /overflow = 'visible'/);
  assert.match(invoice, /pageHeightPx/);
  assert.match(invoice, /pageCount/);
  assert.match(invoice, /pdf\.addPage\(\)/);
  assert.match(invoice, /finally \{[\s\S]*pdf-mode/);
  assert.match(invoice, /invoice-section-card/);
  assert.match(invoice, /invoice-total-card/);
  assert.match(invoice, /bg-white/);
  assert.match(invoice, /invoice-modal-toolbar/);
  assert.match(invoice, /scroll-smooth/);
});
