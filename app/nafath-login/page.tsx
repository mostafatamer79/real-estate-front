"use client";

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type NafathStart = { requestId: string; clientSecret: string; random: string; transId: string };

export default function NafathLoginPage() {
  const router = useRouter();
  const [nationalId, setNationalId] = useState('');
  const [request, setRequest] = useState<NafathStart | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  const finishLogin = (data: any) => {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    window.dispatchEvent(new Event('auth-change'));
    router.replace(data.user?.firstName && data.user?.lastName ? '/details' : '/profile');
  };

  const startPolling = (nextRequest: NafathStart) => {
    pollRef.current = window.setInterval(async () => {
      try {
        const params = new URLSearchParams({ requestId: nextRequest.requestId, clientSecret: nextRequest.clientSecret });
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/nafath/status?${params}`);
        const data = await response.json();
        if (data.status === 'COMPLETED' && data.token) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          finishLogin(data);
        } else if (data.status === 'REJECTED' || data.status === 'EXPIRED') {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setMessage(data.status === 'REJECTED' ? 'تم رفض الطلب في تطبيق نفاذ.' : 'انتهت صلاحية الطلب. حاول مرة أخرى.');
        }
      } catch { setMessage('تعذر التحقق من حالة طلب نفاذ.'); }
    }, 3000);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setMessage(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/nafath/request`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nationalId, locale: 'ar' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setRequest(data); startPolling(data);
    } catch { setMessage('تعذر بدء طلب نفاذ. تأكد من الرقم ثم حاول مرة أخرى.'); }
    finally { setLoading(false); }
  };

  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  const openNafath = () => { window.location.href = /Android/i.test(navigator.userAgent) ? 'nic://nafath' : 'nafath://home'; };

  return <main dir="rtl" className="min-h-screen bg-slate-950 p-5 text-white flex items-center justify-center">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <button onClick={() => router.replace('/login')} className="text-sm text-slate-300">العودة لتسجيل الدخول</button>
      <h1 className="mt-6 text-2xl font-bold">تسجيل الدخول عبر نفاذ</h1>
      {!request ? <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-300">رقم الهوية الوطنية أو الإقامة</label>
        <input value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, ''))} inputMode="numeric" minLength={8} maxLength={20} required className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-left" dir="ltr" />
        <button disabled={loading} className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-slate-950 disabled:opacity-50">{loading ? 'جارٍ بدء الطلب...' : 'متابعة عبر نفاذ'}</button>
      </form> : <div className="mt-6 space-y-5 text-center">
        <p className="text-slate-300">طابق الرقم التالي مع الرقم الظاهر في تطبيق نفاذ:</p>
        <p className="text-6xl font-black tracking-[0.25em] text-emerald-300" dir="ltr">{request.random}</p>
        <p className="text-sm text-slate-400">سيتم إكمال تسجيل الدخول تلقائياً بعد الموافقة.</p>
        {isMobile && <button onClick={openNafath} className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-slate-950">فتح تطبيق نفاذ</button>}
      </div>}
      {message && <p role="alert" className="mt-4 text-sm text-rose-300">{message}</p>}
    </section>
  </main>;
}
