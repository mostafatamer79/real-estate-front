'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import type { User } from '@/types/user';

type PendingVerification = {
  userId: string;
  requestId: string;
  clientSecret: string;
  expiresAt: string;
  url?: string;
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
  const [pendingUrl, setPendingUrl] = useState<string>('');

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
        if (pending.url) setPendingUrl(pending.url);
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
              if (!cancelled) { setBusy(false); setPendingUrl(''); setMessage(''); }
              return;
            }
            if (response.data.status !== 'WAITING' || Date.now() >= deadline) {
              sessionStorage.removeItem(STORAGE_KEY);
              setBusy(false); setPendingUrl(''); setMessage(expired);
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

  const cancel = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setBusy(false);
    setPendingUrl('');
    setMessage('');
  };

  const start = async () => {
    if (!configured) return;
    setBusy(true); setMessage('');
    try {
      const response = await api.post<{ requestId: string; clientSecret: string; expiresAt: string; url: string }>('/auth/nafath/request', { locale: ar ? 'ar' : 'en' });
      const url = new URL(response.data.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid verification URL');
      const destination = url.toString();
      setPendingUrl(destination);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId, requestId: response.data.requestId, clientSecret: response.data.clientSecret, expiresAt: response.data.expiresAt, url: destination,
      } satisfies PendingVerification));
      window.location.assign(destination);
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
        {ar ? 'خدمة التحقق عبر نفاذ غير متاحة حالياً. يمكنك تصفح المنصة وتحديث ملفك الشخصي، والتواصل مع الدعم بشأن التوثيق.' : 'Nafath verification is currently unavailable. Use the available login methods and contact support about identity verification.'}
      </p>}
      {configured && !busy && <p className="text-start text-xs leading-6 text-slate-500">{ar ? 'يمكنك تصفح المنصة. يُرجى توثيق حسابك عبر نفاذ لتتمكن من طلب الخدمات أو تقديمها.' : 'You can browse the website. Verify your identity through Nafath to submit requests, publish offers and send messages.'}</p>}
      {busy ? (
        <div className="space-y-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-start text-xs text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600" aria-hidden="true" />
            <span>{ar ? 'طلب التوثيق قيد الانتظار…' : 'Verification request in progress…'}</span>
          </div>
          <p className="text-[11px] leading-5 text-slate-600">
            {ar
              ? 'إذا لم يتم توجيهك تلقائياً لبوابة النفاذ الوطني (iam.sa)، اضغط أدناه لإكمال تسجيل الدخول:'
              : 'If not automatically redirected to Nafath portal (iam.sa), click below to proceed:'}
          </p>
          {pendingUrl && (
            <Button
              type="button"
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              onClick={() => { window.location.assign(pendingUrl); }}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>{ar ? 'الانتقال إلى بوابة نفاذ (iam.sa)' : 'Go to Nafath Portal (iam.sa)'}</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={cancel}
            className="w-full text-xs text-slate-600 hover:text-slate-900 border-slate-300"
          >
            {ar ? 'إلغاء المحاولة والبدء من جديد' : 'Cancel and start over'}
          </Button>
          <p className="text-[10px] leading-4 text-slate-500">
            {ar
              ? 'ملاحظة: تتطلب بوابة النفاذ الوطني الاتصال من داخل المملكة العربية السعودية أو عبر VPN سعودي.'
              : 'Note: Nafath portal (iam.sa) is accessible only from Saudi Arabia.'}
          </p>
        </div>
      ) : (
        <Button type="button" onClick={start} disabled={!configured} className="w-full gap-2" aria-busy={busy}>
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span>{ar ? 'توثيق الحساب' : 'Verify account'}</span>
        </Button>
      )}
    </>}
    {message && <p role="alert" className="text-start text-xs leading-6 text-red-600">{message}</p>}
  </div>;
}
