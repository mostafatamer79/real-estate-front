const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const root = process.cwd();

function walkSync(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        var filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walkSync(filepath, callback);
        } else if (stats.isFile() && (filepath.endsWith('.tsx') || filepath.endsWith('.jsx'))) {
            callback(filepath);
        }
    });
}

let filesChanged = 0;

targetDirs.forEach(dir => {
    walkSync(path.join(root, dir), (filepath) => {
        let content = fs.readFileSync(filepath, 'utf8');
        let originalContent = content;

        // 1. Wrap <Table> with overflow-x-auto w-full if not already wrapped
        // We look for <Table> that isn't preceded immediately by an overflow div.
        // This regex is simplistic but works for most cases
        if (content.includes('<Table>') && !content.includes('overflow-x-auto') && !filepath.includes('PaymentsManager.tsx')) {
            content = content.replace(/<Table>/g, '<div className="overflow-x-auto w-full">\n<Table>');
            content = content.replace(/<\/Table>/g, '</Table>\n</div>');
        }

        // 2. Fix hardcoded grid-cols-2 to grid-cols-1 md:grid-cols-2
        // Only if it doesn't already have md: or sm: or lg: grid-cols
        content = content.replace(/className="([^"]*)grid-cols-2([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols') || p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols')) {
                return match;
            }
            return `className="${p1}grid-cols-1 md:grid-cols-2${p2}"`;
        });

        // 3. Fix hardcoded grid-cols-3
        content = content.replace(/className="([^"]*)grid-cols-3([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols') || p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') || p1.includes('lg:grid-cols') || p2.includes('lg:grid-cols')) {
                return match;
            }
            return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-3${p2}"`;
        });

        // 4. Fix hardcoded grid-cols-4
        content = content.replace(/className="([^"]*)grid-cols-4([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols') || p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') || p1.includes('lg:grid-cols') || p2.includes('lg:grid-cols')) {
                return match;
            }
            return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-4${p2}"`;
        });

        // 5. Fix Dialog max-w-md
        content = content.replace(/className="([^"]*)max-w-md([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('w-[') || p2.includes('w-[')) {
                return match; // Already has specific width
            }
            // add w-[95vw] sm:max-w-md, remove max-w-md
            return `className="${p1}w-[95vw] sm:max-w-md${p2}"`;
        });
        
        // 6. Fix Dialog max-w-lg
        content = content.replace(/className="([^"]*)max-w-lg([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('w-[') || p2.includes('w-[')) {
                return match; 
            }
            return `className="${p1}w-[95vw] sm:max-w-lg${p2}"`;
        });
        
        // 7. Fix Dialog max-w-2xl
        content = content.replace(/className="([^"]*)max-w-2xl([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('w-[') || p2.includes('w-[')) {
                return match; 
            }
            return `className="${p1}w-[95vw] sm:max-w-2xl${p2}"`;
        });
        
        // 8. Fix Dialog max-w-3xl
        content = content.replace(/className="([^"]*)max-w-3xl([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('w-[') || p2.includes('w-[')) {
                return match; 
            }
            return `className="${p1}w-[95vw] sm:max-w-3xl${p2}"`;
        });

        // 9. Fix absolute positioned top nav overlapping content by ensuring PageWrapper has top padding.
        // We'll skip this via regex and do it manually if needed, or assume PageWrapper handles it.

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`Updated: ${filepath}`);
            filesChanged++;
        }
    });
});

console.log(`\nFinished updating ${filesChanged} files.`);
