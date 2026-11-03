"use client";

import { useRef, useState } from 'react';
import { geideaApi } from '@/lib/api';
import { payWithGeidea, GeideaCheckoutError, geideaPendingKey, readGeideaPending, saveGeideaPending, type GeideaPaymentTarget } from '@/lib/geidea';
import { useAuth } from '@/hooks/useAuth';

export const geideaEnabled = process.env.NEXT_PUBLIC_GEIDEA_ENABLED === 'true';

export function useGeideaCheckout(language: 'ar' | 'en') {
  const { user } = useAuth();
  const inFlight = useRef(false);
  const pendingOrder = useRef<string | null>(null);
  const pendingTarget = useRef<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pay = async (params: GeideaPaymentTarget): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setProcessing(true);
    setError(null);
    const target = geideaPendingKey(user?.id || 'anonymous', params);
    if (pendingTarget.current !== target) {
      pendingTarget.current = target;
      pendingOrder.current = readGeideaPending(target);
      setPending(Boolean(pendingOrder.current));
    }
    const verify = async (orderId: string) => {
      pendingOrder.current = orderId;
      pendingTarget.current = target;
      saveGeideaPending(target, orderId);
      setPending(true);
      const result = (await geideaApi.verifyOrder(orderId)).data;
      if (result.paid || result.status === 'failed' || result.status === 'cancelled') {
        saveGeideaPending(target, null);
        pendingOrder.current = null;
        setPending(false);
      }
      return result;
    };
    try {
      if (!geideaEnabled) throw new Error('unavailable');
      if (pendingOrder.current) {
        if (pendingTarget.current !== target) throw new Error('pending');
        const result = await verify(pendingOrder.current);
        if (!result.paid) throw new Error(result.status || 'pending');
      } else {
        const session = await geideaApi.createSession({ ...params, language });
        await payWithGeidea(session.data, verify);
      }
      pendingOrder.current = null;
      pendingTarget.current = null;
      setPending(false);
      return true;
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : 'failed';
      const message = reason === 'cancelled'
        ? (language === 'ar' ? 'تم إلغاء الدفع.' : 'Payment cancelled.')
        : pendingOrder.current
          ? (language === 'ar' ? 'لم يتم تأكيد الدفع بعد. تحقق من حالة الدفع قبل المحاولة مجدداً.' : 'Payment is not confirmed yet. Check its status before trying another payment.')
          : (language === 'ar' ? 'تعذر بدء أو إتمام الدفع.' : 'Unable to start or complete payment.');
      const details = cause instanceof GeideaCheckoutError
        ? [cause.responseCode && `${language === 'ar' ? 'رمز جيديا' : 'Geidea code'}: ${cause.responseCode}${cause.detailedResponseCode ? '.' + cause.detailedResponseCode : ''}`,
          cause.reference && `${language === 'ar' ? 'مرجع الدعم' : 'Support reference'}: ${cause.reference}`].filter(Boolean).join(' · ')
        : '';
      setError(details ? `${message} ${details}` : message);
      return false;
    } finally {
      inFlight.current = false;
      setProcessing(false);
    }
  };

  return { pay, processing, error, pending };
}
