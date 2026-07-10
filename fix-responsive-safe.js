const fs = require('fs');
const path = require('path');

const root = process.cwd();
let totalChanges = 0;

function walkSync(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        if (filepath.includes('node_modules') || filepath.includes('.next')) return;
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) walkSync(filepath, callback);
        else if (file.endsWith('.tsx') || file.endsWith('.jsx')) callback(filepath);
    });
}

function safeApplyFixes(filepath, content) {
    const original = content;

    // ─── 1. Fix max-w-7xl / max-w-6xl / max-w-5xl with no px ──────────────────
    content = content.replace(
        /className="([^"]*)\bmax-w-7xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-7xl mx-auto px-4 md:px-6 lg:px-8${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bmax-w-6xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-6xl mx-auto px-4 md:px-6${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bmax-w-5xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-5xl mx-auto px-4 md:px-6${p2}"`;
        }
    );

    // ─── 2. Fix gap-8 and gap-6 to be responsive ────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bgap-8\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:gap-') || p2.includes('md:gap-') || p1.includes('sm:gap-') || p2.includes('sm:gap-')) return match;
            return `className="${p1}gap-4 md:gap-8${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bgap-6\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:gap-') || p2.includes('md:gap-') || p1.includes('sm:gap-') || p2.includes('sm:gap-')) return match;
            return `className="${p1}gap-3 md:gap-6${p2}"`;
        }
    );

    // ─── 3. Fix hard coded w-screen that causes overflow ──────────────────────
    content = content.replace(
        /className="([^"]*)\bw-screen\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('overflow-hidden') || p2.includes('overflow-hidden')) return match;
            return `className="${p1}w-full${p2}"`;
        }
    );

    // ─── 4. Fix columns: grid-cols-3 and grid-cols-4 ───────────────────────
    content = content.replace(
        /className="([^"]*)\bgrid-cols-3\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols') ||
                p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') ||
                p1.includes('grid-cols-1') || p2.includes('grid-cols-1')) return match;
            return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-3${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bgrid-cols-4\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:grid-cols') || p2.includes('md:grid-cols') ||
                p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') ||
                p1.includes('grid-cols-1') || p2.includes('grid-cols-1')) return match;
            return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-4${p2}"`;
        }
    );

    // ─── 5. Fix absolute px-12 / px-10 to responsive ────────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpx-12\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:px-') || p2.includes('md:px-') ||
                p1.includes('sm:px-') || p2.includes('sm:px-')) return match;
            return `className="${p1}px-4 md:px-12${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bpx-10\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:px-') || p2.includes('md:px-') ||
                p1.includes('sm:px-') || p2.includes('sm:px-')) return match;
            return `className="${p1}px-4 md:px-10${p2}"`;
        }
    );

    // ─── 6. Fix py-12 / py-16 to be responsive ────────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpy-12\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:py-') || p2.includes('md:py-') ||
                p1.includes('sm:py-') || p2.includes('sm:py-')) return match;
            return `className="${p1}py-6 md:py-12${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bpy-16\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:py-') || p2.includes('md:py-') ||
                p1.includes('sm:py-') || p2.includes('sm:py-')) return match;
            return `className="${p1}py-8 md:py-16${p2}"`;
        }
    );

    // ─── 7. Fix text-5xl / text-6xl to be responsive ────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\btext-5xl\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:text-') || p2.includes('md:text-') ||
                p1.includes('sm:text-') || p2.includes('sm:text-')) return match;
            return `className="${p1}text-3xl md:text-5xl${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\btext-6xl\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:text-') || p2.includes('md:text-') ||
                p1.includes('sm:text-') || p2.includes('sm:text-')) return match;
            return `className="${p1}text-3xl md:text-6xl${p2}"`;
        }
    );

    // ─── 8. Fix space-x-8 (horizontal) to be responsive ─────────────────────
    content = content.replace(
        /className="([^"]*)\bspace-x-8\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('md:space-x-') || p2.includes('md:space-x-') ||
                p1.includes('sm:space-x-') || p2.includes('sm:space-x-')) return match;
            return `className="${p1}space-x-4 md:space-x-8${p2}"`;
        }
    );

    // ─── 9. Safely fix flex items that have w-[fixed wide] ──────────────────────────
    content = content.replace(
        /className="([^"]*)\bw-\[([456]\d\dpx)\]\b([^"]*)"/g,
        (match, p1, widthVal, p2) => {
            if (p1.includes('md:w-') || p2.includes('md:w-') || 
                p1.includes('sm:w-') || p2.includes('sm:w-')) return match;
            if (p1.includes('fixed') || p2.includes('fixed') || 
                p1.includes('absolute') || p2.includes('absolute')) return match;
            return `className="${p1}w-full md:w-[${widthVal}]${p2}"`;
        }
    );

    if (content !== original) {
        totalChanges++;
        console.log(`Updated: ${filepath}`);
    }
    return content;
}

// Process all files
['app', 'components'].forEach(dir => {
    walkSync(path.join(root, dir), filepath => {
        let content = fs.readFileSync(filepath, 'utf8');
        const fixed = safeApplyFixes(filepath, content);
        if (fixed !== content) {
            fs.writeFileSync(filepath, fixed, 'utf8');
        }
    });
});

console.log(`\n✅ Safe mobile fixes applied to ${totalChanges} files.`);
