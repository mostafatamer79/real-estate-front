"use client";

import { Suspense } from "react";
import BuildingManagementPage from "@/components/properties/BuildingManagementWorkspace";

export default function InternalPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-live="polite" className="flex items-center justify-center min-h-screen p-6">
          <p className="text-sm font-bold text-muted-foreground">جارٍ التحميل…</p>
        </div>
      }
    >
      <BuildingManagementPage />
    </Suspense>
  );
}
