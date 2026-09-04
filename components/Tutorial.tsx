"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: React.ReactNode;
  gradient?: string;
}

interface TutorialProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  open?: boolean;
}

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SPOTLIGHT_PADDING = 16;
const HIGHLIGHT_BORDER = 2;
const TOOLTIP_MAX_WIDTH = 400;
const TOOLTIP_APPROX_HEIGHT = 260;
const SAFE_MARGIN = 16;
const SWIPE_THRESHOLD = 60;

// ─── Confetti particle ────────────────────────────────────────────────────────

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const x = (Math.random() - 0.5) * 600;
  const rotate = (Math.random() - 0.5) * 720;
  const size = 6 + Math.random() * 8;
  return (
    <motion.div
      className="absolute rounded-sm pointer-events-none"
      style={{ top: "50%", left: "50%", width: size, height: size * 0.5, background: color, borderRadius: 2 }}
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x, y: -300 - Math.random() * 200, rotate, scale: 0 }}
      transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: "easeOut" }}
    />
  );
}

function Confetti() {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#f43f5e","#a78bfa"];
  const particles = useMemo(
    () => Array.from({ length: 60 }).map((_, i) => ({ key: i, delay: i * 0.015, color: colors[i % colors.length] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[10020]">
      {particles.map((p) => <ConfettiParticle key={p.key} delay={p.delay} color={p.color} />)}
    </div>
  );
}

// ─── Ambient orb ─────────────────────────────────────────────────────────────

function AmbientOrb({ style, color, duration }: { style: React.CSSProperties; color: string; duration: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none blur-3xl"
      style={{ background: color, ...style }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.28, 0.18] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function ProgressRing({ current, total, size = 44 }: { current: number; total: number; size?: number }) {
  const strokeWidth = 3;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const progress = current / total;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ring-grad)" strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ * (1 - progress) }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Tutorial({ steps, onComplete, onSkip, open = true }: TutorialProps) {
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const dragX = useMotionValue(0);
  const cardOpacityFromDrag = useTransform(dragX, [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2], [0.4, 1, 0.4]);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentIndex];
  const hasTarget = Boolean(currentStep.targetId);
  const targetFound = Boolean(targetInfo);
  const isMobile = viewport.width > 0 && viewport.width < 640;
  const isMobileBottomSheet = isMobile && hasTarget && targetFound;
  const isCenter = !isMobileBottomSheet && (!hasTarget || !targetFound || currentStep.position === "center");

  // ── Geometry ──────────────────────────────────────────────────────────────

  const updateGeometry = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    if (!currentStep.targetId) { setTargetInfo(null); return; }
    const el = document.getElementById(currentStep.targetId);
    if (el) setTargetInfo({ rect: el.getBoundingClientRect(), element: el });
    else setTargetInfo(null);
  }, [currentStep.targetId]);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    updateGeometry();
    window.addEventListener("resize", updateGeometry);
    window.addEventListener("scroll", updateGeometry, true);
    return () => {
      window.removeEventListener("resize", updateGeometry);
      window.removeEventListener("scroll", updateGeometry, true);
    };
  }, [updateGeometry]);

  useEffect(() => {
    updateGeometry();
    if (targetInfo && !reducedMotion) {
      targetInfo.element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [currentIndex, updateGeometry, targetInfo, reducedMotion]);

  // ── Spotlight ─────────────────────────────────────────────────────────────

  const spotlight: SpotlightRect | null = useMemo(() => {
    if (!targetInfo) return null;
    const { rect } = targetInfo;
    const x = Math.max(0, rect.left - SPOTLIGHT_PADDING);
    const y = Math.max(0, rect.top - SPOTLIGHT_PADDING);
    const width = rect.width + SPOTLIGHT_PADDING * 2;
    const height = rect.height + SPOTLIGHT_PADDING * 2;
    const radius = Math.min(32, rect.width / 2 + SPOTLIGHT_PADDING, rect.height / 2 + SPOTLIGHT_PADDING);
    return { x, y, width, height, radius };
  }, [targetInfo]);

  // ── Tooltip position ──────────────────────────────────────────────────────

  const tooltipStyle = useMemo(() => {
    if (!targetInfo) return {};
    const { rect } = targetInfo;
    const width = Math.min(TOOLTIP_MAX_WIDTH, viewport.width - SAFE_MARGIN * 2);
    const gap = 20;
    const pos = currentStep.position || "bottom";
    const positions = {
      top:    { top: rect.top - gap, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" },
      bottom: { top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: "translate(-50%, 0)" },
      left:   { top: rect.top + rect.height / 2, left: rect.left - gap, transform: "translate(-100%, -50%)" },
      right:  { top: rect.top + rect.height / 2, left: rect.right + gap, transform: "translate(0, -50%)" },
    };
    let chosen = positions[pos as keyof typeof positions] || positions.bottom;
    if (pos === "bottom" && chosen.top + TOOLTIP_APPROX_HEIGHT > viewport.height - SAFE_MARGIN) chosen = positions.top;
    if (pos === "top" && chosen.top - TOOLTIP_APPROX_HEIGHT < SAFE_MARGIN) chosen = positions.bottom;
    let left = chosen.left;
    if (left - width / 2 < SAFE_MARGIN) left = SAFE_MARGIN + width / 2;
    if (left + width / 2 > viewport.width - SAFE_MARGIN) left = viewport.width - SAFE_MARGIN - width / 2;
    let top = chosen.top;
    if (top + TOOLTIP_APPROX_HEIGHT > viewport.height - SAFE_MARGIN) top = viewport.height - SAFE_MARGIN - TOOLTIP_APPROX_HEIGHT;
    if (top < SAFE_MARGIN) top = SAFE_MARGIN;
    return { top, left, transform: chosen.transform, width };
  }, [targetInfo, viewport, currentStep.position]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goTo = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    dragX.set(0);
  }, [currentIndex, dragX]);

  const handleNext = useCallback(() => {
    if (currentIndex < steps.length - 1) {
      goTo(currentIndex + 1);
    } else {
      setShowConfetti(true);
      setTimeout(() => { setShowConfetti(false); onComplete(); }, 1400);
    }
  }, [currentIndex, steps.length, goTo, onComplete]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  const handleSkip = () => onSkip();

  // ── Swipe gesture ─────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const swipe = info.offset.x + info.velocity.x * 0.3;
      if (Math.abs(swipe) > SWIPE_THRESHOLD) {
        const forward = isRtl ? swipe > 0 : swipe < 0;
        if (forward && currentIndex < steps.length - 1) handleNext();
        else if (!forward && currentIndex > 0) handleBack();
      }
      dragX.set(0);
    },
    [isRtl, currentIndex, steps.length, handleNext, handleBack, dragX]
  );

  // ── Slide variants ────────────────────────────────────────────────────────

  const cardVariants = {
    enter: (dir: number) => ({
      opacity: 0, x: reducedMotion ? 0 : dir * 60,
      scale: reducedMotion ? 1 : 0.95, filter: "blur(6px)",
    }),
    center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
    exit: (dir: number) => ({
      opacity: 0, x: reducedMotion ? 0 : dir * -60,
      scale: reducedMotion ? 1 : 0.95, filter: "blur(6px)",
    }),
  };

  const bottomSheetVariants = {
    enter: { opacity: 0, y: 120 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 120 },
  };

  // ── Accent palette ────────────────────────────────────────────────────────

  const ACCENT_PALETTE = [
    "from-indigo-500 to-violet-500",
    "from-violet-500 to-purple-500",
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
  ];
  const accentGradient = currentStep.gradient ?? ACCENT_PALETTE[currentIndex % ACCENT_PALETTE.length];
  const isLastStep = currentIndex === steps.length - 1;

  if (!mounted || !open) return null;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="fixed inset-0 z-[10000]" dir={isRtl ? "rtl" : "ltr"} aria-modal="true" role="dialog">

      {/* ── Confetti ── */}
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* ── Dim overlay with SVG spotlight cutout ── */}
      {spotlight ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
          <defs>
            <mask id="tutorial-spotlight-mask">
              <rect x={0} y={0} width={viewport.width} height={viewport.height} fill="white" />
              <motion.rect
                x={spotlight.x} y={spotlight.y}
                width={spotlight.width} height={spotlight.height}
                rx={spotlight.radius} ry={spotlight.radius} fill="black"
                animate={{ x: spotlight.x, y: spotlight.y, width: spotlight.width, height: spotlight.height }}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 28 }}
              />
            </mask>
          </defs>
          <rect x={0} y={0} width={viewport.width} height={viewport.height} fill="rgba(2,6,23,0.84)" mask="url(#tutorial-spotlight-mask)" />
        </svg>
      ) : (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"
        />
      )}

      {/* ── Animated spotlight ring ── */}
      <AnimatePresence mode="wait">
        {spotlight && (
          <motion.div
            key={`ring-${currentStep.id}`}
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.06 }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
            className="absolute pointer-events-none z-[10005]"
            style={{
              left: spotlight.x - HIGHLIGHT_BORDER - 2, top: spotlight.y - HIGHLIGHT_BORDER - 2,
              width: spotlight.width + (HIGHLIGHT_BORDER + 2) * 2, height: spotlight.height + (HIGHLIGHT_BORDER + 2) * 2,
              borderRadius: spotlight.radius + HIGHLIGHT_BORDER + 2,
            }}
          >
            {/* Breathing glow */}
            <motion.div
              className="absolute inset-0 rounded-[inherit]"
              style={{ boxShadow: "0 0 0 2px rgba(129,140,248,0.75), 0 0 60px 14px rgba(129,140,248,0.32), 0 0 120px 28px rgba(139,92,246,0.18)" }}
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.015, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Border */}
            <div className="absolute inset-0 rounded-[inherit] border-2 border-indigo-400/90" />
            {/* Corner dots */}
            {["top-0 left-0 -translate-x-1 -translate-y-1","top-0 right-0 translate-x-1 -translate-y-1","bottom-0 left-0 -translate-x-1 translate-y-1","bottom-0 right-0 translate-x-1 translate-y-1"].map((pos, i) => (
              <motion.div key={i} className={cn("absolute w-2 h-2 rounded-full bg-indigo-400", pos)}
                animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tooltip / Card ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`card-${currentStep.id}`}
          custom={direction}
          variants={isMobileBottomSheet ? bottomSheetVariants : cardVariants}
          initial="enter" animate="center" exit="exit"
          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: isMobileBottomSheet ? 380 : 340, damping: 32 }}
          drag={isMobile ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={
            !isCenter && !isMobileBottomSheet
              ? { ...tooltipStyle, ...(isMobile ? { x: dragX, opacity: cardOpacityFromDrag } : {}) }
              : isMobile
              ? { x: dragX, opacity: cardOpacityFromDrag }
              : undefined
          }
          className={cn(
            "z-[10010] pointer-events-auto select-none",
            isCenter ? "fixed inset-0 flex items-center justify-center p-4"
              : isMobileBottomSheet ? "fixed bottom-0 left-0 right-0"
              : "absolute max-w-[min(400px,calc(100vw-32px))]"
          )}
        >
          {/* Ambient orbs for center modal */}
          {isCenter && !reducedMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
              <AmbientOrb color="rgba(99,102,241,0.35)" style={{ width: 280, height: 280, top: -80, left: -80 }} duration={4} />
              <AmbientOrb color="rgba(139,92,246,0.25)" style={{ width: 200, height: 200, bottom: -60, right: -60 }} duration={5.5} />
            </div>
          )}

          {/* Card shell */}
          <div className={cn(
            "relative overflow-hidden",
            "bg-gradient-to-b from-[rgba(15,18,40,0.97)] to-[rgba(8,10,28,0.98)]",
            "border border-white/[0.08]",
            "shadow-[0_32px_80px_-8px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)]",
            isCenter ? "w-full max-w-md rounded-[2rem] p-6 sm:p-8"
              : isMobileBottomSheet ? "w-full rounded-t-[2rem] p-5 pb-8"
              : "w-full rounded-2xl p-5"
          )}>
            {/* Gradient top line */}
            <div className={cn("absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r opacity-90", accentGradient)} />

            {/* Shimmer sweep */}
            {!reducedMotion && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-[1]"
                initial={{ x: "-110%" }} animate={{ x: "110%" }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)" }}
              />
            )}

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-3.5">
                {currentStep.icon && (
                  <div className="relative shrink-0">
                    <div className={cn("p-3 rounded-2xl bg-gradient-to-br text-white border border-white/10 shadow-lg", accentGradient)}>
                      {currentStep.icon}
                    </div>
                    <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br blur-md opacity-50 -z-10", accentGradient)} />
                  </div>
                )}
                <div className="min-w-0">
                  <motion.h3
                    key={`title-${currentStep.id}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.3 }}
                    className="text-base sm:text-lg font-bold text-white leading-tight"
                  >
                    {currentStep.title}
                  </motion.h3>
                  <p className="text-xs text-white/35 mt-0.5 font-medium tracking-wide">
                    {t("tour.step") || "Step"} {currentIndex + 1} {t("tour.of") || "of"} {steps.length}
                  </p>
                </div>
              </div>

              {/* Progress ring + X */}
              <div className="relative shrink-0 flex items-center justify-center">
                <ProgressRing current={currentIndex + 1} total={steps.length} size={44} />
                <span className="absolute text-[10px] font-bold text-white/60">{currentIndex + 1}</span>
                <button
                  onClick={handleSkip}
                  className="absolute -top-2 -right-2 p-1 bg-white/5 hover:bg-white/15 text-white/35 hover:text-white/90 rounded-full transition-all duration-200 border border-white/10"
                  aria-label={t("tour.skip") || "Skip tour"}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Description */}
            <motion.p
              key={`desc-${currentStep.id}`}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14, duration: 0.3 }}
              className="relative z-10 text-white/60 text-sm leading-relaxed whitespace-pre-line mb-5"
            >
              {currentStep.description}
            </motion.p>

            {/* Dot navigation */}
            <div className="relative z-10 flex items-center justify-center gap-2 mb-5">
              {steps.map((_, idx) => (
                <button key={idx} onClick={() => goTo(idx)} aria-label={`Go to step ${idx + 1}`}>
                  <motion.div
                    animate={{
                      width: idx === currentIndex ? 24 : 6,
                      backgroundColor: idx === currentIndex ? "#818cf8" : idx < currentIndex ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.12)",
                    }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="h-1.5 rounded-full"
                  />
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="relative z-10 flex items-center gap-2.5">
              {currentIndex > 0 && (
                <motion.button
                  whileHover={reducedMotion ? {} : { scale: 1.03 }}
                  whileTap={reducedMotion ? {} : { scale: 0.97 }}
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.13] text-white/75 hover:text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <ChevronRight className={cn("w-4 h-4", !isRtl && "rotate-180")} />
                  {t("tour.back") || "Back"}
                </motion.button>
              )}

              <motion.button
                whileHover={reducedMotion ? {} : { scale: 1.03, y: -1 }}
                whileTap={reducedMotion ? {} : { scale: 0.97 }}
                onClick={handleNext}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold",
                  "flex items-center justify-center gap-1.5",
                  "bg-gradient-to-r shadow-lg transition-all duration-200",
                  accentGradient,
                  isLastStep ? "shadow-purple-500/30 hover:shadow-purple-500/50" : "shadow-indigo-500/25 hover:shadow-indigo-500/40"
                )}
              >
                {isLastStep ? (
                  <><Sparkles className="w-4 h-4" />{t("tour.finish") || "Finish"}</>
                ) : (
                  <>{t("tour.next") || "Next"}<ChevronLeft className={cn("w-4 h-4", !isRtl && "rotate-180")} /></>
                )}
              </motion.button>
            </div>

            {/* Skip link */}
            <button onClick={handleSkip} className="relative z-10 w-full mt-3 text-xs text-white/22 hover:text-white/50 transition-colors font-medium">
              {t("tour.skip") || "Skip tour"}
            </button>

            {/* Mobile swipe hint */}
            {isMobile && currentIndex === 0 && !reducedMotion && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 text-white/18 text-[10px] pointer-events-none"
              >
                <ChevronLeft className="w-3 h-3" />
                {t("tour.swipe") || "Swipe to navigate"}
                <ChevronRight className="w-3 h-3" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
