"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, BookOpen, FileCheck, Phone, ChevronLeft, Handshake, Scale, CheckCircle2, Landmark, UserCheck, Lock, Server, FileText, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";

import { TermsPrivacyModal } from "@/components/modals/terms-privacy-modal";
import { infoContentApi, type InfoBlock, type InfoTab } from "@/lib/api";

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard('info');


  const requestedTab = searchParams.get("tab") || "terms";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"terms" | "privacy">("terms");

  const openModal = (tab: "terms" | "privacy") => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  const isRtl = language === "ar";
  const [infoTabs, setInfoTabs] = useState<InfoTab[] | null>(null);
  const [infoBlocks, setInfoBlocks] = useState<InfoBlock[] | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setInfoLoading(true);
      try {
        const res = await infoContentApi.getAll();
        setInfoTabs(Array.isArray(res.data?.tabs) ? res.data.tabs : []);
        setInfoBlocks(Array.isArray(res.data?.blocks) ? res.data.blocks : []);
      } catch {
        setInfoTabs(null);
        setInfoBlocks(null);
      } finally {
        setInfoLoading(false);
      }
    })();
  }, []);

  const tabsToRender = useMemo(() => {
    const fallback = [
      { key: "terms_short", title: t("footer.terms") || "الشروط والأحكام", icon: Shield },
      { key: "usage", title: t("footer.usage") || "سياسة الاستخدام", icon: BookOpen },
      { key: "permits", title: t("footer.permits") || "التراخيص والتصاريح", icon: FileCheck },
      { key: "contact", title: t("footer.contact") || "اتصل بنا", icon: Phone },
    ];
    if (!infoTabs) return fallback;
    const keyToIcon: Record<string, any> = { terms_short: Shield, usage: BookOpen, permits: FileCheck, contact: Phone };
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

  const defaultTab = useMemo(() => {
    const aliasMap: Record<string, string> = {
      terms: "terms_short",
      privacy: "usage",
    };
    const normalized = aliasMap[requestedTab] || requestedTab;
    const validKeys = tabsToRender.map((tab) => tab.key);
    return validKeys.includes(normalized) ? normalized : validKeys[0] || "terms_short";
  }, [requestedTab, tabsToRender]);

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
      return <ComingSoonOverlay sectionName={t('footer.support') || 'المعلومات'} message={message} isAdmin={isAdmin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 pt-24" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-6 h-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mb-6">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-card/5 px-4 text-xs font-black text-slate-300 transition-all hover:bg-card/10 hover:text-white"
          >
            {isRtl ? <ChevronLeft className="w-4 h-4 rotate-180" /> : <ChevronLeft className="w-4 h-4" />}
            {isRtl ? "رجوع" : "Back"}
          </button>
        </div>
  
        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList className="flex h-14 items-center justify-start rounded-2xl bg-card/5 border border-white/5 p-1.5 w-full overflow-x-auto overflow-y-hidden no-scrollbar gap-2">
            {tabsToRender.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="flex-1 min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-card data-[state=active]:text-slate-950 font-black text-xs transition-all uppercase tracking-tighter"
                >
                  <Icon className="w-4 h-4" />
                  {tab.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <AnimatePresence mode="wait">
            {tabsToRender.map((tab) => {
              const Icon = tab.icon;
              const content =
                blocksByTabKey.get(tab.key)?.map(({ label, text }) => ({ label, text })) || [];
              const actionBtn =
                tab.key === "terms_short" ? (
                  <button
                    onClick={() => openModal("terms")}
                    className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all"
                  >
                    <span>{isRtl ? "قراءة الشروط والأحكام بالتفصيل" : "Read full terms"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : tab.key === "usage" ? (
                  <button
                    onClick={() => openModal("privacy")}
                    className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all"
                  >
                    <span>{isRtl ? "قراءة سياسة الخصوصية بالتفصيل" : "Read full privacy policy"}</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                ) : tab.key === "contact" ? (
                  <div className="bg-card/5 border border-white/5 rounded-3xl p-4 sm:p-8 space-y-6">
                    <div className="p-4 bg-slate-700/30 rounded-2xl w-fit">
                      <Handshake className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black mb-2">{isRtl ? "خدمة العملاء" : "Customer Service"}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {isRtl
                          ? "تواصل معنا مباشرة عبر قسم خدمة العملاء لتقديم الشكاوى أو الاقتراحات."
                          : "Contact us via Customer Service to submit complaints or suggestions."}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/customerservice")}
                      className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-sm transition-colors"
                    >
                      {isRtl ? "فتح تذكرة دعم" : "Open support ticket"}
                    </button>
                  </div>
                ) : undefined;

              return (
                <TabsContent key={tab.key} value={tab.key} className="m-0 outline-none">
                  <InfoSection
                    title={tab.title}
                    icon={<Icon className="w-8 h-8 text-slate-400" />}
                    content={
                      content.length > 0
                        ? content
                        : [
                            {
                              label: isRtl ? "ملاحظة" : "Note",
                              text: infoLoading ? (isRtl ? "جاري تحميل المحتوى..." : "Loading content...") : (isRtl ? "لا يوجد محتوى." : "No content."),
                            },
                          ]
                    }
                    actionBtn={actionBtn}
                    bgColor="bg-slate-500/20"
                  />
                </TabsContent>
              );
            })}
          </AnimatePresence>
        </Tabs>
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

function InfoSection({ title, icon, content, actionBtn, bgColor = "bg-card/10" }: { title: string, icon: React.ReactNode, content: { label: string, text: string }[], actionBtn?: React.ReactNode, bgColor?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }}
      exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
      className="bg-card/5 border border-white/5 rounded-[1.25rem] p-4 sm:p-8 md:p-12 space-y-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className={cn("absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px]", bgColor)} />
      </div>

      <div className="flex items-center gap-3 md:gap-6 relative z-10">
        <div className="p-5 bg-card/5 border border-white/10 rounded-2xl">
          {icon}
        </div>
        <h2 className="text-2xl md:text-xl sm:text-3xl font-black tracking-tight">{title}</h2>
      </div>

      <div className="space-y-8 relative z-10">
        {content.map((item, idx) => (
          <div key={idx} className="space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-card/20 group-hover:bg-card transition-colors" />
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
                {item.label}
              </h4>
            </div>
            <p className="text-slate-300 text-base leading-relaxed font-medium ps-11">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {actionBtn && (
        <div className="relative z-10 border-t border-white/10 pt-8 mt-8">
          {actionBtn}
        </div>
      )}
    </motion.div>
  );
}

export default function InfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <InfoPageContent />
    </Suspense>
  );
}
