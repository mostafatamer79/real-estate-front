'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import type { User } from '@/types/user';

type PendingVerification = {
  userId: string;
  requestId: string;
  clientSecret: string;
  expiresAt: string;
};
const STORAGE_KEY = 'nafath-profile-verification';

export default function NafathVerification({ userId, verifiedAt, onVerified }: {
  userId: string;
  verifiedAt?: string | null;
  onVerified: (user: Partial<User>) => void;
}) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ configured: boolean }>('/auth/nafath/availability', { signal: controller.signal })
      .then(response => setConfigured(response.data.configured === true))
      .catch(() => { if (!controller.signal.aborted) setConfigured(false); });
    return () => controller.abort();
  }, []);
  const [message, setMessage] = useState('');
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => { onVerifiedRef.current = onVerified; }, [onVerified]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const failure = ar ? 'تعذر إكمال التحقق عبر نفاذ. يرجى المحاولة مرة أخرى.' : 'Could not complete Nafath verification. Please try again.';
    const expired = ar ? 'انتهت مهلة التحقق. ابدأ طلباً جديداً.' : 'Verification expired. Start a new request.';
    const refreshProfile = async () => {
      const response = await api.get<User | { data: User }>('/user/profile', { signal: controller.signal });
      const profile = 'data' in response.data ? response.data.data : response.data;
      if (!cancelled) onVerifiedRef.current(profile);
    };
    const resume = async () => {
      try {
        // Always refresh from the server, including a return in another tab/device.
        await refreshProfile();
        const query = new URLSearchParams(window.location.search);
        const returnedState = query.get('state');
        const callbackFailed = query.get('nafath') === 'error';
        if (returnedState || query.has('nafath')) {
          query.delete('state'); query.delete('requestId'); query.delete('nafath');
          window.history.replaceState(null, '', `${window.location.pathname}${query.size ? `?${query}` : ''}`);
        }
        if (callbackFailed) {
          sessionStorage.removeItem(STORAGE_KEY);
          if (!cancelled) setMessage(failure);
          return;
        }
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        let pending: PendingVerification;
        try { pending = JSON.parse(stored); } catch { sessionStorage.removeItem(STORAGE_KEY); return; }
        if (pending.userId !== userId || !pending.requestId || !pending.clientSecret) {
          sessionStorage.removeItem(STORAGE_KEY); return;
        }
        const deadline = new Date(pending.expiresAt).getTime();
        if (!Number.isFinite(deadline)) { sessionStorage.removeItem(STORAGE_KEY); return; }
        if (!cancelled) setBusy(true);
        if (returnedState) {
          await api.post('/auth/nafath/complete', {
            requestId: pending.requestId, clientSecret: pending.clientSecret, state: returnedState,
          }, { signal: controller.signal });
        }
        const poll = async () => {
          if (cancelled) return;
          try {
            const response = await api.get<{ status: string }>('/auth/nafath/status', {
              params: { requestId: pending.requestId, clientSecret: pending.clientSecret }, signal: controller.signal,
            });
            if (cancelled) return;
            if (response.data.status === 'COMPLETED') {
              await refreshProfile();
              sessionStorage.removeItem(STORAGE_KEY);
              if (!cancelled) { setBusy(false); setMessage(''); }
              return;
            }
            if (response.data.status !== 'WAITING' || Date.now() >= deadline) {
              sessionStorage.removeItem(STORAGE_KEY);
              setBusy(false); setMessage(expired);
              return;
            }
            timer = setTimeout(poll, 2500);
          } catch {
            if (!cancelled) { setBusy(false); setMessage(failure); }
          }
        };
        await poll();
      } catch {
        if (!cancelled) { setBusy(false); setMessage(failure); }
      }
    };
    void resume();
    return () => { cancelled = true; controller.abort(); if (timer) clearTimeout(timer); };
  }, [userId, ar]);

  const start = async () => {
    if (!configured) return;
    setBusy(true); setMessage('');
    try {
      const response = await api.post<{ requestId: string; clientSecret: string; expiresAt: string; url: string }>('/auth/nafath/request', { locale: ar ? 'ar' : 'en' });
      const url = new URL(response.data.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid verification URL');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId, requestId: response.data.requestId, clientSecret: response.data.clientSecret, expiresAt: response.data.expiresAt,
      } satisfies PendingVerification));
      window.location.assign(url.toString());
    } catch {
      setBusy(false);
      setMessage(ar ? 'خدمة نفاذ غير متاحة حالياً. يرجى المحاولة لاحقاً أو التواصل مع الدعم.' : 'Nafath is currently unavailable. Please try later or contact support.');
    }
  };

  return <div className="w-full space-y-3" dir={ar ? 'rtl' : 'ltr'}>
    <div className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${verifiedAt ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
      <span>{verifiedAt ? (ar ? 'موثق عبر نفاذ' : 'Verified through Nafath') : (ar ? 'الهوية غير موثقة' : 'Identity not verified')}</span>
    </div>
    {!verifiedAt && <>
      {!configured && <p role="status" className="text-start text-xs leading-6 text-amber-700">
        {ar ? 'خدمة التحقق عبر نفاذ غير متاحة حالياً. يمكنك استخدام طرق تسجيل الدخول المتاحة والتواصل مع الدعم بشأن التوثيق.' : 'Nafath verification is currently unavailable. Use the available login methods and contact support about identity verification.'}
      </p>}
      {configured && <p className="text-start text-xs leading-6 text-slate-500">{ar ? 'يمكنك تصفح الموقع. وثّق هويتك عبر نفاذ لإتمام الطلبات ونشر العروض وإرسال الرسائل.' : 'You can browse the website. Verify your identity through Nafath to submit requests, publish offers and send messages.'}</p>}
      <Button type="button" onClick={start} disabled={busy || !configured} className="w-full gap-2" aria-busy={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
        {busy ? (ar ? 'جارٍ انتظار التحقق…' : 'Waiting for verification…') : (ar ? 'توثيق الهوية عبر نفاذ' : 'Verify identity through Nafath')}
      </Button>
    </>}
    {message && <p role="alert" className="text-start text-xs leading-6 text-red-600">{message}</p>}
  </div>;
}
