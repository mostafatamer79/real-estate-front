const fs = require('fs');
const file = 'app/details/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the Back button at the very top of the page content
const backButtonHtml = `
        {/* Mobile App Bar */}
        <div className="flex md:hidden items-center justify-between px-4 sm:px-6 pt-4 pb-2 relative z-50">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className={\`w-5 h-5 \${language === 'ar' ? 'rotate-180' : ''}\`} />
          </button>
          <div className="text-sm font-bold text-white tracking-widest uppercase">
             {t("common.back") || "رجوع"}
          </div>
          <div className="w-10 h-10" />
        </div>
`;

if (!content.includes('Mobile App Bar')) {
    content = content.replace(
        /(<div className="w-full min-h-dvh-safe bg-slate-950 pt-12 pb-12 relative overflow-hidden"[^>]*>)/,
        `$1\n${backButtonHtml}`
    );
    
    // We also need to make sure pt-12 is less on mobile so we don't have too much space
    content = content.replace(
        /pt-12 pb-12/,
        'pt-4 md:pt-12 pb-12'
    );
    
    // Make sure ArrowLeft is imported
    if (!content.includes('ArrowLeft')) {
        content = content.replace(/import \{([^}]+)\} from "lucide-react";/, 'import { $1, ArrowLeft } from "lucide-react";');
    }
}

fs.writeFileSync(file, content);
console.log('Details page patched.');
