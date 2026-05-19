"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Scale, CheckCircle2, XCircle, Clock,
  AlertCircle, ArrowLeft, Plus, Users, DollarSign, ChevronDown, ChevronUp
} from "lucide-react";
import Link from "next/link";

type ClientDecision = "pending" | "accepted" | "rejected";

interface LegalRequest {
  id: string;
  serviceType: string;
  category: string;
  status: string;
  clientName: string;
  phone: string;
  city: string;
  district: string;
  description?: string;
  price: number;
  invoiceSent: boolean;
  invoicePrice: number | null;
  clientDecision: ClientDecision | null;
  paymentStatus: string;
  createdAt: string;
  firstParty?: any;
  secondParty?: any;
  metadata?: any;
}

const getStatusConfig = (req: LegalRequest, t: (k: string) => string) => {
  if (!req.invoiceSent)
    return { label: t("legal.requests.awaitingInvoice"), dot: "bg-white/20", text: "text-white/40", ring: "border-white/10", pill: "bg-white/5" };
  if (req.clientDecision === "accepted")
    return { label: t("legal.decision.accepted"),        dot: "bg-white",     text: "text-white/80", ring: "border-white/20", pill: "bg-white/5" };
  if (req.clientDecision === "rejected")
    return { label: t("legal.decision.rejected"),        dot: "bg-white/30",  text: "text-white/40", ring: "border-white/10", pill: "bg-white/5" };
  return   { label: t("legal.decision.pending"),         dot: "bg-white/60",  text: "text-white/70", ring: "border-white/20", pill: "bg-white/5" };
};

export default function LegalRequestsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { t, language } = useLanguage();
  const { token } = useAuth();
  const isRtl = language === "ar";

  const [requests, setRequests]       = useState<LegalRequest[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; type: "success"|"error"; text: string }|null>(null);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests?category=legal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : (data.items || data.data || []));
    } catch { setError(t("common.error")); }
    finally { setIsLoading(false); }
  }, [token, t]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleDecision = async (id: string, decision: "accepted" | "rejected") => {
    if (!token) return;
    setActionLoading(id); setActionMessage(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${id}/client-decision`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setActionMessage({ id, type: "success", text: t(decision === "accepted" ? "legal.decision.successAccept" : "legal.decision.successReject") });
        await fetchRequests();
      } else setActionMessage({ id, type: "error", text: t("legal.decision.error") });
    } catch { setActionMessage({ id, type: "error", text: t("legal.decision.error") }); }
    finally { setActionLoading(null); }
  };

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-slate-950 text-white'}`} dir={isRtl ? "rtl" : "ltr"}>
      {!embedded && <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -5%, rgba(255,255,255,0.04) 0%, transparent 60%)" }} />}

      {/* Sticky header — Adjusted for global header */}
      {!embedded && (
      <div className="sticky top-16 z-20 bg-slate-950 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/services" className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center transition-colors">
              <ArrowLeft className={`w-3.5 h-3.5 text-white/50 ${isRtl ? "rotate-180" : ""}`} />
            </Link>
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-white/40" />
              <span className="font-black text-sm text-white">{t("legal.requests.title")}</span>
              {requests.length > 0 && (
                <span className="text-[9px] font-black text-white/30 border border-white/10 rounded-full px-2 py-0.5">
                  {requests.length}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/services/form?type=legal"
            className="flex items-center gap-1.5 h-8 px-4 rounded-full bg-white text-slate-950 text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {isRtl ? "جديد" : "New"}
          </Link>
        </div>
      </div>
      )}

      <div className={`${embedded ? '' : 'relative z-10 max-w-3xl mx-auto px-6 py-10'}`}>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center">
              <Scale className="w-7 h-7 text-white/10" />
            </div>
            <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 font-bold text-sm">{error}</p>
            <button onClick={fetchRequests} className="text-[10px] text-white/20 font-black uppercase tracking-widest hover:text-white/60 transition-colors">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && requests.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 gap-8 text-center">
            <div className="w-24 h-24 rounded-[2rem] border border-white/10 bg-white/[0.02] flex items-center justify-center">
              <Scale className="w-10 h-10 text-white/10" />
            </div>
            <div>
              <p className="font-black text-white/60 text-lg mb-1">{t("legal.requests.empty")}</p>
              <p className="text-white/25 text-xs">ابدأ بتقديم طلبك القانوني الأول</p>
            </div>
            <Link
              href="/services/form?type=legal"
              className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-white text-slate-950 text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("action.services")}
            </Link>
          </motion.div>
        )}

        {/* Cards */}
        {!isLoading && !error && requests.length > 0 && (
          <AnimatePresence>
            <div className="space-y-3">
              {requests.map((req, idx) => {
                const status = getStatusConfig(req, t);
                const isExpanded = expandedId === req.id;

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.4, ease: "easeOut" }}
                    className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-[1.75rem] overflow-hidden transition-all duration-300"
                  >
                    {/* Shimmer top for pending action */}
                    {req.invoiceSent && req.clientDecision === "pending" && (
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    )}

                    {/* Header row */}
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          <Scale className="w-5 h-5 text-white/40" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-white text-sm truncate">{req.serviceType}</p>
                          <p className="text-[10px] text-white/35 font-bold mt-0.5">
                            {req.city}{req.district ? ` · ${req.district}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1.5 rounded-full border ${status.pill} ${status.ring} ${status.text} uppercase tracking-widest`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="w-7 h-7 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center transition-colors"
                        >
                          {isExpanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                            : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-white/[0.06] px-5 py-5 space-y-4">
                            {/* Parties */}
                            {(req.firstParty || req.secondParty) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[req.firstParty && { label: t("disputes.firstParty"), party: req.firstParty }, req.secondParty && { label: t("disputes.secondParty"), party: req.secondParty }]
                                  .filter(Boolean).map((item: any) => (
                                  <div key={item.label} className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">{item.label}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <Users className="w-3.5 h-3.5 text-white/30" />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-white/80">{item.party.name}</p>
                                        {item.party.idNumber && <p className="text-[9px] text-white/25">{item.party.idNumber}</p>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Description */}
                            {req.description && (
                              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">{t("admin.service_requests.description")}</p>
                                <p className="text-xs text-white/40 leading-relaxed line-clamp-3">{req.description}</p>
                              </div>
                            )}

                            {/* Invoice */}
                            {req.invoiceSent && req.invoicePrice != null && (
                              <div className="p-5 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-white/40" />
                                  </div>
                                  <div>
                                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest">{t("legal.requests.invoicePrice")}</p>
                                    <p className="text-xl font-black text-white leading-none mt-0.5">
                                      {req.invoicePrice.toLocaleString()}
                                      <span className="text-xs font-bold text-white/30 mr-1">{t("admin.settings.currency")}</span>
                                    </p>
                                  </div>
                                </div>
                                {req.clientDecision === "accepted" && (
                                  <div className="flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />
                                    <span className="text-[9px] font-black text-white/40 uppercase">مقبول</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action buttons */}
                            {req.invoiceSent && req.clientDecision === "pending" && (
                              <div className="flex gap-3 pt-1">
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleDecision(req.id, "accepted")}
                                  disabled={actionLoading === req.id}
                                  className="flex-1 h-12 rounded-2xl bg-white text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                  {t("legal.decision.accept")}
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => handleDecision(req.id, "rejected")}
                                  disabled={actionLoading === req.id}
                                  className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-white/70 font-black text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                  {t("legal.decision.reject")}
                                </motion.button>
                              </div>
                            )}

                            {/* Feedback */}
                            <AnimatePresence>
                              {actionMessage?.id === req.id && (
                                <motion.p
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="text-center text-xs font-bold p-3 rounded-2xl border border-white/10 bg-white/[0.03] text-white/50"
                                >
                                  {actionMessage.text}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[9px] font-black text-white/15 font-mono">#{req.id.substring(0, 8)}</span>
                      <span className="text-[9px] font-bold text-white/20">
                        {new Date(req.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
