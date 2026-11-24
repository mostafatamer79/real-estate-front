const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function render(authenticated, language, withIcons) {
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../components/HomeAccountLink.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  const mocks = {
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    '@/hooks/useAuth': { useAuth: () => ({ isAuthenticated: authenticated }) },
    '@/context/LanguageContext': { useLanguage: () => ({ language }) },
  };
  new Function('require', 'module', 'exports', code)(name => mocks[name] || require(name), module, module.exports);
  return renderToStaticMarkup(React.createElement(module.exports.default, { withIcons }));
}

for (const withIcons of [false, true]) {
  test(`homepage ${withIcons ? 'demo' : 'header'} link follows login state in both languages`, () => {
    for (const language of ['ar', 'en']) {
      const guest = render(false, language, withIcons);
      const member = render(true, language, withIcons);
      assert.match(guest, /href="\/login"/);
      assert.ok(guest.includes(language === 'ar' ? 'تسجيل الدخول' : 'Sign in'));
      assert.match(member, /href="\/details"/);
      assert.ok(member.includes(language === 'ar' ? 'الانتقال إلى لوحة المعلومات' : 'Go to dashboard'));
      assert.doesNotMatch(member, /href="\/login"/);
    }
  });
}
