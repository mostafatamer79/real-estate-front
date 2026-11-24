const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const cache = new Map();
function load(file) {
  const filename = path.resolve(__dirname, '../lib', file + '.ts');
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', source)((name) => name.startsWith('./') ? load(name.slice(2)) : require(name), module, module.exports);
  return module.exports;
}
const { serviceTree, requestMatchesService, serviceGrant } = load('service-navigation');
const { getServiceDisplayName } = load('service-catalog');
test('missing categories stay visible in all services and do not crash category filtering', () => {
  for (const category of [null, undefined, '']) {
    const request = { category, serviceType: 'legacy request' };
    assert.equal(requestMatchesService(request, {}), true);
    assert.equal(requestMatchesService(request, { category: 'postPurchase' }), false);
    assert.equal(requestMatchesService(request, { category: 'legal', branch: 'legal_contracts' }), false);
  }
  assert.equal(requestMatchesService({ category: 'legal_contracts', serviceType: 'عقد' }, { category: 'legal' }), true);
});
test('tree preserves order, includes custom categories, and removes deleted services', () => {
  const custom = [
    { id: 'rename', category: 'marketing', name: 'تصوير فوتوغرافي للعقار', displayName: 'تصوير احترافي', status: 'enabled' },
    { id: 'delete', category: 'marketing', name: 'أخرى', deleted: true, status: 'disabled' },
  ];
  const tree = serviceTree(custom, [{id:'consulting', title:'استشارات', status:'enabled'}, {id:'hidden', title:'مخفي', status:'disabled'}]);
  assert.deepEqual(tree.map(c => c.id), ['postPurchase','legal','construction','marketing','other','consulting']);
  assert.deepEqual(tree[1].children.map(c => c.id), ['legal_disputes','legal_contracts','legal_documentation','legal_other']);
  assert.ok(!tree[3].children[0].services.includes('أخرى'));
  assert.equal(getServiceDisplayName('marketing', 'تصوير فوتوغرافي للعقار', custom), 'تصوير احترافي');
  assert.ok(tree[3].children[0].services.includes('تصوير فوتوغرافي للعقار'));
});
test('selection filters roots, metadata branches and exact services using historical names', () => {
  const request = { category:'legal', serviceType:'عقد بيع', metadata:{contractDetails:{}} };
  assert.ok(requestMatchesService(request, {}));
  assert.ok(requestMatchesService(request, {category:'legal'}));
  assert.ok(requestMatchesService(request, {category:'legal',branch:'legal_contracts'}));
  assert.ok(!requestMatchesService(request, {category:'legal',branch:'legal_documentation'}));
  assert.ok(!requestMatchesService(request, {category:'marketing'}));
  assert.ok(!requestMatchesService(request, {service:'عقد إيجار'}));
  assert.ok(requestMatchesService(request, {service:'عقد بيع'}));
});
test('root grants cover children; leaf grants never cover siblings or other roots', () => {
  assert.equal(serviceGrant(['legal'],'legal_documentation'), 'approved');
  assert.equal(serviceGrant(['legal_contracts'],'legal'), 'partial');
  assert.equal(serviceGrant(['legal_contracts'],'legal_documentation'), 'unapproved');
  assert.equal(serviceGrant(['legal'],'marketing'), 'unapproved');
});
test('legal branch rename and deletion propagate through the complete tree', () => {
  const tree = serviceTree([
    {id:'rename-branch',category:'legal',name:'العقود',displayName:'صياغة ومراجعة العقود',status:'enabled'},
    {id:'delete-branch',category:'legal',name:'التوثيق',deleted:true,status:'disabled'},
  ]);
  assert.equal(tree[1].children.find(branch => branch.id === 'legal_contracts').title, 'صياغة ومراجعة العقود');
  assert.ok(!tree[1].children.some(branch => branch.id === 'legal_documentation'));
});
