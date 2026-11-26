/* Native scroll remains the input. A short, time-based camera catch-up makes
   the iris reversible without intercepting touch, wheel or keyboard scrolling. */
(()=>{
 const film=document.querySelector('[data-portal-film]');
 const light=document.querySelector('.light-journey');
 const title=film.querySelector('.portal-title');
 const bottom=film.querySelector('.portal-bottom');
 const insideContent=film.querySelector('.portal-inside');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const small=matchMedia('(max-width:700px)');
 const clamp=v=>Math.max(0,Math.min(1,v));
 const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t)};
 let measures=[],frame=0,last=0,current=0,target=0;
 const lastProgress=[NaN,NaN];
 function measure(){lastProgress.fill(NaN);measures=[film,light].map(el=>({el,top:el.getBoundingClientRect().top+scrollY,range:Math.max(1,el.offsetHeight-innerHeight)}));request()}
 function draw(now){
  frame=0;
  const delta=Math.min(64,now-(last||now-16));last=now;
  target=scrollY;current=reduce.matches?target:current+(target-current)*(1-Math.exp(-delta/95));
  if(Math.abs(target-current)<.15)current=target;
  const states=measures.map(m=>({...m,p:clamp((current-m.top)/m.range)}));
  if(states[0].p!==lastProgress[0]){
  lastProgress[0]=states[0].p;
  const p=states[0].p,open=smooth(.02,.72,p),heading=1-smooth(.02,.24,p),inside=smooth(.36,.62,p);
  const mobile=small.matches;
  film.style.setProperty('--camera',open.toFixed(5));
  film.style.setProperty('--heading',heading.toFixed(5));
  film.style.setProperty('--inside',inside.toFixed(5));
  film.style.setProperty('--iris-x',(mobile?50:30+20*open)+'%');
  film.style.setProperty('--iris-y',(mobile?74-24*open:58)+'%');
  film.style.setProperty('--iris-rx',((mobile?43:25)+(mobile?62:80)*open)+'%');
  film.style.setProperty('--iris-ry',((mobile?28:44)+(mobile?77:61)*open)+'%');
  film.style.setProperty('--photo-scale',(1+.055*open).toFixed(5));
  film.style.setProperty('--darken',smooth(.24,.6,p).toFixed(5));
  film.style.setProperty('--title-visibility',heading<.01?'hidden':'visible');
  film.style.setProperty('--inside-visibility',inside>.01?'visible':'hidden');
  title.inert=heading<.05;
  bottom.inert=heading<.05;
  insideContent.inert=inside<.5;
  }
  if(states[1].p!==lastProgress[1]){
  lastProgress[1]=states[1].p;
  const q=states[1].p,wipe=smooth(.13,.78,q);
  light.style.setProperty('--light',wipe.toFixed(5));
  light.style.setProperty('--first',(1-smooth(.14,.43,q)).toFixed(5));
  light.style.setProperty('--second',smooth(.5,.8,q).toFixed(5));
  light.style.setProperty('--light-scale',(1.1-.1*q).toFixed(5));
  }
  if(current!==target&&!reduce.matches)frame=requestAnimationFrame(draw);
 }
 function request(){if(document.hidden)return;if(!frame)frame=requestAnimationFrame(draw)}
 addEventListener('scroll',request,{passive:true});addEventListener('resize',measure);
 addEventListener('pageshow',()=>{current=scrollY;measure()});
 reduce.addEventListener('change',()=>{current=scrollY;measure()});small.addEventListener('change',measure);
 addEventListener('portal-layout',measure);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else{current=scrollY;last=0;measure()}});
 document.fonts.ready.then(measure);measure();

})();
