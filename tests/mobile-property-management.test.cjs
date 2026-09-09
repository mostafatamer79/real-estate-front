const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'buildingmanagement', 'page.tsx'),
  'utf8'
);

test('property management shortcuts use a stable stacked layout on mobile', () => {
  assert.match(page, /className="property-management-card bg-card rounded-\[1\.25rem\] shadow-2xl shadow-stone-400 p-4 sm:p-10/);
  assert.match(page, /className="property-management-tabs bg-muted p-1\.5 rounded-2xl flex flex-col sm:flex-row sm:flex-wrap gap-1/);
  assert.match(page, /className={`w-full sm:w-auto justify-center px-3 sm:px-6 py-2\.5/);
});
