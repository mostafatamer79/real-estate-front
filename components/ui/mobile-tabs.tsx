"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticTick } from "@/lib/haptics";

/**
 * Mobile-first segmented tabs built on Radix Tabs primitives.
 *
 * - Phones (<768px): triggers become wrapping chips (nothing hidden, no scroll)
 *   with a spring-animated sliding pill behind the active chip.
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
          "max-md:flex-wrap max-md:gap-2",
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
      className={cn("relative", className)}
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
            "absolute inset-0 rounded-full bg-slate-950 shadow-sm md:hidden",
            pillClassName
          )}
          transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

export const SegmentedContent = TabsPrimitive.Content;
