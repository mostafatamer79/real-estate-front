"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import { Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api'; // We might need a paymentApi, let's assume we can add it or make a fetch
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  invoiceId?: string;
  price: number;
  onPaymentSuccess: () => void;
}

export default function StripePaymentModal({ isOpen, onClose, bookingId, invoiceId, price, onPaymentSuccess }: StripePaymentModalProps) {
  const { t, language } = useLanguage();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (bookingId || invoiceId)) {
      const fetchClientSecret = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009'}/payment/intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bookingId, invoiceId }),
          });
          
          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || 'Failed to initialize payment');
          }

          const data = await res.json();
          setClientSecret(data.clientSecret);
        } catch (err: any) {
          console.error(err);
          setError(err.message || t('payment.errorInit'));
        } finally {
          setLoading(false);
        }
      };

      fetchClientSecret();
    }
  }, [isOpen, bookingId, invoiceId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:w-[95vw] sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('payment.title')}</DialogTitle>
          <DialogDescription>
             {t('payment.amountRequired')}: <SaudiRiyalAmount amount={price} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
           <div className="flex justify-center p-8">
             <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
           </div>
        ) : error ? (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm onSuccess={() => {
                    onPaymentSuccess();
                    onClose();
                }} onError={(msg) => setError(msg)} />
            </Elements>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
