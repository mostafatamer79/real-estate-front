"use client";
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function PaylinkPaymentModal({ isOpen, onClose, bookingId, invoiceId, price, onPaymentSuccess }: { isOpen: boolean; onClose: () => void; bookingId?: string; invoiceId?: string; price: number; onPaymentSuccess: () => void }) {
  const { t, language } = useLanguage(); const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [customerMobile, setCustomerMobile] = useState("");
  const [submittedMobile, setSubmittedMobile] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen) {
      setSubmittedMobile(null);
      return;
    }
    const mobile = user?.phone?.trim() || "";
    setCustomerMobile(mobile);
    setSubmittedMobile(mobile || null);
  }, [isOpen, user?.phone]);
  useEffect(() => {
    if (!isOpen || (!bookingId && !invoiceId) || !submittedMobile) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null); const token = localStorage.getItem('token');
        const configuredBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api'; const base = configuredBase.endsWith('/api') ? configuredBase : configuredBase + '/api';
        const response = await fetch(base + '/payment/paylink/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ bookingId, invoiceId, customerMobile: submittedMobile }) });
        const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.message || 'Failed to initialize Paylink payment');
        if (!cancelled && body.paymentUrl) window.location.assign(body.paymentUrl);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Payment initialization failed'); }
    })();
    return () => { cancelled = true; };
  }, [isOpen, bookingId, invoiceId, submittedMobile]);
  return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <DialogHeader><DialogTitle>{t('payment.title')}</DialogTitle><DialogDescription>{t('payment.amountRequired')}: <SaudiRiyalAmount amount={price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></DialogDescription></DialogHeader>
    {!submittedMobile ? (
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const mobile = customerMobile.trim(); if (mobile) setSubmittedMobile(mobile); }}>
        <label htmlFor="paylink-booking-mobile" className="block text-sm font-bold text-slate-700">
          {language === "ar" ? "رقم الجوال مطلوب لإتمام الدفع" : "Mobile number is required to complete payment"}
        </label>
        <input id="paylink-booking-mobile" type="tel" inputMode="tel" value={customerMobile} onChange={(event) => setCustomerMobile(event.target.value)} placeholder="05xxxxxxxx" className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-left text-slate-900 outline-none focus:border-indigo-600" dir="ltr" required />
        <Button type="submit" className="w-full">{language === "ar" ? "متابعة الدفع" : "Continue to payment"}</Button>
      </form>
    ) : (
      <div className="flex min-h-24 items-center justify-center text-center">{error ? <p className="text-red-500">{error}</p> : <div><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-gray-500" /><p>Redirecting to Paylink…</p></div>}</div>
    )}
  </DialogContent></Dialog>;
}
