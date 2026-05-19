"use client";

import React from "react";

type SoonBadgeProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

export default function SoonBadge({ children, className = "", style, title }: SoonBadgeProps) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-tighter shadow-lg ring-1 ring-white/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "var(--soon-badge-bg, #ffffff)",
        color: "var(--soon-badge-text, #000000)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

