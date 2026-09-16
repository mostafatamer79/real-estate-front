const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pageWrapper = fs.readFileSync(
  path.join(root, 'app', 'src', 'components', 'PageWrapper.tsx'),
  'utf8'
);
const notifications = fs.readFileSync(
  path.join(root, 'context', 'NotificationContext.tsx'),
  'utf8'
);

test('page wrapper auth effect is not coupled to the full settings object', () => {
  assert.doesNotMatch(pageWrapper, /\}, \[pathname, router, settings, settingsLoading\]\);/);
});

test('notification bootstrap fetches independent resources in parallel', () => {
  assert.match(notifications, /Promise\.all\(\[/);
});

test('notification socket does not use React state for an imperative connection', () => {
  assert.match(notifications, /useRef<Socket \| null>\(null\)/);
  assert.doesNotMatch(notifications, /const \[socket, setSocket\] = useState<Socket \| null>\(null\)/);
});
