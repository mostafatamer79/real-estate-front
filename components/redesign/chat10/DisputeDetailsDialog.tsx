"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Gavel,
  Calendar,
  FileText,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { legalServicesApi, LegalDispute } from "@/lib/legal-services";
import {
  safeExtractParty,
  getDisputeStatusConfig,
} from "@/lib/redesign-chat10-disputes";

export interface DisputeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: LegalDispute | null;
  language?: "ar" | "en";
}

interface DetailedDispute extends Partial<LegalDispute> {
  disputeDescription?: string;
  firstPartyAgent?: { name?: string; agencyNumber?: string; idNumber?: string };
  secondPartyAgent?: { name?: string; agencyNumber?: string; idNumber?: string };
  documentIds?: string[];
  documents?: Array<{ id: string; name?: string; url?: string }>;
}

export default function DisputeDetailsDialog({
  isOpen,
  onClose,
  dispute,
  language = "ar",
}: DisputeDetailsDialogProps) {
  const isAr = language === "ar";
  const [details, setDetails] = useState<DetailedDispute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const fetchFullDetails = useCallback(async (id: string) => {
    const currentId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await legalServicesApi.getLegalDisputeById(id);
      if (reqIdRef.current !== currentId) return;
      const data = res?.data || res;
      setDetails(data);
    } catch (err) {
      if (reqIdRef.current !== currentId) return;
      console.error("Failed to load dispute details:", err);
      setError(
        isAr
          ? "تعذر تحميل التفاصيل الكاملة للقضية من الخادم. يمكنك مراجعة البيانات الأساسية أدناه أو المحاولة مجدداً."
          : "Unable to load full case details from the server. You can review the basic data below or retry."
      );
    } finally {
      if (reqIdRef.current === currentId) {
        setLoading(false);
      }
    }
  }, [isAr]);

  useEffect(() => {
    if (isOpen && dispute?.id) {
      setDetails(dispute as DetailedDispute);
      fetchFullDetails(dispute.id);
    } else {
      setDetails(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, dispute, fetchFullDetails]);

  if (!dispute) return null;

  const activeData: DetailedDispute = details || dispute;
  const statusCfg = getDisputeStatusConfig(activeData.status || dispute.status);
  const firstParty = safeExtractParty(activeData.firstParty ?? dispute.firstParty);
  const secondParty = safeExtractParty(activeData.secondParty ?? dispute.secondParty);

  const titleText = isAr ? "تفاصيل النزاع القانوني" : "Legal Dispute Details";
  const descText = isAr
    ? `بيانات القضية رقم #${activeData.disputeNumber || dispute.disputeNumber}`
    : `Case information #${activeData.disputeNumber || dispute.disputeNumber}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card text-foreground border border-border dark:border-slate-800"
        closeLabel={isAr ? "إغلاق" : "Close"}
        dir={isAr ? "rtl" : "ltr"}
      >
        <DialogHeader className="space-y-3 pb-4 border-b border-border dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-muted text-foreground flex items-center justify-center">
                <Gavel className="w-5 h-5 text-primary dark:text-slate-200" />
              </span>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground dark:text-white">
                  {titleText}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground dark:text-slate-400">
                  {descText}
                </DialogDescription>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass}`} />
              <span>{isAr ? statusCfg.labelAr : statusCfg.labelEn}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Error notification banner with retry */}
        {error && (
          <div
            role="alert"
            className="my-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchFullDetails(dispute.id)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-destructive text-destructive-foreground font-bold hover:opacity-90 transition-opacity"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{isAr ? "إعادة المحاولة" : "Retry"}</span>
            </button>
          </div>
        )}

        <div className="space-y-5 pt-3">
          {/* Dispute metadata cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                {isAr ? "نوع النزاع" : "Dispute Type"}
              </span>
              <p className="font-bold text-sm text-foreground dark:text-white">
                {activeData.disputeType || (isAr ? "غير محدد" : "Unspecified")}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border dark:border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                {isAr ? "تاريخ الإنشاء" : "Created At"}
              </span>
              <p className="font-bold text-sm text-foreground dark:text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {activeData.createdAt
                  ? new Date(activeData.createdAt).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>

          {/* Parties information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Party */}
            <div className="p-4 rounded-xl bg-card border border-border dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  {isAr ? "أ" : "A"}
                </span>
                <span className="font-black text-xs text-foreground dark:text-white">
                  {isAr ? "الطرف الأول" : "First Party"}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm text-foreground dark:text-slate-100">
                  {firstParty.name}
                </p>
                {firstParty.role && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "الصفة: " : "Role: "}</span>
                    {firstParty.role}
                  </p>
                )}
                {firstParty.phone && (
                  <p className="text-muted-foreground" dir="ltr">
                    <span className="font-semibold" dir={isAr ? "rtl" : "ltr"}>{isAr ? "الهاتف: " : "Phone: "}</span>
                    {firstParty.phone}
                  </p>
                )}
                {firstParty.idNumber && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "رقم الهوية: " : "ID: "}</span>
                    {firstParty.idNumber}
                  </p>
                )}
                {firstParty.city && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "المدينة: " : "City: "}</span>
                    {firstParty.city}
                  </p>
                )}
              </div>
            </div>

            {/* Second Party */}
            <div className="p-4 rounded-xl bg-card border border-border dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60 dark:border-slate-800/80">
                <span className="w-6 h-6 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">
                  {isAr ? "ب" : "B"}
                </span>
                <span className="font-black text-xs text-foreground dark:text-white">
                  {isAr ? "الطرف الثاني" : "Second Party"}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm text-foreground dark:text-slate-100">
                  {secondParty.name}
                </p>
                {secondParty.role && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "الصفة: " : "Role: "}</span>
                    {secondParty.role}
                  </p>
                )}
                {secondParty.phone && (
                  <p className="text-muted-foreground" dir="ltr">
                    <span className="font-semibold" dir={isAr ? "rtl" : "ltr"}>{isAr ? "الهاتف: " : "Phone: "}</span>
                    {secondParty.phone}
                  </p>
                )}
                {secondParty.idNumber && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "رقم الهوية: " : "ID: "}</span>
                    {secondParty.idNumber}
                  </p>
                )}
                {secondParty.city && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold">{isAr ? "المدينة: " : "City: "}</span>
                    {secondParty.city}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Legal Agents if present */}
          {(activeData.firstPartyAgent || activeData.secondPartyAgent) && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-foreground dark:text-white">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>{isAr ? "بيانات الوكلاء والممثلين" : "Legal Agents / Representatives"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {activeData.firstPartyAgent && (
                  <div>
                    <span className="font-bold text-muted-foreground">{isAr ? "وكيل الطرف الأول:" : "First Party Agent:"} </span>
                    <span className="text-foreground">{activeData.firstPartyAgent.name || "—"}</span>
                    {activeData.firstPartyAgent.agencyNumber && (
                      <p className="text-muted-foreground text-[11px]">
                        {isAr ? "رقم الوكالة: " : "Agency #: "}{activeData.firstPartyAgent.agencyNumber}
                      </p>
                    )}
                  </div>
                )}
                {activeData.secondPartyAgent && (
                  <div>
                    <span className="font-bold text-muted-foreground">{isAr ? "وكيل الطرف الثاني:" : "Second Party Agent:"} </span>
                    <span className="text-foreground">{activeData.secondPartyAgent.name || "—"}</span>
                    {activeData.secondPartyAgent.agencyNumber && (
                      <p className="text-muted-foreground text-[11px]">
                        {isAr ? "رقم الوكالة: " : "Agency #: "}{activeData.secondPartyAgent.agencyNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h4 className="font-black text-xs text-foreground dark:text-white">
                {isAr ? "الوصف الكامل للنزاع والوقائع" : "Complete Dispute Description"}
              </h4>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border dark:border-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-foreground/90 dark:text-slate-200">
              {activeData.disputeDescription ||
                (isAr
                  ? "لا يوجد وصف إضافي مرفق مع هذا النزاع."
                  : "No additional description attached to this dispute.")}
            </div>
          </div>

          {/* Attached documents if any */}
          {Array.isArray(activeData.documentIds) && activeData.documentIds.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-black text-xs text-foreground dark:text-white">
                {isAr ? "المستندات والمرفقات" : "Documents & Attachments"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeData.documentIds.map((docId, index) => (
                  <span
                    key={docId || index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-mono text-muted-foreground border border-border"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>#{docId.slice(0, 10)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
