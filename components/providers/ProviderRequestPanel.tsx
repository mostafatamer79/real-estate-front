"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  providerApi,
  providerError,
  deliveryLabel,
  type ProviderOffer,
} from "@/lib/providers";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { providerPanelView } from "@/lib/provider-request-view";

export default function ProviderRequestPanel({
  requestId,
  admin = false,
}: {
  requestId: string;
  admin?: boolean;
}) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [offers, setOffers] = useState<ProviderOffer[]>([]);
  const [selection, setSelection] = useState<{
    providerId: string;
    amount: number;
    platformFee: number;
  } | null>(null);
  const [contact, setContact] = useState<{
    unlocked: boolean;
    phone: string | null;
    name?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const serial = useRef(0);
  const acting = useRef(false);
  const load = useCallback(async () => {
    const operation = ++serial.current;
    setBusy(true);
    setError("");
    // Clear provider/contact data before a new request, language or refresh load.
    setOffers([]); setSelection(null); setContact(null);
    try {
      const [response, contactResponse] = await Promise.all([
        providerApi.offers(requestId),
        admin ? Promise.resolve(null) : providerApi.contact(requestId),
      ]);
      const view = providerPanelView(response.data, contactResponse?.data, admin);
      if (!mounted.current || operation !== serial.current) return;
      setOffers(view.offers); setSelection(view.selection); setContact(view.contact);
    } catch (error) {
      if (!mounted.current || operation !== serial.current) return;
      setError(providerError(error, ar ? "تعذر تحميل عروض المزودين" : "Could not load provider offers"));
    } finally {
      if (mounted.current && operation === serial.current) setBusy(false);
    }
  }, [requestId, admin, ar]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => { mounted.current = false; serial.current += 1; };
  }, [load]);
  const accept = async (providerId: string) => {
    if (!admin || acting.current || busy) return;
    acting.current = true;
    const operation = serial.current;
    setBusy(true);
    setError("");
    try {
      await providerApi.assign(requestId, providerId);
      if (mounted.current && operation === serial.current) await load();
    } catch (error) {
      if (!mounted.current || operation !== serial.current) return;
      setError(
        providerError(error, ar ? "تعذر قبول العرض" : "Could not accept offer"),
      );
    } finally {
      acting.current = false;
      if (mounted.current && operation === serial.current) setBusy(false);
    }
  };
  return (
    <section
      className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">
          {ar ? "عروض مزودي الخدمات" : "Provider offers"}
        </h3>
        <Button variant="outline" size="sm" className="min-h-11" onClick={load} disabled={busy}>
          {ar ? "تحديث" : "Refresh"}
        </Button>
      </div>
      {busy && <p role="status" className="text-sm">{ar ? "جارٍ تحميل العروض…" : "Loading offers…"}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {!busy && !offers.length && !error && (
        <p className="text-sm text-muted-foreground">
          {ar ? "لا توجد عروض حتى الآن." : "No offers yet."}
        </p>
      )}
      {offers.map((offer) => (
        <div
          key={offer.providerId}
          className="space-y-2 rounded-lg border border-border p-3"
        >
          <p className="font-semibold">
            {offer.amount.toLocaleString(ar ? "ar-SA" : "en-US")}{" "}
            {ar ? "ريال" : "SAR"} · {deliveryLabel(offer.deliveryMode, ar)}
          </p>
          {offer.note && <p className="text-sm">{offer.note}</p>}
          {admin && (
            <p className="text-xs text-muted-foreground">
              {ar ? "المزود:" : "Provider:"} {offer.providerId} ·{" "}
              {ar ? "حصة المنصة:" : "Platform share:"} {offer.commission}
            </p>
          )}
          {selection?.providerId === offer.providerId ? (
            <p className="text-sm font-bold">
              {ar ? "تم قبول العرض" : "Accepted offer"}
            </p>
          ) : (
            admin &&
            !selection && (
              <Button disabled={busy} onClick={() => accept(offer.providerId)}>
                {ar ? "قبول وإصدار الفاتورة" : "Accept and issue invoice"}
              </Button>
            )
          )}
        </div>
      ))}
      {!admin && selection && (
        <div className="space-y-2 border-t border-border pt-3 text-sm">
          <p>
            {ar ? "حصة / رسوم المنصة:" : "Platform share / fee:"}{" "}
            {selection.platformFee} {ar ? "ريال" : "SAR"}
          </p>
          {contact?.unlocked ? (
            contact.phone ? (
              <a
                className="flex min-h-11 items-center font-semibold underline"
                dir="ltr"
                href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
              >
                {contact.name} · {contact.phone}
              </a>
            ) : (
              <p>
                {ar
                  ? "تم السداد، لكن المزود لم يضف رقم تواصل. تواصل مع الدعم."
                  : "Payment received. Ask support for the missing provider contact."}
              </p>
            )
          ) : (
            <>
              <p>
                {ar
                  ? "يتاح رقم التواصل بعد قبول الطلب وسداد الفاتورة."
                  : "Contact becomes available after acceptance and invoice payment."}
              </p>
              <Link
                className="inline-flex min-h-11 items-center font-bold underline"
                href="/wallet?tab=invoices"
              >
                {ar ? "فتح الفواتير والدفع" : "Open invoices and pay"}
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}
