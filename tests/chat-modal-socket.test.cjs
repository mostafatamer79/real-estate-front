const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Run the real component's effects and handlers with isolated transport and HTTP boundaries.
function mount(extraProps = {}) {
  const slots = [], effects = [], requests = [], sent = [], handlers = new Map();
  let cursor = 0, options, url, tree;
  const socket = {
    on(event, callback) { handlers.set(event, callback); return this; },
    emit(...args) { sent.push(args); return this; },
    disconnect() {},
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(callback, deps) {
      const index = cursor++, previous = slots[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        effects.push(() => { previous?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; });
      }
    },
  };
  const compiled = ts.transpileModule(fs.readFileSync(require.resolve('../components/chat/chat-modal.tsx'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'localStorage', 'fetch', 'process', compiled)(
    name => name === 'react' ? react : name === 'react/jsx-runtime' ? require(name)
      : name === 'socket.io-client' ? { io(value, config) { url = value; options = config; return socket; } }
      : new Proxy({}, { get: () => () => null }),
    module, module.exports, { getItem: () => 'local-test-token' },
    (url, options) => new Promise(resolve => requests.push({ url, options, resolve })), { env: {} },
  );
  let props = { isOpen: true, onClose() {}, roomId: 'room', userId: 'member', otherUserName: 'Peer', ...extraProps };
  function render(next) { props = { ...props, ...next }; cursor = 0; tree = module.exports.default(props); while (effects.length) effects.shift()(); return tree; }
  render();
  return {
    slots, requests, sent, handlers, render, get options() { return options; }, get url() { return url; },
    async history(messages, index = 0) {
      requests[index].resolve({ ok: true, json: async () => messages });
      await new Promise(resolve => setImmediate(resolve));
    },
    find(type) {
      function visit(node) {
        if (!node || typeof node !== 'object') return null;
        if (node.type === type) return node;
        return [node.props?.children].flat(Infinity).map(visit).find(Boolean);
      }
      return visit(tree);
    },
  };
}

const message = (id, second = '00') => ({ id, content: id, sender: { id: 'peer', firstName: 'Peer', lastName: '' }, createdAt: `2026-11-12T00:00:${second}Z` });

test('authenticates with a token and rejoins on each connection', () => {
  const chat = mount();
  assert.deepEqual(chat.options.auth, { token: 'local-test-token' });
  assert.equal(chat.options.query, undefined);
  assert.equal(chat.url, 'http://localhost:3030/chat');
  assert.equal(typeof chat.handlers.get('connect'), 'function');
  chat.handlers.get('connect')();
  chat.handlers.get('connect')();
  assert.deepEqual(chat.sent, [['joinRoom', { roomId: 'room' }], ['joinRoom', { roomId: 'room' }]]);
});

test('unwraps gateway events, deduplicates echoes and keeps live messages when history resolves', async () => {
  const chat = mount();
  const live = message('live', '02');
  chat.handlers.get('receiveMessage')({ type: 'receiveMessage', message: live });
  chat.handlers.get('receiveMessage')({ type: 'receiveMessage', message: live });
  await chat.history([message('old', '01')]);
  assert.deepEqual(chat.slots[0], [message('old', '01'), live]);
  assert.doesNotThrow(() => chat.render());
});

test('accepts raw messages without duplicating messages also loaded from history', async () => {
  const chat = mount();
  const live = message('live');
  chat.handlers.get('receiveMessage')(live);
  await chat.history([live]);
  assert.deepEqual(chat.slots[0], [live]);
});

test('uses the API fallback for history and ignores the previous room response', async () => {
  const chat = mount();
  assert.equal(chat.requests[0].url, 'http://localhost:3030/api/chat/room/messages');
  chat.render({ roomId: 'next-room' });
  await chat.history([message('next')], 1);
  await chat.history([message('previous')], 0);
  assert.deepEqual(chat.slots[0], [message('next')]);
});

test('read-only composer also blocks a programmatic form submission', () => {
  const chat = mount({ readOnly: true });
  chat.find('input').props.onChange({ target: { value: 'draft' } });
  chat.render();
  chat.find('form').props.onSubmit({ preventDefault() {} });
  assert.equal(chat.sent.some(([event]) => event === 'sendMessage'), false);
  assert.equal(chat.find('input').props.disabled, true);
});

test('sends only room and content, leaving sender identity to the server', () => {
  const chat = mount();
  chat.find('input').props.onChange({ target: { value: 'hello' } });
  chat.render();
  chat.find('form').props.onSubmit({ preventDefault() {} });
  assert.deepEqual(chat.sent.find(([event]) => event === 'sendMessage'), ['sendMessage', { roomId: 'room', content: 'hello' }]);
});

test('reloads persisted history on reconnect to recover messages missed offline', async () => {
  const chat = mount();
  await chat.history([message('before')], 0);
  chat.handlers.get('connect')();
  assert.equal(chat.requests.length, 2);
  await chat.history([message('before'), message('missed', '05')], 1);
  assert.deepEqual(chat.slots[0].map(item => item.id), ['before', 'missed']);
});
