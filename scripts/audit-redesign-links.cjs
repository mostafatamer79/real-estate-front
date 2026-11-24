/* Read-only route inventory; dynamic values still require browser review. */
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const pages=files(path.join(root,'app')).filter(p=>/\/page\.[jt]sx?$/.test(p)).map(p=>'/'+path.relative(path.join(root,'app'),path.dirname(p)).split(path.sep).filter(p=>p&&!/^\(.*\)$/.test(p)).join('/'));
const matchers=pages.map(p=>new RegExp('^'+p.split('/').map(s=>s.startsWith('[...')?'.+':s.startsWith('[[...')?'.*':s.startsWith('[')?'[^/]+':s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'/?$'));
const links=[],dynamic=[];
for(const dir of ['app','components'])for(const file of files(path.join(root,dir)).filter(p=>/\.[jt]sx?$/.test(p))){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function record(node,value){const at={file:path.relative(root,file),line:source.getLineAndCharacterOfPosition(node.getStart()).line+1};if(value&&ts.isJsxExpression(value))value=value.expression;if(value&&(ts.isStringLiteral(value)||ts.isNoSubstitutionTemplateLiteral(value))){const target=value.text;if(target.startsWith('/')){const pathname=target.split(/[?#]/)[0]||'/';links.push({...at,target,status:pathname==='/socket.io'?'transport':matchers.some(m=>m.test(pathname))?'route':fs.existsSync(path.join(root,'public',pathname))?'asset':'missing'});}}else if(value)dynamic.push({...at,expression:value.getText(source).slice(0,160)});}
 function visit(node){if(ts.isJsxAttribute(node)&&node.name.getText(source)==='href')record(node,node.initializer);if(ts.isPropertyAssignment(node)&&['href','path','route'].includes(node.name.getText(source).replace(/['"]/g,'')))record(node,node.initializer);if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&['push','replace'].includes(node.expression.name.text)&&/router/i.test(node.expression.expression.getText(source)))record(node,node.arguments[0]);ts.forEachChild(node,visit);}visit(source);
}
const report={scope:'Static internal navigation and route data only; not UI or endpoint validation',pages,links,dynamic,missing:links.filter(l=>l.status==='missing')};
const out=path.join(root,'docs/verification/redesign-2026-11-16/current-link-audit.json');fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({pages:pages.length,staticLinks:links.length,dynamic:dynamic.length,missing:report.missing},null,2));
