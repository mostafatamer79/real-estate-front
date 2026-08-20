const fs = require('fs');
const file = 'app/src/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const isMobileHiddenRoute')) {
  content = content.replace(
    /const isHiddenRoute = React\.useMemo\(\(\) => \{/,
    `const isMobileHiddenRoute = React.useMemo(() => {
    if (!pathname) return false;
    const mobileOnlyHidden = ['/profile', '/orders', '/offers', '/chat'];
    if (mobileOnlyHidden.some(p => pathname.startsWith(p))) return true;
    return false;
  }, [pathname]);\n\n  const isHiddenRoute = React.useMemo(() => {`
  );

  content = content.replace(
    /className=\{\`fixed top-0 left-0 right-0 h-16 z-\[9999\] transition-transform duration-300 bg-slate-950 border-b border-white\/10 \$\{/,
    `className={\`\${isMobileHiddenRoute ? 'hidden md:flex md:flex-col' : 'flex flex-col'} fixed top-0 left-0 right-0 h-16 z-[9999] transition-transform duration-300 bg-slate-950 border-b border-white/10 \${`
  );
  
  fs.writeFileSync(file, content);
  console.log('Header patched for mobile routes.');
} else {
  console.log('Header already patched.');
}
