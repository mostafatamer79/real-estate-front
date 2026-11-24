import { Suspense } from 'react';
import CheckoutHandoff from '@/components/Payment/CheckoutHandoff';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          aria-live="polite"
          className="min-h-[80dvh] w-full flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              جارٍ تجهيز بوابة الدفع…
            </p>
          </div>
        </div>
      }
    >
      <CheckoutHandoff />
    </Suspense>
  );
}

