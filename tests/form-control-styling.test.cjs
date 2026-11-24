const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const css = postcss.parse(fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8'));
const fieldRules = [];
css.walkRules(rule => {
  if (rule.nodes.some(node => node.type === 'decl' && node.prop === 'width' && node.value === '100%') &&
      /services-form-root|wallet-page-root|wallet-form-container|wallet-dialog-content|orders-page-root|subscriptions-page-root|offers-page-root|internal-page-root/.test(rule.selector)) {
    fieldRules.push(rule);
  }
});

test('full-width form field rules cannot resize arbitrary cards, consent marks, or submit controls', () => {
  assert.ok(fieldRules.length > 0);
  for (const rule of fieldRules) {
    for (const selector of rule.selectors) {
      assert.match(selector, /\b(?:input|textarea|select)\b|button\[role="combobox"\]/, selector);
      assert.doesNotMatch(selector, /\[class\*=/, selector);
    }
  }
});

test('full-width input rules exclude native checkboxes and radio buttons', () => {
  for (const rule of fieldRules) {
    for (const selector of rule.selectors.filter(selector => /\binput\b/.test(selector))) {
      assert.ok(selector.includes(':not([type="checkbox"])'), selector);
      assert.ok(selector.includes(':not([type="radio"])'), selector);
    }
  }
});
