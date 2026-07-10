const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const root = process.cwd();

function walkSync(dir, callback) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
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
        const originalContent = content;

        // Fix text that can overflow: add min-w-0 to flex children that have truncate
        // This is a known issue where flex children don't properly truncate without min-w-0

        // 1. Fix p-8 padding in card content areas to be responsive
        content = content.replace(/className="([^"]*)\bp-8\b([^"]*)"/g, (match, p1, p2) => {
            // Only apply to div/section that aren't buttons or fixed-size elements
            if (p1.includes('sm:p-') || p2.includes('sm:p-')) return match;
            return `className="${p1}p-4 sm:p-8${p2}"`;
        });

        // 2. Fix p-6 padding to be responsive p-3 sm:p-6
        content = content.replace(/className="([^"]*)\bp-6\b([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('sm:p-') || p2.includes('sm:p-') || p1.includes('p-4') || p2.includes('p-4')) return match;
            return `className="${p1}p-3 sm:p-6${p2}"`;
        });

        // 3. Fix text-2xl in headings to be responsive
        content = content.replace(/className="([^"]*)text-2xl([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('sm:text-') || p2.includes('sm:text-') || p1.includes('md:text-') || p2.includes('md:text-')) return match;
            return `className="${p1}text-xl sm:text-2xl${p2}"`;
        });

        // 4. Fix text-4xl in large headings to be responsive
        content = content.replace(/className="([^"]*)text-4xl([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('sm:text-') || p2.includes('sm:text-') || p1.includes('md:text-') || p2.includes('md:text-')) return match;
            return `className="${p1}text-2xl sm:text-4xl${p2}"`;
        });

        // 5. Fix text-3xl
        content = content.replace(/className="([^"]*)text-3xl([^"]*)"/g, (match, p1, p2) => {
            if (p1.includes('sm:text-') || p2.includes('sm:text-') || p1.includes('md:text-') || p2.includes('md:text-')) return match;
            return `className="${p1}text-xl sm:text-3xl${p2}"`;
        });

        if (content !== originalContent) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`Updated: ${filepath}`);
            filesChanged++;
        }
    });
});

console.log(`\nFinished updating ${filesChanged} files.`);
