import { Suspense } from 'react';
import FinancialStandalone from '@/components/redesign/chat09/FinancialStandalone';

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="p-6">جارٍ التحميل…</p>}>
      <FinancialStandalone />
    </Suspense>
  );
}
