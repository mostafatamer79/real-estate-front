'use client';

import { Fragment, useEffect, useRef } from 'react';
import styles from './cinematic-text.module.css';

export default function CinematicText({ text, className = '', as: Heading = 'h2' }: {
  text: string; className?: string; as?: 'h1' | 'h2';
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = ref.current;
    if (!heading) return;
    const words = Array.from(heading.querySelectorAll<HTMLElement>('[data-cinematic-word]'));
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const animations: Animation[] = [];
    let frame = 0;
    const clamp = (n: number) => Math.min(1,Math.max(0,n));
    const update = () => {
      frame = 0;
      const rect = heading.getBoundingClientRect();
      const progress = Heading === 'h1' || media.matches ? 1 : clamp((innerHeight*.94-rect.top)/Math.max(1,innerHeight*.62+rect.height*.15));
      words.forEach((word,index) => word.style.setProperty('--word-progress',String(clamp(progress*1.4-index/Math.max(1,words.length-1)*.4))));
    };
    const schedule = () => {if(!frame)frame=requestAnimationFrame(update);};
    const preference = () => {animations.forEach(animation=>animation.cancel());update();};
    if (Heading === 'h1' && !media.matches) words.forEach((word,index) => {
      animations.push(word.animate([{opacity:0,transform:'translateY(16px)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0 0)'}],{duration:700,delay:Math.min(index*55,330),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
    });
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});media.addEventListener('change',preference);
    const resize = new ResizeObserver(schedule);resize.observe(heading);update();
    return()=>{cancelAnimationFrame(frame);resize.disconnect();animations.forEach(animation=>animation.cancel());window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);media.removeEventListener('change',preference);};
  },[text,Heading]);
  return <Heading ref={ref} className={`${styles.heading} ${className}`} aria-label={text} data-cinematic-text={Heading}>
    {text.trim().split(/\s+/u).map((word,index)=><Fragment key={`${index}-${word}`}><span data-cinematic-word aria-hidden="true" className={styles.word}>{word}</span>{' '}</Fragment>)}
  </Heading>;
}
