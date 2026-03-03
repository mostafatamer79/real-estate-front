"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, BookOpen, FileCheck, Phone, ChevronLeft, Handshake, Scale, CheckCircle2, Landmark, UserCheck, Lock, Server, FileText, ExternalLink } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { TermsPrivacyModal } from "@/components/modals/terms-privacy-modal";

function InfoPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const defaultTab = searchParams.get("tab") || "terms";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"terms" | "privacy">("terms");

  const openModal = (tab: "terms" | "privacy") => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 pt-24" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-6 h-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black tracking-tight text-white"
              >
                {t("footer.rights")?.split("{year}")[0]?.trim() || "منصتنا العقارية"}
              </motion.h1>
              <p className="text-slate-400 font-medium max-w-xl text-sm leading-relaxed">
                هنا تجد كافة المعلومات القانونية، سياسات الاستخدام، والتراخيص التي تضمن لك رحلة عقارية آمنة وموثوقة.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5"
          >
            <ChevronLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            العودة
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="w-full space-y-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <TabsList className="flex h-14 items-center justify-start rounded-2xl bg-white/5 border border-white/5 p-1.5 w-full overflow-x-auto overflow-y-hidden no-scrollbar gap-2">
            <TabsTrigger value="terms" className="flex-1 min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-black text-xs transition-all uppercase tracking-tighter">
                <Shield className="w-4 h-4" />
              {t("footer.terms")}
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex-1 min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-black text-xs transition-all uppercase tracking-tighter">
              <BookOpen className="w-4 h-4" />
              {t("footer.usage")}
            </TabsTrigger>
            <TabsTrigger value="permits" className="flex-1 min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-black text-xs transition-all uppercase tracking-tighter">
              <FileCheck className="w-4 h-4" />
              {t("footer.permits")}
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 min-w-[140px] rounded-xl h-11 gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-950 font-black text-xs transition-all uppercase tracking-tighter">
              <Phone className="w-4 h-4" />
              {t("footer.contact")}
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent key="terms" value="terms" className="m-0 outline-none">
              <InfoSection 
                title={t("footer.terms")}
                icon={<Shield className="w-8 h-8 text-slate-400" />}
                content={[
                  { label: "قبول الشروط", text: "باستخدامك للمنصة، فإنك توافق على الالتزام بكافة الشروط والأحكام المذكورة في سياط المنصة." },
                  { label: "الملكية الفكرية", text: "جميع المحتويات، العلامات التجارية، والبيانات الموجودة على المنصة مملوكة حصرياً لنا." },
                  { label: "التزامات المستخدم", text: "يجب على المستخدم تقديم معلومات دقيقة وصحيحة عند التسجيل أو إضافة العقارات." }
                ]}
                actionBtn={
                  <button onClick={() => openModal("privacy")} className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all">
                    <span>قراءة الشروط والأحكام بالتفصيل</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                }
                bgColor="bg-slate-500/20"
              />
            </TabsContent>

            <TabsContent key="usage" value="usage" className="m-0 outline-none">
              <InfoSection 
                title={t("footer.usage")}
                icon={<BookOpen className="w-8 h-8 text-slate-400" />}
                content={[
                  { label: "الغرض من الاستخدام", text: "تم تصميم المنصة لتسهيل تداول العقارات والخدمات المرتبطة بها بشكل قانوني." },
                  { label: "السلوك الممنوع", text: "يُمنع استخدام المنصة لأي أغراض غير قانونية أو نشر محتوى مضلل." },
                  { label: "خصوصية البيانات", text: "نحن ملتزمون بحماية بياناتك الشخصية واستخدامها فقط للأغراض الموضحة في سياسة الخصوصية." }
                ]}
                actionBtn={
                  <button onClick={() => openModal("terms")} className="mt-8 flex items-center justify-center gap-2 w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-black text-sm transition-all">
                    <span>قراءة سياسة الخصوصية بالتفصيل</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                }
                bgColor="bg-slate-500/20"
              />
            </TabsContent>

            <TabsContent key="permits" value="permits" className="m-0 outline-none">
              <InfoSection 
                title={t("footer.permits")}
                icon={<FileCheck className="w-8 h-8 text-slate-400" />}
                content={[
                  { label: "ترخيص المنصة", text: "المنصة حاصلة على كافة التراخيص اللازمة من الهيئة العامة للعقار." },
                  { label: "تراخيص الوسطاء", text: "يتم التحقق من رخص كافة الوسطاء والمكاتب العقارية المسوقة عبر المنصة." },
                  { label: "الامتثال للأنظمة", text: "نحن نتبع كافة الأنظمة واللوائح العقارية المعمول بها في المملكة العربية السعودية." }
                ]}
                bgColor="bg-slate-500/20"
              />
            </TabsContent>

            <TabsContent key="contact" value="contact" className="m-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                  <div className="p-4 bg-slate-700/30 rounded-2xl w-fit">
                    <Phone className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-2">{t("footer.contact")}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      فريق الدعم الفني متواجد لمساعدتك على مدار الساعة.
                    </p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Phone className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">92000XXXX</span>
                    </div>
                    <div className="flex items-center gap-4 group cursor-pointer">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Scale className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-bold tracking-tight">info@dealapp.sa</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-3xl p-8 space-y-6">
                  <div className="p-4 bg-slate-700/30 rounded-2xl w-fit">
                    <Handshake className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-2">خدمة العملاء</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      تواصل معنا مباشرة عبر قسم خدمة العملاء لتقديم الشكاوى أو الاقتراحات.
                    </p>
                  </div>
                  <button 
                    onClick={() => router.push('/customerservice')}
                    className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-sm transition-colors"
                  >
                    فتح تذكرة دعم
                  </button>
                </div>
              </div>
            </TabsContent>
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

function InfoSection({ title, icon, content, actionBtn, bgColor = "bg-white/10" }: { title: string, icon: React.ReactNode, content: { label: string, text: string }[], actionBtn?: React.ReactNode, bgColor?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }}
      exit={{ opacity: 0, y: -15, transition: { duration: 0.2 } }}
      className="bg-white/5 border border-white/5 rounded-[2rem] p-8 md:p-12 space-y-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className={cn("absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px]", bgColor)} />
      </div>

      <div className="flex items-center gap-6 relative z-10">
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          {icon}
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">{title}</h2>
      </div>

      <div className="space-y-8 relative z-10">
        {content.map((item, idx) => (
          <div key={idx} className="space-y-3 group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[2px] bg-white/20 group-hover:bg-white transition-colors" />
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
