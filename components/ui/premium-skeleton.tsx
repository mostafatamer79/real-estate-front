"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium skeleton loading components for mobile.
 *
 * Usage:
 *   <PremiumSkeleton variant="card" />
 *   <PremiumSkeleton variant="avatar" />
 *   <PremiumSkeleton variant="text" lines={3} />
 *   <PremiumSkeleton variant="list" count={4} />
 *   <PremiumSkeleton variant="dashboard" />
 */

interface SkeletonProps {
  className?: string;
  dark?: boolean;
}

function SkeletonBase({ className, dark }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        dark
          ? "bg-slate-800/60"
          : "bg-slate-200/60",
        className
      )}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: dark
            ? "linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.08), rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.08), transparent)"
            : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.4), transparent)",
        }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// --- Card Skeleton ---
function CardSkeleton({ className, dark }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 space-y-3",
        dark ? "bg-slate-800/40" : "bg-white/60",
        "border",
        dark ? "border-slate-700/30" : "border-slate-200/50",
        className
      )}
    >
      <SkeletonBase className="h-32 w-full rounded-xl" dark={dark} />
      <SkeletonBase className="h-4 w-3/4 rounded-lg" dark={dark} />
      <SkeletonBase className="h-3 w-1/2 rounded-lg" dark={dark} />
      <div className="flex gap-2">
        <SkeletonBase className="h-6 w-16 rounded-full" dark={dark} />
        <SkeletonBase className="h-6 w-12 rounded-full" dark={dark} />
      </div>
    </div>
  );
}

// --- Avatar Skeleton ---
function AvatarSkeleton({ className, dark, size = 48 }: SkeletonProps & { size?: number }) {
  return (
    <SkeletonBase
      className={cn("rounded-full", className)}
      dark={dark}
      // @ts-ignore
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

// --- Text Skeleton ---
function TextSkeleton({ className, dark, lines = 3 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBase
          key={i}
          className={cn(
            "h-3 rounded-lg",
            i === lines - 1 ? "w-2/3" : "w-full"
          )}
          dark={dark}
        />
      ))}
    </div>
  );
}

// --- List Item Skeleton ---
function ListItemSkeleton({ className, dark }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        dark ? "bg-slate-800/30" : "bg-white/40",
        className
      )}
    >
      <AvatarSkeleton size={40} dark={dark} />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-3.5 w-2/3 rounded-lg" dark={dark} />
        <SkeletonBase className="h-2.5 w-1/2 rounded-lg" dark={dark} />
      </div>
      <SkeletonBase className="h-6 w-16 rounded-full" dark={dark} />
    </div>
  );
}

// --- List Skeleton ---
function ListSkeleton({ className, dark, count = 4 }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <ListItemSkeleton dark={dark} />
        </motion.div>
      ))}
    </div>
  );
}

// --- Dashboard Skeleton ---
function DashboardSkeleton({ className, dark }: SkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Greeting skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBase className="h-3 w-20 rounded-lg" dark={dark} />
          <SkeletonBase className="h-5 w-36 rounded-lg" dark={dark} />
        </div>
        <AvatarSkeleton size={48} dark={dark} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "p-4 rounded-xl space-y-2",
              dark ? "bg-slate-800/40 border border-slate-700/30" : "bg-white/60 border border-slate-200/50"
            )}
          >
            <SkeletonBase className="h-8 w-8 rounded-lg" dark={dark} />
            <SkeletonBase className="h-4 w-16 rounded-lg" dark={dark} />
            <SkeletonBase className="h-3 w-12 rounded-lg" dark={dark} />
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col items-center gap-2 shrink-0"
          >
            <SkeletonBase className="w-14 h-14 rounded-xl" dark={dark} />
            <SkeletonBase className="h-2.5 w-10 rounded-lg" dark={dark} />
          </motion.div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className={cn(
        "p-4 rounded-xl space-y-3",
        dark ? "bg-slate-800/40 border border-slate-700/30" : "bg-white/60 border border-slate-200/50"
      )}>
        <SkeletonBase className="h-4 w-24 rounded-lg" dark={dark} />
        <SkeletonBase className="h-40 w-full rounded-xl" dark={dark} />
      </div>
    </div>
  );
}

// --- Main Export ---
export const PremiumSkeleton = Object.assign(
  function PremiumSkeleton({ variant = "card", ...props }: SkeletonProps & {
    variant?: "card" | "avatar" | "text" | "list" | "listItem" | "dashboard";
    lines?: number;
    count?: number;
    size?: number;
  }) {
    switch (variant) {
      case "avatar":
        return <AvatarSkeleton {...props} />;
      case "text":
        return <TextSkeleton {...props} />;
      case "list":
        return <ListSkeleton {...props} />;
      case "listItem":
        return <ListItemSkeleton {...props} />;
      case "dashboard":
        return <DashboardSkeleton {...props} />;
      case "card":
      default:
        return <CardSkeleton {...props} />;
    }
  },
  {
    Card: CardSkeleton,
    Avatar: AvatarSkeleton,
    Text: TextSkeleton,
    List: ListSkeleton,
    ListItem: ListItemSkeleton,
    Dashboard: DashboardSkeleton,
  }
);
