const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const catalog = fs.readFileSync(path.join(__dirname, '..', 'lib', 'service-catalog.ts'), 'utf8');
const servicesPage = fs.readFileSync(path.join(__dirname, '..', 'app', 'services', 'page.tsx'), 'utf8');
const adminPage = fs.readFileSync(path.join(__dirname, '..', 'app', 'admin', 'services', 'page.tsx'), 'utf8');

test('leasing and visit are removed from public and admin service catalogs', () => {
  assert.doesNotMatch(catalog, /\n\s*leasing:/);
  assert.doesNotMatch(catalog, /\n\s*visit:/);
  assert.doesNotMatch(servicesPage, /id: "leasing"/);
  assert.doesNotMatch(servicesPage, /id: "visit"/);
  assert.doesNotMatch(adminPage, /id: "leasing"/);
  assert.doesNotMatch(adminPage, /id: "visit"/);
  assert.doesNotMatch(adminPage, /value="leasing"/);
  assert.doesNotMatch(adminPage, /value="visit"/);
});
