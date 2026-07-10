"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";

export default function RecentActivity() {
    const { t, language } = useLanguage();
    const { token } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.get('/activities/me')
            .then((res) => {
                const data = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
                setActivities(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching activities:", err);
                setLoading(false);
            });
        }
    }, [token]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'property_added': return <FileText className="w-4 h-4 text-blue-400" />;
            case 'order_placed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'payment_received': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            default: return <Clock className="w-4 h-4 text-indigo-400" />;
        }
    };

    const getActivityText = (activity: any) => {
        const title = String(activity?.title || '');
        const description = String(activity?.description || '');
        const userName = description.replace(/\s*joined the system\.?$/i, '').trim();

        if (title.toLowerCase() === 'new user joined') {
            return {
                title: language === 'ar' ? 'انضم مستخدم جديد' : 'New User Joined',
                description: language === 'ar'
                    ? `${userName || 'مستخدم'} انضم إلى النظام`
                    : description || `${userName || 'User'} joined the system`,
            };
        }

        return {
            title: title || description || (language === 'ar' ? 'عملية سابقة' : 'Previous Operation'),
            description,
        };
    };

    if (loading) return <div className="h-48 w-full bg-slate-900/50 animate-pulse rounded-3xl" />;

    return (
        <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400">
                    <History className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-300 tracking-tight">
                    {language === 'ar' ? 'العمليات السابقة' : 'Previous Operations'}
                </h2>
            </div>

            <div className="grid gap-4">
                {activities.length > 0 ? (
                    activities.map((activity, idx) => {
                        const activityText = getActivityText(activity);
                        return (
                            <motion.div
                                key={activity.id || idx}
                                initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/60 hover:border-indigo-500/30 rounded-2xl p-4 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {getIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h4 className="text-sm font-bold text-slate-200">{activityText.title}</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">{activityText.description}</p>
                                    </div>
                                    <div className="text-[10px] font-medium text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">
                                        {new Date(activity.createdAt || activity.timestamp || activity.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-6 bg-slate-900/20 border border-slate-800/40 rounded-[1rem] border-dashed">
                        <AlertCircle className="w-8 h-8 text-slate-700 mb-4" />
                        <p className="text-slate-500 text-sm font-medium">
                            {language === 'ar' ? 'لا توجد عمليات حالياً' : 'No previous operations found'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
