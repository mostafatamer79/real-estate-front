/**
 * FINAL COMPREHENSIVE MOBILE FIX - ROUND 4
 * Targets every remaining class pattern that causes mobile layout issues
 */

const fs = require('fs');
const path = require('path');

const root = process.cwd();
let filesChanged = 0;
const changedFiles = [];

function walkSync(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (filepath.includes('node_modules') || filepath.includes('.next')) return;
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) walkSync(filepath, callback);
        else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) callback(filepath);
    });
}

function fix(content, filepath) {
    let c = content;

    // ── 1. Hardcoded min-w that causes overflow on mobile ──────────────────────
    // min-w-[500px] etc → remove or make conditional
    c = c.replace(/\bmin-w-\[(\d{3,})px\]/g, (m, n) => parseInt(n) > 300 ? 'min-w-0' : m);

    // ── 2. overflow-x: hidden on outermost wrapper ─────────────────────────────
    // Replace "overflow-hidden" on outer page divs with "overflow-x-hidden"
    // Actually ensure the html/body don't overflow
    // This is handled in globals.css, skip

    // ── 3. flex-nowrap that causes overflow ────────────────────────────────────
    c = c.replace(/className="([^"]*)\bflex\b([^"]*)\bflex-row\b([^"]*)"(?![^>]*\bwrap)/g, (match) => {
        // Only apply if not already wrapped
        return match; // too risky to auto-fix flex-row, skip
    });

    // ── 4. Fix w-full on inputs/buttons for mobile (usually fine, but check table cells) ─

    // ── 5. Fix hardcoded widths in flex containers that overflow ───────────────
    // w-[300px] w-[350px] w-[400px] etc in flex → add max-w-full
    c = c.replace(/className="([^"]*)\bw-\[(\d{3,4})px\]\b([^"]*)"/g, (match, p1, n, p2) => {
        const num = parseInt(n);
        if (num <= 300) return match;
        if (p1.includes('max-w-') || p2.includes('max-w-') || p1.includes('sm:w-') || p2.includes('sm:w-')) return match;
        if (p1.includes('fixed') || p2.includes('fixed') || p1.includes('absolute') || p2.includes('absolute')) return match;
        return `className="${p1}w-full sm:w-[${n}px]${p2}"`;
    });

    // ── 6. Fix DialogContent widths ─────────────────────────────────────────────
    // Ensure all DialogContent have w-[95vw] for mobile
    c = c.replace(/<DialogContent\s+className="([^"]*)(?:max-w-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|lg|md|sm))([^"]*)">/g, (match, p1, p2) => {
        if (p1.includes('w-[95vw]') || p1.includes('w-\\[95vw\\]')) return match;
        const maxWMatch = match.match(/max-w-(\w+)/);
        const maxW = maxWMatch ? maxWMatch[0] : 'max-w-xl';
        return `<DialogContent className="${p1}w-[95vw] sm:${maxW}${p2}">`;
    });

    // ── 7. Fix px-4 missing on main containers ─────────────────────────────────
    // section/main with no padding → add px-4
    c = c.replace(/<(section|main)\s+className="([^"]*)\bw-full\b([^"]*)">/g, (match, tag, p1, p2) => {
        if (p1.includes('px-') || p2.includes('px-')) return match;
        return `<${tag} className="${p1}w-full px-4 sm:px-0${p2}">`;
    });

    // ── 8. Fix table overflow (ensure all tables wrapped in overflow-x-auto) ───
    c = c.replace(/<table\s+className="([^"]*)">/g, (match, cls) => {
        // Check if parent has overflow-x-auto - can't easily check, skip
        return match;
    });

    // ── 9. Hidden scrollbar on overflow containers ─────────────────────────────
    c = c.replace(/className="([^"]*)\boverflow-x-auto\b([^"]*)"/g, (match, p1, p2) => {
        if (p1.includes('scrollbar') || p2.includes('scrollbar')) return match;
        return `className="${p1}overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200${p2}"`;
    });

    // ── 10. Fix space-y-8 / space-y-10 / space-y-12 ──────────────────────────
    c = c.replace(/className="([^"]*)\bspace-y-12\b([^"]*)"/g, (match, p1, p2) => {
        if (p1.includes('sm:space-y') || p2.includes('sm:space-y')) return match;
        return `className="${p1}space-y-6 sm:space-y-12${p2}"`;
    });
    c = c.replace(/className="([^"]*)\bspace-y-10\b([^"]*)"/g, (match, p1, p2) => {
        if (p1.includes('sm:space-y') || p2.includes('sm:space-y')) return match;
        return `className="${p1}space-y-5 sm:space-y-10${p2}"`;
    });

    // ── 11. Truncate long text in table cells ─────────────────────────────────
    // Already handled by whitespace-nowrap in InvoicesSection

    // ── 12. Fix flex items-center gap on small screens ────────────────────────
    // gap-6 in flex → responsive
    c = c.replace(/className="([^"]*)\bflex\b([^"]*)\bgap-6\b([^"]*)"/g, (match, p1, p2, p3) => {
        if (p1.includes('sm:gap-') || p2.includes('sm:gap-') || p3.includes('sm:gap-')) return match;
        if (p1.includes('flex-col') || p2.includes('flex-col')) return match;
        return `className="${p1}flex${p2}gap-3 sm:gap-6${p3}"`;
    });

    // ── 13. Fix rounded-3xl padding on mobile (too much rounding for tiny screen) ─
    // Actually fine, skip

    // ── 14. Fix mb-12 / mb-16 / mb-20 to responsive ──────────────────────────
    c = c.replace(/className="([^"]*)\bmb-16\b([^"]*)"/g, (match, p1, p2) => {
        if (p1.includes('sm:mb-') || p2.includes('sm:mb-')) return match;
        return `className="${p1}mb-8 sm:mb-16${p2}"`;
    });
    c = c.replace(/className="([^"]*)\bmb-20\b([^"]*)"/g, (match, p1, p2) => {
        if (p1.includes('sm:mb-') || p2.includes('sm:mb-')) return match;
        return `className="${p1}mb-10 sm:mb-20${p2}"`;
    });

    return c;
}

// Apply to all files
['app', 'components'].forEach(dir => {
    walkSync(path.join(root, dir), filepath => {
        const original = fs.readFileSync(filepath, 'utf8');
        const fixed = fix(original, filepath);
        if (fixed !== original) {
            fs.writeFileSync(filepath, fixed, 'utf8');
            filesChanged++;
            changedFiles.push(filepath.replace(root + '/', ''));
        }
    });
});

console.log(`\n✅ Files updated: ${filesChanged}`);
changedFiles.forEach(f => console.log(`  • ${f}`));
