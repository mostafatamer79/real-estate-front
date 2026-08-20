const fs = require('fs');

const pages = [
  'app/wallet/page.tsx',
  'app/buildingmanagement/page.tsx',
  'app/orders/page.tsx',
  'app/offers/page.tsx',
  'app/profile/page.tsx',
  'app/chat/page.tsx'
];

pages.forEach(path => {
  let content = fs.readFileSync(path, 'utf8');
  
  // Remove the injected import if it's there
  const importStatement = "import MobileAppHeader from '@/app/src/components/MobileAppHeader';\n";
  content = content.replace(importStatement, '');
  
  // Add it to the very top, after "use client"; if it exists
  if (content.startsWith('"use client";')) {
     content = content.replace('"use client";', '"use client";\n' + importStatement);
  } else {
     content = importStatement + content;
  }
  
  fs.writeFileSync(path, content);
  console.log('Fixed imports in ' + path);
});
