'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { offersApi } from '@/lib/api';
import { loginHref } from '@/lib/auth-navigation';
import { OFFER_ID_PATTERN } from '@/lib/seo';
import { emptyOfferEditor, offerEditorFields, offerEditorPayload, offerEditorValues, type OfferEditorField, type OfferEditorValues } from '@/lib/offer-editor';
import type { CreateOfferDto } from '@/types/api';
import styles from './offer-editor.module.css';

const createRoles = new Set(['admin','agent','broker','real_estate_office','owner','marketing','marketing_admin']);
const labels: Record<OfferEditorField, [string,string]> = {
  propertyType:['نوع العقار','Property type'], area:['المساحة (م²)','Area (m²)'], price:['السعر (ريال)','Price (SAR)'], city:['المدينة','City'], neighborhood:['الحي','Neighborhood'], propertyAge:['عمر العقار','Property age'], direction:['الاتجاه','Direction'], deedType:['نوع الصك','Deed type'], propertyCondition:['حالة العقار','Property condition'], additionalNotes:['ملاحظات إضافية','Additional notes'],
};

export default function OfferEditor({ offerId }: { offerId?: string }) {
  const edit = Boolean(offerId);
  const { user, token, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const router = useRouter();
  const [values,setValues] = useState<OfferEditorValues>(emptyOfferEditor);
  const [original,setOriginal] = useState<OfferEditorValues | null>(null);
  const [loading,setLoading] = useState(edit);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [retry,setRetry] = useState(0);
  const active = useRef(true);
  const saveLock = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const canCreate = Boolean(token && createRoles.has(String(user?.role || '').toLowerCase()));
  const canSave = edit ? Boolean(token && original) : canCreate;
  const back = edit ? `/offers/${offerId}` : '/offers';

  useEffect(() => {
    if (!offerId) return;
    if (!OFFER_ID_PATTERN.test(offerId)) { setError('invalid-id'); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    offersApi.findOne(offerId).then(response => {
      if (cancelled) return;
      const initial = offerEditorValues(response.data);
      setValues(initial); setOriginal(initial);
    }).catch(() => { if (!cancelled) setError('load'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offerId,retry]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saveLock.current) return;
    if (!token) { router.push(loginHref(edit ? `/offers/${offerId}/edit` : '/offers/new')); return; }
    if (!canSave) return;
    let payload;
    try { payload = offerEditorPayload(values, edit ? original || undefined : undefined); }
    catch { setError(ar ? 'أكمل الحقول المطلوبة، وأدخل مساحة وسعرًا أكبر من صفر.' : 'Complete the required fields and enter an area and price greater than zero.'); return; }
    if (edit && Object.keys(payload).length === 0) { router.push(back); return; }
    saveLock.current = true;
    setSaving(true); setError('');
    try {
      const response = edit ? await offersApi.update(offerId!, payload) : await offersApi.create(payload as CreateOfferDto);
      if (active.current) router.push(`/offers/${response.data.id || offerId}`);
    } catch (failure: unknown) {
      if (!active.current) return;
      const message = axios.isAxiosError(failure) ? failure.response?.data?.message : undefined;
      setError(typeof message === 'string' ? message : Array.isArray(message) ? message.filter(item => typeof item === 'string').join('، ') : (ar ? 'تعذر حفظ العرض. بياناتك ما زالت في النموذج.' : 'Could not save the offer. Your entries are still in the form.'));
    } finally { if (active.current) { setSaving(false); saveLock.current = false; } }
  };
  const errorText = error === 'load' ? (ar ? 'تعذر تحميل بيانات العرض.' : 'Could not load the offer.') : error === 'invalid-id' ? (ar ? 'رابط العرض غير صالح.' : 'This offer link is invalid.') : error;

  return <section className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <div className={styles.shell}>
      <header className={styles.orientation}>
        <Link href={back} className={styles.back}><ArrowLeft aria-hidden="true" />{edit ? (ar ? 'العودة إلى العرض' : 'Back to the offer') : (ar ? 'العودة إلى العروض' : 'Back to offers')}</Link>
        <span className={styles.kicker}>{ar ? 'بيانات العقار' : 'PROPERTY DETAILS'}</span>
        <h1>{edit ? (ar ? 'حدّث عرضك.' : 'Refine your offer.') : (ar ? 'عرض جديد. بداية واضحة.' : 'A new offer. A clear start.')}</h1>
        <p>{edit ? (ar ? 'راجع البيانات الأساسية وعدّل ما تحتاجه، ثم احفظ تغييراتك.' : 'Review the core property details, update what you need, and save your changes.') : (ar ? 'أضف البيانات الأساسية للعقار لإنشاء عرضك.' : 'Add the core property details to create your offer.')}</p>
      </header>
      <div className={styles.content}>
        {authLoading || loading ? <p role="status" className={styles.loading}><Loader2 aria-hidden="true" />{ar ? 'جارٍ التحميل…' : 'Loading…'}</p> : <>
          {errorText && <p role="alert" className={styles.error}>{errorText}</p>}
          {error === 'load' && <button className={styles.secondary} onClick={() => setRetry(n => n + 1)} type="button">{ar ? 'إعادة المحاولة' : 'Try again'}</button>}
          {!token && <p className={styles.notice}>{ar ? 'سجّل الدخول لحفظ بيانات العرض.' : 'Sign in to save the offer.'}<Link href={loginHref(edit ? `/offers/${offerId}/edit` : '/offers/new')}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Link></p>}
          {!edit && token && !canCreate && <p role="status" className={styles.notice}>{ar ? 'إنشاء العروض غير متاح لدور حسابك الحالي.' : 'Creating offers is unavailable for your current account role.'}</p>}
          {(!edit || original) && <form onSubmit={submit} className={styles.form} aria-busy={saving}>
            {offerEditorFields.map(field => <label key={field} className={field === 'additionalNotes' ? styles.wide : styles.field} htmlFor={`offer-editor-${field}`}>
              <span>{labels[field][ar ? 0 : 1]}{field !== 'additionalNotes' && ' *'}</span>
              {field === 'additionalNotes' ? <textarea id={`offer-editor-${field}`} name={field} value={values[field]} disabled={saving} onChange={e => setValues(current => ({...current,[field]:e.target.value}))} /> : <input id={`offer-editor-${field}`} name={field} value={values[field]} type={field === 'area' || field === 'price' ? 'number' : 'text'} min={field === 'area' || field === 'price' ? '0.01' : undefined} step={field === 'area' || field === 'price' ? 'any' : undefined} required disabled={saving} dir={field === 'area' || field === 'price' ? 'ltr' : undefined} onChange={e => setValues(current => ({...current,[field]:e.target.value}))} />}
            </label>)}
            <div className={styles.actions}><button type="submit" disabled={saving || !canSave}>{saving && <Loader2 aria-hidden="true" />}{ar ? 'حفظ العرض' : 'Save offer'}</button><Link href={back}>{ar ? 'إلغاء' : 'Cancel'}</Link></div>
          </form>}
        </>}
      </div>
    </div>
  </section>;
}
