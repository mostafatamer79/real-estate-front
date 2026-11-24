(() => {
 const frame=document.querySelector('#preview');
 const wrapper=document.querySelector('.preview-frame');
 const demo=document.querySelector('#demo');
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let running=false,raf=0,start=0;
 const stop=()=>{running=false;cancelAnimationFrame(raf);demo.setAttribute('aria-pressed','false');demo.textContent='شاهد رحلة التمرير ↓'};
 const resize=new ResizeObserver(entries=>entries.forEach(({contentRect})=>wrapper.style.setProperty('--scale',contentRect.width/1360)));
 resize.observe(wrapper);
 document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
  stop();
  document.querySelectorAll('[data-preview]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  const title=button.querySelector('strong').textContent;
  const url=`details-compact-${button.dataset.preview}.html`;
  frame.src=url; frame.title=`معاينة ${title}`;
  document.querySelector('#preview-title').textContent=title;
  document.querySelector('#open-preview').href=url;
 }));
 demo.addEventListener('click',()=>{
  if(running){stop();return}
  const child=frame.contentWindow;
  if(!child?.document.querySelector('.chapter'))return;
  running=true;start=performance.now();demo.setAttribute('aria-pressed','true');demo.textContent='إيقاف العرض ■';
  const focus=child.document.body.dataset.design==='focus';
  let last=-1;
  function tick(now){
   if(!running)return;
   const elapsed=now-start;
   const p=Math.min(1,elapsed/9500);
   if(focus){const index=Math.min(3,Math.floor(p*4));if(index!==last){child.document.querySelectorAll('[data-section]')[index].click();last=index}}
   else child.scrollTo({top:p*(child.document.documentElement.scrollHeight-child.innerHeight),behavior:'instant'});
   if(p<1)raf=requestAnimationFrame(tick);else stop();
  }
  if(media.matches){child.document.querySelectorAll('[data-section]')[1].click();stop()}else raf=requestAnimationFrame(tick);
 });
 frame.addEventListener('load',stop);
 addEventListener('pagehide',()=>{stop();resize.disconnect()});
})();
