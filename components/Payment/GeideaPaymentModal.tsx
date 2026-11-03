"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';
import { useLanguage } from '@/context/LanguageContext';
import { geideaEnabled, useGeideaCheckout } from '@/hooks/useGeideaCheckout';
import { Loader2 } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  invoiceId?: string;
  price: number;
  onPaymentSuccess: () => void;
};

export default function GeideaPaymentModal({ isOpen, onClose, bookingId, invoiceId, price, onPaymentSuccess }: Props) {
  const { t, language } = useLanguage();
  const checkout = useGeideaCheckout(language);

  const pay = async () => {
    if (await checkout.pay({ bookingId, invoiceId })) {
      onPaymentSuccess();
      onClose();
    }
  };

  return (
    <Dialog modal={!checkout.processing} open={isOpen} onOpenChange={(open) => { if (!open && !checkout.processing) onClose(); }}>
      <DialogContent dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'الدفع عبر جيديا' : 'Pay with Geidea'}</DialogTitle>
          <DialogDescription>
            {t('payment.amountRequired')}: <SaudiRiyalAmount amount={price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
          </DialogDescription>
        </DialogHeader>
        {!geideaEnabled && <p role="status" className="text-sm text-amber-700">
          {language === 'ar' ? 'الدفع الإلكتروني غير متاح حالياً.' : 'Card payments are currently unavailable.'}
        </p>}
        {checkout.error && <p role="alert" className="text-sm text-red-600">{checkout.error}</p>}
        <Button onClick={pay} disabled={!geideaEnabled || checkout.processing} className="w-full">
          {checkout.processing ? <Loader2 className="h-5 w-5 animate-spin" />
            : checkout.pending ? (language === 'ar' ? 'التحقق من حالة الدفع' : 'Check payment status')
              : t('payment.confirm')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
