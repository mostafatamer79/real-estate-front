const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.join(__dirname, '..', 'components', 'properties', 'BuildingManagementWorkspace.tsx'),
  'utf8'
);

test('property management shortcuts use a stable stacked layout on mobile', () => {
  assert.match(page, /className="[^"]*\bproperty-management-card[^"]* p-4 sm:p-10/);
  assert.match(page, /className="[^"]*\bproperty-management-tabs bg-muted p-1\.5 rounded-2xl flex flex-col sm:flex-row sm:flex-wrap gap-1/);
  assert.match(page, /className={`w-full sm:w-auto justify-center px-3 sm:px-6 py-2\.5/);
});
