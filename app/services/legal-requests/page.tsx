import { Suspense } from "react";
import ClientLegalRequests from "@/components/legal/ClientLegalRequests";

export default function LegalRequestsPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center"
        >
          <p className="text-sm font-semibold text-muted-foreground">
            جارٍ تحميل ملف الطلبات القانونية…
          </p>
        </div>
      }
    >
      <ClientLegalRequests />
    </Suspense>
  );
}
