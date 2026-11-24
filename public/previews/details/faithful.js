import * as THREE from './vendor/three.module.js';
import { places, createPlaceExplorer } from './places.js';

// A single illustrative scene; never represents account properties or listing data.
const host=document.querySelector('#architecture');
const welcomeHeading=document.querySelector('.intro h1');
let typingTimer=0;
function typeWelcomeHeading(){
  clearTimeout(typingTimer);
  const language=document.documentElement.lang;
  const full=welcomeHeading.dataset[language==='ar'?'ar':'en'];
  welcomeHeading.setAttribute('aria-label',full);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){welcomeHeading.textContent=full;return;}
  // Reserve the complete heading's height, keeping Arabic shaping and wrapping natural.
  const measure=document.createElement('span');measure.className='typing-measure';measure.textContent=full;measure.setAttribute('aria-hidden','true');
  const output=document.createElement('span');output.className='typing-output writing';output.setAttribute('aria-hidden','true');
  welcomeHeading.replaceChildren(measure,output);
  const letters=Array.from(new Intl.Segmenter(language,{granularity:'grapheme'}).segment(full),part=>part.segment);
  let index=0;
  function write(){output.textContent=letters.slice(0,++index).join('');if(index<letters.length){typingTimer=setTimeout(write,language==='ar'?60:42);}else output.classList.remove('writing');}
  write();
}
addEventListener('pagehide',()=>clearTimeout(typingTimer),{once:true});
// Keep camera controls and the illustrative-model note outside the map canvas.
const sceneControls=document.createElement('div');
sceneControls.className='scene-controls';
document.querySelector('.map-surface').after(sceneControls);
sceneControls.append(document.querySelector('.scene-toolbar'),document.querySelector('.zoom'),document.querySelector('.model-label'));
let ar=true,dark=false,sceneApi=null;
const text=(a,e)=>ar?a:e;
const dialog=document.querySelector('dialog');
document.querySelectorAll('[data-dialog]').forEach(button=>button.onclick=()=>{document.querySelector('#dialog-title').textContent=button.querySelector('[data-ar]')?.textContent||button.dataset.dialog;dialog.showModal();});
document.querySelector('#close').onclick=()=>dialog.close();
document.querySelector('#language').onclick=()=>{
  ar=!ar;document.documentElement.lang=ar?'ar':'en';document.documentElement.dir=ar?'rtl':'ltr';
  document.querySelectorAll('[data-ar]').forEach(el=>{el.textContent=el.dataset[ar?'ar':'en'];});
  document.querySelector('#language').textContent=ar?'English':'العربية';
  document.querySelector('#architecture').setAttribute('aria-label',text('نموذج معماري ثلاثي الأبعاد، اسحب أو استخدم الأسهم للتدوير','3D architectural model. Drag or use arrow keys to rotate'));
  syncMotion();
  typeWelcomeHeading();
};
document.querySelector('#theme').onclick=()=>{dark=!dark;document.body.classList.toggle('dark',dark);document.querySelectorAll('.logo').forEach(el=>el.src=`/icons/${dark?'white':'black'}.png`);sceneApi?.theme(dark);};
const media=matchMedia('(prefers-reduced-motion: reduce)');
let playing=false;
function syncMotion(){const b=document.querySelector('#motion');b.textContent=playing?text('إيقاف الحركة','Pause motion'):text('تشغيل الحركة','Play motion');b.setAttribute('aria-pressed',String(playing));}
function setPlaying(value){playing=value;sceneApi?.play(value);syncMotion();}
const placeExplorer=createPlaceExplorer(host,()=>setPlaying(false));
document.querySelector('#motion').onclick=()=>setPlaying(!playing);
document.querySelector('#rotate-left').onclick=()=>{setPlaying(false);sceneApi?.rotate(-.22);};
document.querySelector('#rotate-right').onclick=()=>{setPlaying(false);sceneApi?.rotate(.22);};
document.querySelector('#reset').onclick=()=>{setPlaying(false);sceneApi?.reset();};
document.querySelector('#zoom-in').onclick=()=>sceneApi?.zoom(-.12);
document.querySelector('#zoom-out').onclick=()=>sceneApi?.zoom(.12);
document.querySelector('#view-map').onclick=()=>{
  setPlaying(false);host.hidden=true;const map=document.querySelector('#geographic');map.hidden=false;
  if(!map.firstChild){const frame=document.createElement('iframe');frame.title=text('خريطة الرياض','Riyadh map');frame.src='https://www.openstreetmap.org/export/embed.html?bbox=46.662%2C24.705%2C46.689%2C24.723&layer=mapnik&marker=24.7136%2C46.6753';frame.loading='lazy';map.append(frame);}
  document.querySelector('#view-map').setAttribute('aria-pressed','true');document.querySelector('#view-3d').setAttribute('aria-pressed','false');
  sceneControls.hidden=true;
  placeExplorer.setVisible(false);
};
document.querySelector('#view-3d').onclick=()=>{host.hidden=false;document.querySelector('#geographic').hidden=true;document.querySelector('#view-map').setAttribute('aria-pressed','false');document.querySelector('#view-3d').setAttribute('aria-pressed','true');sceneControls.hidden=false;placeExplorer.setVisible(true);sceneApi?.draw();};

function createScene(){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1:1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);host.querySelector('.loading')?.remove();
  const scene=new THREE.Scene();scene.background=new THREE.Color('#eae9e6');
  const camera=new THREE.PerspectiveCamera(34,1,.1,100);const target=new THREE.Vector3(0,1.4,0);
  let azimuth=.72,elevation=.58,distance=21,frame=0,last=0,introStart=performance.now(),visible=true,disposed=false;
  const root=new THREE.Group();scene.add(root);
  const ambient=new THREE.HemisphereLight(0xffffff,0x8a8597,2.4);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xfff0dd,3.4);sun.position.set(8,14,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:10,bottom:-9,near:1,far:40});sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xaab8ff,1.5);fill.position.set(-8,6,-4);scene.add(fill);
  const material=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:.65,...opts});
  const stone=material('#e0dcd3'),darkStone=material('#383e4b'),glass=material('#657987',{metalness:.55,roughness:.18}),frameMat=material('#bdb7ab',{metalness:.3}),pavement=material('#ccc8bf'),road=material('#a5a6a8'),leaf=material('#77796b');
  const groundMat=material('#dfddd6');
  // Batch repeated architectural pieces by material: one draw call per material.
  const boxes=new Map();
  function box(w,h,d,x,y,z,mat){if(!boxes.has(mat))boxes.set(mat,[]);boxes.get(mat).push([w,h,d,x,y,z]);}
  box(15,.22,11,0,-.2,0,groundMat);
  box(12,.015,1.2,0,-.075,2.8,road);box(1.05,.015,9,-3.6,-.075,0,road);
  for(let i=-5;i<6;i++)box(.45,.018,.035,i,-.06,2.8,stone);
  for(let i=-3;i<4;i++)box(.035,.018,.45,-3.6,-.06,i,stone);
  box(5.6,.12,5,0,-.04,-.45,pavement);
  // Main tower: stepped limestone frame, recessed glass floors, rooftop terrace.
  const tower=new THREE.Group();root.add(tower);
  box(2.8,.3,2.5,0,.16,-.5,stone,tower);
  for(let floor=0;floor<7;floor++){
    const y=.4+floor*.52;
    box(2.25,.44,1.95,0,y+.2,-.5,glass,tower);
    box(2.65,.08,2.3,0,y+.46,-.5,stone,tower);
    for(const x of [-1.17,-.58,0,.58,1.17]){box(.045,.46,.05,x,y+.2,.49,frameMat,tower);box(.045,.46,.05,x,y+.2,-1.49,frameMat,tower);}
    for(const z of [-1.25,-.75,-.25,.25]){box(.05,.46,.045,1.14,y+.2,z,frameMat,tower);box(.05,.46,.045,-1.14,y+.2,z,frameMat,tower);}
  }
  for(const x of [-1.25,1.25])box(.13,3.95,.15,x,2,-.5,stone,tower);
  box(2.7,.12,2.4,0,4.2,-.5,stone,tower);box(1.2,.35,1,0,4.42,-.5,darkStone,tower);
  for(let i=0;i<6;i++)box(.1,.1,2.1,-1.1+i*.44,4.62,-.5,stone,tower);
  // Lower wing and shaded entrance.
  box(2.2,1.4,2.4,2.25,.72,-.5,glass);box(2.5,.16,2.7,2.25,1.5,-.5,stone);
  for(let i=0;i<5;i++)box(.08,1.45,.08,1.35+i*.45,.72,.74,stone);
  box(1.7,.08,1,0,.55,1.25,darkStone);for(const x of [-.72,.72])box(.045,.5,.045,x,.25,1.6,frameMat);
  for(let i=0;i<3;i++)box(2,.045, .4,0,.06-i*.025,1.4+i*.25,stone);
  // Street trees and planters ground the architecture at a human scale.
  const treeGeo=new THREE.IcosahedronGeometry(.42,1),trunkGeo=new THREE.CylinderGeometry(.035,.045,.55,6);
  for(const [x,z] of [[-2,1.8],[-2,-2.5],[3.9,-2.4],[3.9,.4],[2.8,1.8],[-4.8,-2],[-4.8,.1]]){
    box(.65,.15,.65,x,.04,z,pavement);const trunk=new THREE.Mesh(trunkGeo,darkStone);trunk.position.set(x,.35,z);root.add(trunk);const crown=new THREE.Mesh(treeGeo,leaf);crown.position.set(x,.85,z);crown.scale.set(.85,1.25,.85);crown.castShadow=true;root.add(crown);
  }
  // Two parked cars, using shared materials and simple geometry.
  for(const x of [2,4]){box(.8,.18,.38,x,.04,3.12,darkStone);box(.43,.14,.32,x,.2,3.12,glass);}
  const parkMat=material('#b5bea8');
  box(2.5,.08,2.5,-5.2,-.04,-1.7,parkMat);
  for(const p of places.filter(p=>p.id!=='park')){const height=p.id==='school'?1.05:p.id==='mosque'?1.2:.7;box(1.6,height,1.25,p.x,height*.5,p.z,stone);box(1.75,.1,1.4,p.x,height+.06,p.z,darkStone);box(1.15,.35,.035,p.x,height*.6,p.z+.64,glass);}
  const boxGeometry=new THREE.BoxGeometry(1,1,1),instance=new THREE.Object3D();
  for(const [mat,parts] of boxes){const mesh=new THREE.InstancedMesh(boxGeometry,mat,parts.length);parts.forEach(([w,h,d,x,y,z],i)=>{instance.position.set(x,y,z);instance.scale.set(w,h,d);instance.updateMatrix();mesh.setMatrixAt(i,instance.matrix);});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();root.add(mesh);}
  const resize=()=>{const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width/height<1.2?44:34;camera.updateProjectionMatrix();draw();};
  function draw(){if(disposed||host.hidden||!visible||document.hidden)return;camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);renderer.render(scene,camera);placeExplorer.project(camera,host.clientWidth,host.clientHeight,THREE);}
  function animate(time){if(disposed||!visible||host.hidden){frame=0;return;}const intro=!media.matches&&time-introStart<1600;if(time-last>33){if(intro){const p=Math.min(1,(time-introStart)/1600);azimuth=.72+(1-p)**3*.55;distance=21+(1-p)**3*3;}else if(playing)azimuth+=.0025;draw();last=time;}if(intro||playing)frame=requestAnimationFrame(animate);else frame=0;}
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(animate);}
  const observer=new ResizeObserver(resize);observer.observe(host);
  let point=null,oldAngle=azimuth;host.onpointerdown=e=>{setPlaying(false);introStart=-10000;point=e.clientX;oldAngle=azimuth;host.setPointerCapture(e.pointerId);};
  host.onpointermove=e=>{if(point===null)return;azimuth=oldAngle-(e.clientX-point)*.008;draw();};host.onpointerup=host.onpointercancel=()=>point=null;
  host.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key))return;e.preventDefault();setPlaying(false);introStart=-10000;if(e.key==='Home'){azimuth=.72;distance=21;}else if(['+','=','-'].includes(e.key)){distance=Math.max(13,Math.min(29,distance+(e.key==='-'?1:-1)));}else azimuth+=e.key==='ArrowLeft'?-.2:.2;draw();};
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){draw();schedule();}});intersection.observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){setPlaying(false);}else{draw();}});
  addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();const geometries=new Set();scene.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);});geometries.forEach(geometry=>geometry.dispose());[stone,darkStone,glass,frameMat,pavement,road,leaf,groundMat,parkMat].forEach(mat=>mat.dispose());renderer.dispose();},{once:true});
  resize();schedule();
  return {draw,rotate(delta){introStart=-10000;azimuth+=delta;draw();},reset(){introStart=-10000;azimuth=.72;distance=21;draw();},zoom(delta){introStart=-10000;distance=Math.max(13,Math.min(29,distance*(1+delta)));draw();},play(value){if(value){introStart=-10000;schedule();}},theme(value){scene.background.set(value?'#171c2a':'#eae9e6');groundMat.color.set(value?'#555865':'#dfddd6');ambient.intensity=value?1.8:2.4;sun.intensity=value?2.2:3.4;draw();}};
}
try{sceneApi=createScene();}catch(error){host.querySelector('.loading').textContent=text('تعذّر تشغيل العرض ثلاثي الأبعاد. يمكنك استخدام الخريطة.','3D view unavailable. You can use the map.');document.querySelectorAll('.scene-toolbar button,.zoom button').forEach(button=>button.disabled=true);}
media.addEventListener('change',()=>{setPlaying(false);sceneApi?.draw();typeWelcomeHeading();});
typeWelcomeHeading();
