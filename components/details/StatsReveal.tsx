"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/** Each card observes itself, including cards stacked below the fold on mobile. */
export default function StatsReveal({ children, className, delay = 0 }: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();
  return <motion.div
    ref={ref}
    className={className}
    initial={false}
    animate={inView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
    transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
    whileHover={reduceMotion ? undefined : { y: -2, transition: { duration: 0.18 } }}
  >{children}</motion.div>;
}
