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
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { motion } from "framer-motion";
import { Map as MapIcon, Grid, Zap, Megaphone, History, LayoutDashboard, Building2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useSectionGuard } from '@/hooks/useSectionGuard';
import { useSettings } from '@/context/SettingsContext';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';
import api from '@/lib/api';

export default function HomePage() {
  const propertyLocation: [number, number] = [24.7136, 46.6753];
  const { user, token } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard('details');


  const { settings } = useSettings();
  const ui = settings.uiFlags;

  const detailsPartStatus = (id: 'map' | 'stats' | 'charts' | 'ads' | 'previous_logs' | 'quick_actions'): 'enabled' | 'soon' | 'hidden' => {
    const explicit = settings.detailsPartFlags?.[id];
    if (explicit) return explicit;
    // Backward-compatible fallback to old boolean uiFlags
    if (id === 'map' && ui?.show_map_section === false) return 'hidden';
    if (id === 'stats' && ui?.show_stats_cards === false) return 'hidden';
    if (id === 'charts' && ui?.show_charts_section === false) return 'hidden';
    if (id === 'quick_actions' && ui?.show_quick_actions === false) return 'hidden';
    return 'enabled';
  };

  const defaultSectionOrder: Array<'map' | 'stats' | 'charts' | 'ads' | 'previous_logs' | 'quick_actions'> = [
    'map',
    'stats',
    'charts',
    'quick_actions',
  ];
  const mergedCardOnlySections = new Set<string>(['ads', 'previous_logs']);

  const orderedSections = (() => {
    const raw = settings.textOverrides?.details_parts_order || '';
    const custom = raw
      .split(',')
      .map((part) => part.trim())
      .filter((part): part is typeof defaultSectionOrder[number] => defaultSectionOrder.includes(part as any));
    const merged = [...custom, ...defaultSectionOrder.filter((part) => !custom.includes(part))];
    return merged.filter((part) => !mergedCardOnlySections.has(part));
  })();

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

      const chartQuery = `${statusQuery.substring(1)}${rangeQuery}`;
      const priceRes = await api.get(`/financial/chart-data${chartQuery ? `?${chartQuery}` : ''}`).catch(() => ({ data: [] }));
      if (Array.isArray(priceRes.data)) {
        setPriceData(priceRes.data.map((value: any) => Number(value) || 0));
        const today = new Date();
        const labels = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          labels.push(t(`chart.months.short.${d.getMonth() + 1}`));
        }
        setChartLabels(labels);
      }

      const statsQuery = statusQuery.substring(1);
      const statsRes = await api.get(`/properties/stats${statsQuery ? `?${statsQuery}` : ''}`).catch(() => ({ data: [] }));
      if (Array.isArray(statsRes.data)) {
        const data = statsRes.data;
        setPropertyTypes(data.map((item: any, index: number) => ({
          ...item,
          value: Number(item.value) || 0,
          name: t(`property.type.${item.name.toLowerCase()}`) || item.name,
          color: ['bg-indigo-400', 'bg-slate-400', 'bg-gray-400', 'bg-slate-600'][index % 4]
        })));
      }

      const normalizeList = (payload: any) => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
      };

      const [opsRes, adsRes] = await Promise.all([
        api.get('/activities/me').catch(() => ({ data: [] })),
        api.get('/marketing/email-marketing/public').catch(() => ({ data: [] })),
      ]);
      setOperations(normalizeList(opsRes.data));
      setMarketingRequests(normalizeList(adsRes.data));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  // useEffect(() => {
  //   if (user && user.departments && user.departments.length > 0 && user.role !== 'admin') {
  //     router.push('/department-hub');
  //   }
  // }, [user, router]);

  useEffect(() => { fetchData(); }, [token, selectedStatus, selectedRange]);

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

  const sectionCards: Record<string, { id: string; title: string; icon: any; content: any }> = {
    map: {
      id: 'map',
      title: t('details.map.title'),
      icon: MapIcon,
      content: (
        detailsPartStatus('map') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.map.title')} message={settings.detailsPartMessages?.map} />
        ) : settings.sectionFlags.scan_map === 'hidden' ? null : settings.sectionFlags.scan_map === 'closed' ? (
          <ComingSoonInline sectionName={t('details.map.title')} message={settings.sectionMessages.scan_map} />
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
              {t('home.scan')}
            </motion.button>
          </div>
        )
      ),
    },
    stats: {
      id: 'stats',
      title: t('details.stats.title'),
      icon: Grid,
      content: (
        detailsPartStatus('stats') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.stats.title')} message={settings.detailsPartMessages?.stats} />
        ) : settings.sectionFlags.financial === 'hidden' ? null : settings.sectionFlags.financial === 'closed' ? (
          <ComingSoonInline sectionName={t('details.stats.title')} message={settings.sectionMessages.financial} />
        ) : (
          <div className="space-y-8">
            <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/70 rounded-3xl border border-slate-700/50 shadow-[0_4px_32px_rgba(0,0,0,0.4)] p-6 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent" />
              <PropertyInfoCards operations={operations} marketingRequests={marketingRequests} userRole={user?.role} />
            </div>
          </div>
        )
      ),
    },
    charts: {
      id: 'charts',
      title: t('details.charts.title'),
      icon: Grid,
      content: (
        detailsPartStatus('charts') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.charts.title')} message={settings.detailsPartMessages?.charts} />
        ) : settings.sectionFlags.financial === 'hidden' && user?.role !== 'admin' ? null : settings.sectionFlags.financial === 'closed' && user?.role !== 'admin' ? (
          <ComingSoonInline sectionName={t('details.charts.title')} message={settings.sectionMessages.financial} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            {[
              <PriceTrendChart key="price" data={priceData} labels={chartLabels} />,
              <PropertyDistributionChart key="dist" data={propertyTypes} />
            ].map((chart, i) => (
              <motion.div key={i} whileHover={{ y: -4 }}
                className="relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/70 hover:border-slate-700/60 rounded-[1.25rem] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(99,102,241,0.04)] transition-all duration-300 h-full"
              >
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent" />
                {chart}
              </motion.div>
            ))}
          </div>
        )
      ),
    },
    ads: {
      id: 'ads',
      title: language === 'ar' ? 'الإعلانات' : 'Ads',
      icon: Megaphone,
      content: detailsPartStatus('ads') === 'soon' ? (
        <ComingSoonInline sectionName={language === 'ar' ? 'الإعلانات' : 'Ads'} message={settings.detailsPartMessages?.ads} />
      ) : marketingRequests.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {marketingRequests.slice(0, 6).map((request: any, index: number) => {
            const isOffer = request.category === 'offers';
            const priceVal = request.price ? Number(request.price) : 0;
            const areaVal = request.area ? Number(request.area) : 0;
            const imageUrl = request.mediaFiles && request.mediaFiles.length > 0 ? request.mediaFiles[0] : null;

            return (
              <div key={request.id || index} className="rounded-3xl border border-slate-800/70 bg-slate-900/80 overflow-hidden text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.35)] flex flex-col hover:border-slate-700/80 transition-all duration-300">
                {imageUrl && (
                  <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                    <img src={imageUrl} alt={request.subject || request.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-200">
                      {request.dealType || (language === 'ar' ? 'عرض' : 'Offer')}
                    </div>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black truncate">{request.title || request.subject || request.name || (language === 'ar' ? 'طلب إعلان' : 'Ad request')}</p>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                        {request.scheduleMode === 'date_range'
                          ? `${request.startDate ? new Date(request.startDate).toLocaleDateString() : ''} - ${request.endDate ? new Date(request.endDate).toLocaleDateString() : ''}`
                          : (language === 'ar' ? 'يدوي' : 'Manual')}
                      </span>
                    </div>

                    {isOffer && (priceVal > 0 || areaVal > 0 || request.city || request.neighborhood) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/50 text-[11px] font-bold text-slate-300 text-right" dir="rtl">
                        {priceVal > 0 && (
                          <div>
                            <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">{language === 'ar' ? 'السعر' : 'Price'}</span>
                            <span className="text-indigo-400 font-black"><SaudiRiyalAmount amount={priceVal} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></span>
                          </div>
                        )}
                        {areaVal > 0 && (
                          <div>
                            <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">{language === 'ar' ? 'المساحة' : 'Area'}</span>
                            <span>{areaVal} {language === 'ar' ? 'م²' : 'm²'}</span>
                          </div>
                        )}
                        {request.propertyType && (
                          <div>
                            <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">{language === 'ar' ? 'النوع' : 'Type'}</span>
                            <span>{request.propertyType}</span>
                          </div>
                        )}
                        {(request.city || request.neighborhood) && (
                          <div>
                            <span className="text-[9px] font-black text-slate-500 block uppercase tracking-wider">{language === 'ar' ? 'الموقع' : 'Location'}</span>
                            <span className="truncate block">{request.neighborhood ? `${request.neighborhood}، ` : ''}{request.city || ''}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="mt-3 text-xs leading-6 text-slate-400 line-clamp-3">
                      {request.description || request.content || request.message || request.notes || ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/60 p-10 text-center text-slate-400">
          {language === 'ar' ? 'لا توجد بيانات إعلانات حالياً' : 'No ads data available yet'}
        </div>
      ),
    },
    previous_logs: {
      id: 'previous_logs',
      title: language === 'ar' ? 'السجل السابق' : 'Previous logs',
      icon: History,
      content: detailsPartStatus('previous_logs') === 'soon' ? (
        <ComingSoonInline sectionName={language === 'ar' ? 'السجل السابق' : 'Previous logs'} message={settings.detailsPartMessages?.previous_logs} />
      ) : (
        <RecentActivity />
      ),
    },
    quick_actions: {
      id: 'quick_actions',
      title: t('details.quickActions.title'),
      icon: Zap,
      content: detailsPartStatus('quick_actions') === 'soon' ? (
        <ComingSoonInline sectionName={t('details.quickActions.title')} message={settings.detailsPartMessages?.quick_actions} />
      ) : (
        <QuickActions />
      ),
    },
  };

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

  

          <div className="space-y-10">
            {orderedSections.map((sectionId) => {
              const section = sectionCards[sectionId];
              if (!section || detailsPartStatus(sectionId as any) === 'hidden') return null;

              const sectionStylesMap: Record<string, {
                iconColorKey: string;
                iconSizeKey: string;
                titleColorKey: string;
                titleSizeKey: string;
              }> = {
                map: {
                  iconColorKey: 'mapIconColor',
                  iconSizeKey: 'mapIconSize',
                  titleColorKey: 'mapTitleColor',
                  titleSizeKey: 'mapTitleSize',
                },
                stats: {
                  iconColorKey: 'statsIconColor',
                  iconSizeKey: 'statsIconSize',
                  titleColorKey: 'statsTitleColor',
                  titleSizeKey: 'statsTitleSize',
                },
                charts: {
                  iconColorKey: 'chartsIconColor',
                  iconSizeKey: 'chartsIconSize',
                  titleColorKey: 'chartsTitleColor',
                  titleSizeKey: 'chartsTitleSize',
                },
                ads: {
                  iconColorKey: 'adsIconColor',
                  iconSizeKey: 'adsIconSize',
                  titleColorKey: 'adsTitleColor',
                  titleSizeKey: 'adsTitleSize',
                },
                previous_logs: {
                  iconColorKey: 'statsIconColor',
                  iconSizeKey: 'statsIconSize',
                  titleColorKey: 'statsTitleColor',
                  titleSizeKey: 'statsTitleSize',
                }
              };

              const styles = sectionStylesMap[sectionId];
              const customIconColor = styles ? (settings as any)[styles.iconColorKey] : undefined;
              const customIconSize = styles && (settings as any)[styles.iconSizeKey] ? Number((settings as any)[styles.iconSizeKey]) : undefined;
              const customTitleColor = styles ? (settings as any)[styles.titleColorKey] : undefined;
              const customTitleSize = styles && (settings as any)[styles.titleSizeKey] ? Number((settings as any)[styles.titleSizeKey]) : undefined;

              return (
                <motion.div key={section.id} variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-400 flex items-center justify-center"
                      style={{
                        color: customIconColor || undefined,
                        width: customIconSize ? `${customIconSize + 16}px` : undefined,
                        height: customIconSize ? `${customIconSize + 16}px` : undefined,
                      }}
                    >
                      <section.icon 
                        style={{
                          color: customIconColor || undefined,
                          width: customIconSize ? `${customIconSize}px` : undefined,
                          height: customIconSize ? `${customIconSize}px` : undefined,
                        }} 
                      />
                    </div>
                    <h2 
                      className="text-base font-bold text-slate-300 tracking-tight"
                      style={{
                        color: customTitleColor || undefined,
                        fontSize: customTitleSize ? `${customTitleSize}px` : undefined,
                      }}
                    >
                      {section.title}
                    </h2>
                  </div>
                  {section.content}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>

      {user && token && (
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}
          user={user} onUpdate={handleProfileUpdate} />
      )}
      <Footer />
    </>
  );
}
