import { Suspense } from 'react';
import MarketingStandalone from '@/components/redesign/chat09/MarketingStandalone';

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="p-6">جارٍ التحميل…</p>}>
      <MarketingStandalone />
    </Suspense>
  );
}
