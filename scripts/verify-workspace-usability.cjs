// Local visual verification only. Run against the built preview on port 3360.
// PUPPETEER_MODULE and CHROME_PATH point to an existing browser installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');
const base = 'http://127.0.0.1:3360';
const output = path.resolve(__dirname, '../docs/verification/workspace-usability-2026-11-09');
const user = { id: 'preview', role: 'admin', firstName: 'Preview', lastName: 'Account', email: 'preview@example.test', city: 'Riyadh', onboardingStatus: 'completed', isVerified: true, departments: ['legal', 'financial'] };
const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
let customSettings = [], emptyCharts = false;
let listError=false, formStatus=500, submissions=0, chartFetches=0;
const formDef={version:1,fields:[{id:'subject',type:'text',label:'تفاصيل الطلب',target:'description',required:true,section:'بيانات الطلب'},{id:'serviceType',type:'select',label:'نوع الخدمة',target:'serviceType',required:true,options:[{value:'تصوير فوتوغرافي للعقار',label:'تصوير فوتوغرافي للعقار'}]},{id:'quantity',type:'number',label:'الكمية',target:'quantity',required:true,defaultValue:'1'},{id:'delivery',type:'radio',label:'طريقة التنفيذ',target:'metadata.delivery',required:true,options:[{value:'online',label:'أونلاين'},{value:'in_person',label:'حضوري'}]},{id:'terms',type:'terms',label:'الموافقة على الشروط',target:'termsAccepted',required:true}]};
const records=Array.from({length:23},(_,index)=>({id:'request-'+index,clientName:index===0?'أحمد الاختبار':`عميل ${String(index+1).padStart(2,'0')}`,phone:'050000'+String(index).padStart(4,'0'),serviceType:'تصوير فوتوغرافي للعقار',targetDepartment:'marketing',category:'marketing',status:index%2?'completed':'pending',createdAt:`2026-10-${String(index+1).padStart(2,'0')}T12:00:00Z`,city:'الرياض',district:'حي الاختبار'}));
const checks = [];
function fixture(url) {
  const endpoint = new URL(url).pathname;
  if(endpoint.endsWith('/service-requests'))return {items:records,total:records.length};
  if (endpoint.includes('settings')) return [...['services', 'wallet', 'financial', 'offers', 'orders', 'marketing', 'buildingmanagement', 'scan_map', 'legal', 'customerservice', 'details', 'info', 'about', 'chat', 'subscriptions'].map(key => ({ key: `section_${key}`, value: 'open' })), {key:'service_form_marketing',value:JSON.stringify(formDef)}, ...customSettings];
  if (endpoint.includes('/financial/chart-data')) return emptyCharts ? [] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11.5, 0];
  if (endpoint.includes('/properties/stats')) return emptyCharts ? [] : [{ name: 'building', value: 8 }, { name: 'apartment', value: 5 }, { name: 'land', value: 4 }, { name: 'warehouse', value: 3 }];
  if (endpoint.includes('/activities/me')) return [{ id: 'a1', type: 'user_joined', title: 'New User Joined', description: 'admin joined the system', createdAt: '2026-11-07T12:00:00Z' }, { id: 'a2', type: 'user_joined', title: 'New User Joined', description: 'Preview joined the system', createdAt: '2026-11-08T10:00:00Z' }];
  if (/user\/profile|auth\/me/.test(endpoint)) return { ...user, data: user, user };
  if (/nafath.*(status|availability|config)/.test(endpoint)) return { configured: false, available: false };
  if (endpoint.includes('/subscriptions/status')) return { isActive: true, status: 'active', departments: user.departments };
  if (endpoint.includes('/financial/my-wallet')) return { balance: 0, entries: [] };
  if (endpoint.includes('/service-providers/me')) return null;
  if (/service-providers|provider-requests/.test(endpoint)) return { items: [], total: 0 };
  return [];
}
async function intercept(request) {
  const url = request.url();
  const endpoint=new URL(url).pathname;
  if(endpoint.includes('/financial/chart-data') && request.method()==='GET')chartFetches++;
  if(endpoint.endsWith('/service-requests')&&request.method()==='POST'){submissions++;await new Promise(resolve=>setTimeout(resolve,250));return request.respond({headers,status:formStatus,contentType:'application/json',body:JSON.stringify(formStatus===201?{id:'created-fixture'}:{message:'تعذر حفظ الطلب التجريبي؛ حاول مرة أخرى'})});}
  if(endpoint.endsWith('/service-requests')&&request.method()==='GET'&&listError)return request.respond({headers,status:500,contentType:'application/json',body:JSON.stringify({message:'fixture unavailable'})});
  if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
  if (['fetch', 'xhr'].includes(request.resourceType()) && (new URL(url).origin !== base || new URL(url).pathname.startsWith('/api/'))) return request.respond({ headers, contentType: 'application/json', body: JSON.stringify(fixture(url)) });
  if (!url.startsWith(base) && !url.startsWith('data:')) return request.abort();
  return request.continue();
}
async function prepare(page, authenticated) {
  await page.setBypassServiceWorker(true);
  await page.setRequestInterception(true);
  page.on('request', intercept);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(({ user, authenticated }) => {
    if (!localStorage.getItem('digital-brokerage-theme')) localStorage.setItem('digital-brokerage-theme', 'light');
    if (!localStorage.getItem('language')) localStorage.setItem('language', 'ar');
    if (authenticated) { localStorage.setItem('token', 'preview'); localStorage.setItem('user', JSON.stringify(user)); localStorage.setItem('onboarding_status_preview', 'completed'); }
  }, { user, authenticated });
}
async function visit(page, route) {
  const response = await page.goto(base + route, { waitUntil: 'networkidle0', timeout: 60000 });
  assert.ok([200, 304].includes(response.status()), `${route}: ${response.status()}`);
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, name), fullPage: true }); }

async function fill(page,selector,value){await page.click(selector,{clickCount:3});await page.keyboard.press('Backspace');if(value)await page.type(selector,value);}
async function clickText(page,selector,text){const element=await page.evaluateHandle(({selector,text})=>[...document.querySelectorAll(selector)].find(element=>element.textContent.trim()===text),{selector,text});assert.ok(element);await element.asElement().evaluate(element=>element.scrollIntoView({block:'center'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await element.asElement().click();await element.dispose();}
(async()=>{
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(fixture('http://127.0.0.1:3030'+req.url)));});await new Promise(resolve=>server.listen(3030,resolve));
let browser;
try{
browser=await puppeteer.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});const page=await browser.newPage();await prepare(page,true);const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const width of [1440,390]){
 await page.setViewport({width,height:1000});await visit(page,'/admin/marketing');await page.waitForSelector('[data-service-requests] [role="status"]');
 const layout=width<768?'cards':'table';const rowSelector=`[data-request-layout="${layout}"] ${width<768?'button':'tbody tr'}`;
 assert.equal((await page.$$(rowSelector)).length,10);await clickText(page,'.workspace-pagination button','التالي');await page.waitForFunction(()=>document.querySelector('.workspace-pagination [aria-current="page"]')?.textContent.trim()==='2');assert.equal((await page.$$(rowSelector)).length,10);assert.equal(await page.$eval('.workspace-pagination [aria-current="page"]',e=>e.textContent.trim()),'2');await clickText(page,'.workspace-pagination button','التالي');await page.waitForFunction(()=>document.querySelector('.workspace-pagination [aria-current="page"]')?.textContent.trim()==='3');assert.equal((await page.$$(rowSelector)).length,3);
 await fill(page,'[data-service-requests] input[type="search"]','احمد');await page.waitForFunction(()=>document.querySelector('[data-service-requests] [role="status"]').textContent.includes('1 طلب'));assert.equal((await page.$$(rowSelector)).length,1);
 await fill(page,'[data-service-requests] input[type="search"]','unmatched');await page.waitForFunction(()=>document.querySelector('[data-service-requests]').textContent.includes('لا توجد طلبات مطابقة'));await clickText(page,'[data-service-requests] button','مسح البحث والفلترة');assert.equal((await page.$$(rowSelector)).length,10);
 await page.select('[data-service-requests] select[id^="requests-status"]','completed');assert.ok((await page.$eval('[data-service-requests] [role="status"]',e=>e.textContent)).includes('11 طلب'));await page.select('[data-service-requests] select[id^="requests-status"]','all');await page.select('[data-service-requests] select[id^="requests-sort"]','oldest');assert.ok((await page.$eval(rowSelector,e=>e.textContent)).includes('أحمد الاختبار'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await screenshot(page,`requests-${width}.png`);checks.push({width,searchArabic:true,statusFilter:true,sorting:true,pagination:true,mobileLayout:true});
}
listError=true;await visit(page,'/admin/marketing');await page.waitForSelector('[data-service-requests] [role="alert"]');assert.ok((await page.$eval('[data-service-requests]',e=>e.textContent)).includes('الطلبات غير متاحة'));await screenshot(page,'requests-error-390.png');listError=false;await clickText(page,'[data-service-requests] button','تحديث');await page.waitForFunction(()=>!document.querySelector('[data-service-requests] [role="alert"]'));checks.push({listErrorRecovery:true});
await visit(page,'/services/form?type=marketing');await page.waitForSelector('.dynamic-service-form');await page.$eval('.dynamic-service-form',form=>form.requestSubmit());await page.waitForSelector('.dynamic-service-form [role="alert"]');assert.equal(await page.evaluate(()=>document.activeElement.name),'subject');assert.equal(submissions,0);await screenshot(page,'form-errors-390.png');
await fill(page,'[name="subject"]','طلب تصوير تجريبي');await page.select('[name="serviceType"]','تصوير فوتوغرافي للعقار');await fill(page,'[name="quantity"]','0');await page.focus('input[type="radio"]');await page.keyboard.press('Space');await page.click('[name="terms"]');await page.$eval('.dynamic-service-form',form=>form.requestSubmit());assert.equal(submissions,0);assert.ok(await page.$eval('[name="quantity"]',e=>e.getAttribute('aria-invalid')==='true'));await fill(page,'[name="quantity"]','2');
await page.$eval('.dynamic-service-form',form=>{form.requestSubmit();form.requestSubmit();});await page.waitForFunction(()=>document.querySelector('.dynamic-service-form [role="alert"]')?.textContent.includes('تعذر حفظ الطلب'));assert.equal(submissions,1);assert.equal(await page.$eval('[name="subject"]',e=>e.value),'طلب تصوير تجريبي');await screenshot(page,'form-failed-390.png');checks.push({inlineValidation:true,firstInvalidFocus:true,radioKeyboard:true,numericValidation:true,failedSavePreservesInput:true,concurrentSubmitGuard:true});
formStatus=201;await page.$eval('.dynamic-service-form',form=>{form.requestSubmit();form.requestSubmit();});await page.waitForSelector('.dynamic-service-form [role="status"]');assert.equal(submissions,2);assert.ok(await page.$eval('.service-submit',button=>button.disabled));await screenshot(page,'form-saved-390.png');checks.push({successfulSaveLocksUntilRedirect:true});
await visit(page,'/financial');await page.waitForSelector('[data-workspace-tab]');const activeBefore=await page.$eval('[data-workspace-tab][aria-selected="true"]',e=>e.textContent);await page.focus('[data-workspace-tab][aria-selected="true"]');await page.keyboard.press('ArrowLeft');await page.waitForFunction(before=>document.querySelector('[data-workspace-tab][aria-selected="true"]').textContent!==before,{},activeBefore);const activeStyle=await page.$eval('[data-workspace-tab][aria-selected="true"]',e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));assert.equal(activeStyle.background,'rgb(48, 48, 48)');assert.equal(activeStyle.color,'rgb(255, 255, 255)');await screenshot(page,'navigation-390.png');checks.push({rtlKeyboardTabs:true,activeTabContrast:true});
await visit(page,'/details');assert.ok((await page.$eval('.calm-chart',e=>e.textContent)).includes('إجمالي المعاملات شهريًا'));assert.ok(!(await page.$eval('.calm-chart',e=>e.textContent)).includes('m²'));assert.equal(chartFetches,1);checks.push({transactionUnitsCorrect:true,singleDashboardChartFetch:true});
await page.evaluate(()=>localStorage.setItem('language','en'));await visit(page,'/services/form?type=marketing');await page.$eval('.dynamic-service-form',form=>form.requestSubmit());assert.ok((await page.$eval('.dynamic-service-form [role="alert"]',e=>e.textContent)).includes('Check'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);checks.push({englishValidation:true});const directPage=await browser.newPage();await prepare(directPage,true);await directPage.setViewport({width:390,height:1000});await visit(directPage,'/offers');await directPage.waitForSelector('button[aria-label="Back"]');await directPage.click('button[aria-label="Back"]');await directPage.waitForFunction(()=>location.pathname==='/details');await directPage.close();checks.push({directEntryBackFallback:true});
await page.evaluate(()=>localStorage.setItem('digital-brokerage-theme','dark'));await visit(page,'/financial');await page.waitForSelector('[data-workspace-tab][aria-selected="true"]');assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('dark')));await page.focus('[data-workspace-tab][aria-selected="true"]');await page.keyboard.press('ArrowRight');await screenshot(page,'navigation-dark-390.png');checks.push({darkNavigationPreserved:true});
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify({checks,submissions,pageErrors:errors},null,2));console.log(JSON.stringify({checks,submissions,pageErrors:errors},null,2));
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
