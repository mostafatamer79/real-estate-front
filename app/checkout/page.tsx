import { Suspense } from 'react';
import CheckoutHandoff from '@/components/Payment/CheckoutHandoff';

export default function CheckoutPage() {
  return <Suspense fallback={<div role="status">…</div>}><CheckoutHandoff /></Suspense>;
}
