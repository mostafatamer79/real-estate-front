const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function renderInvoice(serviceType){
 const source=ts.transpileModule(fs.readFileSync(require.resolve('../app/src/components/invoice.tsx'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const imports={react:React,'react/jsx-runtime':Object.fromEntries(Object.entries(require('react/jsx-runtime')).map(([key,value])=>[key,typeof value==='function'?(type,props,...args)=>{if(type==='style'){const {jsx,global,...rest}=props;props=rest}return value(type,props,...args)}:value])),'next/image':()=>null,'@/context/LanguageContext':{useLanguage:()=>({language:'ar',t:key=>key})},'html-to-image':{},jspdf:()=>{},'lucide-react':new Proxy({},{get:()=>()=>null}),'@/components/ui/saudi-riyal':{SaudiRiyalAmount:()=>null}};
 const primitive=new Proxy({},{get:()=>({children,...props})=>React.createElement('div',props,children)});
 const context={exports:{},require:name=>imports[name]||primitive};vm.runInNewContext(source,context);
 return renderToStaticMarkup(React.createElement(context.exports.default,{isOpen:true,onClose(){},serviceRequest:{id:'request',invoiceNumber:'INV-TEST',createdAt:'2026-11-11',category:'marketing',serviceType,clientName:'Test',phone:'0500000000',city:'Riyadh',district:'Test',quantity:1,price:100,paymentStatus:'unpaid',status:'pending'}}));
}
test('invoice heading identifies its actual service rather than a missing legal translation',()=>{
 const result=renderInvoice('تصوير عقاري');
 assert.doesNotMatch(result,/pm\.legal\.title/);
 assert.match(result,/تصوير عقاري/);
});
