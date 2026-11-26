/* Interactions for this preview only. The original seven concepts are untouched. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const ease='cubic-bezier(.22,1,.36,1)';
 const animate=(el,frames,options={})=>{
  if(reduce.matches)return null;
  return el.animate(frames,{duration:650,easing:ease,...options});
 };
 const watched=new Set();
 const reveal=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting||watched.has(target))return;
  watched.add(target);target.classList.add('seen');
  const image=target.matches('.photo,.service-visual,.vision-image');
  animate(target,image?[{clipPath:'inset(12% 0 88% 0 round 140px)',opacity:.5},{clipPath:'inset(0 0 0 0 round 0px)',opacity:1}]:[{opacity:0,transform:'translateY(36px)'},{opacity:1,transform:'none'}],{duration:image?1100:750});
  if(image){const img=target.querySelector('img');if(img)animate(img,[{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:1400})}
 }),{threshold:.08});
 document.querySelectorAll('.reveal,.vision-image').forEach(el=>reveal.observe(el));
 const scene=document.querySelector('.scene-reveal');
 const ribbon=document.querySelector('.chapter-ribbon');
 const steps=document.querySelector('.journey-steps');
 const end=document.querySelector('.portal-end');
 const progress=document.querySelector('.progress');
 let scheduled=false;
 const clamp=v=>Math.min(1,Math.max(0,v));
 function draw(){
  scheduled=false;
  const h=innerHeight,y=scrollY;
  // Batch geometry reads before style writes.
  const r=scene.getBoundingClientRect(),rr=ribbon.getBoundingClientRect(),sr=steps.getBoundingClientRect(),er=end.getBoundingClientRect();
  const p=reduce.matches?1:clamp((h-r.top)/(h*.85));
  progress.style.transform=`scaleX(${y/Math.max(1,document.documentElement.scrollHeight-h)})`;
  scene.style.setProperty('--scene-width',`${76+p*24}%`);
  scene.style.setProperty('--scene-radius',`${(1-p)*170}px`);
  scene.style.setProperty('--scene-scale',`${1.17-p*.17}`);
  ribbon.style.setProperty('--ribbon-shift',`${reduce.matches?0:(h/2-rr.top)*.055}px`);
  ribbon.style.setProperty('--ribbon-turn',`${reduce.matches?0:(h/2-rr.top)*.025}deg`);
  steps.style.setProperty('--step-progress',reduce.matches?1:clamp((h*.85-sr.top)/(sr.height*.8)));
  end.style.setProperty('--end-open',reduce.matches?1:clamp((h-er.top)/(h*.7)));
 }
 function request(){if(!scheduled){scheduled=true;requestAnimationFrame(draw)}}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request);reduce.addEventListener('change',request);draw();
 const serviceImage=document.querySelector('#service-image');let serviceVersion=0;
 async function selectService(row){
  if(row.classList.contains('active'))return;
  const version=++serviceVersion;
  document.querySelectorAll('.service-row').forEach(r=>{r.classList.toggle('active',r===row);r.setAttribute('aria-pressed',String(r===row))});
  const src='../../artworks/banan/'+row.dataset.service,loaded=new Image();loaded.src=src;
  try{await loaded.decode()}catch{return}if(version!==serviceVersion)return;
  const old=serviceImage.cloneNode();old.removeAttribute('id');old.alt='';old.setAttribute('aria-hidden','true');old.className='service-previous';
  // Cancel previous wipes when a new selection supersedes them.
  serviceImage.parentElement.querySelectorAll('.service-previous').forEach(el=>el.remove());
  serviceImage.parentElement.append(old);serviceImage.src=src;serviceImage.alt=row.dataset.description;
  const wipe=animate(old,[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(0 0 0 100%)'}],{duration:850});
  if(wipe)wipe.finished.then(()=>old.remove()).catch(()=>old.remove());else old.remove();
  serviceImage.getAnimations().forEach(a=>a.cancel());
  animate(serviceImage,[{transform:'scale(1.12)'},{transform:'scale(1.02)'}],{duration:1100});
 }
 document.querySelectorAll('.service-row').forEach(row=>{
  row.addEventListener('click',()=>selectService(row));
  row.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')selectService(row)});
  row.addEventListener('focus',()=>selectService(row));
 });
 const demo=document.createElement('dialog');demo.className='preview-dialog';demo.setAttribute('aria-label','معاينة المنصة');
 demo.innerHTML='<h2>خطوتك التالية.</h2><p>هذه معاينة تفاعلية للتصميم. استكشف الحركة والتفاصيل؛ تُربط وظائف المنصة بعد اعتماد الاتجاه.</p><form method="dialog"><button class="pill">أكمل الاستكشاف</button></form>';
 document.body.append(demo);
 document.querySelectorAll('a[href^="/"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();if(!demo.open){demo.showModal();animate(demo,[{opacity:0,transform:'translateY(25px) scale(.97)'},{opacity:1,transform:'none'}],{duration:350})}}));
 reduce.addEventListener('change',()=>{if(reduce.matches)document.getAnimations().forEach(a=>a.cancel())});
})();
