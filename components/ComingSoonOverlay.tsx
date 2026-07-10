"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface ComingSoonOverlayProps {
    message?: string;
    sectionName?: string;
    /** Show an admin quick-edit link */
    isAdmin?: boolean;
}

export default function ComingSoonOverlay({ message, sectionName, isAdmin }: ComingSoonOverlayProps) {
    const { t, language } = useLanguage();
    const displayMsg = message || t('coming_soon_global') || "هذه الخدمة ستتوفر قريباً جداً في نظامنا المطور.";

    return (
        <div className="w-full min-h-screen bg-[#020617] flex flex-col items-center justify-center relative overflow-hidden px-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Ultra-premium background effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-indigo-500/10 rounded-full blur-[180px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-pulse delay-1000" />
            
            {/* Animated mesh gradient */}
            <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400 rounded-full blur-[120px] animate-float-delayed" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center gap-10 text-center w-[95vw] sm:max-w-lg w-full"
            >
                {/* Icon Assembly */}
                <div className="relative">
                    <motion.div 
                        animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-[1rem] bg-slate-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10"
                    >
                        <Clock className="w-10 h-10 text-indigo-400" />
                    </motion.div>
                    {/* Radial glows around icon */}
                    <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl rounded-full -z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 to-transparent blur-xl rounded-[1rem] opacity-50" />
                </div>

                {/* Text Content */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm"
                    >
                        <Lock className="w-3 h-3" />
                        Exclusive Access Pending
                    </motion.div>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
                            {sectionName || "الخدمة"}
                            <span className="block bg-gradient-to-r from-indigo-400 via-blue-400 to-slate-400 bg-clip-text text-transparent mt-2">
                                {language === 'ar' ? 'قريباً جداً' : 'Coming Soon'}
                            </span>
                        </h1>
                    </div>

                    <p className="text-slate-400/80 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                        {displayMsg}
                    </p>
                </div>

                {/* Glass Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm pt-4">
                    <Link
                        href="/details"
                        className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-card/5 hover:bg-card/10 border border-white/10 hover:border-white/20 text-white text-sm font-black transition-all group backdrop-blur-md"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
                        {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                    </Link>

                    {isAdmin && (
                        <Link
                            href="/admin/settings"
                            className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition-all shadow-[0_10px_20px_rgba(79,70,229,0.2)]"
                        >
                            ⚙️ {language === 'ar' ? 'تعديل الخدمة' : 'Admin Edit'}
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* Background Grain/Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PScwIDAgMjAwIDIwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZmlsdGVyIGlkPSdub2lzZUZpbHRlcic+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuNjUnIG51bU9jdGF2ZXM9JzMnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyBmaWx0ZXI9J3VybCgjbm9pc2VGaWx0ZXIpJy8+PC9zdmc+')]" />
        </div>
    );
}
