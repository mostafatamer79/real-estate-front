// Behavioral regression tests for app/verify-otp/page.tsx:
//  - "Back / edit identifier" must abort an in-flight verification request
//    BEFORE navigating to /login, so a late success can neither store
//    credentials nor redirect behind the user's back.
//  - Duplicate submits / stale resends must be ignored, not aborted-and-retried.
//  - Network failures and malformed responses must surface recoverable
//    messages; genuine server rejections keep the server's message.
//
// The page component is executed in a minimal fake-React sandbox and driven
// like a user: fill the six inputs, submit, click back/resend — then the
// manually-settled fake fetch resolves and we observe storage, navigation,
// and error side effects. The real lib/fetch-with-timeout.ts,
// lib/auth-navigation.ts, and lib/otp-expiry.ts are exercised unmocked.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.join(__dirname, '..');

// Mirrors the page's inline bilingual UX strings (translations keys are out of
// scope for this page, so the strings themselves are the user-facing contract).
const CONNECTION_ERROR_AR = 'انتهت مهلة الاتصال أو تعذّر الوصول إلى الخادم. تحقق من اتصالك وحاول مرة أخرى.';
const CONNECTION_ERROR_EN = 'Connection timed out or the server could not be reached. Check your connection and try again.';
const INVALID_RESPONSE_AR = 'استجابة غير متوقعة من الخادم. حاول مرة أخرى بعد قليل.';
const INVALID_RESPONSE_EN = 'Unexpected response from the server. Please try again shortly.';
const EXPIRED_AR = 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.';

const API_BASE = 'http://api.test';

function transpile(absPath) {
  const source = fs.readFileSync(absPath, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
  }).outputText;
}

function makeStorage(map) {
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

function jsonBody(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    clone: () => ({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
  };
}

function unreadableBody(status) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
    clone: () => ({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }),
  };
}

function makeAbortError() {
  const err = new Error('The operation was aborted');
  err.name = 'AbortError';
  return err;
}

function createRuntime({ language = 'ar', translations = null } = {}) {
  const rt = {
    language,
    t: translations
      ? (key) => (Object.prototype.hasOwnProperty.call(translations, key) ? translations[key] : key)
      : (key) => key,
    navigations: [],
    navigationOrder: [],
    fetchCalls: [],
    authEvents: [],
    focusCalls: [],
    hapticSuccess: 0,
    hapticError: 0,
    storage: new Map(),
    session: new Map(),
  };

  // --- mini React -----------------------------------------------------------
  let states = [];
  let refs = [];
  let effects = [];
  let pendingEffects = [];
  let hookIndex = 0;
  let flushing = false;
  let tree = null;

  const depsChanged = (a, b) =>
    !a || !b || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

  function useState(initial) {
    const i = hookIndex++;
    const slot = states[i] || (states[i] = { value: typeof initial === 'function' ? initial() : initial });
    const setValue = (next) => {
      const resolved = typeof next === 'function' ? next(slot.value) : next;
      if (Object.is(resolved, slot.value)) return;
      slot.value = resolved;
      renderAndFlush();
    };
    return [slot.value, setValue];
  }

  function useRef(initial) {
    const i = hookIndex++;
    return refs[i] || (refs[i] = { current: initial });
  }

  function useCallback(fn) {
    return fn;
  }

  function useEffect(fn, deps) {
    const i = hookIndex++;
    const slot = effects[i] || (effects[i] = { deps: undefined, hasRun: false, cleanup: null, queued: null });
    if (slot.hasRun && !depsChanged(slot.deps, deps)) return;
    const run = () => {
      if (typeof slot.cleanup === 'function') slot.cleanup();
      const out = fn();
      slot.cleanup = typeof out === 'function' ? out : null;
      slot.deps = deps;
      slot.hasRun = true;
      slot.queued = null;
    };
    if (slot.queued) {
      const at = pendingEffects.indexOf(slot.queued);
      if (at !== -1) pendingEffects.splice(at, 1);
    }
    slot.queued = run;
    pendingEffects.push(run);
  }

  function renderComponent() {
    hookIndex = 0;
    tree = Page();
  }

  function flush() {
    if (flushing) return;
    flushing = true;
    try {
      let guard = 0;
      while (pendingEffects.length && guard++ < 1000) {
        const batch = pendingEffects.splice(0);
        for (const run of batch) run();
      }
    } finally {
      flushing = false;
    }
  }

  function renderAndFlush() {
    renderComponent();
    flush();
  }

  // --- fakes ----------------------------------------------------------------
  const React = {
    createElement: (type, props, ...children) => ({ $$el: true, type, props: props || {}, children }),
  };
  const Icon = (props) => React.createElement('svg', props);
  const LinkStub = (props) => React.createElement('a', props, props.children);
  const AnimatedArtworkStub = () => null;

  function fakeFetch(url, init = {}) {
    let resolveFetch;
    let rejectFetch;
    const promise = new Promise((res, rej) => { resolveFetch = res; rejectFetch = rej; });
    const call = {
      url,
      body: init.body ? JSON.parse(init.body) : null,
      signal: init.signal || null,
      settled: false,
      resolveWith(response) { call.settled = true; resolveFetch(response); },
      rejectWith(err) { call.settled = true; rejectFetch(err); },
    };
    rt.fetchCalls.push(call);
    return promise;
  }

  // lib/fetch-with-timeout.ts calls the free `fetch`; shadow it by passing the
  // fake as a parameter of the transpiled function body.
  function loadModule(absPath, shadowFetch) {
    const fn = new Function('require', 'module', 'exports', 'fetch', transpile(absPath));
    const m = { exports: {} };
    fn(() => { throw new Error('lib modules must not require'); }, m, m.exports, shadowFetch);
    return m.exports;
  }

  const libs = {
    fetchWithTimeout: loadModule(path.join(ROOT, 'lib', 'fetch-with-timeout.ts'), fakeFetch).fetchWithTimeout,
    authNavigation: loadModule(path.join(ROOT, 'lib', 'auth-navigation.ts')),
    otpExpiry: loadModule(path.join(ROOT, 'lib', 'otp-expiry.ts')),
  };

  rt.router = {
    replace(url) {
      const last = rt.fetchCalls[rt.fetchCalls.length - 1];
      // Records whether the in-flight request was already aborted at the
      // moment navigation happened (the lib's internal signal mirrors the
      // page's external controller through its abort listener).
      rt.navigationOrder.push({ url, abortedAtCall: last ? last.signal.aborted === true : false });
      rt.navigations.push(url);
    },
  };

  const documentFake = {
    body: { setAttribute() {}, removeAttribute() {} },
    getElementById(id) { rt.focusCalls.push(id); return { focus() {} }; },
  };

  const windowFake = {
    setInterval: () => 0,
    clearInterval: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: (e) => { rt.authEvents.push(e.type); },
  };

  const processFake = { env: { NEXT_PUBLIC_API_URL: API_BASE, NODE_ENV: 'production' } };

  const registry = {
    react: { useState, useEffect, useCallback, useRef },
    'next/navigation': { useRouter: () => rt.router },
    'next/image': function Image(props) { return React.createElement('img', props); },
    'next/link': LinkStub,
    'lucide-react': { ArrowLeft: Icon, Loader2: Icon },
    '@/context/LanguageContext': { useLanguage: () => ({ t: rt.t, language: rt.language }) },
    '@/context/SettingsContext': { useSettings: () => ({ settings: { isDark: false } }) },
    '@/lib/haptics': {
      hapticSuccess: () => { rt.hapticSuccess += 1; },
      hapticError: () => { rt.hapticError += 1; },
    },
    '@/lib/fetch-with-timeout': { fetchWithTimeout: libs.fetchWithTimeout },
    '@/lib/auth-navigation': libs.authNavigation,
    '@/lib/otp-expiry': libs.otpExpiry,
    // __esModule must answer falsy so the transpiled __importDefault wraps this
    // proxy as { default: proxy }; a truthy __esModule makes
    // verify_otp_module_css_1.default extract the string "default" instead,
    // leaving every styles.* lookup undefined and the class-name-based finders
    // unable to match anything.
    './verify-otp.module.css': new Proxy({}, {
      get: (_t, key) => {
        if (key === '__esModule') return false;
        return typeof key === 'symbol' ? undefined : String(key);
      },
    }),
    '@/components/cinematic/AnimatedArtwork': AnimatedArtworkStub,
  };

  const requireFromSandbox = (spec) => {
    if (!(spec in registry)) throw new Error('Unexpected module: ' + spec);
    return registry[spec];
  };

  const pageFn = new Function(
    'require', 'module', 'exports', 'React', 'document', 'window',
    'localStorage', 'sessionStorage', 'process', 'Event', 'AbortController',
    transpile(path.join(ROOT, 'app', 'verify-otp', 'page.tsx')),
  );
  const pageModule = { exports: {} };
  pageFn(
    requireFromSandbox, pageModule, pageModule.exports, React, documentFake, windowFake,
    makeStorage(rt.storage), makeStorage(rt.session), processFake, Event, AbortController,
  );
  const Page = pageModule.exports.default;

  // --- tree helpers -----------------------------------------------------------
  function walk(node, visit) {
    if (node === null || node === undefined || node === false || node === true) return;
    if (Array.isArray(node)) { for (const child of node) walk(child, visit); return; }
    visit(node);
    if (typeof node === 'object' && node.$$el) {
      walk(node.props.children, visit);
      walk(node.children, visit);
    }
  }

  const findAll = (pred) => {
    const out = [];
    walk(tree, (n) => { if (typeof n === 'object' && n !== null && n.$$el && pred(n)) out.push(n); });
    return out;
  };

  const textOf = (node) => {
    let out = '';
    walk(node, (n) => {
      if (typeof n === 'string') out += n;
      else if (typeof n === 'number') out += String(n);
    });
    return out;
  };

  const findForm = () => findAll((n) => n.type === 'form')[0];
  const findBackButton = () => findAll((n) => n.props && n.props['aria-label'] === 'common.back')[0];
  const findResendButton = () =>
    findAll((n) => n.props && n.props.className === 'resendButton')[0] || null;
  const findCustomerServiceLink = () =>
    findAll((n) => n.type === LinkStub && n.props.href === '/customerservice')[0] || null;
  const alertText = () => {
    const alert = findAll((n) => n.props && n.props.role === 'alert')[0];
    return alert ? textOf(alert) : null;
  };

  function fillOtp(code) {
    for (let i = 0; i < code.length && i < 6; i++) {
      const inputs = findAll((n) => n.type === 'input');
      inputs[i].props.onChange({ target: { value: code[i] } });
    }
  }

  function submit() {
    findForm().props.onSubmit({ preventDefault() {} });
  }

  function seedPending({ expired = false } = {}) {
    rt.storage.set('pendingVerification', 'user@test.com');
    rt.storage.set(
      'pendingVerificationExpiresAt',
      new Date(Date.now() + (expired ? -60_000 : 10 * 60_000)).toISOString(),
    );
  }

  async function settle() {
    for (let i = 0; i < 40; i++) {
      await Promise.resolve();
      flush();
    }
  }

  // The mount effects read localStorage synchronously (pendingVerification,
  // expiry). Tests seed storage first and then call mount() explicitly.
  let started = false;
  function mount() {
    if (started) return;
    started = true;
    renderAndFlush();
  }

  return {
    rt,
    mount,
    fillOtp,
    submit,
    settle,
    seedPending,
    alertText,
    findBackButton,
    findResendButton,
    findCustomerServiceLink,
    findInputs: () => findAll((n) => n.type === 'input'),
  };
}

test('back aborts the in-flight verification before navigating to /login', async () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 1);

  h.findBackButton().props.onClick();

  assert.equal(h.rt.fetchCalls[0].signal.aborted, true, 'in-flight request must abort synchronously');
  assert.deepEqual(h.rt.navigationOrder, [{ url: '/login', abortedAtCall: true }]);

  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'r',
  }));
  await h.settle();

  assert.deepEqual(h.rt.navigations, ['/login'], 'no navigation besides the back action');
  assert.equal(h.rt.storage.has('user'), false, 'late success must not store credentials');
  assert.equal(h.rt.storage.has('token'), false);
  assert.equal(h.rt.storage.has('refreshToken'), false);
  assert.deepEqual(h.rt.authEvents, [], 'no auth-change event after back');
});

// The customer-service Link is the one exit rendered as next/link instead of a
// button. next/link runs the user's onClick before its own navigation handler
// (verified against node_modules/next/dist/client/link.js), so the page's
// handler must abort the in-flight request synchronously; the late success
// response then hits the abort guard and must store nothing and navigate
// nowhere.
test('customer-service link aborts the in-flight verification synchronously', async () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 1);

  const link = h.findCustomerServiceLink();
  assert.ok(link, 'customer-service link renders in the form column');
  link.props.onClick();

  assert.equal(h.rt.fetchCalls[0].signal.aborted, true, 'abort must land synchronously inside the Link onClick');
  assert.deepEqual(h.rt.navigations, [], 'the click itself must not have navigated yet');

  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'r',
  }));
  await h.settle();

  assert.deepEqual(h.rt.navigations, [], 'late success must not navigate after the abort');
  assert.equal(h.rt.storage.has('user'), false, 'late success must not store credentials');
  assert.equal(h.rt.storage.has('token'), false);
  assert.equal(h.rt.storage.has('refreshToken'), false);
  assert.deepEqual(h.rt.authEvents, [], 'no auth-change event after the customer-service exit');
  assert.equal(h.rt.hapticError, 0, 'an intentional exit must stay silent');
  assert.equal(h.alertText(), null, 'no error message is surfaced for a deliberate exit');
});

test('customer-service link with Ctrl/Cmd modifier does NOT abort the in-flight verification', async () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 1);

  const link = h.findCustomerServiceLink();
  assert.ok(link, 'customer-service link renders');
  // Simulate Ctrl-click (opening support in new tab)
  link.props.onClick({ ctrlKey: true, button: 0, defaultPrevented: false });
  assert.equal(h.rt.fetchCalls[0].signal.aborted, false, 'in-flight request must remain running on Ctrl-click');

  // Simulate Cmd-click (Mac)
  link.props.onClick({ metaKey: true, button: 0, defaultPrevented: false });
  assert.equal(h.rt.fetchCalls[0].signal.aborted, false, 'in-flight request must remain running on Cmd-click');

  // Request resolves successfully
  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok-ctrl',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'ref-ctrl',
  }));
  await h.settle();

  assert.equal(h.rt.storage.get('token'), 'tok-ctrl', 'success stores credentials when not aborted');
  assert.equal(h.rt.storage.get('refreshToken'), 'ref-ctrl');
  assert.equal(h.rt.storage.has('user'), true);
});

test('customer-service link with middle-click does NOT abort the in-flight verification', async () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 1);

  const link = h.findCustomerServiceLink();
  link.props.onClick({ button: 1, defaultPrevented: false });
  assert.equal(h.rt.fetchCalls[0].signal.aborted, false, 'in-flight request must remain running on middle click');
});

test('200 response missing refreshToken surfaces invalid-response and stores nothing', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();

  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
  }));
  await h.settle();

  assert.equal(h.alertText(), INVALID_RESPONSE_AR);
  assert.deepEqual(h.rt.navigations, []);
  assert.equal(h.rt.storage.has('token'), false);
  assert.equal(h.rt.storage.has('refreshToken'), false);
  assert.equal(h.rt.storage.has('user'), false);
});

test('delayed success after back preserves pre-existing credentials and pending state', async () => {
  const h = createRuntime();
  h.rt.storage.set('user', '{"legacy":true}');
  h.rt.storage.set('token', 'legacy-token');
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();

  h.findBackButton().props.onClick();
  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'new-token',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'r',
  }));
  await h.settle();

  assert.equal(h.rt.storage.get('user'), '{"legacy":true}', 'pre-existing user untouched');
  assert.equal(h.rt.storage.get('token'), 'legacy-token', 'pre-existing token untouched');
  assert.equal(h.rt.storage.get('pendingVerification'), 'user@test.com', 'pending verification kept');
  assert.ok(h.rt.storage.get('pendingVerificationExpiresAt'), 'pending expiry kept');
  assert.deepEqual(h.rt.navigations, ['/login']);
  assert.deepEqual(h.rt.authEvents, []);
});

test('duplicate submit issues exactly one request', async () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 1);

  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'r',
  }));
  await h.settle();
  assert.equal(h.rt.storage.get('token'), 'tok');
});

test('resend double-click issues exactly one request and refreshes expiry once', async () => {
  const h = createRuntime();
  h.seedPending({ expired: true });
  h.mount();
  assert.ok(h.findResendButton(), 'resend button renders when the code is expired');

  const resend = h.findResendButton();
  resend.props.onClick();
  resend.props.onClick();
  assert.equal(h.rt.fetchCalls.length, 1, 'second click must be ignored, not issued');
  assert.equal(h.rt.fetchCalls[0].url, `${API_BASE}/auth/resend-otp`);

  const newExpiry = new Date(Date.now() + 10 * 60_000).toISOString();
  h.rt.fetchCalls[0].resolveWith(jsonBody(200, { expiresAt: newExpiry }));
  await h.settle();

  assert.equal(
    h.rt.storage.get('pendingVerificationExpiresAt'),
    new Date(Date.parse(newExpiry)).toISOString(),
    'expiry refreshed exactly once by the successful resend',
  );
  assert.equal(h.findInputs()[0].props.value, '', 'otp boxes reset after resend');
  assert.equal(h.findResendButton(), null, 'resend hidden again once the timer restarts');
});

test('submitting an expired code shows the expiry message without fetching', () => {
  const h = createRuntime();
  h.seedPending({ expired: true });
  h.mount();
  h.fillOtp('123456');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 0);
  assert.equal(h.alertText(), EXPIRED_AR);
});

test('fetch TypeError surfaces the recoverable connection message (ar)', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].rejectWith(new TypeError('Failed to fetch'));
  await h.settle();
  assert.equal(h.alertText(), CONNECTION_ERROR_AR);
  assert.equal(h.rt.hapticError, 1);
  assert.deepEqual(h.rt.navigations, []);
  assert.equal(h.rt.storage.has('token'), false);
});

test('timeout AbortError surfaces the recoverable connection message (en)', async () => {
  const h = createRuntime({ language: 'en' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].rejectWith(makeAbortError());
  await h.settle();
  assert.equal(h.alertText(), CONNECTION_ERROR_EN);
  assert.notEqual(h.alertText(), 'otp.errorInvalid', 'must not read as an invalid code');
  assert.deepEqual(h.rt.navigations, []);
});

test('malformed 200 body surfaces the invalid-response message with no side effects', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(unreadableBody(200));
  await h.settle();
  assert.equal(h.alertText(), INVALID_RESPONSE_AR);
  assert.notEqual(h.alertText(), CONNECTION_ERROR_AR);
  assert.deepEqual(h.rt.navigations, []);
  assert.deepEqual(h.rt.authEvents, []);
  assert.equal(h.rt.storage.has('token'), false);
  assert.equal(h.rt.storage.get('pendingVerification'), 'user@test.com');
});

test('400 with a server message keeps the server message verbatim', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(jsonBody(400, { message: 'الرمز غير صحيح، حاول مرة أخرى' }));
  await h.settle();
  assert.equal(h.alertText(), 'الرمز غير صحيح، حاول مرة أخرى');
  assert.deepEqual(h.rt.navigations, []);
});

test('400 without a message falls back to otp.errorInvalid', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(jsonBody(400, {}));
  await h.settle();
  assert.equal(h.alertText(), 'otp.errorInvalid');
});

test('server message that is a dictionary key is translated', async () => {
  const h = createRuntime({ language: 'ar', translations: { 'otp.errorInvalid': 'رمز غير صالح' } });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(jsonBody(400, { message: 'otp.errorInvalid' }));
  await h.settle();
  assert.equal(h.alertText(), 'رمز غير صالح');
});

test('500 response surfaces the invalid-response message even with a body message', async () => {
  const h = createRuntime({ language: 'ar' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(jsonBody(500, { message: 'boom' }));
  await h.settle();
  assert.equal(h.alertText(), INVALID_RESPONSE_AR);
  assert.notEqual(h.alertText(), 'boom');
});

test('500 with an unreadable body surfaces the invalid-response message', async () => {
  const h = createRuntime({ language: 'en' });
  h.seedPending();
  h.mount();
  h.fillOtp('123456');
  h.submit();
  h.rt.fetchCalls[0].resolveWith(unreadableBody(500));
  await h.settle();
  assert.equal(h.alertText(), INVALID_RESPONSE_EN);
});

test('control: genuine success stores credentials, fires auth-change, and follows safeReturnTo', async () => {
  const h = createRuntime();
  h.seedPending();
  h.rt.session.set('authReturnTo', '/services/form?type=marketing');
  h.mount();
  h.fillOtp('123456');
  h.submit();

  assert.equal(h.rt.fetchCalls.length, 1);
  assert.equal(h.rt.fetchCalls[0].url, `${API_BASE}/auth/verify-otp`);
  assert.equal(h.rt.fetchCalls[0].body.otp, '123456');
  assert.equal(h.rt.fetchCalls[0].body.email, 'user@test.com');

  h.rt.fetchCalls[0].resolveWith(jsonBody(200, {
    token: 'tok',
    user: { role: 'customer', firstName: 'A', lastName: 'B' },
    refreshToken: 'r',
  }));
  await h.settle();

  assert.deepEqual(h.rt.navigations, ['/services/form?type=marketing']);
  assert.deepEqual(h.rt.authEvents, ['auth-change']);
  assert.equal(h.rt.storage.get('token'), 'tok');
  assert.equal(h.rt.storage.get('refreshToken'), 'r');
  assert.deepEqual(JSON.parse(h.rt.storage.get('user')), { role: 'customer', firstName: 'A', lastName: 'B' });
  assert.equal(h.rt.storage.has('pendingVerification'), false);
  assert.equal(h.rt.storage.has('pendingVerificationExpiresAt'), false);
  assert.equal(h.rt.hapticSuccess, 1);
});

test('control: missing pendingVerification redirects to /login without fetching', () => {
  const h = createRuntime();
  h.mount();
  assert.deepEqual(h.rt.navigations, ['/login']);
  assert.equal(h.rt.fetchCalls.length, 0);
});

test('control: short code shows the required-field error without fetching', () => {
  const h = createRuntime();
  h.seedPending();
  h.mount();
  h.fillOtp('123');
  h.submit();
  assert.equal(h.rt.fetchCalls.length, 0);
  assert.equal(h.alertText(), 'otp.errorRequired');
});
