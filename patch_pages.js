const fs = require('fs');

const pages = [
  { path: 'app/wallet/page.tsx', theme: 'light' },
  { path: 'app/buildingmanagement/page.tsx', theme: 'light' },
  { path: 'app/orders/page.tsx', theme: 'light' },
  { path: 'app/offers/page.tsx', theme: 'light' },
  { path: 'app/profile/page.tsx', theme: 'light' },
  { path: 'app/chat/page.tsx', theme: 'light' }
];

pages.forEach(page => {
  if (!fs.existsSync(page.path)) {
     console.log('Skipping ' + page.path);
     return;
  }
  let content = fs.readFileSync(page.path, 'utf8');
  
  if (content.includes('MobileAppHeader')) {
      console.log('Already patched ' + page.path);
      return;
  }
  
  // Add import
  const importStatement = `import MobileAppHeader from '@/app/src/components/MobileAppHeader';\n`;
  
  // Find where to inject import
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const endOfImport = content.indexOf('\n', lastImportIndex);
    content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
  } else {
    content = importStatement + content;
  }
  
  // Find the first div after return ( or return <>
  // We'll use regex to inject <MobileAppHeader theme="..." />
  // This can be tricky, so we inject it right after <div ... className="...root..." or similar if possible.
  // Or just before the first child of the main wrapper.
  
  if (page.path.includes('wallet/page.tsx')) {
     content = content.replace(
       /(<div className='wallet-page-root[^>]*>)/,
       `$1\n            <MobileAppHeader theme="${page.theme}" title={t('header.wallet')} />`
     );
  } else if (page.path.includes('buildingmanagement/page.tsx')) {
     content = content.replace(
       /(<div className="w-full min-h-dvh-safe bg-slate-50 text-slate-950 relative overflow-hidden"[^>]*>)/,
       `$1\n      <MobileAppHeader theme="${page.theme}" title={t('action.propertyManagement')} />`
     );
  } else if (page.path.includes('orders/page.tsx')) {
     content = content.replace(
       /(<div className="w-full min-h-screen bg-slate-50 text-slate-950 pb-20 md:pb-8"[^>]*>)/,
       `$1\n      <MobileAppHeader theme="${page.theme}" title={t('header.myRequests')} />`
     );
  } else if (page.path.includes('offers/page.tsx')) {
     content = content.replace(
       /(<div className="w-full min-h-screen bg-slate-50 text-slate-950 pb-20 md:pb-8"[^>]*>)/,
       `$1\n      <MobileAppHeader theme="${page.theme}" title={t('header.offers')} />`
     );
  } else if (page.path.includes('profile/page.tsx')) {
     content = content.replace(
       /(<div className="min-h-screen bg-muted p-4 md:p-10"[^>]*>)/,
       `$1\n      <MobileAppHeader theme="${page.theme}" title={t('profile.title')} />`
     );
     // Also hide the desktop back button on mobile in profile
     content = content.replace(
       /className="px-4 py-2 text-slate-600 hover:bg-muted rounded-lg transition-colors"/,
       'className="hidden md:block px-4 py-2 text-slate-600 hover:bg-muted rounded-lg transition-colors"'
     );
  } else if (page.path.includes('chat/page.tsx')) {
     content = content.replace(
       /(<div className="flex h-screen bg-slate-50 overflow-hidden"[^>]*>)/,
       `$1\n      <div className="absolute top-0 left-0 right-0 z-50"><MobileAppHeader theme="${page.theme}" title={t('chat.title')} /></div>`
     );
     // Chat needs padding top if it's absolute, or change layout.
     // Better to modify its container if possible.
  }
  
  fs.writeFileSync(page.path, content);
  console.log('Patched ' + page.path);
});
