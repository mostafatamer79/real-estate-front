"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./order-detail.module.css";

/** Visual effects only: request state and chat transport remain owned by the page. */
export function useOrderMotion(orderId: string | undefined, loading: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(new WeakSet<Element>());
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !orderId || loading || paused || reducedMotion) return;
    const animations = new Set<Animation>();
    const animate = (element: Element, delay = 0, duration = 520) => {
      if (typeof element.animate !== "function") return;
      const animation = element.animate(
        [{ opacity: 0.2, transform: "translateY(16px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration, delay, easing: "cubic-bezier(.22,1,.36,1)" },
      );
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };
    const observer = new IntersectionObserver(entries => {
      let index = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!revealed.current.has(entry.target)) {
          revealed.current.add(entry.target);
          animate(entry.target, Math.min(index++ * 60, 180));
        }
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    root.querySelectorAll(`.${styles.heroTitleArea}, .${styles.ruledFigureCell}, .${styles.specBlock}, .${styles.chatContainer}`).forEach(element => observer.observe(element));
    const messages = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.classList.contains(styles.messageRow)) animate(node, 0, 220);
        node.querySelectorAll(`.${styles.specBlock}, .${styles.chatContainer}`).forEach(element => observer.observe(element));
      }));
    });
    messages.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      messages.disconnect();
      animations.forEach(animation => animation.cancel());
    };
  }, [orderId, loading, paused, reducedMotion]);

  return { rootRef, paused, reducedMotion, toggleMotion: () => setPaused(value => !value) };
}

export function OrderNetworkArtwork() {
  return (
    <svg className={styles.heroNetwork} viewBox="0 0 440 240" fill="none" aria-hidden="true" focusable="false">
      <g className={styles.networkLines} stroke="currentColor">
        <path d="M10 180H130Q160 180 160 150V80Q160 50 190 50H425" />
        <path d="M45 215H240Q270 215 270 185V110Q270 80 300 80H410" />
        <path d="M25 110H80Q110 110 110 80V25" />
      </g>
      <g className={styles.networkTrace} stroke="currentColor">
        <path d="M10 180H130Q160 180 160 150V80Q160 50 190 50H425" />
        <path d="M45 215H240Q270 215 270 185V110Q270 80 300 80H410" />
      </g>
      <g className={styles.networkNode} fill="currentColor">
        <circle cx="160" cy="120" r="5" /><circle cx="270" cy="155" r="5" /><circle cx="330" cy="50" r="5" />
      </g>
      <g className={styles.networkHouse} stroke="currentColor" strokeWidth="1.4">
        <rect x="180" y="100" width="58" height="62" rx="9" />
        <path d="M193 124L209 111L225 124V145H193V124Z" /><path d="M205 145V132H214V145" />
      </g>
    </svg>
  );
}
