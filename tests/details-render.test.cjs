const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..');let savedDesign='{}';let language='ar';
function compile(file,mocks={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);return module.exports;}
const config=compile('lib/details-design.ts');const copy=compile('lib/details-copy.ts').DETAILS_COPY;
const uiImports={'@/lib/utils':compile('lib/utils.ts')};
const mocks={
  '@/components/ui/button':compile('components/ui/button.tsx',uiImports),
  '@/components/ui/tabs':compile('components/ui/tabs.tsx',uiImports),
  'next/dynamic':{default:()=>()=>React.createElement('div',{'data-real-map':true})},
  'next/navigation':{useRouter:()=>({push(){}})},
  '@/context/LanguageContext':{useLanguage:()=>({language,t:key=>copy[language][key]||key})},
  '@/context/SettingsContext':{useSettings:()=>({settings:{isDark:false,textOverrides:{[config.DETAILS_DESIGN_KEY]:savedDesign}}}),resolveSurfaceColor:color=>color},
  '@/lib/details-design':config,
  './details-explorer.module.css':new Proxy({},{get:(_,key)=>key}),
};
const Neighborhood=compile('components/details/DetailsNeighborhood.tsx',mocks).default;
const Controls=compile('components/details/DetailsDesignControls.tsx',mocks).default;
test('the real neighborhood respects admin view and pin availability',()=>{
  savedDesign=JSON.stringify({enable3d:false});let html=renderToStaticMarkup(React.createElement(Neighborhood));assert.match(html,/data-real-map/);assert.doesNotMatch(html,/aria-pressed/);
  savedDesign=JSON.stringify({showPins:false,showPropertyPin:false});html=renderToStaticMarkup(React.createElement(Neighborhood));assert.doesNotMatch(html,/illustrative location|aria-label="حديقة/);assert.match(html,/نموذج معماري ثلاثي الأبعاد/);
  savedDesign=JSON.stringify({places:[{id:'school',ar:'مدرسة مخصصة',en:'Custom school',enabled:true}],propertyPinColor:'#aa2222'});html=renderToStaticMarkup(React.createElement(Neighborhood));assert.match(html,/مدرسة مخصصة/);assert.match(html,/#aa2222/);
});
test('English pin text and admin design values render from the same saved configuration',()=>{
  language='en';savedDesign=JSON.stringify({mobileHeight:270,places:[{id:'park',ar:'حديقة الاختبار',en:'Test park',enabled:true}]});const html=renderToStaticMarkup(React.createElement(Neighborhood));assert.match(html,/Test park/);assert.match(html,/--scene-mobile:270px/);assert.doesNotMatch(html,/place-filters/);
  const admin=renderToStaticMarkup(React.createElement(Controls,{value:savedDesign,onChange(){},order:'quick_actions,map,charts,stats',onOrderChange(){}}));assert.match(admin,/Test park/);assert.match(admin,/value="270"/);assert.ok(admin.indexOf('الوصول السريع')<admin.indexOf('إحصائيات العمليات'));
});

test('the map keeps the scan link and on-scene pins without the two control rows', () => {
  language = 'ar';
  savedDesign = '{}';
  const html = renderToStaticMarkup(React.createElement(Neighborhood));
  assert.match(html, /<a[^>]*href="\/scan-map"[^>]*>/);
  assert.match(html, /استكشف العقارات القريبة/);
  assert.match(html, /aria-pressed="false"[^>]*>حديقة/);
  assert.doesNotMatch(html, /role="tablist"|أدوات المشهد|المواقع حول المبنى/);
});
