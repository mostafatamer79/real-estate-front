'use client';

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';

/** Local choreography: readable without JS; no document-wide motion or scroll hijacking. */
export default function DetailsMotionSurface({ children, className, style, dir, icons }: {
  children: ReactNode; className: string; style: CSSProperties;
  dir: 'rtl' | 'ltr'; icons: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const surface = root.current;
    if (!surface) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let frame = 0;
    const hero = surface.querySelector<HTMLElement>('[data-motion-hero]');
    const progress = surface.querySelector<HTMLElement>('[data-motion-progress]');
    const visual = surface.querySelector<HTMLElement>('[data-cinematic-visual]');
    const rule = surface.querySelector<HTMLElement>('[data-cinematic-rule]');
    const animate = (element: HTMLElement, delay = 0) => {
      const animation = element.animate([
        { opacity: 0, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 620, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
    };
    const start = () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      if (reduced.matches) return;
      surface.querySelectorAll<HTMLElement>('[data-motion-intro]').forEach((element, index) => animate(element, index * 65));
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { animate(entry.target as HTMLElement); observer?.unobserve(entry.target); }
        });
      }, { threshold: 0.08 });
      surface.querySelectorAll<HTMLElement>('[data-home-section]:not([data-home-section="map"]):not([data-motion-intro])').forEach(element => observer?.observe(element));
    };
    const scroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (visual) {
          const rect=visual.getBoundingClientRect();
          const amount=Math.min(1,Math.max(-1,(innerHeight*.5-rect.top-rect.height*.5)/innerHeight));
          const heroRect=hero?.getBoundingClientRect();
          const sceneProgress=heroRect?Math.min(1,Math.max(0,(80-heroRect.top)/Math.max(1,heroRect.height*.8))):0;
          visual.style.setProperty('--arch-radius',reduced.matches?'48%':`${48*(1-sceneProgress)}%`);
          visual.style.setProperty('--visual-y',reduced.matches?'0px':`${amount*-24}px`);
          visual.style.setProperty('--image-y',reduced.matches?'0px':`${amount*30}px`);
          visual.style.setProperty('--visual-inset',reduced.matches?'0%':`${Math.max(0,7*(1-(innerHeight-rect.top)/(innerHeight+rect.height)))}%`);
        }
        if (rule) {
          const rect=rule.getBoundingClientRect();
          rule.style.setProperty('--rule-progress',reduced.matches?'1':String(Math.min(1,Math.max(.08,(innerHeight*.95-rect.top)/(innerHeight*.65)))));
        }
        if (hero) {
          const rect = hero.getBoundingClientRect();
          hero.style.setProperty('--chapter-progress', reduced.matches ? '0' : String(Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)))));
        }
        if (progress) {
          const distance = surface.offsetHeight - innerHeight;
          const amount = distance > 0 ? Math.min(1, Math.max(0, -surface.getBoundingClientRect().top / distance)) : 0;
          progress.style.transform = `scaleX(${amount})`;
        }
      });
    };
    start(); scroll();
    const preference=()=>{start();scroll();};
    reduced.addEventListener('change', preference);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll, { passive: true });
    return () => {
      observer?.disconnect(); animations.forEach(animation => animation.cancel());
      cancelAnimationFrame(frame);
      reduced.removeEventListener('change', preference);
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll);
    };
  }, []);
  return <div ref={root} className={className} style={style} dir={dir} data-section-icons={icons}>{children}</div>;
}
