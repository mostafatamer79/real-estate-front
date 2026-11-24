const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = fs.readFileSync(require.resolve('../components/services/request-steps.ts'), 'utf8');
const moduleResult = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(moduleResult, moduleResult.exports);

const { getRequestFieldSteps } = moduleResult.exports;

test('legal selectors and their dependencies precede details and consent', () => {
  const fields = [
    { id: 'personal', type: 'divider' },
    { id: 'name', type: 'text', target: 'clientName' },
    { id: 'kind', type: 'select', target: 'metadata.kind' },
    { id: 'contract', type: 'select', options: [{ value: 'sale' }], target: 'metadata.type', visibleWhen: { field: 'kind' } },
    { id: 'otherContract', type: 'text', target: 'metadata.otherType', visibleWhen: { field: 'contract' } },
    { id: 'consent', type: 'terms' },
  ];
  const steps = getRequestFieldSteps(fields, 'legal_contracts');
  assert.deepEqual(fields.map(field => steps.get(field.id)), [1, 1, 0, 0, 1, 2]);
});

test('conditional consent drivers stay together and dependency cycles terminate', () => {
  const fields = [
    { id: 'service', type: 'select', options: [{ value: 'sale' }], target: 'serviceType', visibleWhen: { field: 'variant' } },
    { id: 'variant', type: 'select', visibleWhen: { field: 'service' } },
    { id: 'consent', type: 'terms' },
    { id: 'details', type: 'text', visibleWhen: { field: 'consent' } },
  ];
  const steps = getRequestFieldSteps(fields, 'custom');
  assert.deepEqual(fields.map(field => steps.get(field.id)), [0, 0, 1, 1]);
});
