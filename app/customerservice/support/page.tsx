import { Suspense } from "react";
import { CustomerServicePage } from "@/components/customer-service/CustomerServicePage";

export default function CustomerServiceSupportPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6 text-center text-sm font-bold">جارٍ التحميل…</p>}>
      <CustomerServicePage sourcePath="/customerservice/support" />
    </Suspense>
  );
}
