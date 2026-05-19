"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  CreditCard, 
  TrendingUp,
  Clock,
  ExternalLink,
  Map,
  ShieldCheck,
  X
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

import { financialApi, activitiesApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const [statsRes, activitiesRes] = await Promise.all([
                financialApi.getDashboardStats(),
                activitiesApi.getRecent()
            ]);
            
            if (statsRes.data) {
                setDashboardStats(statsRes.data);
            }
            if (activitiesRes.data) {
                setActivities(activitiesRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: t('admin.stats.total_users'), value: dashboardStats?.totalUsers || '0', change: '+0%', trend: 'up', icon: Users },
    { label: t('admin.stats.active_ops'), value: dashboardStats?.activeOperations || '0', change: '+0%', trend: 'up', icon: Activity },
    { label: t('admin.stats.total_revenue'), value: new Intl.NumberFormat('en-US').format(dashboardStats?.totalRevenue || 0), change: '+0%', trend: 'up', icon: TrendingUp },
    { label: t('admin.stats.conv_rate'), value: `${dashboardStats?.conversionRate || 0}%`, change: '+0%', trend: 'up', icon: ShieldCheck },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_joined': return Users;
      case 'property_added': return Activity;
      case 'order_placed': return CreditCard;
      case 'payment_received': return TrendingUp;
      case 'booking_made': return Clock;
      default: return ShieldCheck;
    }
  };

  const getActivityMessage = (activity: any) => {
    switch (activity.type) {
      case 'user_joined': return t('admin.activity.new_user');
      default: return language === 'ar' ? (activity.titleAr || activity.title) : activity.title;
    }
  };

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-[2rem]" />
        <div className="h-96 bg-slate-200 rounded-[2rem]" />
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Activity Detail Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedActivity(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-950 border border-slate-100">
                    {React.createElement(getActivityIcon(selectedActivity.type), { className: "w-8 h-8" })}
                  </div>
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                    {selectedActivity.type}
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 leading-tight">
                    {getActivityMessage(selectedActivity)}
                  </h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                     {new Date(selectedActivity.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                       dateStyle: 'full',
                       timeStyle: 'short'
                     })}
                  </p>
                </div>

                {selectedActivity.description && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      {selectedActivity.description}
                    </p>
                  </div>
                )}

                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      {t('admin.activity.details')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedActivity.metadata).map(([key, value]: [string, any]) => (
                        <div key={key} className="p-4 rounded-xl bg-slate-50/50 border border-slate-100/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                          <p className="text-xs font-bold text-slate-950 truncate">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                   <button 
                    onClick={() => setSelectedActivity(null)}
                    className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    {t('common.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <Activity className="w-3 h-3" />
            {t('admin.system.online')}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t('admin.dashboard.title')}
          </h1>
          <p className="text-slate-400 text-xs font-bold font-mono">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:border-slate-900 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black ${stat.trend === 'up' ? 'text-slate-950' : 'text-slate-400'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-950 tabular-nums">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Map Tool Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 bg-slate-950 text-white rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em]">
                <Map className="w-3.5 h-3.5" />
                {t('admin.special_tool')}
              </div>
              <h2 className="text-4xl font-black max-w-md leading-tight">
                {t('admin.scan.title')}
              </h2>
              <p className="text-white/40 text-sm font-bold max-w-sm leading-relaxed">
                {t('admin.scan.desc')}
              </p>
            </div>
            
            <Link 
              href="/scan-map" 
              className="inline-flex items-center gap-3 mt-12 px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all group"
            >
              {t('admin.scan.btn')}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-white/5 rounded-full" />
        </motion.div>

        {/* Side Notification Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 h-full flex flex-col">
             <div className="flex items-center justify-between mb-8">
               <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                 {t('admin.activity.title')}
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
               </h3>
               <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                 <Clock className="w-4 h-4 text-slate-400" />
               </button>
             </div>

             <div className="flex-1 space-y-6">
               {activities.length > 0 ? activities.map((activity, i) => {
                 const Icon = getActivityIcon(activity.type);
                 return (
                  <motion.div 
                    key={activity.id || i} 
                    whileHover={{ x: 5 }}
                    onClick={() => setSelectedActivity(activity)}
                    className="flex gap-4 group cursor-pointer"
                  >
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-slate-950 group-hover:text-white transition-all">
                       <Icon className="w-4 h-4" />
                     </div>
                     <div className="space-y-1">
                       <p className="text-xs font-black text-slate-950 leading-tight group-hover:text-blue-600 transition-colors">
                         {getActivityMessage(activity)}
                       </p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         {t('admin.activity.time_ago', { 
                           time: formatDistanceToNow(new Date(activity.createdAt), { 
                             addSuffix: false, 
                             locale: language === 'ar' ? arSA : undefined 
                           }) 
                         })}
                       </p>
                     </div>
                  </motion.div>
                 );
               }) : (
                 <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                   <Activity className="w-8 h-8 mb-2 opacity-20" />
                   <p className="text-[10px] font-black uppercase tracking-widest">{t('common.noData')}</p>
                 </div>
               )}
             </div>

             <button className="w-full mt-8 py-4 border border-slate-100 rounded-2xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-950 transition-all flex items-center justify-center gap-2">
               {t('admin.activity.view_all')}
               <ExternalLink className="w-3 h-3" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
