"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { financialApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { geideaEnabled, useGeideaCheckout } from '@/hooks/useGeideaCheckout';


interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  price: number;
  onPaymentSuccess: () => void;
  allowWallet?: boolean;
}

export default function PaymentMethodsModal({ isOpen, onClose, bookingId, invoiceId, subscriptionId, price, onPaymentSuccess, allowWallet = true }: PaymentMethodsModalProps) {
  const { t, language } = useLanguage();
  const geidea = useGeideaCheckout(language);
  const useGeidea = geideaEnabled && Boolean(bookingId || invoiceId || subscriptionId);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchBalance = async () => {
        setLoading(true);
        try {
          const res = await financialApi.getWallet();
          setBalance(res.data?.balance || 0);
        } catch (err) {
          console.error("Failed to fetch balance", err);
        } finally {
          setLoading(false);
        }
      };
      fetchBalance();
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    if (selectedMethod === 'credit' && !useGeidea) {
      toast.error(language === 'ar' ? 'الدفع الإلكتروني غير متاح حالياً.' : 'Card payments are currently unavailable.');
      return;
    }
    
    setProcessing(true);
    try {
      if (selectedMethod === 'balance') {
        if (!invoiceId) throw new Error('Wallet payment is not available for this item');
        await financialApi.payInvoice(invoiceId, 'balance');
        toast.success(t('payment.success') || "تمت عملية الدفع بنجاح");
        onPaymentSuccess();
        onClose();
      } else if (selectedMethod === 'credit' && useGeidea) {
        if (await geidea.pay({ bookingId, invoiceId, subscriptionId })) {
          toast.success(t('payment.success'));
          onPaymentSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      toast.error(err.message || t('payment.error'));
    } finally {
      setProcessing(false);
    }
  };

  const methods = [
    ...(!subscriptionId && allowWallet ? [{ id: 'balance', title: t('payment.balance'), icon: <Wallet className="w-5 h-5" />, desc: <span className="text-xs text-slate-500 font-medium">{balance.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {language === 'ar' ? 'ر.س' : 'SAR'}</span> }] : []),
    { id: 'credit', title: t('payment.credit'), icon: <CreditCard className="w-5 h-5" />, desc: t('payment.creditDesc') || "مدى، فيزا، ماستركارد" },
  ];

  return (
    <Dialog modal={!geidea.processing} open={isOpen} onOpenChange={(open) => { if (!open && !processing) onClose(); }}>
      <DialogContent className="wallet-dialog-content w-[95vw] sm:max-w-md rounded-[1rem] p-5 sm:p-4 sm:p-8 max-h-[90vh] overflow-y-auto !bg-white/80 backdrop-blur-xl border !border-white/30 shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">{t('payment.select')}</DialogTitle>
          <DialogDescription className="text-slate-500 font-bold">
             {t('payment.amountRequired')}: <span className="text-slate-900 font-black">{price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              disabled={processing || geidea.pending}
              onClick={() => {
                setSelectedMethod(method.id);
              }}
              className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all group ${
                selectedMethod === method.id 
                  ? 'border-indigo-600 bg-indigo-50/50' 
                  : '!border-white/20 hover:border-indigo-600 !bg-white/40 backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${
                    selectedMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-muted text-slate-500'
                }`}>
                  {method.icon}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{method.title}</p>
                  <div className="text-xs text-slate-500 font-medium">{method.desc}</div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === method.id ? 'border-indigo-600 bg-indigo-600' : 'border'
              }`}>
                {selectedMethod === method.id && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>

        {geidea.error && <p role="alert" className="mt-4 text-sm text-red-600">{geidea.error}</p>}

        {!useGeidea && <p role="status" className="mt-4 text-sm text-amber-700">
          {language === 'ar' ? 'الدفع الإلكتروني غير متاح حالياً.' : 'Card payments are currently unavailable.'}
        </p>}

        {selectedMethod === 'balance' && balance < price && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                {t('wallet.insufficientBalance')}
            </div>
        )}

        <DialogFooter className="mt-8">
          <Button
            onClick={handlePayment}
            disabled={
              !selectedMethod ||
              processing ||
              (selectedMethod === 'balance' && balance < price) ||
              (selectedMethod === 'credit' && !useGeidea)
            }
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all active:scale-95"
          >
            {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : geidea.pending ? (language === 'ar' ? 'التحقق من حالة الدفع' : 'Check payment status') : t('payment.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
