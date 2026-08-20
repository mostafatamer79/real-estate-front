const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const root = process.cwd();

function walkSync(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filepath = path.join(dir, file);
        if (filepath.includes('node_modules') || filepath.includes('.next')) return;
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) walkSync(filepath, callback);
        else if (file.endsWith('.tsx') || file.endsWith('.jsx')) callback(filepath);
    });
}

let totalChanges = 0;

function applyFixes(filepath, content) {
    const original = content;

    // 1. Duplicate/conflicting width classes
    content = content.replace(/w-full\s+w-\[95vw\]/g, 'w-[95vw]');

    // 2. Redundant md:grid-cols-1 before md:grid-cols-2
    content = content.replace(
        /grid-cols-1\s+md:grid-cols-1\s+md:grid-cols-2(\s+lg:grid-cols-(\d+))?/g,
        (match, p1, p2) => {
            return p1 ? `grid-cols-1 md:grid-cols-2 ${p1.trim()}` : 'grid-cols-1 md:grid-cols-2';
        }
    );

    // 3. Inverted grids: mobile 2 cols, sm 1 col
    content = content.replace(
        /grid-cols-2\s+md:grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-(\d+)/g,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-$1'
    );
    content = content.replace(
        /grid-cols-2\s+sm:grid-cols-1\s+md:grid-cols-2\s+lg:grid-cols-(\d+)/g,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-$1'
    );

    // 4. Other common redundant sm:grid-cols-1 after grid-cols-1
    content = content.replace(
        /grid-cols-1\s+sm:grid-cols-1(\s+md:grid-cols-2)/g,
        'grid-cols-1$1'
    );

    // 5. Dialog mobile width fallback: only inside DialogContent className
    // Avoid adding if w-[95vw] or w-[calc(...)] or w-full already present
    content = content.replace(
        /(<DialogContent[^>]*className=")([^"]*)(?<!(?:w-\[95vw\]|w-\[calc\([^\]]+\)]|w-full)\s*)sm:max-w-\[?(\d+px|\d+xl|md|lg|xl|2xl|3xl|4xl|5xl)\]?([^"]*)(")/g,
        (match, p1, p2, p3, p4, p5) => {
            if (/w-\[95vw\]|w-\[calc\(|w-full/.test(p2)) return match;
            return `${p1}${p2}w-[95vw] sm:max-w-${p3}${p4}${p5}`;
        }
    );

    if (content !== original) {
        totalChanges++;
        console.log(`Updated: ${filepath}`);
    }
    return content;
}

targetDirs.forEach(dir => {
    walkSync(path.join(root, dir), filepath => {
        let content = fs.readFileSync(filepath, 'utf8');
        const fixed = applyFixes(filepath, content);
        if (fixed !== content) {
            fs.writeFileSync(filepath, fixed, 'utf8');
        }
    });
});

console.log(`\n✅ Mobile cleanup applied to ${totalChanges} files.`);
