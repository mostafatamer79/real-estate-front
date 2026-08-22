"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { hapticTick } from "@/lib/haptics";

/**
 * Mobile pull-to-refresh.
 *
 * Renders a floating indicator under the app bar while the user pulls down
 * at the top of the page, then triggers `onRefresh`. Children are rendered
 * untouched (no transform wrappers), so fixed elements keep working.
 * Desktop: renders children only — zero effect.
 */

const THRESHOLD = 64;
const MAX_PULL = 96;
const RESISTANCE = 0.45;

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

  const endPull = useCallback(() => {
    startY.current = null;
    engaged.current = false;
    setPull(0);
  }, []);

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
        setPull(Math.min(deltaY * RESISTANCE, MAX_PULL));
      }
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      const shouldRefresh = pullRef.current >= THRESHOLD && !refreshing;
      endPull();
      if (shouldRefresh) {
        hapticTick();
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
  }, [onRefresh, refreshing, endPull]);

  const progress = Math.min(pull / THRESHOLD, 1);

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
          transition: pull === 0 ? "transform 0.25s ease" : undefined,
        }}
      >
        <motion.div
          animate={{ rotate: refreshing ? 360 : progress * 180 }}
          transition={
            refreshing
              ? { repeat: Infinity, duration: 0.9, ease: "linear" }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card border shadow-lg"
        >
          <RefreshCw className="h-4 w-4 text-slate-500" />
        </motion.div>
      </div>

      {children}
    </>
  );
}
