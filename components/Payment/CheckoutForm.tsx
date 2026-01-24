import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button'; // Assuming standard Shadcn Button
import { Loader2 } from 'lucide-react';

interface CheckoutFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CheckoutForm({ onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL where the user is redirected after the payment.
        // In a modal/SPA context, this might need handling if redirecting.
        // For simplicity, we assume redirection or handling completion.
        return_url: window.location.origin + '/payment/success', 
      },
      redirect: 'if_required', 
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      onError(error.message || 'Payment failed');
    } else {
      // Payment succeeded directly (no redirect needed)
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
      <Button disabled={!stripe || isLoading} className="w-full">
        {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Pay Now'}
      </Button>
    </form>
  );
}
