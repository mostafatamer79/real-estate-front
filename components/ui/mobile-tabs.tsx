"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticTick } from "@/lib/haptics";

/**
 * Premium mobile-first segmented tabs built on Radix Tabs primitives.
 *
 * - Phones (<768px): triggers become wrapping chips (nothing hidden, no scroll)
 *   with a spring-animated sliding pill behind the active chip.
 *   Enhanced with glow effects and smooth transitions.
 * - Desktop (>=768px): fully pass-through — pages keep their exact current
 *   styling via their own classes; the pill indicator is hidden.
 *
 * Usage: swap <Tabs> -> <SegmentedTabs>, <TabsList> -> <SegmentedList>,
 * <TabsTrigger> -> <SegmentedTrigger>. Same props.
 */

type SegmentedStateContextValue = { layoutId: string; value?: string };
type SegmentedPillContextValue = string | undefined;

const SegmentedStateContext = React.createContext<SegmentedStateContextValue | null>(null);
const SegmentedPillContext = React.createContext<SegmentedPillContextValue>(undefined);

export function SegmentedTabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const layoutId = React.useId();
  const [innerValue, setInnerValue] = React.useState<string | undefined>(props.defaultValue);
  const currentValue = props.value !== undefined ? props.value : innerValue;

  return (
    <SegmentedStateContext.Provider value={{ layoutId, value: currentValue }}>
      <TabsPrimitive.Root
        className={className}
        {...props}
        onValueChange={(v) => {
          setInnerValue(v);
          props.onValueChange?.(v);
        }}
      />
    </SegmentedStateContext.Provider>
  );
}

export function SegmentedList({
  className,
  pillClassName,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  /** Classes for the sliding pill shown on phones (e.g. "bg-white" on dark pages). */
  pillClassName?: string;
}) {
  return (
    <SegmentedPillContext.Provider value={pillClassName}>
      <TabsPrimitive.List
        className={cn(
          // Mobile: let chips wrap instead of scrolling horizontally
          "max-md:flex-wrap max-md:gap-2 max-md:p-1.5",
          className
        )}
        {...props}
      />
    </SegmentedPillContext.Provider>
  );
}

export function SegmentedTrigger({
  className,
  children,
  onPointerDown,
  disabled,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const state = React.useContext(SegmentedStateContext);
  const pillClassName = React.useContext(SegmentedPillContext);
  const isActive = state ? state.value === props.value : false;

  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative",
        // Mobile: premium chip styling
        "max-md:px-4 max-md:py-2.5 max-md:rounded-xl max-md:text-sm max-md:font-semibold",
        "max-md:transition-all max-md:duration-200",
        isActive && "max-md:text-white",
        !isActive && "max-md:text-slate-400 max-md:hover:text-slate-200",
        className
      )}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!isActive && !disabled) hapticTick();
        onPointerDown?.(e);
      }}
      {...props}
    >
      {state && isActive && (
        <motion.span
          layoutId={`segmented-pill-${state.layoutId}`}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 rounded-xl md:hidden",
            "bg-white/10 backdrop-blur-sm",
            "shadow-[0_2px_8px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]",
            "border border-white/[0.08]",
            pillClassName
          )}
          transition={{ type: "spring", stiffness: 500, damping: 38, mass: 0.7 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

export const SegmentedContent = TabsPrimitive.Content;
