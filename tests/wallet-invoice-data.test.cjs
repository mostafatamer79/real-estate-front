const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(){const context={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../lib/wallet-invoice-data.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);return context.exports;}
test('financial invoice display uses server amounts and does not recalculate tax',()=>{
 const {mapWalletInvoice}=load();
 const result=mapWalletInvoice({id:'invoice',invoice:'INV-1',date:'2026-11-11',service:'تصوير عقاري',amount:'105.00',originalStatus:'unpaid',raw:{id:'invoice',amount:'100.00',serviceFee:'5.00',tax:'0.00',total:'105.00',status:'unpaid',description:'تصوير عقاري'}});
 assert.equal(result.serviceType,'تصوير عقاري');assert.equal(result.clientName,'غير متوفر');assert.equal(result.quantity,1);
 assert.equal(result.financialSummary.subtotal,100);assert.equal(result.financialSummary.tax,0);assert.equal(result.financialSummary.serviceFee,5);assert.equal(result.financialSummary.total,105);
 assert.equal(result.paymentStatus,'unpaid');assert.equal(result.price,100);
});
test('zero values and raw nullable fields cannot overwrite usable display values',()=>{
 const {mapWalletInvoice}=load();const result=mapWalletInvoice({id:'invoice',invoice:'INV-2',service:'خدمة مجانية',date:'2026-11-11',raw:{id:'invoice',amount:0,tax:0,total:0,clientName:null,serviceType:null,status:'paid'}});
 assert.equal(result.price,0);assert.equal(result.financialSummary.total,0);assert.equal(result.serviceType,'خدمة مجانية');assert.equal(result.clientName,'غير متوفر');assert.equal(result.paymentStatus,'paid');
});
test('legacy service request invoices retain quantity, unit price, owner and decision state',()=>{
 const {mapWalletInvoice}=load();const result=mapWalletInvoice({id:'request',isPendingDecision:true,raw:{id:'request',serviceType:'عقد',category:'legal',clientName:'عميل',quantity:2,price:100,paymentStatus:'unpaid',createdAt:'2026-11-11',userId:'owner'}});
 assert.equal(result.quantity,2);assert.equal(result.price,100);assert.equal(result.userId,'owner');assert.equal(result.isPendingDecision,true);assert.equal(result.financialSummary,undefined);
});
test('linked service details fill customer fields without replacing financial invoice identity or totals',()=>{
 const {mapWalletInvoice}=load();const result=mapWalletInvoice({id:'financial-invoice',amount:'105',raw:{amount:100,total:105,tax:0,serviceFee:5,serviceRequest:{id:'request',clientName:'عميل',phone:'0500000000',city:'الرياض',district:'النرجس',serviceType:'تصوير',category:'marketing',quantity:2,price:50}}});
 assert.equal(result.id,'financial-invoice');assert.equal(result.clientName,'عميل');assert.equal(result.phone,'0500000000');assert.equal(result.city,'الرياض');assert.equal(result.district,'النرجس');assert.equal(result.quantity,2);assert.equal(result.price,50);assert.equal(result.serviceType,'تصوير');assert.equal(result.financialSummary.total,105);
});
