"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatLicenseDate, licenseDatesError, providerLicenseExpired } from "@/lib/provider-license-dates";
import { useLanguage } from "@/context/LanguageContext";
import {
  providerApi,
  providerError,
  providerStatus,
  deliveryLabel,
  type ProviderUser,
  type ProviderProfile,
} from "@/lib/providers";
import ProviderRegistrationFieldsEditor from "@/components/providers/ProviderRegistrationFieldsEditor";
import ProviderSpecializationsEditor from "@/components/providers/ProviderSpecializationsEditor";
import ServiceCategoryTree from "@/components/providers/ServiceCategoryTree";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AdminProvidersPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [items, setItems] = useState<ProviderUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [invitationExpiresAt, setInvitationExpiresAt] = useState<string | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [noticeTarget,setNoticeTarget] = useState<string | null>(null);
  const [noticeText,setNoticeText] = useState("");
  const [fee, setFee] = useState("");
  const [onlineAllCities, setOnlineAllCities] = useState(false);
  const [selected, setSelected] = useState<ProviderUser | null>(null);
  const licenseBlocked = !!selected && (!!licenseDatesError(selected.providerProfile) || providerLicenseExpired(selected.providerProfile));
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<ProviderProfile["status"]>("approved");
  const [agreementType, setAgreementType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [note, setNote] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, controls] = await Promise.all([
        providerApi.list(page),
        providerApi.controls(),
      ]);
      setItems(list.data.items);
      setTotal(list.data.total);
      setFee(
        controls.data.notaryPlatformFee === null
          ? ""
          : String(controls.data.notaryPlatformFee),
      );
      setOnlineAllCities(controls.data.onlineAllCities);
    } catch (error) {
      setError(
        providerError(
          error,
          ar ? "تعذر تحميل المزودين" : "Could not load providers",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page, ar]);
  useEffect(() => {
    void load();
  }, [load]);
  const open = (user: ProviderUser) => {
    const p = user.providerProfile;
    setSelected(user);
    setStatus(p.status === "pending" ? "approved" : p.status);
    setCategories(p.categories.length ? p.categories : p.requestedCategories);
    setAgreementType(p.agreementType || "fixed");
    setValue(p.agreementValue === undefined ? "" : String(p.agreementValue));
    setMin(p.minOffer === undefined ? "" : String(p.minOffer));
    setMax(p.maxOffer === undefined ? "" : String(p.maxOffer));
    setNote(p.reviewNote || "");
    setError("");
    setNotice("");
  };
  const review = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await providerApi.review(selected.id, {
        status,
        categories,
        agreementType,
        agreementValue: Number(value),
        minOffer: Number(min),
        maxOffer: Number(max),
        reviewNote: note,
      });
      setSelected(null);
      setNotice(
        ar
          ? "تم حفظ قرار المراجعة وإشعار المزود."
          : "Review saved and provider notified.",
      );
      await load();
    } catch (error) {
      setError(
        providerError(
          error,
          ar ? "تعذر حفظ المراجعة" : "Could not save review",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const accountAction = async (user:ProviderUser,action:'activate'|'restrict'|'archive') => {
    if(action==='archive'&&!window.confirm(ar?'أرشفة الحساب ومنع دخوله؟ تُحفظ الطلبات والسجلات المالية.':'Archive this account and block sign-in? Requests and financial history remain.'))return;
    setBusy(true);setError('');
    try{await providerApi.accountAction(user.id,action);await load();setNotice(ar?'تم تحديث حالة الحساب وإشعار المزود':'Account updated and provider notified');}
    catch(error){setError(providerError(error,ar?'تعذر تحديث الحساب':'Could not update account'));}finally{setBusy(false)}
  };
  const saveControls = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await providerApi.saveControls({
        notaryPlatformFee: Number(fee),
        onlineAllCities,
      });
      setNotice(
        ar
          ? "تم حفظ رسوم المنصة وسياسة المدينة."
          : "Platform fee and city policy saved.",
      );
    } catch (error) {
      setError(
        providerError(error, ar ? "تعذر حفظ الرسوم" : "Could not save fee"),
      );
    } finally {
      setBusy(false);
    }
  };
  const generateInvitation = async () => {
    setGeneratingInvite(true);
    setInviteError("");
    setNotice("");
    try {
      const res = await providerApi.createInvitation();
      const url = `${window.location.origin}/service-providers?invite=${encodeURIComponent(res.data.token)}`;
      setRegistrationUrl(url);
      setInvitationExpiresAt(res.data.expiresAt);
      setNotice(
        ar
          ? "تم إنشاء رابط دعوة جديد بنجاح."
          : "New provider invitation link generated.",
      );
    } catch (err) {
      setInviteError(
        providerError(
          err,
          ar ? "تعذر إنشاء رابط الدعوة" : "Could not generate invitation link",
        ),
      );
    } finally {
      setGeneratingInvite(false);
    }
  };
  return (
    <div
      className="mx-auto max-w-6xl space-y-6 p-4 text-foreground sm:p-6"
      dir={ar ? "rtl" : "ltr"}
    >
      <h1 className="text-2xl font-bold">
        {ar ? "إدارة مزودي الخدمات والموثقين" : "Providers and notaries"}
      </h1>
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="font-bold">{ar ? "رابط دعوة تسجيل مزود خدمة" : "Provider invitation link"}</h2>
        <p className="text-sm text-muted-foreground">{ar ? "أنشئ رابط دعوة خاص للمزود لتسجيل الدخول وحفظ بياناته ثم إكمال توثيق نفاذ لتفعيل الحساب. ضبط التخصصات والاتفاق المالي يتم من هذه الصفحة." : "Generate an invitation link so a provider can sign in, save their application, and complete Nafath verification to activate. Configure specializations and commercial terms here."}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={generatingInvite} onClick={() => void generateInvitation()}>
            {generatingInvite
              ? ar ? "جارٍ إنشاء الرابط…" : "Generating…"
              : ar ? "إنشاء رابط دعوة" : "Generate invitation link"}
          </Button>
          <Link href="/service-providers" className="inline-flex min-h-11 items-center underline">{ar ? "فتح بوابة المزودين" : "Open provider portal"}</Link>
        </div>
        {inviteError && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {inviteError}
          </p>
        )}
        {registrationUrl && (
          <div className="space-y-2 pt-2">
            <label className="block text-sm">
              {ar ? "رابط الدعوة" : "Invitation URL"}
              <input readOnly value={registrationUrl} dir="ltr" onFocus={event => event.target.select()} className="mt-2 w-full rounded-lg border bg-background p-3" />
            </label>
            {invitationExpiresAt && (
              <p className="text-xs text-muted-foreground">
                {ar ? "تنتهي الصلاحية:" : "Expires:"}{" "}
                <span dir="ltr">{new Date(invitationExpiresAt).toLocaleString(ar ? "ar-SA" : "en-US")}</span>
              </p>
            )}
            <Button type="button" variant="outline" onClick={async () => {
              try { await navigator.clipboard.writeText(registrationUrl); setNotice(ar ? "تم نسخ رابط الدعوة" : "Invitation link copied"); }
              catch { setInviteError(ar ? "حدد الرابط وانسخه يدويًا" : "Select and copy the link manually"); }
            }}>{ar ? "نسخ الرابط" : "Copy link"}</Button>
          </div>
        )}
      </section>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-50 p-3 text-emerald-800"
        >
          {notice}
        </p>
      )}
      <ProviderSpecializationsEditor />
      <ProviderRegistrationFieldsEditor />
      <form
        onSubmit={saveControls}
        className="space-y-4 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="text-lg font-bold">
          {ar ? "رسوم طلب الموثق" : "Notary request platform fee"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {ar
            ? "هذه رسوم للمنصة. تظهر في فاتورة المالك بعد اعتماد عرض الموثق. لا يمكن قبول طلب موثق قبل ضبطها."
            : "This platform fee is invoiced to the owner after an offer is accepted. Configure it before accepting notary offers."}
        </p>
        <label className="block space-y-2">
          <span>{ar ? "الرسوم بالريال" : "Fee (SAR)"}</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            className="w-full max-w-sm rounded-lg border bg-background p-3"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlineAllCities}
            onChange={(e) => setOnlineAllCities(e.target.checked)}
          />
          {ar
            ? "السماح للموثق بخدمة أونلاين لكل المدن؛ الحضوري لنفس المدينة دائماً"
            : "Allow online notary services across cities; in-person stays within the same city"}
        </label>
        <Button type="submit" disabled={busy || loading}>
          {ar ? "حفظ الإعدادات" : "Save settings"}
        </Button>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">
          {ar ? "طلبات المزودين" : "Provider applications"}
        </h2>
        {loading && <p role="status">{ar ? "جارٍ التحميل…" : "Loading…"}</p>}
        {!loading && !items.length && !error && (
          <p className="text-muted-foreground">
            {ar ? "لا توجد طلبات حتى الآن." : "No applications yet."}
          </p>
        )}
        {items.map((user) => (
          <article
            key={user.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div>
              <h3 className="font-semibold">
                {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  user.email ||
                  user.id}
              </h3>
              <p className="text-sm text-muted-foreground">
                {providerStatus(user.providerProfile.status, ar)} ·{" "}
                {user.providerProfile.city} ·{" "}
                {user.providerProfile.kind === "notary"
                  ? ar
                    ? "موثق"
                    : "Notary"
                  : ar
                    ? "مزود خدمة"
                    : "Provider"}
              </p>
              {user.providerProfile.specializationTitle&&<p className="text-sm">{user.providerProfile.specializationTitle}</p>}
              <dl className="text-sm">{user.providerProfile.registrationFields?.map(field=><div key={field.id}><dt className="font-semibold">{field.label}</dt><dd>{user.providerProfile.registrationAnswers?.[field.id]||'—'}</dd></div>)}</dl>
              <Link
                href={`/admin/users/${user.id}`}
                className="text-sm underline"
              >
                {ar ? "ملف المستخدم" : "User profile"}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-sm">{user.providerProfile.archivedAt ? (ar?'مؤرشف':'Archived') : user.isActive===false ? (ar?'الحساب مقيّد':'Account restricted') : (ar?'الحساب فعّال':'Account active')}</span>
              <Button variant="outline" disabled={busy} onClick={()=>accountAction(user,user.isActive===false?'activate':'restrict')}>{user.isActive===false?(ar?'تفعيل الحساب':'Activate account'):(ar?'تقييد الحساب':'Restrict account')}</Button>
              {!user.providerProfile.archivedAt&&<Button variant="outline" disabled={busy} onClick={()=>accountAction(user,'archive')}>{ar?'أرشفة الحساب':'Archive account'}</Button>}
              <Button variant="outline" onClick={()=>{setNoticeTarget(user.id);setNoticeText('')}}>{ar?'إشعار المزود':'Notify provider'}</Button>
            <Button variant="outline" onClick={() => open(user)}>
              {ar ? "مراجعة والصلاحيات والتسعير" : "Review, grants and pricing"}
            </Button>
            </div>
          </article>
        ))}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            {ar ? "السابق" : "Previous"}
          </Button>
          <span>{page}</span>
          <Button
            variant="outline"
            disabled={page * 30 >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            {ar ? "التالي" : "Next"}
          </Button>
          <Button variant="outline" disabled={loading} onClick={load}>
            {ar ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </section>
      {noticeTarget&&<form className="space-y-3 rounded-xl border bg-card p-4" onSubmit={async event=>{event.preventDefault();setBusy(true);try{await providerApi.notice(noticeTarget,noticeText);setNoticeTarget(null);setNotice(ar?'تم حفظ الإشعار في حساب المزود':'Notification delivered to provider account')}catch(error){setError(providerError(error,ar?'تعذر إرسال الإشعار':'Could not send notification'))}finally{setBusy(false)}}}><label className="block">{ar?'نص الإشعار':'Notification text'}<textarea required maxLength={2000} value={noticeText} onChange={e=>setNoticeText(e.target.value)} className="mt-2 w-full rounded-lg border bg-background p-3"/></label><Button disabled={busy||!noticeText.trim()}>{ar?'إرسال الإشعار':'Send notification'}</Button><Button type="button" variant="outline" onClick={()=>setNoticeTarget(null)}>{ar?'إلغاء':'Cancel'}</Button></form>}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto"
          dir={ar ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle>
              {ar ? "مراجعة مزود الخدمة" : "Review provider"}
            </DialogTitle>
            <DialogDescription>
              {selected?.firstName} · {selected?.providerProfile.city}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={review} className="space-y-4">
            <p className="text-sm">
              {selected?.providerProfile.deliveryModes
                .map((mode) => deliveryLabel(mode, ar))
                .join("، ")}{" "}
              · {selected?.providerProfile.licenseNumber}
            </p>
            <p className="text-sm">{ar ? "إصدار الترخيص:" : "License issued:"} {formatLicenseDate(selected?.providerProfile.licenseIssueDate, ar)}</p>
            <p className="text-sm">{ar ? "انتهاء الترخيص:" : "License expiry:"} {formatLicenseDate(selected?.providerProfile.licenseExpiryDate, ar)}</p>
            {licenseBlocked && <p role="alert" className="text-sm">{ar ? "الترخيص منتهي أو تواريخه غير صالحة. يلزم تحديثه قبل الاعتماد. حالة الحساب وتوثيق الهوية مستقلان عن مراجعة الترخيص." : "The license has expired or its dates are invalid. Update it before approval. Account activation and identity verification are separate from license review."}</p>}
            {selected?.providerProfile.notes && (
              <p className="text-sm">{selected.providerProfile.notes}</p>
            )}
            {selected?.providerProfile.licenseDocument && (
              <a
                className="block font-semibold underline"
                href={selected.providerProfile.licenseDocument}
                target="_blank"
                rel="noopener noreferrer"
              >
                {ar ? "فتح مستند الترخيص" : "Open license document"}
              </a>
            )}
            <label className="block space-y-2">
              <span>{ar ? "قرار المراجعة" : "Decision"}</span>
              <select
                className="w-full rounded-lg border bg-background p-3"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ProviderProfile["status"])
                }
              >
                {(["approved", "rejected", "suspended"] as const).map(
                  (status) => (
                    <option key={status} value={status}>
                      {providerStatus(status, ar)}
                    </option>
                  ),
                )}
              </select>
            </label>
            {status === "approved" && (
              <>
                <fieldset>
                  <legend className="mb-3">
                    {ar ? "صلاحيات تقديم العروض" : "Allowed offer categories"}
                  </legend>
                  <ServiceCategoryTree
                    manageServices
                    selected={categories}
                    onChange={setCategories}
                  />
                </fieldset>
                <label className="block space-y-2">
                  <span>{ar ? "اتفاق حصة المنصة" : "Platform agreement"}</span>
                  <select
                    className="w-full rounded-lg border bg-background p-3"
                    value={agreementType}
                    onChange={(e) =>
                      setAgreementType(e.target.value as "fixed" | "percentage")
                    }
                  >
                    <option value="fixed">
                      {ar ? "مبلغ ثابت لكل عرض" : "Fixed amount per offer"}
                    </option>
                    <option value="percentage">
                      {ar ? "نسبة من قيمة العرض" : "Percentage of offer amount"}
                    </option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span>
                    {agreementType === "percentage"
                      ? ar
                        ? "النسبة %"
                        : "Percentage %"
                      : ar
                        ? "المبلغ بالريال"
                        : "Amount (SAR)"}
                  </span>
                  <input
                    required
                    type="number"
                    min="0"
                    max={agreementType === "percentage" ? 100 : undefined}
                    step="0.01"
                    className="w-full rounded-lg border bg-background p-3"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span>{ar ? "أقل قيمة عرض" : "Minimum offer"}</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border bg-background p-3"
                      value={min}
                      onChange={(e) => setMin(e.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <span>{ar ? "أعلى قيمة عرض" : "Maximum offer"}</span>
                    <input
                      required
                      type="number"
                      min={Math.max(0.01, Number(min))}
                      step="0.01"
                      className="w-full rounded-lg border bg-background p-3"
                      value={max}
                      onChange={(e) => setMax(e.target.value)}
                    />
                  </label>
                </div>
              </>
            )}
            <label className="block space-y-2">
              <span>
                {ar ? "ملاحظة / سبب الرفض أو التعليق" : "Review note / reason"}
              </span>
              <textarea
                required={status !== "approved"}
                maxLength={2000}
                className="w-full rounded-lg border bg-background p-3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={busy || (status === "approved" && (!categories.length || licenseBlocked))}
            >
              {ar ? "حفظ القرار" : "Save review"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
