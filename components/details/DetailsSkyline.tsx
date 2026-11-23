'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './details-skyline.module.css';

/** Illustrative architecture, never a geographic or live property representation. */
export default function DetailsSkyline() {
  const host = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const controls = useRef<{ pause(value: boolean): void; reset(): void } | null>(null);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const { language } = useLanguage();
  useEffect(() => {
    const hero = host.current?.closest<HTMLElement>('[data-motion-hero]');
    const stage = host.current?.closest<HTMLElement>('[data-scene-stage]');
    if (!hero || !stage) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const clamp = (n: number) => Math.max(0,Math.min(1,n));
    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const distance = Math.max(1,hero.offsetHeight - stage.offsetHeight);
      const progress = reduced.matches ? 0 : clamp((68-rect.top)/distance);
      progressRef.current = progress;
      hero.style.setProperty('--scene-progress',String(progress));
      const weights = [1-clamp((progress-.16)/.14),clamp((progress-.26)/.13)*(1-clamp((progress-.62)/.13)),clamp((progress-.72)/.14)];
      hero.querySelectorAll<HTMLElement>('[data-scene-chapter]').forEach(element => {
        const index = Number(element.dataset.sceneChapter);
        const visible = weights[index] > .1;
        element.style.opacity = String(weights[index]);
        element.style.transform = reduced.matches ? 'none' : `translateY(${(1-weights[index])*28}px)`;
        element.inert = !visible;
        element.setAttribute('aria-hidden',String(!visible));
      });
      hero.dataset.scenePhase = progress < .3 ? 'overview' : progress < .72 ? 'approach' : 'arrival';
    };
    const schedule = () => {if(!frame)frame=requestAnimationFrame(update);};
    const observer = new ResizeObserver(schedule); observer.observe(hero); observer.observe(stage);
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});reduced.addEventListener('change',schedule);update();
    return () => {cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);reduced.removeEventListener('change',schedule);};
  }, []);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import('three').then(THREE => {
      if (cancelled) return;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      element.append(renderer.domElement);
      const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c1b2a');
      scene.fog = new THREE.Fog('#0c1b2a', 32, 68);
      const camera = new THREE.PerspectiveCamera(36, 1, .1, 120);
      const city = new THREE.Group(); city.position.x = 0; scene.add(city);
      const stone = new THREE.MeshStandardMaterial({ color: '#c5bda9', roughness: .72 });
      const porcelain = new THREE.MeshStandardMaterial({ color: '#f1e9d6', roughness: .55 });
      const glass = new THREE.MeshStandardMaterial({ color: '#264354', metalness: .65, roughness: .24 });
      const brass = new THREE.MeshStandardMaterial({ color: '#c8a46a', metalness: .68, roughness: .32 });
      const base = new THREE.MeshStandardMaterial({ color: '#1b303b', roughness: .9 });
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const pieces = new Map<typeof stone, number[][]>();
      const box = (x: number, y: number, z: number, w: number, h: number, d: number, material = stone) => {
        const list = pieces.get(material) || []; list.push([x, y, z, w, h, d]); pieces.set(material, list);
      };
      box(0, -.32, 0, 90, .25, 90, base);
      // A sculpted courtyard, not an apartment block or a repeating skyline.
      box(0,-.12,0,17,.22,15,stone);
      box(0,.04,0,15.8,.14,13.8,porcelain);
      box(0,.17,-.3,14.5,.12,12.5,stone);
      box(0,.29,-.6,13.2,.12,11.3,porcelain);
      box(-2.4,.36,-1.4,4.8,.12,6.8,base);
      for(let i=0;i<6;i++) box(4.3,.35+i*.15,3.1-i*.48,3.8,.16,.5,stone);
      for(let i=0;i<22;i++) box(-5.9+i*.56,.36,5.2,.028,.025,1.3,brass);
      const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-6,0,4.5),new THREE.Vector3(-5,0,-6.5),new THREE.Vector3(4.2,0,-6.2),new THREE.Vector3(6.3,0,3.4));
      const vertices:number[]=[],indices:number[]=[];
      const segments=90,cross=20;
      for(let i=0;i<=segments;i++) {
        const t=i/segments,point=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector3(-tangent.z,0,tangent.x);
        for(let j=0;j<=cross;j++) {
          const v=j/cross*2-1,offset=v*2.05;
          const height=4.8 + Math.sin(t*Math.PI)*1.1 + Math.cos(v*Math.PI*.5)*1.15;
          vertices.push(point.x+normal.x*offset,height,point.z+normal.z*offset);
          if(i<segments&&j<cross){const n=i*(cross+1)+j;indices.push(n,n+cross+1,n+1,n+1,n+cross+1,n+cross+2);}
        }
      }
      const roofGeometry=new THREE.BufferGeometry();roofGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));roofGeometry.setIndex(indices);roofGeometry.computeVertexNormals();
      const roofMaterial=new THREE.MeshStandardMaterial({color:'#e5d4b7',roughness:.58,side:THREE.DoubleSide});
      const roof=new THREE.Mesh(roofGeometry,roofMaterial);city.add(roof);
      const ribGeometries:InstanceType<typeof THREE.BufferGeometry>[]=[];
      for(let i=0;i<=26;i++) {
        const t=i/26,point=curve.getPoint(t),tangent=curve.getTangent(t),normal=new THREE.Vector3(-tangent.z,0,tangent.x);
        const points=[];
        for(let j=0;j<=16;j++) {const v=j/16*2-1;points.push(new THREE.Vector3(point.x+normal.x*v*2.05,4.84+Math.sin(t*Math.PI)*1.1+Math.cos(v*Math.PI*.5)*1.15,point.z+normal.z*v*2.05));}
        const ribGeometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.026,5,false);ribGeometries.push(ribGeometry);city.add(new THREE.Mesh(ribGeometry,brass));
        if(i%4===0) for(const edge of [-1,1])box(point.x+normal.x*edge*1.9,2.5,point.z+normal.z*edge*1.9,.11,4.9,.11,brass);
      }
      const poolMaterial=new THREE.MeshStandardMaterial({color:'#406b70',metalness:.72,roughness:.13});
      const poolGeometry=new THREE.BoxGeometry(4.5,.035,6.4);const pool=new THREE.Mesh(poolGeometry,poolMaterial);pool.position.set(-2.4,.44,-1.4);city.add(pool);
      const trunkGeometry=new THREE.CylinderGeometry(.12,.2,2.6,9);const crownGeometry=new THREE.IcosahedronGeometry(.75,2);
      const leaves=new THREE.MeshStandardMaterial({color:'#778674',roughness:.9});
      const tree=new THREE.Group();tree.position.set(-3.6,.4,-3.4);city.add(tree);
      const trunk=new THREE.Mesh(trunkGeometry,stone);trunk.position.y=1.3;trunk.rotation.z=.12;tree.add(trunk);
      for(let i=0;i<12;i++){const crown=new THREE.Mesh(crownGeometry,leaves),a=i*2.399; crown.position.set(Math.cos(a)*(.5+i%3*.28),2.5+(i%4)*.25,Math.sin(a)*(.5+i%3*.28));crown.scale.set(1,.7,1);tree.add(crown);}
      const matrix = new THREE.Matrix4();
      pieces.forEach((list, material) => {
        const mesh = new THREE.InstancedMesh(geometry, material, list.length);
        list.forEach(([x,y,z,w,h,d], index) => { matrix.makeScale(w,h,d); matrix.setPosition(x,y,z); mesh.setMatrixAt(index,matrix); });
        city.add(mesh);
      });
      scene.add(new THREE.HemisphereLight('#c5dcf0', '#3d3027', 2.4));
      const key = new THREE.DirectionalLight('#ffe3b0', 4.5); key.position.set(-8, 16, 8); scene.add(key);
      const rim = new THREE.DirectionalLight('#b7d6e8', 3); rim.position.set(10, 8, -10); scene.add(rim);
      const media = matchMedia('(prefers-reduced-motion: reduce)');
      const fine = matchMedia('(hover: hover) and (pointer: fine)');
      let frame = 0, last = 0, visible = true, manualPause = false, pointerX = 0, pointerY = 0, yaw = 0, pitch = 0;
      let cameraProgress = 0;
      const draw = (now: number) => {
        frame = 0;
        if (cancelled || !visible || document.hidden) return;
        if (now - last < 32) { schedule(); return; } last = now;
        const moving = !media.matches && !manualPause;
        const targetProgress = media.matches ? 0 : progressRef.current;
        if (!manualPause) {
          cameraProgress += (targetProgress-cameraProgress) * .085;
          yaw += ((moving ? pointerX : 0) - yaw) * .07;
          pitch += ((moving ? pointerY : 0) - pitch) * .07;
          const smooth = (value: number) => {const v=Math.max(0,Math.min(1,value));return v*v*(3-2*v);};
          const approach = smooth(cameraProgress / .58);
          const enter = smooth((cameraProgress-.48)/.52);
          const mobile = element.clientWidth < 768;
          const arabic = element.closest('[dir]')?.getAttribute('dir') === 'rtl';
          const overview = mobile ? new THREE.Vector3(22,18,27) : new THREE.Vector3(17,13,21);
          const street = new THREE.Vector3(8,5.2,12);
          const entrance = new THREE.Vector3(4.2,2.8,5.6);
          camera.position.copy(overview).lerp(street,approach).lerp(entrance,enter);
          camera.position.x += yaw * (1-enter) * .6;
          camera.position.y += pitch * (1-enter) * .3;
          const focus = new THREE.Vector3(0,2,0).lerp(new THREE.Vector3(.5,2.5,-2.7),enter);
          camera.lookAt(focus);
          const w=element.clientWidth,h=element.clientHeight;
          camera.setViewOffset(w,h,(arabic?1:-1)*w*.14*(1-enter),mobile?-h*.16*(1-enter):0,w,h);
          city.position.x=0;
          city.rotation.y=-.12*(1-enter);
        }
        renderer.render(scene,camera);
        if (moving && (Math.abs(cameraProgress-targetProgress) > .0005 || Math.abs(yaw-pointerX) > .002 || Math.abs(pitch-pointerY) > .002)) schedule();
      };
      const schedule = () => { if (!frame && visible && !document.hidden && !cancelled) frame = requestAnimationFrame(draw); };
      const resize = () => { const r = element.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / Math.max(1,r.height); camera.updateProjectionMatrix(); schedule(); };
      const observer = new ResizeObserver(resize); observer.observe(element);
      const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; } }); intersection.observe(element);
      const pointer = (event: PointerEvent) => { if (!fine.matches || event.pointerType !== 'mouse') return; const r = element.getBoundingClientRect(); pointerX = (event.clientX - r.left) / r.width - .5; pointerY = (event.clientY - r.top) / r.height - .5; schedule(); };
      const resetPointer = () => { pointerX = pointerY = 0; schedule(); };
      const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
      const preference = () => { pointerX = pointerY = 0; schedule(); };
      element.parentElement?.addEventListener('pointermove',pointer); element.parentElement?.addEventListener('pointerleave',resetPointer);
      document.addEventListener('visibilitychange',visibility); media.addEventListener('change',preference); window.addEventListener('scroll',schedule,{passive:true});
      controls.current = { pause(value) { manualPause = value; schedule(); }, reset() { pointerX = pointerY = yaw = pitch = 0; schedule(); } };
      dispose = () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); element.parentElement?.removeEventListener('pointermove',pointer); element.parentElement?.removeEventListener('pointerleave',resetPointer); document.removeEventListener('visibilitychange',visibility); media.removeEventListener('change',preference); window.removeEventListener('scroll',schedule); geometry.dispose(); roofGeometry.dispose(); ribGeometries.forEach(g=>g.dispose()); poolGeometry.dispose(); trunkGeometry.dispose(); crownGeometry.dispose(); [stone,porcelain,glass,brass,base,roofMaterial,poolMaterial,leaves].forEach(m => m.dispose()); renderer.dispose(); renderer.domElement.remove(); controls.current = null; };
      resize(); setReady(true);
    }).catch(() => { /* The existing architectural still is the WebGL fallback. */ });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <div className={styles.origin} data-scene-world>
    <div className={styles.frame}>
    <div ref={host} className={styles.scene} data-skyline-ready={ready} aria-hidden="true" />
    <div className={styles.controls}>
      <a href="#details-workspace">{language === 'ar' ? 'تخطي المشهد إلى مساحة العمل' : 'Skip scene to workspace'}</a>
      {ready && <>
        <button type="button" aria-pressed={paused} aria-label={language === 'ar' ? (paused ? 'تشغيل حركة المشهد' : 'إيقاف حركة المشهد') : (paused ? 'Resume scene motion' : 'Pause scene motion')} onClick={() => { controls.current?.pause(!paused); setPaused(!paused); }}>{paused ? <Play /> : <Pause />}</button>
        <button type="button" aria-label={language === 'ar' ? 'إعادة ضبط المشهد' : 'Reset scene'} onClick={() => { controls.current?.pause(false); controls.current?.reset(); setPaused(false); }}><RotateCcw /></button>
      </>}
    </div>
    </div>
  </div>;
}
