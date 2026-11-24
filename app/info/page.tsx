"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TabsContent } from "@/components/ui/tabs";
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from "@/components/ui/mobile-tabs";
import {
  Shield,
  BookOpen,
  FileCheck,
  Phone,
  ChevronLeft,
  ChevronRight,
  Handshake,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { TermsPrivacyModal } from "@/components/modals/terms-privacy-modal";
import { infoContentApi, type InfoBlock, type InfoTab } from "@/lib/api";
import { resolveInfoTab, safeNavigateBack } from "@/lib/redesign-chat11-content";

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("info");
  const isRtl = language === "ar";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"terms" | "privacy">("terms");

  const openModal = (tab: "terms" | "privacy") => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const handleBack = () => {
    safeNavigateBack(router, "/");
  };

  const [infoTabs, setInfoTabs] = useState<InfoTab[] | null>(null);
  const [infoBlocks, setInfoBlocks] = useState<InfoBlock[] | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    setInfoLoading(true);
    setInfoError(null);
    try {
      const res = await infoContentApi.getAll();
      setInfoTabs(Array.isArray(res.data?.tabs) ? res.data.tabs : []);
      setInfoBlocks(Array.isArray(res.data?.blocks) ? res.data.blocks : []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : null;
      setInfoError(errMsg || (isRtl ? "تعذر تحميل محتوى المعلومات" : "Failed to load info content"));
      setInfoTabs(null);
      setInfoBlocks(null);
    } finally {
      setInfoLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const tabsToRender = useMemo(() => {
    const fallback = [
      { key: "terms_short", title: t("footer.terms") || (isRtl ? "الشروط والأحكام" : "Terms & Conditions"), icon: Shield },
      { key: "usage", title: t("footer.usage") || (isRtl ? "سياسة الاستخدام" : "Usage Policy"), icon: BookOpen },
      { key: "permits", title: t("footer.permits") || (isRtl ? "التراخيص والتصاريح" : "Permits & Licenses"), icon: FileCheck },
      { key: "contact", title: t("footer.contact") || (isRtl ? "اتصل بنا" : "Contact Us"), icon: Phone },
    ];
    if (!infoTabs || infoTabs.length === 0) return fallback;

    const keyToIcon: Record<string, React.ElementType> = {
      terms_short: Shield,
      usage: BookOpen,
      permits: FileCheck,
      contact: Phone,
    };

    return infoTabs
      .filter((tab) => tab.key !== "terms" && tab.key !== "privacy")
      .slice()
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((tab) => ({
        key: tab.key,
        title: isRtl ? tab.titleAr : tab.titleEn,
        icon: keyToIcon[tab.key] || Shield,
      }));
  }, [infoTabs, isRtl, t]);

  const requestedParam = searchParams.get("tab");
  const initialTab = useMemo(() => {
    return resolveInfoTab(requestedParam, tabsToRender, "terms_short");
  }, [requestedParam, tabsToRender]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Synchronize active tab when deep-link search param changes
  useEffect(() => {
    const resolved = resolveInfoTab(requestedParam, tabsToRender, "terms_short");
    if (resolved !== activeTab) {
      setActiveTab(resolved);
    }
  }, [requestedParam, tabsToRender]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`/info?${params.toString()}`, { scroll: false });
  };

  const blocksByTabKey = useMemo(() => {
    const map = new Map<string, Array<{ label: string; text: string; sortOrder: number }>>();
    if (!infoTabs || !infoBlocks) return map;
    const tabById = new Map(infoTabs.map((t) => [t.id, t.key]));
    for (const b of infoBlocks) {
      const key = tabById.get(b.tabId);
      if (!key) continue;
      const arr = map.get(key) || [];
      arr.push({
        label: isRtl ? b.labelAr : b.labelEn,
        text: isRtl ? b.textAr : b.textEn,
        sortOrder: b.sortOrder ?? 0,
      });
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.sortOrder - b.sortOrder);
      map.set(k, arr);
    }
    return map;
  }, [infoTabs, infoBlocks, isRtl]);

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t("footer.support") || (isRtl ? "المعلومات" : "Information")}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div
      className="calm-page calm-screen min-h-screen bg-background dark:bg-slate-950 text-foreground dark:text-white pb-20 pt-24"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-full">
        {/* Safe Back Navigation */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border dark:border-white/10 bg-muted/70 dark:bg-card/5 px-4 text-xs font-black text-muted-foreground dark:text-slate-300 transition-all hover:bg-muted hover:dark:bg-card/10 hover:text-foreground hover:dark:text-white"
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {isRtl ? "رجوع" : "Back"}
          </button>
        </div>

        {/* Error Banner with Retry */}
        {infoError && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{infoError}</span>
            </div>
            <button
              type="button"
              onClick={loadInfo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 font-black text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
            </button>
          </div>
        )}

        {/* Tabs with URL Deep-link Sync */}
        <SegmentedTabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-8"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <SegmentedList
            pillClassName="bg-card dark:bg-slate-900 border border-border dark:border-white/10 shadow-sm"
            className="flex flex-wrap h-auto min-h-14 items-center justify-start rounded-2xl bg-muted/80 dark:bg-card/5 border border-border dark:border-white/5 p-1.5 w-full gap-2 sm:flex-nowrap sm:h-14 sm:overflow-x-auto sm:overflow-y-hidden no-scrollbar"
          >
            {tabsToRender.map((tab) => {
              const Icon = tab.icon;
              return (
                <SegmentedTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex-1 min-w-[120px] sm:min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-card dark:data-[state=active]:bg-slate-900 data-[state=active]:text-foreground dark:data-[state=active]:text-white font-black text-xs transition-all uppercase tracking-tighter max-md:justify-center max-md:rounded-full"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                </SegmentedTrigger>
              );
            })}
          </SegmentedList>

          <AnimatePresence mode="wait">
            {tabsToRender.map((tab) => {
              const Icon = tab.icon;
              const content = blocksByTabKey.get(tab.key)?.map(({ label, text }) => ({ label, text })) || [];

              const actionBtn =
                tab.key === "terms_short" ? (
                  <button
                    type="button"
                    onClick={() => openModal("terms")}
                    className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>{isRtl ? "قراءة الشروط والأحكام بالتفصيل" : "Read full terms & conditions"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : tab.key === "usage" ? (
                  <button
                    type="button"
                    onClick={() => openModal("privacy")}
                    className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <span>{isRtl ? "قراءة سياسة الخصوصية بالتفصيل" : "Read full privacy policy"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : tab.key === "contact" ? (
                  <div className="calm-panel bg-muted/60 dark:bg-card/5 border border-border dark:border-white/5 rounded-3xl p-5 sm:p-8 space-y-6">
                    <div className="p-4 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
                      <Handshake className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-2">{isRtl ? "خدمة العملاء والدعم الفني" : "Customer Service & Support"}</h3>
                      <p className="text-muted-foreground dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
                        {isRtl
                          ? "تواصل معنا مباشرة عبر مركز خدمة العملاء لتقديم الاستفسارات، المقترحات أو متابعة التذاكر."
                          : "Reach out directly through our Customer Service Hub to submit inquiries, suggestions, or track support tickets."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/customerservice")}
                      className="w-full py-4 bg-foreground dark:bg-white text-background dark:text-slate-950 hover:opacity-90 rounded-2xl font-black text-xs uppercase tracking-widest transition-opacity"
                    >
                      {isRtl ? "الانتقال إلى مركز خدمة العملاء" : "Go to Customer Service Hub"}
                    </button>
                  </div>
                ) : undefined;

              return (
                <TabsContent key={tab.key} value={tab.key} className="m-0 outline-none">
                  <InfoSection
                    title={tab.title}
                    icon={<Icon className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                    loading={infoLoading}
                    content={
                      content.length > 0
                        ? content
                        : [
                            {
                              label: isRtl ? "ملاحظة" : "Notice",
                              text: isRtl
                                ? "لا يوجد محتوى منشور في هذا القسم حالياً."
                                : "No published content available in this section currently.",
                            },
                          ]
                    }
                    actionBtn={actionBtn}
                    isRtl={isRtl}
                  />
                </TabsContent>
              );
            })}
          </AnimatePresence>
        </SegmentedTabs>
      </div>

      <TermsPrivacyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={modalTab}
        hideTabs={true}
      />
    </div>
  );
}

function InfoSection({
  title,
  icon,
  content,
  actionBtn,
  loading,
  isRtl,
}: {
  title: string;
  icon: React.ReactNode;
  content: { label: string; text: string }[];
  actionBtn?: React.ReactNode;
  loading?: boolean;
  isRtl?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }}
      exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
      className="calm-panel bg-card/60 dark:bg-card/5 border border-border dark:border-white/5 rounded-[1.5rem] p-5 sm:p-8 md:p-12 space-y-10 relative overflow-hidden shadow-sm"
    >
      <div className="flex items-center gap-4 md:gap-6 relative z-10">
        <div className="calm-panel p-4 bg-muted/80 dark:bg-card/10 border border-border dark:border-white/10 rounded-2xl">
          {icon}
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
      </div>

      <div className="space-y-8 relative z-10">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-32 bg-muted dark:bg-white/10 rounded-md" />
                <div className="h-14 w-full bg-muted/60 dark:bg-white/5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          content.map((item, idx) => (
            <div key={idx} className="space-y-3 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[2px] bg-amber-500/50 group-hover:bg-amber-500 transition-colors" />
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-muted-foreground dark:text-slate-400 group-hover:text-foreground group-hover:dark:text-white transition-colors">
                  {item.label}
                </h3>
              </div>
              <p className={cn("text-sm sm:text-base leading-relaxed font-medium text-foreground/80 dark:text-slate-300", isRtl ? "pe-4 ps-11" : "ps-11")}>
                {item.text}
              </p>
            </div>
          ))
        )}
      </div>

      {actionBtn && (
        <div className="relative z-10 border-t border-border dark:border-white/10 pt-8 mt-8">
          {actionBtn}
        </div>
      )}
    </motion.div>
  );
}

export default function InfoPage() {
  return (
    <Suspense
      fallback={
        <div className="calm-page calm-screen min-h-screen bg-background dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-border dark:border-white/10 border-t-amber-500 rounded-full animate-spin" />
        </div>
      }
    >
      <InfoPageContent />
    </Suspense>
  );
}
