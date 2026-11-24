const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const target = path.join(root, 'public/design-options/vendor');
fs.mkdirSync(target, { recursive: true });
for (const file of ['three.module.js', 'three.core.js']) {
  fs.copyFileSync(path.join(root, 'node_modules/three/build', file), path.join(target, file));
}
fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(target, 'THREE-LICENSE.txt'));
fs.copyFileSync(path.join(root, 'components/details/neighborhood-scene.js'), path.join(target, 'neighborhood-scene.js'));
const design = fs.readFileSync(path.join(root, 'lib/details-design.ts'), 'utf8');
fs.writeFileSync(path.join(target, 'details-design.js'), ts.transpileModule(design, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText);
console.log('Static map previews synchronized with the existing neighborhood engine and Three.js license.');
