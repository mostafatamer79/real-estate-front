const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/cinematic-route-family.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const { cinematicRouteFamily } = context.exports;

function routePages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? routePages(file) : entry.name === 'page.tsx' ? [file] : [];
  });
}

test('the selected design covers every application route without changing its path', () => {
  const app = path.join(__dirname, '../app');
  const routes = routePages(app).map(file => {
    const route = '/' + path.relative(app, path.dirname(file)).replaceAll(path.sep, '/');
    return route === '/.' ? '/' : route;
  });
  const families = new Set(['public', 'browse', 'workspace', 'support', 'admin', 'internal', 'auth']);
  assert.ok(routes.length >= 69);
  for (const route of routes) assert.ok(families.has(cinematicRouteFamily(route)), route);
  assert.equal(cinematicRouteFamily('/'), 'public');
  assert.equal(cinematicRouteFamily('/offers/[id]'), 'browse');
  assert.equal(cinematicRouteFamily('/admin/users'), 'admin');
  assert.equal(cinematicRouteFamily('/internal/[dept]/requests'), 'internal');
  assert.equal(cinematicRouteFamily('/login'), 'auth');
});
