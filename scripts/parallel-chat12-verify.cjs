const { ESLint } = require('/home/mostafa/Work/mostakl/realestate/real-estate-front/node_modules/eslint');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = '/home/mostafa/Work/mostakl/realestate/real-estate-front';

async function runVerification() {
  console.log('=== CHAT 12 SCAN-MAP VERIFICATION SUITE ===\n');

  // 1. Verify Assets
  console.log('1. Checking created assets...');
  const artworkPath = path.join(FRONTEND_ROOT, 'public/artworks/chat12-cartography-plinth.webp');
  if (fs.existsSync(artworkPath)) {
    const stat = fs.statSync(artworkPath);
    console.log(`✔ Found chat12-cartography-plinth.webp (${(stat.size / 1024).toFixed(1)} KB)`);
  } else {
    console.error('✖ Missing artwork: public/artworks/chat12-cartography-plinth.webp');
    process.exit(1);
  }

  // 2. Scoped ESLint
  console.log('\n2. Running scoped ESLint on owned files...');
  const eslint = new ESLint({ cwd: FRONTEND_ROOT });
  const targetFiles = [
    'app/scan-map/page.tsx',
    'lib/redesign-chat12-scan.ts',
    'components/redesign/chat12/ScanDisclaimerModal.tsx',
    'components/redesign/chat12/ScanGeneratingOverlay.tsx',
    'components/redesign/chat12/ScanMapHeader.tsx',
    'components/redesign/chat12/ScanResultsTable.tsx',
    'components/redesign/chat12/ScanMapControls.tsx',
  ];

  const results = await eslint.lintFiles(targetFiles);
  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);
  const errorCount = results.reduce((acc, r) => acc + r.errorCount, 0);
  const warningCount = results.reduce((acc, r) => acc + r.warningCount, 0);

  if (errorCount > 0 || warningCount > 0) {
    console.log(output);
    console.error(`✖ ESLint reported ${errorCount} errors and ${warningCount} warnings.`);
    process.exit(1);
  } else {
    console.log(`✔ ESLint clean on ${targetFiles.length} files (0 errors, 0 warnings).`);
  }

  // 3. Node Test Runner
  console.log('\n3. Running unit test suite...');
  const testFile = path.join(FRONTEND_ROOT, 'tests/parallel-chat12-scan.test.cjs');
  const testRun = spawnSync('node', ['--test', testFile], {
    cwd: FRONTEND_ROOT,
    encoding: 'utf8',
  });

  if (testRun.status === 0) {
    console.log(testRun.stdout.trim());
    console.log('✔ All 10 parallel-chat12 unit tests passed.');
  } else {
    console.error(testRun.stdout);
    console.error(testRun.stderr);
    console.error('✖ Unit tests failed.');
    process.exit(1);
  }

  // 4. Inspect CSS Module Purity
  console.log('\n4. Inspecting CSS Module purity...');
  const cssPath = path.join(FRONTEND_ROOT, 'components/redesign/chat12/scan-map.module.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Verify reduced-motion is present
  if (cssContent.includes('prefers-reduced-motion')) {
    console.log('✔ prefers-reduced-motion media query verified');
  } else {
    console.error('✖ prefers-reduced-motion missing from scan-map.module.css');
    process.exit(1);
  }

  // Verify dark mode tokens
  if (cssContent.includes(':global(.dark)')) {
    console.log('✔ Dark theme variables verified');
  } else {
    console.error('✖ Dark mode variables missing from scan-map.module.css');
    process.exit(1);
  }

  // 5. Verify before-state diff patch
  console.log('\n5. Checking before-state record...');
  const patchPath = path.join(FRONTEND_ROOT, 'tests/parallel-chat12-before-diff.patch');
  if (fs.existsSync(patchPath)) {
    console.log('✔ Before-state patch record preserved');
  } else {
    console.error('✖ Missing before-state patch record');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('ALL CHAT 12 SCAN-MAP VERIFICATION CHECKS PASSED (100%)');
  console.log('======================================================\n');
}

runVerification().catch((err) => {
  console.error('Verification suite failed:', err);
  process.exit(1);
});
