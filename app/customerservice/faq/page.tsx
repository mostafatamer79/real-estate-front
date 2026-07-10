"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { useSettings } from "@/context/SettingsContext";
import { customerServiceFaqApi, customerServiceFaqCategoryApi, type CustomerServiceFaq, type CustomerServiceFaqCategory } from "@/lib/api";
import { faqData } from "../faq-data";
import { ArrowRight, BadgeDollarSign, ChevronDown, ChevronLeft, Headphones, HelpCircle, Home, Search, ShieldCheck, Sparkles, Tag } from "lucide-react";

export default function CustomerServiceFaqPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("customerservice");
  const { settings } = useSettings();

  const categoryIcons: Record<string, React.ElementType> = {
    "أسئلة عامة": HelpCircle,
    "أسئلة البحث والعرض": Search,
    "أسئلة الشراء": ShieldCheck,
    "أسئلة الإيجار": Home,
    "أسئلة البيع": Tag,
    "أسئلة الدفع": BadgeDollarSign,
    "أسئلة الدعم": Headphones,
  };

  const [faqs, setFaqs] = useState<CustomerServiceFaq[] | null>(null);
  const [faqCategories, setFaqCategories] = useState<CustomerServiceFaqCategory[] | null>(null);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [faqsError, setFaqsError] = useState<string | null>(null);
const handleGoBack = () => {
    const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/details");
  };

  const refreshFaqs = async () => {
    setFaqsLoading(true);
    setFaqsError(null);
    try {
      const [catsRes, faqsRes] = await Promise.all([
        customerServiceFaqCategoryApi.list(),
        customerServiceFaqApi.list(),
      ]);
      setFaqCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      setFaqs(Array.isArray(faqsRes.data) ? faqsRes.data : []);
    } catch (e: any) {
      setFaqsError(e?.message || "Failed to load FAQs");
      setFaqs(null);
      setFaqCategories(null);
    } finally {
      setFaqsLoading(false);
    }
  };

  useEffect(() => {
    refreshFaqs();
  }, []);

  const faqSections = useMemo(() => {
    if (!faqs || faqs.length === 0) return faqData;

    const itemsByCat = new Map<string, Array<{ id: string; question: string; answer: string; sortOrder: number; color?: string | null; fontSize?: string | null }>>();
    const uncategorized: Array<{ id: string; question: string; answer: string; sortOrder: number; category: string; color?: string | null; fontSize?: string | null }> = [];

    for (const item of faqs) {
      const question = language === "ar" ? item.questionAr : item.questionEn;
      const answer = language === "ar" ? item.answerAr : item.answerEn;
      const sortOrder = item.sortOrder ?? 0;
      const color = item.color;
      const fontSize = item.fontSize;
      if (item.categoryId) {
        const arr = itemsByCat.get(item.categoryId) || [];
        arr.push({ id: item.id, question, answer, sortOrder, color, fontSize });
        itemsByCat.set(item.categoryId, arr);
      } else {
        const category = language === "ar" ? (item.categoryAr || "أخرى") : (item.categoryEn || "Other");
        uncategorized.push({ id: item.id, question, answer, sortOrder, category, color, fontSize });
      }
    }

    for (const [catId, arr] of itemsByCat.entries()) {
      arr.sort((a, b) => a.sortOrder - b.sortOrder);
      itemsByCat.set(catId, arr);
    }
    uncategorized.sort((a, b) => a.sortOrder - b.sortOrder);

    const sections: Array<{ category: string; items: Array<{ id: string; question: string; answer: string; color?: string | null; fontSize?: string | null }> }> = [];
    const orderedCats = (faqCategories || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    for (const cat of orderedCats) {
      const arr = itemsByCat.get(cat.id) || [];
      if (arr.length === 0) continue;
      sections.push({
        category: language === "ar" ? cat.nameAr : cat.nameEn,
        items: arr.map(({ id, question, answer, color, fontSize }) => ({ id, question, answer, color, fontSize })),
      });
    }

    if (uncategorized.length > 0) {
      const map = new Map<string, Array<{ id: string; question: string; answer: string; sortOrder: number; color?: string | null; fontSize?: string | null }>>();
      for (const u of uncategorized) {
        const arr = map.get(u.category) || [];
        arr.push({ id: u.id, question: u.question, answer: u.answer, sortOrder: u.sortOrder, color: u.color, fontSize: u.fontSize });
        map.set(u.category, arr);
      }
      for (const [cat, arr] of map.entries()) {
        arr.sort((a, b) => a.sortOrder - b.sortOrder);
        sections.push({ category: cat, items: arr.map(({ id, question, answer, color, fontSize }) => ({ id, question, answer, color, fontSize })) });
      }
    }

    return sections.length > 0 ? sections : faqData;
  }, [faqs, faqCategories, language]);

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-3 sm:p-6">
        <ComingSoonOverlay sectionName={language === "ar" ? "الأسئلة الشائعة" : "FAQ"} message={message} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-muted/50 pb-12 overflow-x-hidden"
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        backgroundColor: settings.csBg || undefined,
        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
      }}
    >
      <section className="bg-card border-b border mb-12 p-4 sm:p-8 md:p-12 rounded-b-[1.25rem] text-slate-900 shadow-sm relative overflow-hidden" style={{ backgroundColor: settings.csCardBg || undefined }}>
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            type="button"
            onClick={() => handleGoBack()}
            className="mb-8 inline-flex h-11 items-center gap-2 rounded-2xl border border bg-muted px-4 text-[11px] font-black text-slate-700 transition-all hover:border hover:bg-card hover:text-slate-950"
          >
            {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {language === "ar" ? "العودة لخدمة العملاء" : "Back to customer service"}
          </button>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-950">
            {language === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-slate-500 font-medium text-sm md:text-base leading-relaxed">
            {language === "ar" ? "صفحة مستقلة للأسئلة المتكررة وإجاباتها." : "A dedicated page for frequently asked questions and answers."}
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
                <HelpCircle className="w-4 h-4" />
              </div>
              {language === "ar" ? "الأسئلة المتكررة" : "FAQs"}
            </h2>
            <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={refreshFaqs} disabled={faqsLoading}>
              {language === "ar" ? "تحديث" : "Refresh"}
            </Button>
          </div>

          <div className="glass p-3 sm:p-6 md:p-10 rounded-[1.25rem] bg-card/60 border-none shadow-2xl shadow-stone-400 space-y-8" style={{ backgroundColor: settings.csCardBg ? `${settings.csCardBg}99` : undefined }}>
            {faqsError && (
              <div className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                {language === "ar" ? "تعذر تحميل الأسئلة من الخادم، سيتم عرض البيانات الافتراضية." : "Failed to load FAQs from server; showing default data."}
              </div>
            )}
            <Accordion type="multiple" className="w-full space-y-6">
              {faqSections.map((section, idx) => {
                const CategoryIcon = categoryIcons[section.category] ?? Sparkles;
                return (
                  <AccordionItem key={idx} value={`section-${idx}`} className="border-none glass bg-card/50 rounded-[1rem] px-6 md:px-8 transition-all hover:bg-card" style={{ backgroundColor: settings.csCardBg || undefined }}>
                    <AccordionTrigger
                      className="font-black hover:no-underline text-right py-6 group"
                      style={{
                        color: settings.csTextColor || undefined,
                        fontFamily: settings.csFontFamily || undefined,
                        fontSize: settings.csFontSize ? `${parseInt(settings.csFontSize) + 1}px` : undefined,
                      }}
                    >
                      <span className="flex items-center gap-3 flex-1 text-right ">
                        <CategoryIcon className="w-4 h-4" />
                        {section.category}
                      </span>
                      <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-slate-500 transition-all group-data-[state=open]:rotate-180">
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <Accordion type="single" collapsible className="w-full space-y-4">
                        {section.items.map((item: any, itemIdx: number) => (
                          <AccordionItem
                            key={itemIdx}
                            value={`item-${idx}-${itemIdx}`}
                            className="border-none glass bg-card/40 rounded-3xl px-6 transition-all hover:bg-card"
                            style={{
                              backgroundColor: settings.csBg || undefined,
                              color: item.color || settings.csTextColor || undefined,
                              fontFamily: settings.csFontFamily || undefined,
                            }}
                          >
                            <AccordionTrigger
                              className="font-bold hover:no-underline text-right py-6 group"
                              style={{
                                color: item.color || settings.csTextColor || undefined,
                                fontSize: item.fontSize ? `${item.fontSize}px` : (settings.csFontSize ? `${settings.csFontSize}px` : undefined),
                              }}
                            >
                              <span className="flex-1 text-right">{item.question}</span>
                              <span className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-slate-500 transition-all group-data-[state=open]:rotate-180">
                                <ChevronDown className="h-4 h-4" />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent
                              className="font-medium leading-[1.8] text-right pb-6 opacity-90"
                              style={{
                                color: item.color || settings.csTextColor || undefined,
                                fontSize: item.fontSize ? `${parseInt(item.fontSize) - 2}px` : (settings.csFontSize ? `${parseInt(settings.csFontSize) - 2}px` : undefined),
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
          </div>
        </div>
      </div>
    </div>
  );
}
}
