"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
}

interface TutorialProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  open?: boolean;
}

const SPOTLIGHT_PADDING = 14;
const HIGHLIGHT_BORDER = 2;
const TOOLTIP_MAX_WIDTH = 380;
const TOOLTIP_APPROX_HEIGHT = 240;
const SAFE_MARGIN = 16;

interface TargetInfo {
  rect: DOMRect;
  element: HTMLElement;
}

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

export default function Tutorial({
  steps,
  onComplete,
  onSkip,
  open = true,
}: TutorialProps) {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentIndex];
  const hasTarget = Boolean(currentStep.targetId);
  const targetFound = Boolean(targetInfo);
  const isMobile = viewport.width > 0 && viewport.width < 640;
  const isCenter = isMobile || !hasTarget || !targetFound || currentStep.position === "center";

  const updateGeometry = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (!currentStep.targetId) {
      setTargetInfo(null);
      return;
    }
    const el = document.getElementById(currentStep.targetId);
    if (el) {
      setTargetInfo({ rect: el.getBoundingClientRect(), element: el });
    } else {
      setTargetInfo(null);
    }
  }, [currentStep.targetId]);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    updateGeometry();

    const onResize = () => updateGeometry();
    const onScroll = () => updateGeometry();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [updateGeometry]);

  useEffect(() => {
    updateGeometry();
    if (targetInfo && !reducedMotion) {
      targetInfo.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  }, [currentIndex, updateGeometry, targetInfo, reducedMotion]);

  const spotlight: SpotlightRect | null = useMemo(() => {
    if (!targetInfo) return null;
    const { rect } = targetInfo;
    const x = Math.max(0, rect.left - SPOTLIGHT_PADDING);
    const y = Math.max(0, rect.top - SPOTLIGHT_PADDING);
    const width = rect.width + SPOTLIGHT_PADDING * 2;
    const height = rect.height + SPOTLIGHT_PADDING * 2;
    const radius = Math.min(
      28,
      rect.width / 2 + SPOTLIGHT_PADDING,
      rect.height / 2 + SPOTLIGHT_PADDING
    );
    return { x, y, width, height, radius };
  }, [targetInfo]);

  const tooltipStyle = useMemo(() => {
    if (!targetInfo) return {};
    const { rect } = targetInfo;
    const width = Math.min(TOOLTIP_MAX_WIDTH, viewport.width - SAFE_MARGIN * 2);
    const gap = 20;
    let pos = currentStep.position || "bottom";

    const positions = {
      top: {
        top: rect.top - gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      },
      bottom: {
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      },
      left: {
        top: rect.top + rect.height / 2,
        left: rect.left - gap,
        transform: "translate(-100%, -50%)",
      },
      right: {
        top: rect.top + rect.height / 2,
        left: rect.right + gap,
        transform: "translate(0, -50%)",
      },
    };

    let chosen =
      positions[pos as keyof typeof positions] || positions.bottom;

    // Adaptive flip if tooltip overflows
    if (
      pos === "bottom" &&
      chosen.top + TOOLTIP_APPROX_HEIGHT > viewport.height - SAFE_MARGIN
    ) {
      chosen = positions.top;
    }
    if (pos === "top" && chosen.top - TOOLTIP_APPROX_HEIGHT < SAFE_MARGIN) {
      chosen = positions.bottom;
    }

    let left = chosen.left;
    if (left - width / 2 < SAFE_MARGIN) left = SAFE_MARGIN + width / 2;
    if (left + width / 2 > viewport.width - SAFE_MARGIN)
      left = viewport.width - SAFE_MARGIN - width / 2;

    let top = chosen.top;
    if (top + TOOLTIP_APPROX_HEIGHT > viewport.height - SAFE_MARGIN)
      top = viewport.height - SAFE_MARGIN - TOOLTIP_APPROX_HEIGHT;
    if (top < SAFE_MARGIN) top = SAFE_MARGIN;

    return { top, left, transform: chosen.transform, width };
  }, [targetInfo, viewport, currentStep.position]);

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSkip = () => onSkip();

  const progressLabel = `${currentIndex + 1} ${t("tour.of") || "of"} ${steps.length}`;

  if (!mounted || !open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000]"
      dir={isRtl ? "rtl" : "ltr"}
      aria-modal="true"
      role="dialog"
    >
      {/* Dim overlay with spotlight cutout */}
      {spotlight && (
        <svg
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect
                x={0}
                y={0}
                width={viewport.width}
                height={viewport.height}
                fill="white"
              />
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx={spotlight.radius}
                ry={spotlight.radius}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x={0}
            y={0}
            width={viewport.width}
            height={viewport.height}
            fill="rgba(2, 6, 23, 0.76)"
            mask="url(#tutorial-spotlight-mask)"
            className="transition-all duration-500"
          />
        </svg>
      )}

      {/* Center dim for modal-only steps */}
      {isCenter && !spotlight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
      )}

      {/* Animated spotlight ring */}
      <AnimatePresence mode="wait">
        {spotlight && (
          <motion.div
            key={`ring-${currentStep.id}`}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 30 }
            }
            className="absolute pointer-events-none z-[10005]"
            style={{
              left: spotlight.x - HIGHLIGHT_BORDER,
              top: spotlight.y - HIGHLIGHT_BORDER,
              width: spotlight.width + HIGHLIGHT_BORDER * 2,
              height: spotlight.height + HIGHLIGHT_BORDER * 2,
              borderRadius: spotlight.radius + HIGHLIGHT_BORDER,
              boxShadow:
                "0 0 0 2px rgba(99, 102, 241, 0.65), 0 0 48px 10px rgba(99, 102, 241, 0.22), inset 0 0 24px rgba(99, 102, 241, 0.12)",
            }}
          >
            <div className="absolute inset-0 rounded-[inherit] border-2 border-indigo-400/80 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip / Modal card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${currentStep.id}`}
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 340, damping: 30 }
          }
          className={cn(
            "absolute z-[10010] pointer-events-auto",
            isCenter
              ? "fixed inset-0 flex items-center justify-center p-4"
              : "max-w-[min(380px,calc(100vw-32px))]"
          )}
          style={isCenter ? {} : tooltipStyle}
        >
          <div
            className={cn(
              "relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 shadow-[0_24px_80px_rgba(0,0,0,0.55)]",
              isCenter ? "w-full max-w-lg rounded-[1.75rem] p-5 sm:p-8" : "w-full rounded-2xl p-5"
            )}
          >
            {/* Top shimmer accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {currentStep.icon ? (
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                    {currentStep.icon}
                  </div>
                ) : null}
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {currentStep.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {progressLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors shrink-0"
                aria-label={t("tour.skip") || "Skip tour"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-6">
              {currentStep.description}
            </p>

            {/* Progress bars */}
            <div className="flex items-center gap-1.5 mb-5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    idx <= currentIndex ? "bg-indigo-500" : "bg-slate-700"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {currentIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ChevronRight
                    className={cn("w-4 h-4", !isRtl && "rotate-180")}
                  />
                  {t("tour.back") || "Back"}
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
              >
                {currentIndex === steps.length - 1
                  ? t("tour.finish") || "Finish"
                  : t("tour.next") || "Next"}
                <ChevronLeft
                  className={cn("w-4 h-4", !isRtl && "rotate-180")}
                />
              </button>
            </div>

            <button
              onClick={handleSkip}
              className="w-full mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              {t("tour.skip") || "Skip tour"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
