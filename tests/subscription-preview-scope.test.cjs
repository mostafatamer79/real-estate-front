const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const dialog = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'subscriptions', 'DepartmentFeaturePreviewDialog.tsx'),
  'utf8'
);
const page = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'subscriptions', 'new', 'page.tsx'),
  'utf8'
);

test('package preview is scoped to the selected package departments', () => {
  assert.match(dialog, /packageAdministrations\?\s*:\s*string\[\]/);
  assert.match(dialog, /PREVIEW_DEPARTMENTS\.filter\(/);
  assert.match(page, /packageAdministrations=\{previewPackage\?\.administrations\}/);
});

test('package preview keeps Arabic text readable on mobile', () => {
  assert.match(dialog, /w-full\s+max-w-\[calc\(100vw-1rem\)\]/);
  assert.match(dialog, /leading-\[1\.9\]/);
  assert.doesNotMatch(dialog, /<DialogTitle[^>]*truncate/);
});
