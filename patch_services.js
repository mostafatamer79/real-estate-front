const fs = require('fs');
const file = 'app/services/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Optimize Back Button
content = content.replace(
  /className="group flex items-center gap-2 text-slate-600 hover:text-slate-500 transition-colors text-\[10px\] font-bold uppercase tracking-widest mb-6 sm:mb-8"/,
  'className="group flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm font-medium mb-4 sm:mb-8"'
);
content = content.replace(
  /className="w-6 h-6 rounded-full bg-card\/\[0\.02\] border border-white\/\[0\.06\] group-hover:bg-card\/\[0\.05\] flex items-center justify-center transition-all duration-200"/,
  'className="w-8 h-8 rounded-full bg-card/[0.05] border border-white/[0.1] group-hover:bg-card/[0.1] flex items-center justify-center transition-all duration-200"'
);
content = content.replace(
  /className=\{`w-3 h-3 \$\{isRtl \? "rotate-180" : ""\}`\}/,
  'className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`}'
);

// Optimize Title text
content = content.replace(
  /className="text-3xl sm:text-4xl md:text-5xl font-black tracking-\[-0\.03em\] leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white\/90 to-white\/40 mb-3"/,
  'className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 mb-3"'
);

// Optimize platform services badge
content = content.replace(
  /className="text-\[9px\] font-bold text-white\/50 uppercase tracking-widest"/,
  'className="text-[10px] sm:text-xs font-medium text-white/70 uppercase"'
);

// Optimize description
content = content.replace(
  /className="text-white\/40 text-sm w-full sm:max-w-lg leading-relaxed"/,
  'className="text-white/60 text-sm sm:text-base w-full sm:max-w-lg leading-relaxed"'
);

// Optimize cards layout for mobile to look like app (list on mobile, grid on desktop)
content = content.replace(
  /className="relative z-10 max-w-7xl w-full bg-slate-950 mx-auto px-4 sm:px-6 md:px-10 pb-12 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3"/,
  'className="relative z-10 max-w-7xl w-full bg-slate-950 mx-auto px-4 sm:px-6 md:px-10 pb-12 flex flex-col md:grid md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"'
);

// Optimize cards min-height for mobile list
content = content.replace(
  /min-h-\[140px\] sm:min-h-\[160px\]/,
  'min-h-[100px] sm:min-h-[160px]'
);

// Optimize card content for list style on mobile
content = content.replace(
  /className="mt-auto pt-4 relative z-10 w-full flex flex-row items-end justify-between"/,
  'className="mt-2 sm:mt-auto pt-2 sm:pt-4 relative z-10 w-full flex flex-row items-center sm:items-end justify-between"'
);

fs.writeFileSync(file, content);
console.log('Services page patched.');
