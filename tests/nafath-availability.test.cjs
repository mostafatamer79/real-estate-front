const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');

test('unconfigured Nafath shows its availability and cannot start identity verification', async () => {
  let index = 0;
  const state = [false, false, ''];
  const requests = [];
  const react = { useState: () => [state[index++], () => {}], useRef: x => ({ current: x }), useEffect: () => {} };
  const imports = {
    react, 'react/jsx-runtime': jsx,
    '@/context/LanguageContext': { useLanguage: () => ({ language: 'en' }) },
    '@/lib/api': { post: async (...args) => requests.push(args) },
  };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../components/profile/NafathVerification.tsx'), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { exports: {}, require: name => imports[name] || new Proxy({}, { get: (_, key) => key }) };
  vm.runInNewContext(code, context);
  const root = context.exports.default({ userId: 'fixture-user', onVerified() {} });
  const elements = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (node && typeof node === 'object') { elements.push(node); visit(node.props?.children); }
  }
  visit(root);
  const button = elements.find(x => x.type === 'Button');
  assert.equal(button.props.disabled, true);
  assert.equal(elements.some(x => x.props?.role === 'status' && x.props.children.includes('currently unavailable')), true);
  await button.props.onClick();
  assert.deepEqual(requests, []);
});
