// Decorative companion only: no assistant, messaging, API calls, or tracking.
const buddy=document.createElement('aside');
buddy.className='buddy';
buddy.innerHTML='<button class="buddy-hide" aria-label="إخفاء الرفيق المرح">×</button><button class="buddy-character" aria-label="رفيق مرح: اضغط للعب، اسحب لتحريكه، أو استخدم الأسهم" title="اضغط للعب · اسحب لتحريكه"><span class="buddy-aura" aria-hidden="true"></span><span class="buddy-body" aria-hidden="true"><span class="buddy-eyes"><i></i><i></i></span><span class="buddy-smile"></span><span class="buddy-hand"></span></span><span class="buddy-shadow" aria-hidden="true"></span></button>';
document.body.append(buddy);
const character=buddy.querySelector('.buddy-character');
const hide=buddy.querySelector('.buddy-hide');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let waveTimer=0,scrollTimer=0,scrollFrame=0,lastScroll=scrollY,drag=null,moved=false,custom=false;
const timers=()=>{clearTimeout(waveTimer);clearTimeout(scrollTimer);cancelAnimationFrame(scrollFrame);};
function localize(){const ar=document.documentElement.lang==='ar';character.setAttribute('aria-label',ar?'رفيق مرح: اضغط للعب، اسحب لتحريكه، أو استخدم الأسهم':'Playful companion: tap to play, drag to move, or use arrow keys');character.title=ar?'اضغط للعب · اسحب لتحريكه':'Tap to play · Drag to move';hide.setAttribute('aria-label',ar?'إخفاء الرفيق المرح':'Hide playful companion');}
const languageObserver=new MutationObserver(localize);languageObserver.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});localize();
function play(){if(reduced.matches)return;buddy.classList.remove('waving');requestAnimationFrame(()=>{buddy.classList.add('waving');clearTimeout(waveTimer);waveTimer=setTimeout(()=>buddy.classList.remove('waving'),850);});}
character.onclick=()=>{if(!moved)play();moved=false;};
function position(x,y){const left=Math.max(8,Math.min(innerWidth-90,x));const top=Math.max(8,Math.min(innerHeight-110,y));buddy.style.left=`${left}px`;buddy.style.top=`${top}px`;buddy.style.bottom='auto';custom=true;}
character.onpointerdown=e=>{if(e.button!==0)return;const r=buddy.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};moved=false;character.setPointerCapture(e.pointerId);buddy.classList.add('dragging');};
character.onpointermove=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;if(moved)position(drag.left+dx,drag.top+dy);};
character.onpointerup=character.onpointercancel=()=>{drag=null;buddy.classList.remove('dragging');};
character.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const r=buddy.getBoundingClientRect();position(r.left+(e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0),r.top+(e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0));};
function onScroll(){if(reduced.matches||document.hidden||buddy.hidden||scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{const delta=scrollY-lastScroll;lastScroll=scrollY;buddy.style.setProperty('--buddy-lean',`${Math.max(-10,Math.min(10,delta*.2))}deg`);clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>buddy.style.setProperty('--buddy-lean','0deg'),160);scrollFrame=0;});}
addEventListener('scroll',onScroll,{passive:true});
function onResize(){if(custom){const r=buddy.getBoundingClientRect();position(r.left,r.top);}}
addEventListener('resize',onResize,{passive:true});
hide.onclick=()=>{buddy.hidden=true;timers();removeEventListener('scroll',onScroll);};
document.addEventListener('visibilitychange',()=>{if(document.hidden){timers();buddy.classList.remove('waving');buddy.style.setProperty('--buddy-lean','0deg');}else lastScroll=scrollY;});
reduced.addEventListener('change',()=>{timers();buddy.classList.remove('waving');buddy.style.setProperty('--buddy-lean','0deg');});
addEventListener('pagehide',()=>{timers();languageObserver.disconnect();removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);},{once:true});
