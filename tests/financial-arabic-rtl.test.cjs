const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const page = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'financial', 'page.tsx'),
  'utf8'
);

test('financial mobile dashboard exposes explicit Arabic RTL layout hooks', () => {
  assert.match(page, /className="financial-tabs-list/);
  assert.match(page, /dir=\{language === 'ar' \? 'rtl' : 'ltr'\}/);
  assert.match(page, /className="financial-kpi-card/);
  assert.match(page, /className="financial-kpi-content/);
});
