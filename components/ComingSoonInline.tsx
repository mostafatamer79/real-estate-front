"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ComingSoonInlineProps {
    message?: string;
    sectionName?: string;
}

export default function ComingSoonInline({ message, sectionName }: ComingSoonInlineProps) {
    const { t, language } = useLanguage();
    const displayMsg = message || t('coming_soon_global') || "هذه الخدمة ستتوفر قريباً جداً في نظامنا المطور.";

    return (
        <div className="relative w-full h-full min-h-[300px] bg-slate-950/40 backdrop-blur-xl rounded-[1.25rem] border border-white/5 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden group" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[80px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 flex flex-col items-center gap-3 md:gap-6 text-center max-w-sm"
            >
                <div className="relative">
                    <motion.div 
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-center shadow-2xl"
                    >
                        <Clock className="w-7 h-7 text-indigo-400" />
                    </motion.div>
                    <div className="absolute -inset-2 bg-indigo-500/20 blur-2xl rounded-full -z-10" />
                </div>

                <div className="space-y-3">
                    <div
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest"
                        style={{
                            backgroundColor: "var(--soon-badge-bg, #ffffff)",
                            color: "var(--soon-badge-text, #000000)",
                            borderColor: "var(--soon-badge-bg, #ffffff)",
                        }}
                    >
                        <Lock className="w-3 h-3" />
                        {language === 'ar' ? 'قريباً' : 'COMING SOON'}
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                        {sectionName || (language === 'ar' ? 'هذا القسم' : 'This Section')}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">
                        {displayMsg}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
