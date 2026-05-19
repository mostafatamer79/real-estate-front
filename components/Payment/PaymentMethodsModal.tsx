"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, Calendar, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { financialApi } from '@/lib/api';
import { apiClient } from '@/lib/client';
import toast from 'react-hot-toast';

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  invoiceId?: string;
  subscriptionId?: string;
  price: number;
  onPaymentSuccess: () => void;
}

export default function PaymentMethodsModal({ isOpen, onClose, bookingId, invoiceId, subscriptionId, price, onPaymentSuccess }: PaymentMethodsModalProps) {
  const { t, language } = useLanguage();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);

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
    if (selectedMethod === 'installments' && !selectedInstallment) return;
    
    setProcessing(true);
    try {
      const methodToPay = selectedMethod === 'installments' ? selectedInstallment : selectedMethod;
      const subscriptionMethodMap: Record<string, string> = {
        balance: 'نقدي',
        credit: 'بطاقة ائتمان',
        installments: 'بطاقة ائتمان',
        tamara: 'بطاقة ائتمان',
        tabby: 'بطاقة ائتمان',
      };
      // Logic for different payment methods
      if (invoiceId) {
        await financialApi.payInvoice(invoiceId, methodToPay as string);
        toast.success(t('payment.success') || "تمت عملية الدفع بنجاح");
      } else if (subscriptionId) {
        await apiClient.post(`/subscriptions/${subscriptionId}/activate`, {
          paymentMethod: subscriptionMethodMap[methodToPay as string] || 'بطاقة ائتمان',
        });
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshRes = await apiClient.post('/auth/refresh', { refreshToken });
          if (refreshRes.data?.accessToken) {
            localStorage.setItem('token', refreshRes.data.accessToken);
          }
          if (refreshRes.data?.refreshToken) {
            localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
          }
          if (refreshRes.data?.user) {
            localStorage.setItem('user', JSON.stringify(refreshRes.data.user));
            window.dispatchEvent(new Event('auth-change'));
          }
        }
        toast.success(t('payment.success') || "تمت عملية الدفع بنجاح");
      } else {
        // Fallback for non-invoice payments if any (simulated for now)
        toast.success(t('payment.success') || "تمت عملية الدفع بنجاح");
      }
      
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('payment.error'));
    } finally {
      setProcessing(false);
    }
  };

  const methods = [
    { id: 'balance', title: t('payment.balance'), icon: <Wallet className="w-5 h-5" />, desc: `${balance} ${t('chat.currency')}` },
    { id: 'credit', title: t('payment.credit'), icon: <CreditCard className="w-5 h-5" />, desc: t('payment.creditDesc') || "مدى، فيزا، ماستركارد" },
    { id: 'installments', title: t('payment.installments') || "تقسيط", icon: <Calendar className="w-5 h-5" />, desc: t('payment.installmentsDesc') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-slate-900">{t('payment.select')}</DialogTitle>
          <DialogDescription className="text-slate-500 font-bold">
             {t('payment.amountRequired')}: <span className="text-slate-900 font-black">{price} {t('chat.currency')}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => {
                setSelectedMethod(method.id);
                if (method.id !== 'installments') {
                  setSelectedInstallment(null);
                }
              }}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${
                selectedMethod === method.id 
                  ? 'border-indigo-600 bg-indigo-50/50' 
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors ${
                    selectedMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {method.icon}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{method.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{method.desc}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedMethod === method.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-200'
              }`}>
                {selectedMethod === method.id && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </button>
          ))}
        </div>

        {selectedMethod === 'installments' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedInstallment('tamara')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                selectedInstallment === 'tamara'
                  ? 'border-pink-500 bg-pink-50/70'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  selectedInstallment === 'tamara' ? 'bg-pink-500 text-white' : 'bg-slate-100 text-pink-400'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="font-bold text-slate-900">{t('payment.tamara')}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedInstallment === 'tamara' ? 'border-pink-500 bg-pink-500' : 'border-slate-200'
              }`}>
                {selectedInstallment === 'tamara' && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>

            <button
              onClick={() => setSelectedInstallment('tabby')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                selectedInstallment === 'tabby'
                  ? 'border-emerald-500 bg-emerald-50/70'
                  : 'border-slate-100 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  selectedInstallment === 'tabby' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-emerald-400'
                }`}>
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="font-bold text-slate-900">{t('payment.tabby')}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedInstallment === 'tabby' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'
              }`}>
                {selectedInstallment === 'tabby' && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </button>
          </div>
        )}

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
              (selectedMethod === 'installments' && !selectedInstallment)
            }
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all active:scale-95"
          >
            {processing ? <Loader2 className="w-6 h-6 animate-spin" /> : t('payment.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
