"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { legalServicesApi, LegalDispute } from "@/lib/legal-services";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Gavel,
  ArrowRight,
  Search,
  ShieldAlert,
  Scale,
  PlusCircle,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from "@/components/ui/mobile-tabs";
import ServiceRequestsTable from "@/components/shared/ServiceRequestsTable";
import LegalRequestFlow from "@/components/legal/LegalRequestFlow";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import MobileAppHeader from "@/app/src/components/MobileAppHeader";
import DisputeDetailsDialog from "@/components/redesign/chat10/DisputeDetailsDialog";
import {
  safeExtractParty,
  filterDisputes,
  getDisputeStatusConfig,
  getDisputeText,
} from "@/lib/redesign-chat10-disputes";
import { canAccessDepartment } from "@/lib/redesign-department-navigation";

export default function DisputesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [disputes, setDisputes] = useState<LegalDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<LegalDispute | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { isOpen, message, isAdmin } = useSectionGuard("disputes");
  const reqIdRef = useRef(0);

  // Authentication & Role Check
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.replace("/login");
        return;
      }
      const user = JSON.parse(storedUser);
      const isAllowedRole = ["admin", "legal", "legal_admin", "viewer"].includes(user?.role);
      const hasLegalGrant = canAccessDepartment(user, "legal");

      if (!isAllowedRole && !hasLegalGrant) {
        router.push("/");
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Fetch disputes with recoverable error handling and race-condition prevention
  const fetchDisputes = useCallback(async () => {
    const currentId = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await legalServicesApi.getLegalDisputes();
      if (reqIdRef.current !== currentId) return; // Stale request discarded
      if (Array.isArray(res)) {
        setDisputes(res);
      } else if (res && Array.isArray((res as { data?: LegalDispute[] }).data)) {
        setDisputes((res as { data: LegalDispute[] }).data);
      } else {
        setDisputes([]);
      }
    } catch (err) {
      if (reqIdRef.current !== currentId) return; // Stale error discarded
      console.error("Failed to fetch disputes:", err);
      setError(getDisputeText("disputes.loadError", language, t));
    } finally {
      if (reqIdRef.current === currentId) {
        setLoading(false);
      }
    }
  }, [language, t]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filtered = filterDisputes(disputes, searchTerm);

  const handleOpenDetails = (dispute: LegalDispute) => {
    setSelectedDispute(dispute);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedDispute(null);
  };

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={getDisputeText("disputes.title", language, t)}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  const pageTitle = getDisputeText("disputes.title", language, t);

  return (
    <div
      className="calm-page calm-screen min-h-screen bg-muted/50 pb-12 overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <MobileAppHeader theme="light" title={pageTitle} />

      {/* Header Container */}
      <section className="calm-panel relative overflow-hidden mb-8 md:mb-12 p-4 sm:p-6 md:p-12 rounded-b-[1.25rem] bg-background dark:bg-slate-950 text-foreground dark:text-white shadow-sm dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="calm-decoration absolute -top-24 -right-24 w-96 h-96 bg-primary dark:bg-slate-600 rounded-full blur-[100px]" />
          <div className="calm-decoration absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-900 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="calm-panel inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted dark:bg-card/10 backdrop-blur-xl border border-border dark:border-white/20 text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-primary dark:text-slate-300" />
                Legal Protection &amp; Resolution
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight"
              >
                {pageTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground dark:text-white/60 font-medium max-w-xl text-sm md:text-base leading-relaxed"
              >
                {language === "ar"
                  ? "إدارة النزاعات العقارية، ومتابعة قضايا فض الخلافات، والخدمات القانونية بمهنية وشفافية متكاملة."
                  : "Comprehensive real estate dispute resolution, case arbitration, and transparent legal management."}
              </motion.p>
            </div>

            <div className="flex items-center gap-4">
              <div className="calm-panel glass p-4 sm:p-6 rounded-[1.25rem] bg-card/60 dark:bg-card/10 border border-border dark:border-white/10 text-center min-w-[160px] shadow-sm">
                <p className="text-muted-foreground dark:text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">
                  {getDisputeText("disputes.activeReviews", language, t)}
                </p>
                <p className="text-2xl sm:text-3xl font-black tabular-nums text-foreground dark:text-white">
                  {disputes.filter((d) => d.status === "inProgress" || d.status === "in_progress").length}
                </p>
                <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40">
                  {getDisputeText("disputes.activeReviewsSub", language, t)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SegmentedTabs defaultValue="disputes" className="w-full space-y-8">
          <div className="flex justify-center mb-6 w-full">
            <SegmentedList className="inline-flex h-14 items-center justify-start md:justify-center rounded-2xl bg-card border border-border p-1.5 shadow-sm overflow-x-auto max-w-full">
              <SegmentedTrigger
                value="disputes"
                className="px-4 md:px-8 shrink-0 rounded-xl h-11 gap-2 font-black text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Gavel className="w-4 h-4" />
                {getDisputeText("disputes.tab.disputes", language, t)}
              </SegmentedTrigger>
              <SegmentedTrigger
                value="service_requests"
                className="px-4 md:px-8 shrink-0 rounded-xl h-11 gap-2 font-black text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Scale className="w-4 h-4" />
                {getDisputeText("disputes.tab.service_requests", language, t)}
              </SegmentedTrigger>
              <SegmentedTrigger
                value="new_request"
                className="px-4 md:px-8 shrink-0 rounded-xl h-11 gap-2 font-black text-xs transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <PlusCircle className="w-4 h-4" />
                {getDisputeText("disputes.newRequest", language, t)}
              </SegmentedTrigger>
            </SegmentedList>
          </div>

          <TabsContent value="disputes" className="m-0 space-y-6">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-96 group">
                <Search
                  className={`absolute ${
                    language === "ar" ? "right-4" : "left-4"
                  } top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors`}
                />
                <input
                  type="text"
                  placeholder={getDisputeText("disputes.searchPlaceholder", language, t)}
                  className={`h-12 w-full rounded-xl border border-border bg-card ${
                    language === "ar" ? "pr-11 pl-4" : "pl-11 pr-4"
                  } text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={fetchDisputes}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="h-11 px-4 rounded-xl border-border font-bold text-xs gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  {language === "ar" ? "تحديث" : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Error state with retry */}
            {error ? (
              <div
                role="alert"
                className="calm-panel p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-4"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <p className="font-bold text-base text-foreground dark:text-white">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "ar"
                      ? "تعذر الاتصال بالخادم لجلب بيانات النزاعات. لم يتم فقدان أي بيانات."
                      : "Server communication failed. Please retry to fetch the latest cases."}
                  </p>
                </div>
                <Button
                  onClick={fetchDisputes}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  {getDisputeText("disputes.retry", language, t)}
                </Button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-72 rounded-[1.25rem] bg-muted/60 animate-pulse border border-border/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="calm-panel flex flex-col items-center justify-center py-24 text-muted-foreground glass rounded-[1.25rem] border border-dashed border-border bg-card/40 text-center">
                <div className="calm-panel w-20 h-20 bg-muted/80 rounded-3xl flex items-center justify-center shadow-sm mb-6">
                  <Gavel className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-base font-bold text-foreground">
                  {getDisputeText("disputes.empty", language, t)}
                </p>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ar" ? "جرّب البحث بكلمات مفتاحية أخرى." : "Try searching with different terms."}
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filtered.map((dispute, idx) => {
                    const statusCfg = getDisputeStatusConfig(dispute.status);
                    const firstParty = safeExtractParty(dispute.firstParty);
                    const secondParty = safeExtractParty(dispute.secondParty);

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={dispute.id}
                        className="calm-panel bg-card border border-border rounded-[1.25rem] hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                      >
                        <div className="p-5 sm:p-6 space-y-5">
                          {/* Card Header */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="space-y-2">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusCfg.badgeClass}`}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                                {language === "ar" ? statusCfg.labelAr : statusCfg.labelEn}
                              </div>
                              <h3 className="text-lg font-black text-foreground dark:text-white leading-tight">
                                {dispute.disputeType || (language === "ar" ? "نزاع عقاري" : "Dispute")}
                              </h3>
                            </div>
                            <div className="p-2.5 bg-muted rounded-xl border border-border shrink-0">
                              <Gavel className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>

                          {/* Parties Information (Guarded against typeof null === 'object') */}
                          <div className="space-y-2.5 pt-4 border-t border-border">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                {language === "ar" ? "أ" : "A"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {getDisputeText("disputes.firstParty", language, t)}
                                </p>
                                <p className="text-xs font-bold text-foreground truncate">
                                  {firstParty.name}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                              <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-black text-xs shrink-0">
                                {language === "ar" ? "ب" : "B"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  {getDisputeText("disputes.secondParty", language, t)}
                                </p>
                                <p className="text-xs font-bold text-foreground truncate">
                                  {secondParty.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground pt-2 border-t border-border/60">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {dispute.createdAt
                                  ? new Date(dispute.createdAt).toLocaleDateString(
                                      language === "ar" ? "ar-SA" : "en-US"
                                    )
                                  : "—"}
                              </span>
                            </div>
                            <div className="font-mono bg-muted px-2.5 py-1 rounded-lg text-[11px]">
                              #{dispute.disputeNumber || dispute.id?.slice(0, 8)}
                            </div>
                          </div>
                        </div>

                        {/* Action Button - Connected to Details Dialog */}
                        <div className="p-5 sm:p-6 pt-0">
                          <Button
                            onClick={() => handleOpenDetails(dispute)}
                            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-xs uppercase tracking-wider gap-2 shadow-sm transition-all"
                          >
                            <span>{getDisputeText("disputes.details", language, t)}</span>
                            <ArrowRight
                              className={`w-3.5 h-3.5 ${language === "ar" ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="service_requests" className="m-0">
            <ServiceRequestsTable
              title={getDisputeText("disputes.tab.service_requests", language, t)}
              subtitle={
                language === "ar"
                  ? "إدارة طلبات المراجعة القانونية والاستشارات"
                  : "Manage legal review requests and advisory services"
              }
              department="legal"
            />
          </TabsContent>

          <TabsContent value="new_request" className="m-0">
            <div className="calm-panel bg-card rounded-[1.25rem] border border-border p-4 sm:p-8 md:p-12 shadow-sm relative overflow-hidden">
              <div className="text-center mb-8 relative z-10">
                <h2 className="text-xl sm:text-2xl font-black text-foreground mb-2">
                  {language === "ar" ? "تقديم طلب قانوني جديد" : "Submit New Legal Request"}
                </h2>
                <p className="text-muted-foreground text-sm font-medium">
                  {language === "ar"
                    ? "اختر نوع الخدمة القانونية واملأ التفاصيل المطلوبة بدقة"
                    : "Select service type and provide required case information"}
                </p>
              </div>
              <div className="relative z-10">
                <LegalRequestFlow onSuccessRedirect="/disputes" />
              </div>
            </div>
          </TabsContent>
        </SegmentedTabs>
      </div>

      {/* Accessible Details Dialog */}
      <DisputeDetailsDialog
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        dispute={selectedDispute}
        language={language}
      />

      {/* Back to details navigation button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/details")}
        aria-label={language === "ar" ? "الرجوع" : "Go back"}
        className="fixed bottom-8 left-8 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl z-40 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <ChevronLeft className={`w-6 h-6 ${language === "ar" ? "rotate-180" : ""}`} />
      </motion.button>
    </div>
  );
}
