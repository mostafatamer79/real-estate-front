import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import { Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api'; // We might need a paymentApi, let's assume we can add it or make a fetch

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  price: number;
  onPaymentSuccess: () => void;
}

export default function StripePaymentModal({ isOpen, onClose, bookingId, price, onPaymentSuccess }: StripePaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bookingId) {
      const fetchClientSecret = async () => {
        setLoading(true);
        setError(null);
        try {
          // TODO: Replace with proper API call from lib/api
          const token = localStorage.getItem('token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3009'}/payment/intent`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bookingId }),
          });
          
          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || 'Failed to initialize payment');
          }

          const data = await res.json();
          setClientSecret(data.clientSecret);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Error initializing payment');
        } finally {
          setLoading(false);
        }
      };

      fetchClientSecret();
    }
  }, [isOpen, bookingId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إتمام عملية الدفع</DialogTitle>
          <DialogDescription>
            المبلغ المطلوب: {price} ريال
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
