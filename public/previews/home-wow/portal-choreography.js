/* One motion vocabulary across navigation, text, tabs and architectural details. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const ease='cubic-bezier(.22,1,.36,1)';
 const play=(el,frames,options={})=>{if(!reduced.matches)return el.animate(frames,{duration:650,easing:ease,...options})};
 const headingObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  headingObserver.unobserve(entry.target);
  entry.target.querySelectorAll('.motion-line>span').forEach((line,i)=>play(line,[{transform:'translateY(110%) rotate(2deg)'},{transform:'none'}],{duration:1000,delay:i*90}));
 }),{threshold:.25});
 document.querySelectorAll('.system-heading h2,.section h2,.section-top h2,.scene-text h2,.portal-end h2').forEach(h=>{
  const lines=h.innerHTML.split(/<br\s*\/?\s*>/i);
  h.innerHTML=lines.map(line=>`<span class="motion-line"><span>${line}</span></span>`).join('');headingObserver.observe(h);
 });
 const tabs=[...document.querySelectorAll('[data-system-tab]')];
 const tablist=document.querySelector('.system-tabs');
 const glider=document.createElement('span');glider.className='tab-glider';glider.setAttribute('aria-hidden','true');tablist.prepend(glider);
 function place(tab){
  const parent=tablist.getBoundingClientRect(),box=tab.getBoundingClientRect();
  Object.assign(glider.style,{width:`${box.width}px`,height:`${box.height}px`,transform:`translate(${box.left-parent.left-tablist.clientLeft}px,${box.top-parent.top-tablist.clientTop}px)`});
 }
 function select(tab,keyboard=false){
  const wasActive=tab.getAttribute('aria-selected')==='true';
  tabs.forEach(button=>{const active=button===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;document.getElementById(button.getAttribute('aria-controls')).hidden=!active});
  place(tab);if(wasActive)return;
  const panel=document.getElementById(tab.getAttribute('aria-controls'));
  panel.querySelectorAll('*').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
  if(!keyboard){
   play(panel.querySelector('.system-panel-copy'),[{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'none'}],{duration:500});
   panel.querySelectorAll('.diagram-brand,.diagram-flow span,.diagram-account').forEach((el,i)=>play(el,[{opacity:0,transform:'translateX(-18px)'},{opacity:1,transform:'none'}],{duration:450,delay:i*65}));
  }
 }
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',event=>{
   let next=i;
   if(event.key==='ArrowDown'||event.key==='ArrowRight')next=(i+1)%tabs.length;
   else if(event.key==='ArrowUp'||event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
   else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
   event.preventDefault();select(tabs[next],true);tabs[next].focus();
  });
 });
 const update=()=>place(tabs.find(t=>t.getAttribute('aria-selected')==='true'));
 new ResizeObserver(update).observe(tablist);document.fonts.ready.then(update);update();
 // Each step arrives as part of a single drawn route.
 const stepObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;stepObserver.unobserve(target);
  [...target.children].forEach((el,i)=>play(el,[{opacity:0,transform:'translateY(35px)'},{opacity:1,transform:'none'}],{duration:750,delay:i*70}));
 }),{threshold:.35});document.querySelectorAll('.steps-grid article').forEach(el=>stepObserver.observe(el));
 // Quiet contextual navigation follows the visitor through the chapters.
 const chapters=[['platform','المنصة'],['story','المكان'],['visions','رحلتك'],['experience','الخدمات']];
 const nav=document.createElement('nav');nav.className='chapter-nav';nav.setAttribute('aria-label','فصول التجربة');
 nav.innerHTML=chapters.map(([id,label])=>`<a href="#${id}" aria-label="${label}"><i></i><span>${label}</span></a>`).join('');
 document.body.append(nav);
 const chapterObserver=new IntersectionObserver(entries=>{
  const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!active)return;
  nav.querySelectorAll('a').forEach(a=>{const selected=a.hash==='#'+active.target.id;if(selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
 },{rootMargin:'-25% 0px -35% 0px',threshold:[0,.15,.4]});
 chapters.forEach(([id])=>chapterObserver.observe(document.getElementById(id)));
 const heroObserver=new IntersectionObserver(entries=>{nav.classList.toggle('visible',!entries[0].isIntersecting)},{threshold:0});heroObserver.observe(document.querySelector('[data-portal-film]'));
 // Let the existing theme logic own palette and persistence; only add its transition.
 addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('.theme-toggle');if(!button)return;
  const previous=button.onclick;
  button.onclick=function(event){
   if(!reduced.matches&&document.startViewTransition)document.startViewTransition(()=>previous.call(this,event));
   else previous.call(this,event);
  };
 });
 reduced.addEventListener('change',()=>{if(reduced.matches)document.getAnimations().forEach(a=>a.cancel())});
})();
// Pointer motion is local to the photograph; touch scrolling stays native.
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.vision-image').forEach(card=>{
  let frame=0,point=null;
  function paint(){frame=0;if(!point||reduce.matches)return;const r=card.getBoundingClientRect();const x=(point.x-r.left)/r.width-.5,y=(point.y-r.top)/r.height-.5;
   card.style.setProperty('--card-pitch',`${-y*5}deg`);card.style.setProperty('--card-yaw',`${x*7}deg`);card.style.setProperty('--hover-x',`${x*12}px`);card.style.setProperty('--hover-y',`${y*12}px`);
  }
  card.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduce.matches)return;point={x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(paint)});
  const reset=()=>{cancelAnimationFrame(frame);frame=0;point=null;['--card-pitch','--card-yaw','--hover-x','--hover-y'].forEach(p=>card.style.removeProperty(p))};
  card.addEventListener('pointerleave',reset);reduce.addEventListener('change',reset);
 });
 if(!reduce.matches){
  const ease='cubic-bezier(.22,1,.36,1)';
  document.querySelector('header').animate([{opacity:0,transform:'translateY(-18px)'},{opacity:1,transform:'none'}],{duration:800,easing:ease});
  document.querySelectorAll('.portal-title>.eyebrow,.portal-title>h1,.portal-title>.system-hero-intro,.portal-title>.latin,.portal-deck').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(25px)'},{opacity:1,transform:'none'}],{duration:1000,delay:i*85,easing:ease}));
 }
})();

// The visitor chooses an actual product path instead of browsing campaign images.
(() => {
 const paths = {
  buyer: { title: 'مساحة تناسب حياتك.', description: 'ابحث بحسب المدينة والحي والمساحة، وافتح الصور والموقع والمواصفات قبل اتخاذ خطوتك التالية.', steps: ['حدّد احتياجك','استكشف التفاصيل','ابدأ التواصل'], action: 'استكشف العقارات ↖', href: '/offers' },
  owner: { title: 'عقارك، وخطوته القادمة.', description: 'تعرّف على خدمات التسويق والتصوير والعناية بالعقار، واختر الخدمة المناسبة لاحتياجك.', steps: ['اختر الخدمة','أرفق التفاصيل','تابع طلبك'], action: 'استعرض الخدمات ↖', href: '/services' },
  manager: { title: 'كل التفاصيل بين يديك.', description: 'تابع العقارات والوحدات والعقود والمدفوعات والصيانة من مساحة العمل، بحسب صلاحيات حسابك.', steps: ['نظّم أملاكك','تابع العقود','راجع المستجدات'], action: 'افتح مساحة العمل ↖', href: '/internal' }
 };
 const section = document.querySelector('#visions');
 const content = section.querySelector('.intent-content');
 const choices = section.querySelector('.intent-choices');
 const buttons = [...section.querySelectorAll('[data-intent]')];
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const ease = 'cubic-bezier(.22,1,.36,1)';
 const underline = document.createElement('span');
 underline.className = 'intent-underline';
 underline.setAttribute('aria-hidden','true');
 choices.append(underline);
 function positionIndicator() {
  const active = buttons.find(button=>button.getAttribute('aria-pressed')==='true');
  const parent = choices.getBoundingClientRect();
  const box = active.getBoundingClientRect();
  underline.style.width = box.width + 'px';
  underline.style.transform = `translateX(${box.left-parent.left}px)`;
 }
 function animateJourney() {
  content.querySelectorAll('*').forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));
  if (reduced.matches) return;
  const text = content.querySelectorAll('h3,p,.pill');
  text.forEach((element,index)=>element.animate([
   {opacity:0,transform:'translateY(16px)',clipPath:'inset(0 0 100% 0)'},
   {opacity:1,transform:'none',clipPath:'inset(0 0 0 0)'}
  ],{duration:650,delay:index*75,easing:ease}));
  content.querySelectorAll('.intent-route span').forEach((step,index)=>step.animate([
   {opacity:.15,transform:'translateY(12px) scale(.96)'},
   {opacity:1,transform:'none'}
  ],{duration:650,delay:180+index*180,easing:ease}));
  content.querySelectorAll('.intent-route i').forEach((line,index)=>line.animate([
   {transform:'scaleX(0)'},{transform:'scaleX(1)'}
  ],{duration:650,delay:300+index*180,easing:ease}));
 }
 function select(button) {
  if(button.getAttribute('aria-pressed')==='true')return;
  const path = paths[button.dataset.intent];
  buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  section.querySelector('#intent-title').textContent=path.title;
  section.querySelector('#intent-description').textContent=path.description;
  section.querySelectorAll('.intent-route span').forEach((step,index)=>step.textContent=path.steps[index]);
  const action=section.querySelector('#intent-action');
  action.textContent=path.action;
  action.href=path.href;
  positionIndicator();
  animateJourney();
 }
 buttons.forEach((button,index)=>{
  button.addEventListener('click',()=>select(button));
  button.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   let next=event.key==='ArrowLeft'?(index+1)%buttons.length:(index+buttons.length-1)%buttons.length;
   if(event.key==='Home')next=0;
   if(event.key==='End')next=buttons.length-1;
   buttons[next].focus();select(buttons[next]);
  });
 });
 const entry=new IntersectionObserver(entries=>{
  if(!entries[0].isIntersecting)return;
  entry.disconnect();animateJourney();
  if(!reduced.matches)section.querySelector('.intent-intro').animate([
   {opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'none'}
  ],{duration:850,easing:ease});
 },{threshold:.15});
 entry.observe(section);
 new ResizeObserver(positionIndicator).observe(choices);
 document.fonts.ready.then(positionIndicator);
 reduced.addEventListener('change',()=>{
  if(reduced.matches)content.querySelectorAll('*').forEach(element=>element.getAnimations().forEach(animation=>animation.cancel()));
 });
 positionIndicator();
})();

// Route signals run only while their chapter is visible.
(() => {
 const section = document.querySelector('#visions');
 const route = section.querySelector('.intent-route');
 let inView = false;
 function updatePlayback() {
  section.classList.toggle('journey-active', inView && !document.hidden);
 }
 new IntersectionObserver(entries => {
  inView = entries[0].isIntersecting;
  updatePlayback();
 }, { threshold: 0.1 }).observe(route);
 const connectors = [...route.querySelectorAll('i')];
 new ResizeObserver(() => {
  const widths = connectors.map(connector => connector.getBoundingClientRect().width);
  connectors.forEach((connector, index) => connector.style.setProperty('--signal-distance', `${widths[index]}px`));
 }).observe(route);
 document.addEventListener('visibilitychange', updatePlayback);
})();
