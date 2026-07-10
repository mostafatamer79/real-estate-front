/**
 * COMPREHENSIVE RESPONSIVE AUDIT & FIX SCRIPT
 * Scans all TSX files and applies responsive fixes for ALL known mobile issues
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
let totalChanges = 0;
const report = [];

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

function applyFixes(filepath, content) {
    const original = content;
    const changes = [];

    // ─── 1. Fix max-w-7xl / max-w-6xl / max-w-5xl with no px ──────────────────
    // Ensure content wrappers have responsive padding
    content = content.replace(
        /className="([^"]*)\bmax-w-7xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-7xl mx-auto px-4 sm:px-6 lg:px-8${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bmax-w-6xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-6xl mx-auto px-4 sm:px-6${p2}"`;
        }
    );
    content = content.replace(
        /className="([^"]*)\bmax-w-5xl mx-auto\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('px-') || p2.includes('px-')) return match;
            return `className="${p1}max-w-5xl mx-auto px-4 sm:px-6${p2}"`;
        }
    );

    // ─── 2. Fix gap-8 to be responsive gap ────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bgap-8\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:gap-') || p2.includes('sm:gap-')) return match;
            return `className="${p1}gap-4 sm:gap-8${p2}"`;
        }
    );

    // ─── 3. Fix overflow-x-hidden on body-level divs (common cause of blank right space) ──
    // No auto-fix needed, this is correct behavior

    // ─── 4. Fix hard coded w-screen that causes overflow ──────────────────────
    content = content.replace(
        /className="([^"]*)\bw-screen\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('overflow-hidden') || p2.includes('overflow-hidden')) return match;
            return `className="${p1}w-full${p2}"`;
        }
    );

    // ─── 5. Fix columns: grid-cols-3 without responsive ───────────────────────
    content = content.replace(
        /className="([^"]*)\bgrid-cols-3\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') ||
                p1.includes('md:grid-cols') || p2.includes('md:grid-cols') ||
                p1.includes('grid-cols-1') || p2.includes('grid-cols-1')) return match;
            return `className="${p1}grid-cols-1 sm:grid-cols-2 lg:grid-cols-3${p2}"`;
        }
    );

    // ─── 6. Fix columns: grid-cols-4 without responsive ───────────────────────
    content = content.replace(
        /className="([^"]*)\bgrid-cols-4\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:grid-cols') || p2.includes('sm:grid-cols') ||
                p1.includes('md:grid-cols') || p2.includes('md:grid-cols') ||
                p1.includes('grid-cols-1') || p2.includes('grid-cols-1')) return match;
            return `className="${p1}grid-cols-1 sm:grid-cols-2 lg:grid-cols-4${p2}"`;
        }
    );

    // ─── 7. Fix px-12 to be responsive ────────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpx-12\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:px-') || p2.includes('sm:px-') ||
                p1.includes('lg:px-') || p2.includes('lg:px-')) return match;
            return `className="${p1}px-4 sm:px-12${p2}"`;
        }
    );

    // ─── 8. Fix px-10 to be responsive ────────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpx-10\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:px-') || p2.includes('sm:px-')) return match;
            return `className="${p1}px-4 sm:px-10${p2}"`;
        }
    );

    // ─── 9. Fix py-12 to be responsive ────────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpy-12\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:py-') || p2.includes('sm:py-') ||
                p1.includes('lg:py-') || p2.includes('lg:py-')) return match;
            return `className="${p1}py-6 sm:py-12${p2}"`;
        }
    );

    // ─── 10. Fix py-16 to be responsive ───────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\bpy-16\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:py-') || p2.includes('sm:py-') ||
                p1.includes('lg:py-') || p2.includes('lg:py-')) return match;
            return `className="${p1}py-8 sm:py-16${p2}"`;
        }
    );

    // ─── 11. Fix text-5xl to be responsive ────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\btext-5xl\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:text-') || p2.includes('sm:text-') ||
                p1.includes('md:text-') || p2.includes('md:text-')) return match;
            return `className="${p1}text-3xl sm:text-5xl${p2}"`;
        }
    );

    // ─── 12. Fix text-6xl to be responsive ────────────────────────────────────
    content = content.replace(
        /className="([^"]*)\btext-6xl\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:text-') || p2.includes('sm:text-') ||
                p1.includes('md:text-') || p2.includes('md:text-')) return match;
            return `className="${p1}text-3xl sm:text-6xl${p2}"`;
        }
    );

    // ─── 13. Fix space-x-8 (horizontal) to be responsive ─────────────────────
    content = content.replace(
        /className="([^"]*)\bspace-x-8\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:space-x-') || p2.includes('sm:space-x-')) return match;
            return `className="${p1}space-x-4 sm:space-x-8${p2}"`;
        }
    );

    // ─── 14. Fix flex items that have w-[fixed wide] ──────────────────────────
    // Fix w-[400px] and similar that may overflow on mobile
    content = content.replace(
        /className="([^"]*)\bw-\[4\d\dpx\]\b([^"]*)"/g,
        (match, p1, p2) => {
            if (p1.includes('sm:w-') || p2.includes('sm:w-')) return match;
            return `className="${p1}w-full sm:${match.match(/w-\[\d+px\]/)?.[0] || 'w-full'}${p2}"`;
        }
    );

    if (content !== original) {
        totalChanges++;
        report.push({ file: filepath.replace(root + '/', ''), changed: true });
    }
    return content;
}

// Also find and report pages that still have issues to manually fix
function analyzeForIssues(filepath, content) {
    const issues = [];
    
    // Fixed sidebars that aren't hidden on mobile
    if (content.includes('fixed') && content.includes('right-0') && 
        !content.includes('hidden lg:') && !content.includes('lg:hidden') &&
        !filepath.includes('Header') && !filepath.includes('WalletSidebar') &&
        !filepath.includes('shell') && !filepath.includes('admin/layout') &&
        !filepath.includes('department-hub') && !filepath.includes('buildingmanagement') &&
        !filepath.includes('offers/page')) {
        issues.push('⚠️  FIXED SIDEBAR: Still has fixed right-0 without mobile toggle');
    }

    if (issues.length > 0) {
        report.push({ file: filepath.replace(root + '/', ''), issues });
        return issues;
    }
    return [];
}

// Process all files
['app', 'components'].forEach(dir => {
    walkSync(path.join(root, dir), filepath => {
        let content = fs.readFileSync(filepath, 'utf8');
        const issues = analyzeForIssues(filepath, content);
        const fixed = applyFixes(filepath, content);
        if (fixed !== content) {
            fs.writeFileSync(filepath, fixed, 'utf8');
        }
    });
});

console.log('\n=== RESPONSIVE FIX REPORT ===');
console.log(`\nFiles Updated: ${totalChanges}`);
console.log('\n--- Pages with Remaining Sidebar Issues ---');
report.filter(r => r.issues).forEach(r => {
    console.log(`\n📄 ${r.file}`);
    r.issues.forEach(i => console.log(`   ${i}`));
});
console.log('\n=== DONE ===');
