'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
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
type Phase = 'idle' | 'starting' | 'redirecting' | 'checking' | 'waiting' | 'verified' | 'expired' | 'rejected' | 'error';
type Failure = 'start' | 'status' | 'callback' | 'storage' | 'login';
const STORAGE_KEY = 'nafath-profile-verification';

function clearPending() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}

function safeDestination(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid verification URL');
  return url.toString();
}

function needsLogin(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'response' in error &&
    typeof error.response === 'object' && error.response !== null &&
    'status' in error.response && error.response.status === 401;
}

export default function NafathVerification({ userId, verifiedAt, onVerified }: {
  userId: string;
  verifiedAt?: string | null;
  onVerified: (user: Partial<User>) => void;
}) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [failure, setFailure] = useState<Failure>('start');
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [resumeRevision, setResumeRevision] = useState(0);
  const [availabilityRevision, setAvailabilityRevision] = useState(0);
  const onVerifiedRef = useRef(onVerified);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startingRef = useRef(false);
  const operationRef = useRef(0);
  useEffect(() => { onVerifiedRef.current = onVerified; }, [onVerified]);
  useEffect(() => () => {
    operationRef.current += 1;
    startingRef.current = false;
    controllerRef.current?.abort();
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ configured: boolean }>('/auth/nafath/availability', { signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setConfigured(response.data.configured === true); })
      .catch(() => { if (!controller.signal.aborted) setConfigured(false); });
    return () => controller.abort();
  }, [availabilityRevision]);

  useEffect(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const active = () => !controller.signal.aborted;
    const finish = (result: 'verified' | 'expired' | 'rejected') => {
      if (!active()) return;
      clearPending(); setPending(null); setPhase(result);
    };
    const refreshProfile = async () => {
      const response = await api.get<User | { data: User }>('/user/profile', { signal: controller.signal });
      if (!active()) return null;
      const profile = 'data' in response.data ? response.data.data : response.data;
      onVerifiedRef.current(profile);
      return profile;
    };
    const resume = async () => {
      let stage: Failure = 'status';
      try {
        const query = new URLSearchParams(window.location.search);
        const returnedState = query.get('state');
        const callbackFailed = query.get('nafath') === 'error';
        const cleanReturnUrl = () => {
          query.delete('state'); query.delete('requestId'); query.delete('nafath');
          window.history.replaceState(null, '', `${window.location.pathname}${query.size ? `?${query}` : ''}`);
        };
        const profile = await refreshProfile();
        if (!active()) return;
        if (verifiedAt || profile?.nafathVerifiedAt) {
          if (returnedState || query.has('nafath')) cleanReturnUrl();
          finish('verified'); return;
        }
        if (callbackFailed) {
          cleanReturnUrl(); clearPending(); setPending(null); setFailure('callback'); setPhase('error'); return;
        }
        let saved: PendingVerification;
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY);
          if (!stored) {
            if (returnedState || query.has('nafath')) {
              cleanReturnUrl(); setFailure('callback'); setPhase('error');
            } else { setPending(null); setPhase('idle'); }
            return;
          }
          saved = JSON.parse(stored);
        } catch { clearPending(); setFailure('storage'); setPhase('error'); return; }
        if (!saved || saved.userId !== userId || !saved.requestId || !saved.clientSecret) {
          clearPending(); setPending(null); setPhase('idle'); return;
        }
        const deadline = new Date(saved.expiresAt).getTime();
        if (!Number.isFinite(deadline)) { finish('expired'); return; }
        if (saved.url) {
          try { saved.url = safeDestination(saved.url); } catch { delete saved.url; }
        }
        setPending(saved); setPhase('checking');
        if (returnedState) {
          stage = 'callback';
          await api.post('/auth/nafath/complete', {
            requestId: saved.requestId, clientSecret: saved.clientSecret, state: returnedState,
          }, { signal: controller.signal });
          if (!active()) return;
          cleanReturnUrl();
        } else if (query.has('nafath')) cleanReturnUrl();
        stage = 'status';
        const poll = async () => {
          if (!active()) return;
          try {
            const response = await api.get<{ status: string }>('/auth/nafath/status', {
              params: { requestId: saved.requestId, clientSecret: saved.clientSecret }, signal: controller.signal,
            });
            if (!active()) return;
            if (response.data.status === 'COMPLETED') {
              const updated = await refreshProfile();
              if (!active()) return;
              if (!updated?.nafathVerifiedAt) throw new Error('Verification not reflected in profile');
              finish('verified'); return;
            }
            if (response.data.status === 'REJECTED') { finish('rejected'); return; }
            if (response.data.status === 'EXPIRED' || Date.now() >= deadline) { finish('expired'); return; }
            if (response.data.status !== 'WAITING') throw new Error('Unknown verification status');
            setPhase('waiting'); timer = setTimeout(poll, 2500); timerRef.current = timer;
          } catch (error) {
            if (active()) { setFailure(needsLogin(error) ? 'login' : 'status'); setPhase('error'); }
          }
        };
        await poll();
      } catch (error) {
        if (active()) { setFailure(needsLogin(error) ? 'login' : stage); setPhase('error'); }
      }
    };
    void resume();
    return () => { controller.abort(); if (timer) clearTimeout(timer); };
  }, [userId, verifiedAt, resumeRevision]);

  const cancel = () => {
    operationRef.current += 1;
    controllerRef.current?.abort();
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    startingRef.current = false;
    clearPending(); setPending(null); setPhase('idle');
  };

  const start = async () => {
    if (configured !== true || startingRef.current || pending || verifiedAt || phase === 'verified') return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const operation = ++operationRef.current;
    startingRef.current = true;
    setPhase('starting'); setFailure('start');
    let stage: Failure = 'start';
    try {
      const response = await api.post<PendingVerification>('/auth/nafath/request', { locale: ar ? 'ar' : 'en' }, { signal: controller.signal });
      if (controller.signal.aborted || operation !== operationRef.current) return;
      const { requestId, clientSecret, expiresAt } = response.data;
      if (!requestId || !clientSecret || !Number.isFinite(new Date(expiresAt).getTime()) || new Date(expiresAt).getTime() <= Date.now()) throw new Error('Invalid verification session');
      const destination = safeDestination(response.data.url || '');
      const saved = { userId, requestId, clientSecret, expiresAt, url: destination };
      stage = 'storage';
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setPending(saved); setPhase('redirecting');
      // Begin checking even if browser navigation is interrupted; preserve the same session.
      setResumeRevision(value => value + 1);
      stage = 'status';
      window.location.assign(destination);
    } catch (error) {
      if (!controller.signal.aborted && operation === operationRef.current) {
        setFailure(needsLogin(error) ? 'login' : stage); setPhase('error');
      }
    } finally {
      if (operation === operationRef.current) startingRef.current = false;
    }
  };

  const verified = Boolean(verifiedAt) || phase === 'verified';
  const busy = ['starting', 'redirecting', 'checking', 'waiting'].includes(phase);
  const step = verified || phase === 'checking' ? 3 : pending ? 2 : 1;
  const steps = ar ? ['بدء التوثيق', 'المتابعة في نفاذ', 'تأكيد النتيجة'] : ['Start verification', 'Complete Nafath', 'Confirm result'];
  const status = phase === 'starting' ? (ar ? 'جارٍ تجهيز رابط نفاذ…' : 'Preparing your Nafath link…')
    : phase === 'redirecting' ? (ar ? 'جارٍ الانتقال إلى نفاذ…' : 'Opening Nafath…')
    : phase === 'checking' ? (ar ? 'جارٍ التحقق من نتيجة التوثيق…' : 'Checking your verification result…')
    : (ar ? 'بانتظار إكمال التوثيق في نفاذ.' : 'Waiting for you to complete Nafath verification.');
  const errors: Record<Failure, string> = {
    start: ar ? 'تعذر بدء التوثيق. حاول مرة أخرى، أو تواصل مع الدعم إذا استمرت المشكلة.' : 'Could not start verification. Try again, or contact support if the problem continues.',
    status: ar ? 'تعذر التحقق من النتيجة الآن. تحقق من اتصالك ثم أعد فحص حالة التوثيق.' : 'Could not check the result. Check your connection, then check verification status again.',
    callback: ar ? 'لم نتمكن من تأكيد نتيجة نفاذ. أعد فحص الحالة أو ابدأ محاولة جديدة.' : 'We could not confirm the Nafath result. Check the status again or start a new attempt.',
    storage: ar ? 'تعذر حفظ محاولة التوثيق في المتصفح. اسمح بتخزين بيانات الموقع ثم حاول مرة أخرى.' : 'Your browser could not save this verification attempt. Allow site storage, then try again.',
    login: ar ? 'انتهت جلسة تسجيل الدخول. سجّل الدخول مجدداً ثم عد للتحقق من حالة التوثيق.' : 'Your login session expired. Sign in again, then return to check verification status.',
  };

  return <section className="nafath-verification w-full space-y-4 text-start" dir={ar ? 'rtl' : 'ltr'} aria-label={ar ? 'توثيق الهوية عبر نفاذ' : 'Nafath identity verification'}>
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${verified ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-border bg-muted/50 text-foreground'}`}>
      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span role="status">{verified ? (ar ? 'موثق عبر نفاذ' : 'Verified through Nafath') : (ar ? 'توثيق الهوية عبر نفاذ' : 'Verify your identity with Nafath')}</span>
    </div>
    {!verified && <>
      <ol className="flex gap-2 text-xs leading-5" aria-label={ar ? 'خطوات التوثيق' : 'Verification steps'}>
        {steps.map((label, index) => <li key={label} aria-current={index + 1 === step ? 'step' : undefined} className={`flex min-w-0 flex-1 flex-col gap-1.5 ${index + 1 === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border tabular-nums ${index + 1 === step ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`} aria-hidden="true">{index + 1 < step ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
          <span>{label}</span>
        </li>)}
      </ol>
      {configured === null && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{ar ? 'جارٍ التحقق من توفر نفاذ…' : 'Checking Nafath availability…'}</p>}
      {configured === false && !pending && <div className="space-y-2">
        <p role="status" className="text-sm leading-6 text-muted-foreground">{ar ? 'خدمة التحقق عبر نفاذ غير متاحة حالياً. يمكنك تصفح المنصة وتحديث ملفك الشخصي.' : 'Nafath verification is currently unavailable. You can still browse and update your profile.'}</p>
        <Button type="button" variant="outline" className="w-full" onClick={() => { setConfigured(null); setAvailabilityRevision(value => value + 1); }}>{ar ? 'إعادة التحقق من توفر الخدمة' : 'Check availability again'}</Button>
      </div>}
      {busy && <div role="status" aria-live="polite" className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground"><Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />{status}</p>
        {pending && <p className="text-sm leading-6 text-muted-foreground">{ar ? 'أكمل الخطوات في نفاذ ثم عد إلى ملفك الشخصي. سنتحقق من النتيجة تلقائياً.' : 'Complete the steps in Nafath, then return to your profile. We will check the result automatically.'}</p>}
      </div>}
      {phase === 'expired' && <p role="alert" className="text-sm leading-6 text-muted-foreground">{ar ? 'انتهت مهلة التوثيق. ابدأ محاولة جديدة عندما تكون مستعداً.' : 'Verification expired. Start a new attempt when you are ready.'}</p>}
      {phase === 'rejected' && <p role="alert" className="text-sm leading-6 text-muted-foreground">{ar ? 'تم رفض طلب التوثيق في نفاذ. يمكنك بدء محاولة جديدة إذا رغبت.' : 'The verification request was declined in Nafath. You can start a new attempt.'}</p>}
      {phase === 'error' && <p role="alert" className="text-sm leading-6 text-destructive">{errors[failure]}</p>}
      {phase === 'idle' && configured === true && <p className="text-sm leading-6 text-muted-foreground">{ar ? 'سننقلك إلى نفاذ لإكمال توثيق هويتك، ثم نؤكد النتيجة عند عودتك. يمكنك تصفح المنصة قبل التوثيق.' : 'Continue to Nafath to verify your identity. We will confirm the result when you return. You can browse before verifying.'}</p>}
      <div className="space-y-2">
        {pending?.url && <Button type="button" className="min-h-11 w-full gap-2" onClick={() => {
          try { window.location.assign(safeDestination(pending.url!)); } catch { setFailure('status'); setPhase('error'); }
        }}><ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />{ar ? 'المتابعة في نفاذ' : 'Continue to Nafath'}</Button>}
        {phase === 'error' && failure === 'login' ? <Button asChild className="min-h-11 w-full"><a href="/login">{ar ? 'تسجيل الدخول مجدداً' : 'Sign in again'}</a></Button>
          : phase === 'error' && (pending || failure === 'status' || failure === 'callback') ? <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => { setPhase('checking'); setResumeRevision(value => value + 1); }}>{ar ? 'التحقق من حالة التوثيق' : 'Check verification status'}</Button>
          : !pending && !busy && <Button type="button" onClick={start} disabled={configured !== true} className="min-h-11 w-full gap-2"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />{phase === 'idle' ? (ar ? 'المتابعة في نفاذ' : 'Continue to Nafath') : (ar ? 'بدء محاولة جديدة' : 'Start a new attempt')}</Button>}
        {(busy || pending || (phase === 'error' && failure === 'callback')) && <Button type="button" variant="ghost" onClick={cancel} className="min-h-11 w-full text-muted-foreground">{ar ? 'إلغاء المحاولة' : 'Cancel attempt'}</Button>}
      </div>
    </>}
  </section>;
}
