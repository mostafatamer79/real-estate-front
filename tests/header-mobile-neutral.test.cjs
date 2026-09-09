const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const header = fs.readFileSync(
  path.join(__dirname, '..', 'app', 'src', 'components', 'Header.tsx'),
  'utf8'
);

test('mobile header uses the computer header neutral color treatment', () => {
  assert.match(header, /max-md:bg-slate-950/);
  assert.match(header, /md:hidden absolute top-16 left-0 right-0 bg-slate-950/);
  assert.doesNotMatch(header, /text-emerald-400 text-base sm:text-lg/);
  assert.doesNotMatch(header, /text-blue-400 text-base sm:text-lg/);
  assert.doesNotMatch(header, /text-red-400 text-base sm:text-lg/);
  assert.doesNotMatch(header, /bg-gradient-to-r from-indigo-600 to-indigo-500/);
});
