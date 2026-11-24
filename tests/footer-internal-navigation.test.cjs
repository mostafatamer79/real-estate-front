const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const { join } = require("node:path");

const projectRoot = join(__dirname, "..");

test("footer restores its previous appearance and keeps contacts with QR only", () => {
  const footer = readFileSync(join(projectRoot, "app/src/components/Footer.tsx"), "utf8");

  assert.match(footer, /border-slate-800 bg-slate-950 text-white/);
  assert.doesNotMatch(footer, /t\("footer\.contact_us"\)/);
  assert.doesNotMatch(footer, /Mobile Contact Strip/);
  assert.match(footer, /mobile-contact-block/);
  assert.match(footer, /<VerificationQr \/>/);
});

test("internal properties navigation omits the Orders entry", () => {
  const shell = readFileSync(join(projectRoot, "app/internal/shell.tsx"), "utf8");
  const propertiesItems = shell.match(/properties:\s*\[([\s\S]*?)\n\s*\],\n\s*employees:/)?.[1] ?? "";

  assert.doesNotMatch(propertiesItems, /id:\s*"orders"/);
  assert.doesNotMatch(propertiesItems, /إدارة الطلبات/);
});
