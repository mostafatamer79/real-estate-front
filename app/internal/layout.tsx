import React, { Suspense } from "react";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      {children}
    </Suspense>
  );
}
