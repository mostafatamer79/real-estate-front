"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { useSettings } from "@/context/SettingsContext";
import { customerServiceFaqApi, customerServiceFaqCategoryApi, type CustomerServiceFaq, type CustomerServiceFaqCategory } from "@/lib/api";
import { buildFaqSections, safeNavigateBack, type FaqSectionOutput } from "@/lib/redesign-chat11-content";
import {
  ArrowRight,
  BadgeDollarSign,
  ChevronDown,
  ChevronLeft,
  Headphones,
  HelpCircle,
  Home,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function CustomerServiceFaqPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("customerservice");
  const { settings } = useSettings();
  const isAr = language === "ar";

  const categoryIcons: Record<string, React.ElementType> = {
    "أسئلة عامة": HelpCircle,
    "General Questions": HelpCircle,
    "أسئلة البحث والعرض": Search,
    "Search & Listings": Search,
    "أسئلة الشراء": ShieldCheck,
    "Purchase Inquiries": ShieldCheck,
    "أسئلة الإيجار": Home,
    "Rental Inquiries": Home,
    "أسئلة البيع": Tag,
    "Sales Inquiries": Tag,
    "أسئلة الدفع": BadgeDollarSign,
    "Payment Inquiries": BadgeDollarSign,
    "أسئلة الدعم": Headphones,
    "Support Inquiries": Headphones,
  };

  const [faqs, setFaqs] = useState<CustomerServiceFaq[] | null>(null);
  const [faqCategories, setFaqCategories] = useState<CustomerServiceFaqCategory[] | null>(null);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [faqsError, setFaqsError] = useState<string | null>(null);

  const handleGoBack = () => {
    safeNavigateBack(router, "/customerservice");
  };

  const refreshFaqs = useCallback(async () => {
    setFaqsLoading(true);
    setFaqsError(null);
    try {
      const [catsRes, faqsRes] = await Promise.all([
        customerServiceFaqCategoryApi.list(),
        customerServiceFaqApi.list(),
      ]);
      setFaqCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setFaqs(Array.isArray(faqsRes.data) ? faqsRes.data : []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : null;
      setFaqsError(errMsg || (isAr ? "تعذر تحميل الأسئلة الشائعة من الخادم" : "Failed to load FAQs from server"));
      setFaqs(null);
      setFaqCategories(null);
    } finally {
      setFaqsLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    refreshFaqs();
  }, [refreshFaqs]);

  // Build FAQ sections with zero question drops and published empty state support
  const faqSections = useMemo<FaqSectionOutput[]>(() => {
    return buildFaqSections(faqs, faqCategories, language as "ar" | "en");
  }, [faqs, faqCategories, language]);

  if (!isOpen) {
    return (
      <div className="calm-page calm-screen min-h-screen bg-muted/50 flex items-center justify-center p-4 sm:p-6">
        <ComingSoonOverlay
          sectionName={isAr ? "الأسئلة الشائعة" : "FAQ"}
          message={message}
          isAdmin={isAdmin}
        />
      </div>
    );
  }

  return (
    <div
      className="calm-page calm-screen min-h-screen bg-background dark:bg-slate-950 text-foreground dark:text-white pb-16 overflow-x-hidden"
      dir={isAr ? "rtl" : "ltr"}
      style={{
        backgroundColor: settings.csBg || undefined,
        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
      }}
    >
      {/* Top Header Section */}
      <section
        className="calm-panel bg-card dark:bg-slate-900/80 border-b border-border dark:border-white/10 mb-8 sm:mb-12 p-6 sm:p-10 rounded-b-[1.75rem] shadow-sm relative overflow-hidden"
        style={{ backgroundColor: settings.csCardBg || undefined }}
      >
        <div className="max-w-6xl mx-auto px-2 sm:px-4 relative z-10">
          <button
            type="button"
            onClick={handleGoBack}
            className="mb-6 sm:mb-8 inline-flex h-10 items-center gap-2 rounded-xl border border-border dark:border-white/10 bg-muted/80 dark:bg-white/5 px-4 text-xs font-black text-muted-foreground dark:text-white/80 transition-all hover:bg-muted hover:dark:bg-white/10 hover:text-foreground hover:dark:text-white"
          >
            {isAr ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{isAr ? "العودة لخدمة العملاء" : "Back to customer service"}</span>
          </button>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground dark:text-white">
              {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h1>
            <p className="mt-2.5 text-muted-foreground dark:text-slate-400 font-medium text-xs sm:text-sm md:text-base leading-relaxed">
              {isAr
                ? "إجابات معتمدة ومباشرة على أكثر الاستفسارات والأسئلة تكراراً حول خدمات وتشغيل المنصة."
                : "Official, verified answers to the most common questions regarding platform services and procedures."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base sm:text-lg font-black text-foreground dark:text-white flex items-center gap-2.5">
              <div className="calm-panel p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span>{isAr ? "دليل الأسئلة والإجابات" : "Questions & Answers Directory"}</span>
            </h2>

            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl border-border dark:border-white/10 text-xs font-black uppercase tracking-wider"
              onClick={refreshFaqs}
              disabled={faqsLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${faqsLoading ? "animate-spin" : ""}`} />
              <span className="ms-1.5">{isAr ? "تحديث" : "Refresh"}</span>
            </Button>
          </div>

          {/* Localized Error Banner */}
          {faqsError && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-700 dark:text-red-400">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{faqsError}</span>
              </div>
              <button
                type="button"
                onClick={refreshFaqs}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 font-black text-[11px] uppercase tracking-wider text-red-800 dark:text-red-300 hover:bg-red-500/30 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isAr ? "إعادة المحاولة" : "Retry"}</span>
              </button>
            </div>
          )}

          {/* FAQ Accordion List or Loading / Empty States */}
          <div
            className="calm-panel p-4 sm:p-8 md:p-10 rounded-[1.5rem] bg-card/60 dark:bg-card/5 border border-border dark:border-white/10 shadow-sm space-y-6"
            style={{ backgroundColor: settings.csCardBg ? `${settings.csCardBg}99` : undefined }}
          >
            {faqsLoading ? (
              /* Localized Loading Skeleton */
              <div className="space-y-5 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border border-border dark:border-white/10 bg-muted/40 dark:bg-white/5 space-y-3"
                  >
                    <div className="h-5 w-48 bg-muted dark:bg-white/10 rounded-md" />
                    <div className="h-4 w-full bg-muted/60 dark:bg-white/5 rounded-md" />
                  </div>
                ))}
              </div>
            ) : !faqsError && faqSections.length === 0 ? (
              /* Published Honest Empty State - Never falls back silently to Arabic hardcoded data */
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 mb-2">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-foreground dark:text-white">
                  {isAr ? "لا توجد أسئلة شائعة منشورة حالياً" : "No FAQs currently published"}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? "لم يتم نشر أي أسئلة شائعة حتى الآن. يمكنك التواصل المباشر مع خدمة العملاء لطلب أي مساعدة."
                    : "No published questions are available at this time. Please reach out to customer service for direct assistance."}
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/customerservice")}
                    className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
                  >
                    {isAr ? "التواصل مع الدعم الفني" : "Contact Support"}
                  </button>
                </div>
              </div>
            ) : (
              /* Grouped FAQ Sections with Accessible Semantic Accordion */
              <Accordion type="multiple" className="w-full space-y-5">
                {faqSections.map((section, idx) => {
                  const CategoryIcon = categoryIcons[section.category] ?? Sparkles;
                  return (
                    <AccordionItem
                      key={idx}
                      value={`section-${idx}`}
                      className="border border-border dark:border-white/10 rounded-2xl px-4 sm:px-6 transition-all hover:border-amber-500/30 bg-muted/30 dark:bg-white/[0.02]"
                      style={{ backgroundColor: settings.csCardBg || undefined }}
                    >
                      <AccordionTrigger
                        className="font-black hover:no-underline py-5 group"
                        style={{
                          color: settings.csTextColor || undefined,
                          fontFamily: settings.csFontFamily || undefined,
                          fontSize: settings.csFontSize ? `${parseInt(settings.csFontSize) + 1}px` : undefined,
                        }}
                      >
                        <span className="flex items-center gap-3 flex-1 text-start">
                          <CategoryIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-sm sm:text-base font-black">{section.category}</span>
                        </span>
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted dark:bg-white/10 text-muted-foreground dark:text-white transition-transform duration-200 group-data-[state=open]:rotate-180">
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </AccordionTrigger>

                      <AccordionContent className="pb-5 pt-1">
                        <Accordion type="single" collapsible className="w-full space-y-3">
                          {section.items.map((item, itemIdx) => (
                            <AccordionItem
                              key={item.id || itemIdx}
                              value={`item-${idx}-${itemIdx}`}
                              className="border border-border/80 dark:border-white/5 rounded-xl px-4 sm:px-5 transition-colors hover:bg-muted/40 dark:hover:bg-white/5 bg-background dark:bg-slate-950/40"
                              style={{
                                backgroundColor: settings.csBg || undefined,
                                color: item.color || settings.csTextColor || undefined,
                                fontFamily: settings.csFontFamily || undefined,
                              }}
                            >
                              <AccordionTrigger
                                className="font-bold hover:no-underline py-4 group"
                                style={{
                                  color: item.color || settings.csTextColor || undefined,
                                  fontSize: item.fontSize
                                    ? `${item.fontSize}px`
                                    : settings.csFontSize
                                    ? `${settings.csFontSize}px`
                                    : undefined,
                                }}
                              >
                                <span className="flex-1 text-start text-xs sm:text-sm font-bold leading-snug">
                                  {item.question}
                                </span>
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 dark:bg-white/5 text-muted-foreground dark:text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180">
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </span>
                              </AccordionTrigger>

                              <AccordionContent
                                className="font-medium text-xs sm:text-sm leading-relaxed text-start pb-5 pt-1 text-muted-foreground dark:text-slate-300"
                                style={{
                                  color: item.color || settings.csTextColor || undefined,
                                  fontSize: item.fontSize
                                    ? `${parseInt(item.fontSize) - 2}px`
                                    : settings.csFontSize
                                    ? `${parseInt(settings.csFontSize) - 2}px`
                                    : undefined,
                                }}
                              >
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
