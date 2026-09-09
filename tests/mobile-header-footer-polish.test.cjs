const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const header = fs.readFileSync(path.join(root, 'app/src/components/Header.tsx'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'app/src/components/Footer.tsx'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');

test('mobile footer removes the top call-us action but keeps contact details', () => {
  const mobileStart = footer.indexOf('MOBILE LAYOUT');
  const mobileFooter = footer.slice(mobileStart);

  assert.equal(mobileFooter.includes('t("footer.call_us")'), false);
  assert.equal(mobileFooter.includes('aria-label="Email"'), false);
  assert.equal(mobileFooter.includes('aria-label="X"'), false);
  assert.match(mobileFooter, /mobile-contact-block/);
  assert.match(mobileFooter, /settings\.contactEmail/);
});

test('mobile header uses a polished shell and motion with reduced-motion support', () => {
  assert.match(header, /mobile-header-shell/);
  assert.match(header, /mobile-header-menu-button/);
  assert.match(header, /mobile-header-shortcuts/);
  assert.match(header, /tour-target-mobile-customer-service/);
  assert.match(header, /tour-target-mobile-language/);
  assert.match(header, /tour-target-mobile-profile/);
  assert.match(header, /mobile-menu-panel/);
  const drawer = header.slice(header.indexOf('mobile-menu-panel'));
  assert.equal(drawer.includes("t('header.customerService')"), false);
  assert.equal(drawer.includes('toggleLanguage(); setIsMenuOpen(false)'), false);
  assert.equal(drawer.includes('href="/profile"'), false);
  assert.match(styles, /@keyframes mobileHeaderReveal/);
  assert.match(styles, /@keyframes mobileMenuReveal/);
  assert.match(styles, /@keyframes mobileMenuItemReveal/);
  assert.match(styles, /\.mobile-menu-panel > a/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
