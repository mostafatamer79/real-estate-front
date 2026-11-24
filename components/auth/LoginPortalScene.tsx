'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './login-portal-scene.module.css';

type PortalControls = { pause(value: boolean): void; rotate(value: number): void; reset(): void };

export default function LoginPortalScene({ fallbackSrc }: { fallbackSrc: string }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<PortalControls | null>(null);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [angle, setAngle] = useState(0);
  const { language } = useLanguage();
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import('three').then(THREE => {
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.setAttribute('aria-hidden','true');
      element.append(renderer.domElement);
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#102332');
      scene.fog = new THREE.Fog('#102332',23,50);
      const camera = new THREE.PerspectiveCamera(37,1,.1,80);
      const world = new THREE.Group(); scene.add(world);
      const materials = [
        new THREE.MeshStandardMaterial({ color:'#e9dec8',roughness:.68 }),
        new THREE.MeshStandardMaterial({ color:'#c6b69c',roughness:.8 }),
        new THREE.MeshStandardMaterial({ color:'#c4a064',metalness:.65,roughness:.32 }),
        new THREE.MeshStandardMaterial({ color:'#183140',roughness:.82 }),
      ];
      const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>();
      const addBox = (w:number,h:number,d:number,x:number,y:number,z:number,material=materials[0]) => {
        const geometry = new THREE.BoxGeometry(w,h,d); geometries.add(geometry);
        const mesh = new THREE.Mesh(geometry,material); mesh.position.set(x,y,z); mesh.castShadow = mesh.receiveShadow = true; world.add(mesh); return mesh;
      };
      const archShape = new THREE.Shape();
      archShape.moveTo(-2,0); archShape.lineTo(-2,3.8); archShape.absarc(0,3.8,2,Math.PI,0,true); archShape.lineTo(2,0); archShape.lineTo(-2,0);
      const opening = new THREE.Path(); opening.moveTo(-1.58,0); opening.lineTo(1.58,0); opening.lineTo(1.58,3.8); opening.absarc(0,3.8,1.58,0,Math.PI,false); opening.lineTo(-1.58,0); archShape.holes.push(opening);
      const archGeometry = new THREE.ExtrudeGeometry(archShape,{depth:.42,bevelEnabled:true,bevelThickness:.045,bevelSize:.035,bevelSegments:2,curveSegments:40}); geometries.add(archGeometry);
      const arches: InstanceType<typeof THREE.Mesh>[] = [];
      for (let i=0;i<3;i++) {
        const arch = new THREE.Mesh(archGeometry,materials[i === 1 ? 2 : i === 0 ? 0 : 1]);
        arch.position.set((i-1)*.3,.3,(i-1)*1.8); arch.rotation.y=(i-1)*.12; arch.castShadow=arch.receiveShadow=true; world.add(arch); arches.push(arch);
      }
      addBox(10,.25,9,0,.05,0,materials[3]);
      addBox(6,.18,6.8,0,.24,0,materials[1]);
      addBox(5.5,.12,6.2,0,.38,0,materials[0]);
      const slabLeft = addBox(1.3,6.7,1.1,-3.4,3.5,-.7,materials[0]); slabLeft.rotation.z=-.13;
      const slabRight = addBox(.8,4.4,1.8,3.25,2.35,1.1,materials[1]); slabRight.rotation.y=-.35;
      for(let i=0;i<7;i++) addBox(.04,4.5,.05,-4.3+i*.18,2.5,-2.8,materials[2]);
      scene.add(new THREE.HemisphereLight('#d1e4ed','#56442f',2.5));
      const key = new THREE.DirectionalLight('#ffe6bb',5); key.position.set(-5,11,7); key.castShadow=true; key.shadow.mapSize.set(512,512); Object.assign(key.shadow.camera,{left:-8,right:8,top:10,bottom:-5}); key.shadow.normalBias=.04; scene.add(key);
      const rim = new THREE.DirectionalLight('#b4d8ed',3); rim.position.set(6,6,-5); scene.add(rim);
      const glow = new THREE.PointLight('#ffd18c',28,12,2); glow.position.set(0,3,-3.3); scene.add(glow);
      const media = matchMedia('(prefers-reduced-motion: reduce)');
      let frame=0,last=0,visible=true,userPaused=false,manualAngle=0,hoverX=0,hoverY=0,yaw=0,pitch=0,dragStart:number|null=null,dragAngle=0;
      const start=performance.now();
      const draw=(now:number) => {
        frame=0;
        if(cancelled||!visible||document.hidden) return;
        if(now-last<32){schedule();return;} last=now;
        const t=media.matches?1:Math.min(1,(now-start)/1600),ease=1-Math.pow(1-t,4);
        const active=!userPaused&&!media.matches;
        if(!userPaused){yaw+=((active?hoverX:0)-yaw)*.08; pitch+=((active?hoverY:0)-pitch)*.08;}
        world.rotation.y=-.35+manualAngle+yaw*.22;
        arches.forEach((arch,index)=>{arch.position.y=.45+(1-ease)*(index+1)*.8;});
        camera.position.set(7.5-ease*1.1,4.9+pitch*.45,14-ease*2);
        camera.lookAt(0,2.65,0); renderer.render(scene,camera);
        if(active&&(t<1||Math.abs(yaw-hoverX)>.002||Math.abs(pitch-hoverY)>.002))schedule();
      };
      const schedule=()=>{if(!frame&&visible&&!document.hidden&&!cancelled)frame=requestAnimationFrame(draw);};
      const resize=()=>{const r=element.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();schedule();};
      const observer=new ResizeObserver(resize);observer.observe(element);
      const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(element);
      const down=(event:PointerEvent)=>{if(event.button!==0)return;dragStart=event.clientX;dragAngle=manualAngle;renderer.domElement.setPointerCapture(event.pointerId);};
      const move=(event:PointerEvent)=>{const r=element.getBoundingClientRect();if(dragStart!==null){manualAngle=Math.max(-1,Math.min(1,dragAngle+(event.clientX-dragStart)/r.width*1.5));}else if(event.pointerType==='mouse'){hoverX=(event.clientX-r.left)/r.width-.5;hoverY=(event.clientY-r.top)/r.height-.5;}schedule();};
      const up=()=>{if(dragStart!==null)setAngle(Math.round(manualAngle*100));dragStart=null;};const leave=()=>{hoverX=hoverY=0;up();schedule();};
      renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);renderer.domElement.addEventListener('pointerleave',leave);
      const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();};
      const preference=()=>{hoverX=hoverY=0;schedule();};document.addEventListener('visibilitychange',visibility);media.addEventListener('change',preference);
      controls.current={pause(value){userPaused=value;schedule();},rotate(value){manualAngle=value/100;schedule();},reset(){manualAngle=hoverX=hoverY=yaw=pitch=0;schedule();}};
      dispose=()=>{cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',preference);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',up);renderer.domElement.removeEventListener('pointerleave',leave);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();controls.current=null;};
      resize();setReady(true);
    }).catch(()=>{/* The architectural still remains readable when WebGL is unavailable. */});
    return()=>{cancelled=true;dispose?.();};
  },[]);
  return <div className={styles.sceneContainer}>
    <Image src={fallbackSrc} alt="" fill sizes="(max-width: 1023px) 100vw, 56vw" priority className={styles.fallback} />
    <div ref={host} className={styles.canvas} data-portal-ready={ready} />
    <div className={styles.sceneCaption}>{language==='ar'?'بوابة إلى آفاق جديدة.':'A gateway to new perspectives.'}</div>
    {ready&&<div className={styles.controls}>
      <button type="button" aria-pressed={paused} aria-label={language==='ar'?(paused?'تشغيل حركة المشهد':'إيقاف حركة المشهد'):(paused?'Resume scene motion':'Pause scene motion')} onClick={()=>{controls.current?.pause(!paused);setPaused(!paused);}}>{paused?<Play />:<Pause />}</button>
      <input type="range" min={-100} max={100} value={angle} aria-label={language==='ar'?'تدوير البوابة':'Rotate gateway'} onChange={event=>{const value=Number(event.target.value);setAngle(value);controls.current?.rotate(value);}} />
      <button type="button" aria-label={language==='ar'?'إعادة ضبط المشهد':'Reset scene'} onClick={()=>{setAngle(0);controls.current?.reset();}}><RotateCcw /></button>
    </div>}

  </div>;
}
