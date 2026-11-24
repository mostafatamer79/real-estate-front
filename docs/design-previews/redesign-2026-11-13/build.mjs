import fs from 'node:fs';
import path from 'node:path';

const dir = import.meta.dirname;
const source = fs.readFileSync(path.join(dir, '../white-light-2026-11-11/01-calm-platform.html'), 'utf8');
const match = source.match(/<script id="route-data" type="application\/json">([\s\S]*?)<\/script>/);
if (!match) throw new Error('Could not read route inventory');
const routes = JSON.parse(match[1]);
const template = fs.readFileSync(path.join(dir, 'template.html'), 'utf8');
const style = fs.readFileSync(path.join(dir, 'style.css'), 'utf8') + '\n' + fs.readFileSync(path.join(dir, 'directions.css'), 'utf8');
const script = fs.readFileSync(path.join(dir, 'preview-app.js'), 'utf8');
const concepts = [
  ['01-immersive-gallery.html', 'gallery', 'المعرض العقاري', 'صور واسعة، بحث واضح، ومساحات هادئة'],
  ['02-precision-workspace.html', 'workspace', 'مساحة العمل', 'قرارات وبيانات وأدوات في تخطيط مركز'],
  ['03-editorial-residence.html', 'editorial', 'الواجهة التحريرية', 'عناوين كبيرة، إيقاع معماري، ومحتوى قصصي'],
  ['04-compact-command.html', 'compact', 'التحكم السريع', 'كثافة أعلى ووصول أسرع إلى الإجراءات'],
];
const nav = concepts.map(([file, key, name], index) => `<a href="${file}" data-variant="${key}">${String(index + 1).padStart(2, '0')} · ${name}</a>`).join('');
for (const [file, key, name, description] of concepts) {
  fs.writeFileSync(path.join(dir, file), template
    .replaceAll('__VARIANT__', key).replaceAll('__NAME__', name)
    .replaceAll('__DESCRIPTION__', description).replace('__NAV__', nav)
    .replace('__ROUTES__', JSON.stringify(routes).replaceAll('<', '\\u003c'))
    .replace('__STYLE__', style).replace('__SCRIPT__', script.replaceAll('__NAME__', name).replaceAll('__VARIANT__', key)));
}
console.log(`Generated ${concepts.length} previews × 2 themes × ${routes.length} routes.`);
