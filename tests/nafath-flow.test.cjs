const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const jsx = require('react/jsx-runtime');

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const pending = () => ({ userId: 'user-1', requestId: 'request-1', clientSecret: 'secret', url: 'https://www.iam.sa/authservice/authorize', expiresAt: new Date(Date.now() + 60000).toISOString() });

// Exercise the real component with controlled React scheduling and browser/network boundaries.
function mount({ language = 'en', stored, get, post, verifiedAt, search = '' } = {}) {
  const hooks = [], effects = [], storage = new Map(stored ? [['nafath-profile-verification', JSON.stringify(stored)]] : []);
  const requests = [], redirects = [], updates = [], timers = new Map();
  let cursor = 0, dirty = true, tree, timerId = 0;
  const react = {
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial; return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; dirty = true; }]; },
    useRef(initial) { const i = cursor++; return hooks[i] ||= { current: initial }; },
    useEffect(fn, deps) { const i = cursor++; const prev = hooks[i]; if (!prev || deps.some((d, n) => d !== prev.deps[n])) { effects.push(() => { prev?.cleanup?.(); hooks[i] = { deps, cleanup: fn() }; }); } },
  };
  const api = {
    async get(path, options) { requests.push({ method: 'get', path, options }); if (get) { const r = await get(path, options); if (r !== undefined) return r; } return { data: path.includes('availability') ? { configured: true } : path.includes('status') ? { status: 'WAITING' } : { id: 'user-1', nafathVerifiedAt: verifiedAt } }; },
    async post(path, body, options) { requests.push({ method: 'post', path, body, options }); return post ? post(path, body, options) : { data: pending() }; },
  };
  const imports = { react, 'react/jsx-runtime': jsx, '@/lib/api': api, '@/context/LanguageContext': { useLanguage: () => ({ language }) } };
  const module = { exports: {} };
  const location = { pathname: '/profile', search, assign: value => redirects.push(value) };
  const context = { module, exports: module.exports, require: name => imports[name] || new Proxy({}, { get: (_, key) => key }), URL, URLSearchParams, AbortController, Date,
    sessionStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    window: { location, history: { replaceState: (_, __, url) => { location.search = new URL(url, 'https://example.test').search; } } },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id),
  };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../components/profile/NafathVerification.tsx'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, context);
  function render() { cursor = 0; dirty = false; tree = module.exports.default({ userId: 'user-1', verifiedAt, onVerified: p => updates.push(p) }); effects.splice(0).forEach(fn => fn()); }
  function nodes() { const out = []; const visit = n => { if (Array.isArray(n)) n.forEach(visit); else if (n && typeof n === 'object') { out.push(n); visit(n.props?.children); } }; visit(tree); return out; }
  function text(n) { if (Array.isArray(n)) return n.map(text).join(' '); return n && typeof n === 'object' ? text(n.props?.children) : typeof n === 'string' || typeof n === 'number' ? String(n) : ''; }
  async function settle() { for (let i = 0; i < 10; i++) { await new Promise(setImmediate); if (dirty) render(); } }
  render();
  return { requests, redirects, storage, updates, timers, settle, text: () => text(tree), nodes,
    button: label => nodes().find(n => n.type === 'Button' && text(n).includes(label)),
    async tick() { const fns = [...timers.values()]; timers.clear(); await Promise.all(fns.map(fn => fn())); await settle(); },
    unmount() { hooks.forEach(h => h?.cleanup?.()); },
  };
}

test('availability loading is distinct from service unavailable', async () => {
  const availability = deferred();
  const app = mount({ get: path => path.includes('availability') ? availability.promise : undefined });
  assert.match(app.text(), /Checking Nafath availability/);
  assert.doesNotMatch(app.text(), /currently unavailable/);
  availability.resolve({ data: { configured: true } }); await app.settle();
  assert.match(app.text(), /Continue to Nafath/); app.unmount();
});

test('double-click starts one request and cancellation ignores a late session response', async () => {
  const session = deferred(); const app = mount({ post: () => session.promise }); await app.settle();
  const start = app.button('Continue to Nafath'); assert.ok(start);
  const first = start.props.onClick(); const second = start.props.onClick(); await app.settle();
  assert.equal(app.requests.filter(r => r.path.endsWith('/request')).length, 1);
  await app.button('Cancel').props.onClick(); await app.settle();
  session.resolve({ data: pending() }); await Promise.all([first, second]); await app.settle();
  assert.equal(app.redirects.length, 0); assert.equal(app.storage.size, 0); app.unmount();
});

test('cancel stops polling and ignores an in-flight completion result', async () => {
  const status = deferred(); const app = mount({ stored: pending(), get: path => path.endsWith('/status') ? status.promise : undefined }); await app.settle();
  await app.button('Cancel').props.onClick(); await app.settle();
  const updates = app.updates.length;
  status.resolve({ data: { status: 'COMPLETED' } }); await app.settle();
  assert.equal(app.updates.length, updates); assert.equal(app.timers.size, 0); assert.equal(app.storage.size, 0); app.unmount();
});

for (const language of ['en', 'ar']) {
  test(`${language}: rejection and expiry have distinct recovery messages`, async () => {
    for (const status of ['REJECTED', 'EXPIRED']) {
      const app = mount({ language, stored: pending(), get: path => path.endsWith('/status') ? { data: { status } } : undefined }); await app.settle();
      assert.match(app.text(), status === 'REJECTED' ? (language === 'ar' ? /رفض/ : /declined/) : (language === 'ar' ? /انتهت/ : /expired/));
      assert.equal(app.storage.size, 0); assert.equal(app.timers.size, 0); app.unmount();
    }
  });
}

test('a verified profile clears stale pending verification without polling', async () => {
  const app = mount({ stored: pending(), get: path => path.endsWith('/profile') ? { data: { id: 'user-1', nafathVerifiedAt: '2026-11-08T12:00:00Z' } } : undefined }); await app.settle();
  assert.equal(app.requests.filter(r => r.path.endsWith('/status')).length, 0);
  assert.equal(app.storage.size, 0); assert.match(app.text(), /Verified through Nafath/); app.unmount();
});

test('temporary status failure offers a status retry without creating a second session', async () => {
  let attempts = 0;
  const app = mount({ stored: pending(), get: path => { if (path.endsWith('/status')) { if (++attempts === 1) throw new Error('offline'); return { data: { status: 'COMPLETED' } }; } if (path.endsWith('/profile') && attempts > 1) return { data: { id: 'user-1', nafathVerifiedAt: '2026-11-08T12:00:00Z' } }; } });
  await app.settle(); const retry = app.button('Check verification status'); assert.ok(retry);
  await retry.props.onClick(); await app.settle();
  assert.equal(app.requests.filter(r => r.path.endsWith('/request')).length, 0);
  assert.equal(app.storage.size, 0); assert.match(app.text(), /Verified through Nafath/); app.unmount();
});

test('retry after profile refresh failure returns to the start step when no attempt exists', async () => {
  let attempts = 0;
  const app = mount({ get: path => { if (path.endsWith('/profile') && ++attempts === 1) throw new Error('offline'); } });
  await app.settle(); await app.button('Check verification status').props.onClick(); await app.settle();
  assert.ok(app.button('Continue to Nafath')); assert.equal(app.button('Cancel'), undefined); app.unmount();
});

test('unmount during session creation prevents late navigation and storage writes', async () => {
  const session = deferred(); const app = mount({ post: () => session.promise }); await app.settle();
  const start = app.button('Continue to Nafath').props.onClick(); app.unmount();
  session.resolve({ data: pending() }); await start;
  assert.equal(app.redirects.length, 0); assert.equal(app.storage.size, 0);
});

test('a fresh attempt saves the session before redirect and can resume it', async () => {
  const app = mount(); await app.settle(); await app.button('Continue to Nafath').props.onClick(); await app.settle();
  assert.equal(app.redirects.length, 1);
  const saved = JSON.parse(app.storage.get('nafath-profile-verification'));
  assert.equal(saved.userId, 'user-1'); assert.equal(saved.url, app.redirects[0]);
  assert.ok(app.button('Continue to Nafath')); app.unmount();
});

test('returned state is exchanged and success requires a verified server profile', async () => {
  let completed = false;
  const app = mount({ stored: pending(), search: '?state=provider-state&keep=value', post: path => { if (path.endsWith('/complete')) completed = true; return { data: true }; }, get: path => {
    if (path.endsWith('/status')) return { data: { status: 'COMPLETED' } };
    if (path.endsWith('/profile') && completed) return { data: { id: 'user-1', nafathVerifiedAt: '2026-11-08T12:00:00Z' } };
  } });
  await app.settle();
  assert.equal(app.requests.find(r => r.path.endsWith('/complete')).body.state, 'provider-state');
  assert.match(app.text(), /Verified through Nafath/); assert.equal(app.storage.size, 0); app.unmount();
});

test('cancel clears the next scheduled poll immediately', async () => {
  const app = mount({ stored: pending() }); await app.settle();
  assert.equal(app.timers.size, 1);
  await app.button('Cancel').props.onClick(); await app.settle();
  assert.equal(app.timers.size, 0); app.unmount();
});

test('a completion response alone never marks an unverified server profile as verified', async () => {
  const app = mount({ stored: pending(), get: path => path.endsWith('/status') ? { data: { status: 'COMPLETED' } } : undefined }); await app.settle();
  assert.doesNotMatch(app.text(), /Verified through Nafath/);
  assert.ok(app.button('Check verification status')); assert.equal(app.storage.size, 1); app.unmount();
});

test('an expired login offers sign-in without discarding the pending attempt', async () => {
  const app = mount({ stored: pending(), get: path => { if (path.endsWith('/status')) throw { response: { status: 401 } }; } }); await app.settle();
  assert.match(app.text(), /login session expired/); assert.ok(app.button('Sign in again'));
  assert.equal(app.storage.size, 1); app.unmount();
});
