import * as THREE from "three";

// Batched, on-demand neighborhood illustration shared by the Details surface.
export function createNeighborhoodScene(host, project, options){
  let playing=false;
  let reducedMotion=options.reducedMotion;
  const media={get matches(){return reducedMotion;}};
  const places=options.places;
  const setPlaying=value=>{playing=value;options.onPlayingChange?.(value);if(value)schedule();};
  const vector=new THREE.Vector3();
  const markers=[...places.filter(p=>p.enabled),{id:'apartment',x:0,y:5.05,z:-.5}];
  const projectPins=(camera,width,height)=>{camera.updateMatrixWorld();project(markers.map(p=>{vector.set(p.x,p.y,p.z).project(camera);const x=(vector.x*.5+.5)*width,y=(-vector.y*.5+.5)*height;return {id:p.id,x,y,visible:vector.z>=-1&&vector.z<=1&&x>=22&&x<=width-22&&y>=35&&y<=height-10};}));};
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1:1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
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
  function draw(){if(disposed||host.hidden||!visible||document.hidden)return;camera.position.set(Math.sin(azimuth)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(azimuth)*Math.cos(elevation)*distance);camera.lookAt(target);renderer.render(scene,camera);projectPins(camera,host.clientWidth,host.clientHeight);}
  function animate(time){if(disposed||!visible||host.hidden){frame=0;return;}const intro=!media.matches&&time-introStart<1600;if(time-last>33){if(intro){const p=Math.min(1,(time-introStart)/1600);azimuth=.72+(1-p)**3*.55;distance=21+(1-p)**3*3;}else if(playing)azimuth+=.0025;draw();last=time;}if(intro||playing)frame=requestAnimationFrame(animate);else frame=0;}
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(animate);}
  const observer=new ResizeObserver(resize);observer.observe(host);
  let point=null,oldAngle=azimuth;host.onpointerdown=e=>{if(e.target.closest('button'))return;setPlaying(false);introStart=-10000;point=e.clientX;oldAngle=azimuth;host.setPointerCapture(e.pointerId);};
  host.onpointermove=e=>{if(point===null)return;azimuth=oldAngle-(e.clientX-point)*.008;draw();};host.onpointerup=host.onpointercancel=()=>point=null;
  host.onkeydown=e=>{if(e.target.closest('button'))return;if(!['ArrowLeft','ArrowRight','+','=','-','Home'].includes(e.key))return;e.preventDefault();setPlaying(false);introStart=-10000;if(e.key==='Home'){azimuth=.72;distance=21;}else if(['+','=','-'].includes(e.key)){distance=Math.max(13,Math.min(29,distance+(e.key==='-'?1:-1)));}else azimuth+=e.key==='ArrowLeft'?-.2:.2;draw();};
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){draw();schedule();}});intersection.observe(host);
  const onVisibility=()=>{if(document.hidden)setPlaying(false);else draw();};
  document.addEventListener('visibilitychange',onVisibility);
  const dispose=()=>{disposed=true;document.removeEventListener('visibilitychange',onVisibility);host.onpointerdown=host.onpointermove=host.onpointerup=host.onpointercancel=host.onkeydown=null;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();const geometries=new Set();scene.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);});geometries.forEach(geometry=>geometry.dispose());[stone,darkStone,glass,frameMat,pavement,road,leaf,groundMat,parkMat].forEach(mat=>mat.dispose());renderer.dispose();renderer.domElement.remove();};
  resize();schedule();
  if(options.dark){scene.background.set("#171c2a");groundMat.color.set("#555865");ambient.intensity=1.8;sun.intensity=2.2;draw();}
  return {draw,dispose,setReducedMotion(value){reducedMotion=value;if(value)setPlaying(false);draw();},rotate(delta){introStart=-10000;azimuth+=delta;draw();},reset(){introStart=-10000;azimuth=.72;distance=21;draw();},zoom(delta){introStart=-10000;distance=Math.max(13,Math.min(29,distance*(1+delta)));draw();},play(value){playing=value;if(value){introStart=-10000;schedule();}},theme(value){scene.background.set(value?'#171c2a':'#eae9e6');groundMat.color.set(value?'#555865':'#dfddd6');ambient.intensity=value?1.8:2.4;sun.intensity=value?2.2:3.4;draw();}};
}

