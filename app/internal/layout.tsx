import React, { Suspense } from "react";
import InternalShell from "./shell";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <InternalShell>{children}</InternalShell>
    </Suspense>
  );
}

