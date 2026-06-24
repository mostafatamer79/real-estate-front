const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGE_ERROR:', error.message));
  
  // Set auth cookie if needed, but maybe the error happens even without auth
  await page.goto('http://localhost:3000/admin/customer-service');
  await page.waitForTimeout(2000);
  
  console.log('PAGE_LOADED');
  
  // Try to click the opinions tab
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      if (text && text.includes('آراء العملاء')) {
        await btn.click();
        console.log('CLICKED OPINIONS TAB');
        break;
      }
    }
  } catch (e) {
    console.log('BUTTON NOT FOUND', e);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();
