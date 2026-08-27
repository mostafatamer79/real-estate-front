"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import { hapticTick, hapticSuccess } from "@/lib/haptics";

/**
 * Premium mobile pull-to-refresh.
 *
 * Renders a floating indicator under the app bar while the user pulls down
 * at the top of the page, then triggers `onRefresh`. Children are rendered
 * untouched (no transform wrappers), so fixed elements keep working.
 * Desktop: renders children only — zero effect.
 */

const THRESHOLD = 64;
const MAX_PULL = 100;
const RESISTANCE = 0.42;

export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const startX = useRef<number>(0);
  const engaged = useRef(false);
  const pullRef = useRef(0);
  pullRef.current = pull;

  // Spring animation for smooth indicator movement
  const springPull = useSpring(0, { stiffness: 300, damping: 30 });
  const indicatorY = useTransform(springPull, [0, MAX_PULL], [-40, 16]);

  const endPull = useCallback(() => {
    startY.current = null;
    engaged.current = false;
    setPull(0);
    springPull.set(0);
  }, [springPull]);

  useEffect(() => {
    if (refreshing) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 2) return;
      startY.current = e.touches[0].clientY;
      startX.current = e.touches[0].clientX;
      engaged.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshing) return;
      const deltaY = e.touches[0].clientY - startY.current;
      const deltaX = Math.abs(e.touches[0].clientX - startX.current);

      // Only engage on a mostly-vertical downward drag at the very top
      if (!engaged.current) {
        if (deltaY > 12 && deltaX < 24 && window.scrollY <= 2) {
          engaged.current = true;
        } else if (deltaY < -8) {
          startY.current = null; // scrolling up — abort
          return;
        } else {
          return;
        }
      }

      if (deltaY > 0) {
        const newPull = Math.min(deltaY * RESISTANCE, MAX_PULL);
        setPull(newPull);
        springPull.set(newPull);
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      const shouldRefresh = pullRef.current >= THRESHOLD && !refreshing;
      endPull();
      if (shouldRefresh) {
        hapticSuccess();
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", endPull, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", endPull);
    };
  }, [onRefresh, refreshing, endPull, springPull]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const circumference = 2 * Math.PI * 14;

  return (
    <>
      {/* Pull indicator — mobile only */}
      <div
        aria-hidden={pull === 0 && !refreshing}
        className="pointer-events-none md:hidden fixed inset-x-0 z-[60] flex justify-center"
        style={{
          top: "calc(4.25rem + env(safe-area-inset-top))",
          opacity: refreshing ? 1 : Math.min(progress * 1.4, 1),
          transform: `translateY(${Math.max(pull - 24, refreshing ? 0 : -40)}px)`,
          transition: pull === 0 ? "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)" : undefined,
        }}
      >
        <div className="relative">
          {/* Glow ring behind indicator */}
          <motion.div
            animate={{
              opacity: refreshing ? 0.3 : progress * 0.2,
              scale: refreshing ? 1.2 : 0.8 + progress * 0.4,
            }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 -m-2 rounded-full bg-indigo-500/20 blur-lg"
          />

          <motion.div
            animate={{ rotate: refreshing ? 360 : progress * 180 }}
            transition={
              refreshing
                ? { repeat: Infinity, duration: 0.8, ease: "linear" }
                : { type: "spring", stiffness: 300, damping: 25 }
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
          >
            {/* SVG progress ring */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />
              <motion.circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke={refreshing ? "#818cf8" : "#6366f1"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{
                  strokeDashoffset: refreshing
                    ? [circumference, 0]
                    : circumference * (1 - progress),
                }}
                transition={
                  refreshing
                    ? { repeat: Infinity, duration: 1.2, ease: "linear" }
                    : { duration: 0.1 }
                }
              />
            </svg>

            <RefreshCw className={`h-4 w-4 ${refreshing ? 'text-indigo-400' : 'text-slate-400'} transition-colors`} />
          </motion.div>
        </div>
      </div>

      {children}
    </>
  );
}
