"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import LegalRequestFlow from "@/components/legal/LegalRequestFlow";

export default function LegalServiceSelectionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRtl = language === "ar";

  return (
    <section className="w-full min-h-screen bg-slate-950 text-white overflow-x-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[10%] w-[50%] h-[40%] rounded-full bg-indigo-500/4 blur-[140px]" />
        <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] rounded-full bg-slate-600/8 blur-[120px]" />
        <div className="absolute top-[45%] right-[20%] w-[25%] h-[25%] rounded-full bg-gray-500/4 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-10 pb-16">
        <div>
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push("/services")}
            className="group flex items-center gap-2 text-slate-600 hover:text-slate-500 transition-colors text-[10px] font-bold uppercase tracking-widest"
          >
            <span className="w-6 h-6 rounded-full bg-card/[0.02] border border-white/[0.06] group-hover:bg-card/[0.05] flex items-center justify-center transition-all duration-200">
              <ArrowLeft className={`w-3 h-3 ${isRtl ? "rotate-180" : ""}`} />
            </span>
            {isRtl ? "العودة للخدمات" : "Back to services"}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="pt-10 pb-8"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/5 border border-white/10 mb-3">
              <Scale className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{isRtl ? "خدمات المنصة" : "Platform services"}</p>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 font-mono">02</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 mb-3">
              {isRtl ? "الخدمات القانونية" : "Legal services"}
            </h1>
            <p className="text-white/40 text-sm w-[95vw] sm:max-w-lg leading-relaxed">
              {isRtl ? "اختر نوع الخدمة القانونية، ثم أكمل تفاصيل الطلب في النموذج." : "Choose a legal service, then complete its request form."}
            </p>
          </motion.div>

          <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6" />

          <LegalRequestFlow
            selectionOnly
            onCategorySelect={(category) => router.push(`/services/form?type=legal&category=${category}`)}
          />
        </div>
      </div>
    </section>
  );
}
