'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Building2, Tags, ClipboardList, Wallet } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './login-service-door.module.css';

const services = [
  { id: 'services', Icon: Building2, ar: 'الخدمات الإدارية', en: 'Services', descriptionAr: 'جهّز طلب الخدمة وتابع إجراءاته من مساحتك.', descriptionEn: 'Prepare a service request and follow its progress in your workspace.' },
  { id: 'offers', Icon: Tags, ar: 'العروض العقارية', en: 'Property offers', descriptionAr: 'استكشف العروض العقارية المتاحة وتفاصيلها.', descriptionEn: 'Explore available property offers and their details.' },
  { id: 'orders', Icon: ClipboardList, ar: 'مركز الطلبات', en: 'Request center', descriptionAr: 'تابع طلباتك وخطوات إنجازها في مكان واحد.', descriptionEn: 'Follow your requests and their progress in one place.' },
  { id: 'wallet', Icon: Wallet, ar: 'المحفظة المالية', en: 'Wallet', descriptionAr: 'راجع معاملاتك المالية وسجل عملياتك.', descriptionEn: 'Review your financial transactions and activity.' },
] as const;

export default function LoginServiceDoor() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const panelId = useId();
  const left = useRef<HTMLDivElement>(null);
  const right = useRef<HTMLDivElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  const reducedRef = useRef(false);
  const generation = useRef(0);
  const [opened, setOpened] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<(typeof services)[number]['id']>('services');

  const setDoor = useCallback((value: boolean, immediate = false) => {
    if (delay.current) clearTimeout(delay.current);
    const nodes = [left.current, right.current, room.current];
    if (!nodes[0] || !nodes[1] || !nodes[2]) return;
    const [l, r, content] = nodes as [HTMLDivElement, HTMLDivElement, HTMLDivElement];
    const from = [getComputedStyle(l).transform, getComputedStyle(r).transform, getComputedStyle(content).opacity];
    const version = ++generation.current;
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
    setOpened(value);
    setRevealed(false);
    l.style.transform = value ? 'rotateY(-112deg)' : 'rotateY(0deg)';
    r.style.transform = value ? 'rotateY(112deg)' : 'rotateY(0deg)';
    content.style.opacity = value ? '1' : '0';
    if (immediate || reducedRef.current || typeof l.animate !== 'function') { setRevealed(value); return; }
    const ease = 'cubic-bezier(.77,0,.175,1)';
    const a = l.animate([{ transform: from[0] }, { transform: l.style.transform }], { duration: 1250, easing: ease });
    const b = r.animate([{ transform: from[1] }, { transform: r.style.transform }], { duration: 1250, easing: ease });
    const c = content.animate([{ opacity: from[2] }, { opacity: value ? 1 : 0 }], { duration: value ? 850 : 200, delay: value ? 450 : 0, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    animations.current = [a, b, c];
    if (document.hidden) animations.current.forEach(animation => animation.pause());
    void Promise.all(animations.current.map(animation => animation.finished)).then(() => {
      if (mounted.current && generation.current === version) setRevealed(value);
    }).catch(() => { /* Closing, replay, and unmount cancel the previous scene. */ });
  }, []);

  useEffect(() => {
    mounted.current = true;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    const initialFrame = requestAnimationFrame(() => {
      if (media.matches) setDoor(true, true);
      else delay.current = setTimeout(() => setDoor(true), 650);
    });
    const change = () => { reducedRef.current = media.matches; setDoor(true, true); };
    const visibility = () => animations.current.forEach(animation => { if (document.hidden && animation.playState === 'running') animation.pause(); else if (!document.hidden && animation.playState === 'paused') animation.play(); });
    media.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      mounted.current = false;
      cancelAnimationFrame(initialFrame);
      if (delay.current) clearTimeout(delay.current);
      animations.current.forEach(animation => animation.cancel());
      media.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [setDoor]);

  const active = services.find(service => service.id === selected)!;
  return <section className={styles.scene} dir={ar ? 'rtl' : 'ltr'} data-login-door data-door-open={opened} aria-label={ar ? 'بوابة خدمات المنصة' : 'Platform services doorway'}>
    <div className={styles.heading}><p>{ar ? 'مساحة واحدة. كل خدماتك.' : 'One workspace. All your services.'}</p><h2>{ar ? 'افتح باب أعمالك.' : 'Open your next chapter.'}</h2></div>
    <div className={styles.frame}>
      <svg className={styles.architecture} viewBox="0 0 480 570" fill="none" aria-hidden="true"><path d="M28 532V228a212 212 0 0 1 424 0v304M52 532V228a188 188 0 0 1 376 0v304" stroke="currentColor"/><path d="M8 533h464M24 551h432M80 533l-40 18m360-18 40 18" stroke="currentColor" opacity=".45"/><circle cx="240" cy="48" r="5" fill="currentColor"/><path d="M225 48h-25m55 0h25" stroke="currentColor" opacity=".5"/></svg>
      <div className={styles.opening}>
        <div ref={room} className={styles.room}>
          <div className={styles.services} id={panelId} inert={!revealed} role="group" aria-label={ar ? 'استعرض خدمات المنصة' : 'Explore platform services'}>
            {services.map(({ id, Icon, ar: arabic, en }) => <button key={id} type="button" data-door-service={id} aria-pressed={selected === id} onClick={() => setSelected(id)}><Icon aria-hidden="true"/><span>{ar ? arabic : en}</span></button>)}
          </div>
        </div>
        <div ref={left} className={`${styles.leaf} ${styles.left}`} aria-hidden="true"><svg viewBox="0 0 160 430" preserveAspectRatio="none"><path d="M16 415V160Q16 28 145 16V415Z" fill="none" stroke="currentColor"/><path d="M30 400V160Q30 45 130 33V400Z" fill="none" stroke="currentColor" opacity=".35"/><circle cx="140" cy="253" r="4" fill="currentColor"/></svg></div>
        <div ref={right} className={`${styles.leaf} ${styles.right}`} aria-hidden="true"><svg viewBox="0 0 160 430" preserveAspectRatio="none"><path d="M15 415V16Q144 28 144 160V415Z" fill="none" stroke="currentColor"/><path d="M30 400V33Q130 45 130 160V400Z" fill="none" stroke="currentColor" opacity=".35"/><circle cx="20" cy="253" r="4" fill="currentColor"/></svg></div>
      </div>
    </div>
    <div className={styles.description} role="status" aria-live="polite"><h3>{ar ? active.ar : active.en}</h3><p>{ar ? active.descriptionAr : active.descriptionEn}</p><small>{ar ? 'تابع تسجيل الدخول للوصول إلى خدماتك.' : 'Continue signing in to access your services.'}</small></div>

  </section>;
}
