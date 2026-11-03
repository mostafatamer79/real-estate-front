'use client';

import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { geideaEnabled, useGeideaCheckout } from '@/hooks/useGeideaCheckout';
import { useLanguage } from '@/context/LanguageContext';
import { checkoutTarget } from '@/lib/checkout-target';
import { Button } from '@/components/ui/button';

export default function CheckoutHandoff() {
  const query = useSearchParams();
  const { language } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();
  const checkout = useGeideaCheckout(language);
  const target = checkoutTarget(new URLSearchParams(query.toString()));
  const ar = language === 'ar';

  const pay = async () => {
    if (!target || isLoading || !isAuthenticated || !geideaEnabled) return;
    if (await checkout.pay(target)) window.location.assign('/wallet');
  };

  return <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-12" dir={ar ? 'rtl' : 'ltr'}>
    <section className="w-full space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">{ar ? 'الدفع الآمن عبر جيديا' : 'Secure payment with Geidea'}</h1>
      {!target ? <p role="alert">{ar ? 'رابط الدفع غير صالح. افتح الطلب وحاول مجدداً.' : 'Invalid payment link. Open your order and try again.'}</p>
        : <>
          <p>{ar ? 'تابع لعرض المبلغ وطرق الدفع المتاحة في صفحة الدفع الآمنة.' : 'Continue to review the amount and available payment methods in secure checkout.'}</p>
          {!isLoading && !isAuthenticated && <p role="alert">{ar ? 'سجّل الدخول للمتابعة.' : 'Sign in to continue.'}</p>}
          {!geideaEnabled && <p role="alert">{ar ? 'الدفع الإلكتروني غير متاح حالياً.' : 'Card payments are currently unavailable.'}</p>}
          {checkout.error && <p role="alert" className="text-red-600">{checkout.error}</p>}
          <Button onClick={pay} disabled={isLoading || !isAuthenticated || !geideaEnabled || checkout.processing} className="w-full">
            {checkout.processing ? (ar ? 'جارٍ فتح صفحة الدفع…' : 'Opening checkout…')
              : checkout.pending ? (ar ? 'التحقق من حالة الدفع' : 'Check payment status')
                : (ar ? 'متابعة الدفع' : 'Continue to payment')}
          </Button>
        </>}
    </section>
  </div>;
}
