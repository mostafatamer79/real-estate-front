// app/details/page.tsx
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import("../src/components/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse rounded-2xl" />
});
import PropertyInfoCards from "../src/components/PropertyInfoCards";
import QuickActions from "../src/components/QuickActions";
import PriceTrendChart from "../src/components/PriceTrendChart";
import PropertyDistributionChart from "../src/components/PropertyDistributionChart";
import ProfileModal from "@/components/ProfileModal";
import ComingSoonInline from "@/components/ComingSoonInline";
import RecentActivity from "../src/components/RecentActivity";
import Footer from "../src/components/Footer";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from "framer-motion";
import { Map as MapIcon, Grid, Zap, Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useSectionGuard } from '@/hooks/useSectionGuard';
import { useSettings } from '@/context/SettingsContext';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

export default function HomePage() {
  const propertyLocation: [number, number] = [24.7136, 46.6753];
  const { user, token } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard('details');


  const { settings } = useSettings();
  const ui = settings.uiFlags;

  const detailsPartStatus = (id: 'map' | 'stats' | 'charts' | 'quick_actions'): 'enabled' | 'soon' | 'hidden' => {
    const explicit = settings.detailsPartFlags?.[id];
    if (explicit) return explicit;
    // Backward-compatible fallback to old boolean uiFlags
    if (id === 'map' && ui?.show_map_section === false) return 'hidden';
    if (id === 'stats' && ui?.show_stats_cards === false) return 'hidden';
    if (id === 'charts' && ui?.show_charts_section === false) return 'hidden';
    if (id === 'quick_actions' && ui?.show_quick_actions === false) return 'hidden';
    return 'enabled';
  };

  const [priceData, setPriceData] = useState<number[]>([]);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [marketingRequests, setMarketingRequests] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRange, setSelectedRange] = useState<string>('year');

  const handleProfileUpdate = (_updatedUser: any) => { window.location.reload(); };

  const fetchData = async () => {
    try {
      let startDateStr = "";
      const endDateStr = new Date().toISOString();
      if (selectedRange !== 'all') {
        const d = new Date();
        if (selectedRange === 'last30') d.setDate(d.getDate() - 30);
        else if (selectedRange === 'last90') d.setDate(d.getDate() - 90);
        else if (selectedRange === 'year') d.setFullYear(d.getFullYear() - 1);
        startDateStr = d.toISOString();
      }
      const statusQuery = selectedStatus !== 'ALL' ? `&status=${selectedStatus.toLowerCase()}` : '';
      const rangeQuery = startDateStr ? `&startDate=${startDateStr}&endDate=${endDateStr}` : '';

      const priceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/chart-data?${statusQuery.substring(1)}${rangeQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (priceRes.ok) {
        const data = await priceRes.json();
        setPriceData(data);
        const today = new Date();
        const labels = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          labels.push(t(`chart.months.short.${d.getMonth() + 1}`));
        }
        setChartLabels(labels);
      }

      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties/stats?${statusQuery.substring(1)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setPropertyTypes(data.map((item: any, index: number) => ({
          ...item,
          name: t(`property.type.${item.name.toLowerCase()}`) || item.name,
          color: ['bg-indigo-400', 'bg-slate-400', 'bg-gray-400', 'bg-slate-600'][index % 4]
        })));
      }

      const [opsData, adsData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/activities/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/marketing/email`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : [])
      ]);
      setOperations(opsData);
      setMarketingRequests(adsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // useEffect(() => {
  //   if (user && user.departments && user.departments.length > 0 && user.role !== 'admin') {
  //     router.push('/department-hub');
  //   }
  // }, [user, router]);

  useEffect(() => { if (token) fetchData(); }, [selectedStatus, selectedRange]);

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('common.details') || 'التفاصيل'} message={message} isAdmin={isAdmin} />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const dropdownTriggerCls = `flex items-center gap-2 bg-slate-800 border border-slate-700/70
    hover:border-slate-600 rounded-xl px-4 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.3)]
    text-xs font-bold text-slate-300 hover:text-slate-100 cursor-pointer transition-all duration-200`;

  const dropdownContentCls = `rounded-2xl bg-slate-800 border border-slate-700/60
    shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-2 w-48 z-[100]`;

  const dropdownItemCls = `rounded-xl font-semibold text-xs p-3 text-slate-300
    hover:text-slate-100 hover:bg-slate-700/60 cursor-pointer transition-colors duration-150`;

  return (
    <>
      <div className="w-full min-h-screen bg-slate-950 pt-12 pb-12 relative overflow-hidden"
        dir={language === 'ar' ? 'rtl' : 'ltr'}>

        {/* Ambient background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[5%] left-[10%] w-[50%] h-[40%] rounded-full bg-indigo-500/4 blur-[140px]" />
          <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] rounded-full bg-slate-600/8 blur-[120px]" />
          <div className="absolute top-[45%] right-[20%] w-[25%] h-[25%] rounded-full bg-gray-500/4 blur-[100px]" />
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

          {/* Header */}
          <motion.div variants={itemVariants} className="mb-14 space-y-5">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {t('details.header.title')}{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-slate-400">
                {t('details.header.highlight')}
              </span>
            </h1>
            <div className="flex items-start gap-4 group">
               <div className="w-1.5 self-stretch bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-full opacity-40 group-hover:opacity-100 transition-opacity duration-300 mt-1.5" />
               <p className="text-slate-400 font-medium w-full max-w-none text-base md:text-lg leading-tight tracking-tighter">
                 {t('details.header.desc')}
               </p>
            </div>
          </motion.div>

          <div className="space-y-10">
            {/* Map Section */}
            {detailsPartStatus('map') !== 'hidden' && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400">
                  <MapIcon className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-300 tracking-tight">{t('details.map.title')}</h2>
              </div>

              {detailsPartStatus('map') === 'soon' ? (
                <ComingSoonInline sectionName={t('details.map.title')} message={settings.detailsPartMessages?.map} />
              ) : settings.sectionFlags.scan_map === 'closed' ? (
                <ComingSoonInline 
                  sectionName={t('details.map.title')} 
                  message={settings.sectionMessages.scan_map} 
                />
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/15 to-slate-600/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-700 cursor-pointer"
                    onClick={() => router.push('/scan-map')} />
                  <div className="relative w-full h-[350px] bg-slate-800 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-slate-700/40">
                    <Map center={propertyLocation} zoom={15} markerPosition={propertyLocation}
                      markerTitle={t('map.markerProp')} markerDescription={t('map.markerDefault')} />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                    onClick={() => router.push('/scan-map')}
                    className="relative w-full mt-6 bg-gradient-to-b from-slate-800 to-slate-850
                      hover:from-slate-780 hover:to-slate-820
                      border border-slate-700/60 hover:border-slate-600/80
                      text-slate-300 hover:text-slate-100
                      py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.4em]
                      shadow-[0_4px_24px_rgba(0,0,0,0.4)]
                      hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.07)]
                      transition-all duration-300
                      flex items-center justify-center gap-4 group cursor-pointer overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                    <MapIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    {t('home.scan')}
                    <Zap className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-400 group-hover:animate-pulse" />
                  </motion.button>
                </div>
              )}
            </motion.div>
            )}

            {/* Stats / Info Cards */}
            {detailsPartStatus('stats') !== 'hidden' && (
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400">
                    <Grid className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-300 tracking-tight">{t('details.stats.title')}</h2>
                </div>

                {detailsPartStatus('stats') === 'soon' ? (
                  <ComingSoonInline sectionName={t('details.stats.title')} message={settings.detailsPartMessages?.stats} />
                ) : settings.sectionFlags.financial === 'closed' ? (
                  <ComingSoonInline 
                    sectionName={t('details.stats.title')} 
                    message={settings.sectionMessages.financial} 
                  />
                ) : (
                  <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/70
                    rounded-3xl border border-slate-700/50
                    shadow-[0_4px_32px_rgba(0,0,0,0.4)] p-6 overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
                    <PropertyInfoCards operations={operations} marketingRequests={marketingRequests} userRole={user?.role} />
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Charts Section */}
        {detailsPartStatus('charts') !== 'hidden' && (
        <section className="w-full bg-transparent py-24 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800/60 to-transparent" />

          <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
            <motion.div variants={itemVariants} className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-7 bg-gradient-to-b from-slate-400 to-slate-700 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-200 tracking-tight uppercase">
                    {t('details.charts.title')}
                  </h2>
                </div>
              </div>

              {detailsPartStatus('charts') === 'soon' ? (
                <ComingSoonInline sectionName={t('details.charts.title')} message={settings.detailsPartMessages?.charts} />
              ) : settings.sectionFlags.financial === 'closed' && user?.role !== 'admin' ? (
                <ComingSoonInline 
                  sectionName={t('details.charts.title')} 
                  message={settings.sectionMessages.financial} 
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
                  {[
                    <PriceTrendChart key="price" data={priceData.length > 0 ? priceData : undefined} labels={chartLabels} />,
                    <PropertyDistributionChart key="dist" data={propertyTypes.length > 0 ? propertyTypes : undefined} />
                  ].map((chart, i) => (
                    <motion.div key={i} whileHover={{ y: -4 }}
                      className="relative bg-gradient-to-b from-slate-900 to-slate-950
                        border border-slate-800/70 hover:border-slate-700/60
                        rounded-[2rem] overflow-hidden
                        shadow-[0_4px_24px_rgba(0,0,0,0.5)]
                        hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.04)]
                        transition-all duration-300 h-full"
                    >
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
                      {chart}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
        )}

        {/* Quick Actions */}
        {detailsPartStatus('quick_actions') !== 'hidden' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="w-full max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="space-y-20 pb-20">
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-300 tracking-tight">{t('details.quickActions.title')}</h2>
              </div>
              {detailsPartStatus('quick_actions') === 'soon' ? (
                <ComingSoonInline sectionName={t('details.quickActions.title')} message={settings.detailsPartMessages?.quick_actions} />
              ) : (
                <QuickActions />
              )}
            </motion.div>
          </div>
        </motion.div>
        )}
      </div>

      {user && token && (
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}
          user={user} onUpdate={handleProfileUpdate} />
      )}
      <Footer />
    </>
  );
}
