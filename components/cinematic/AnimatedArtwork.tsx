'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import styles from './animated-artwork.module.css';

/** Decorative camera movement; page controls retain their native pointer and scroll behavior. */
export default function AnimatedArtwork({ src, alt = '', className = '', priority = false, sizes = '(max-width: 767px) 100vw, 60vw' }: { src: string; alt?: string; className?: string; priority?: boolean; sizes?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    const surface = element?.parentElement;
    if (!element || !surface) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let inView = false;
    let frame = 0;
    const updateState = () => {
      const active = inView && !document.hidden && !reduced.matches;
      element.dataset.motionState = reduced.matches ? 'reduced' : active ? 'running' : 'paused';
      element.style.setProperty('--art-play', active ? 'running' : 'paused');
      if (!active) {
        element.style.setProperty('--art-x', '0px');
        element.style.setProperty('--art-y', '0px');
        element.style.setProperty('--art-scroll', '0px');
      }
    };
    const scroll = () => {
      if (!inView || reduced.matches || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
        element.style.setProperty('--art-scroll', `${progress * 12}px`);
      });
    };
    const pointer = (event: PointerEvent) => {
      if (!inView || reduced.matches || !finePointer.matches || event.pointerType === 'touch') return;
      const rect = surface.getBoundingClientRect();
      element.style.setProperty('--art-x', `${Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1)) * -7}px`);
      element.style.setProperty('--art-y', `${Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1)) * -5}px`);
    };
    const reset = () => {
      element.style.setProperty('--art-x', '0px');
      element.style.setProperty('--art-y', '0px');
    };
    const observer = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      updateState();
      scroll();
    });
    observer.observe(element);
    surface.addEventListener('pointermove', pointer, { passive: true });
    surface.addEventListener('pointerleave', reset);
    document.addEventListener('scroll', scroll, { passive: true, capture: true });
    document.addEventListener('visibilitychange', updateState);
    reduced.addEventListener('change', updateState);
    updateState();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      surface.removeEventListener('pointermove', pointer);
      surface.removeEventListener('pointerleave', reset);
      document.removeEventListener('scroll', scroll, true);
      document.removeEventListener('visibilitychange', updateState);
      reduced.removeEventListener('change', updateState);
    };
  }, []);
  return <div ref={root} className={`${styles.artwork} ${className}`} data-artwork-src={src} aria-hidden={alt ? undefined : true}>
    <div className={styles.camera}><Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={styles.image} /></div>
  </div>;
}
