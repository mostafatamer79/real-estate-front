"use client";
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

export default function PaylinkPaymentModal({ isOpen, onClose, bookingId, invoiceId, price, onPaymentSuccess }: { isOpen: boolean; onClose: () => void; bookingId?: string; invoiceId?: string; price: number; onPaymentSuccess: () => void }) {
  const { t, language } = useLanguage(); const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!isOpen || (!bookingId && !invoiceId)) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null); const token = localStorage.getItem('token');
        const configuredBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api'; const base = configuredBase.endsWith('/api') ? configuredBase : configuredBase + '/api';
        const response = await fetch(base + '/payment/paylink/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ bookingId, invoiceId }) });
        const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.message || 'Failed to initialize Paylink payment');
        if (!cancelled && body.paymentUrl) window.location.assign(body.paymentUrl);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Payment initialization failed'); }
    })();
    return () => { cancelled = true; };
  }, [isOpen, bookingId, invoiceId]);
  return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
    <DialogHeader><DialogTitle>{t('payment.title')}</DialogTitle><DialogDescription>{t('payment.amountRequired')}: <SaudiRiyalAmount amount={price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></DialogDescription></DialogHeader>
    <div className="flex min-h-24 items-center justify-center text-center">{error ? <p className="text-red-500">{error}</p> : <div><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-gray-500" /><p>Redirecting to Paylink…</p></div>}</div>
  </DialogContent></Dialog>;
}
