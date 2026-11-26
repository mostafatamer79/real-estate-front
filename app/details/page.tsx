// app/details/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import {
  Map as MapIcon,
  BarChart3,
  PieChart,
  Zap,
  Megaphone,
  History,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';


import DetailsNeighborhood from '@/components/details/DetailsNeighborhood';
import studio from './details-studio.module.css';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DETAILS_DESIGN_KEY, parseDetailsDesign } from '@/lib/details-design';
import PropertyInfoCards from "../src/components/PropertyInfoCards";
import QuickActions from "../src/components/QuickActions";
import PriceTrendChart from "../src/components/PriceTrendChart";
import PropertyDistributionChart from "../src/components/PropertyDistributionChart";
import ComingSoonInline from "@/components/ComingSoonInline";
import RecentActivity from "../src/components/RecentActivity";
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/context/LanguageContext';
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { useSectionGuard } from '@/hooks/useSectionGuard';
import { useSettings, resolveSurfaceColor } from '@/context/SettingsContext';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';
import api from '@/lib/api';
const Tutorial = dynamic(() => import('@/components/Tutorial'));
import { shouldShowOnboarding, saveOnboardingStatus, buildTourSteps } from '@/lib/onboarding';
import styles from './details.module.css';
import DetailsStudioSurface from '@/components/details/DetailsStudioSurface';
import { motion, useReducedMotion } from 'motion/react';
import { dashboardSeries, dashboardPropertyTypes } from '@/lib/details-data';

const defaultSectionOrder: Array<'map' | 'stats' | 'charts' | 'ads' | 'previous_logs' | 'quick_actions'> = [
  'map',
  'stats',
  'charts',
  'quick_actions',
];
const mergedCardOnlySections = new Set<string>(['ads', 'previous_logs']);

export default function DetailsPage() {
  const { user, token } = useAuth();
  const reduceMotion = useReducedMotion();
  const { t, language } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard('details');

  const { settings, isLoading: settingsLoading } = useSettings();
  const design = useMemo(() => parseDetailsDesign(settings.textOverrides[DETAILS_DESIGN_KEY]), [settings.textOverrides]);
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

  const orderedSections = useMemo(() => {
    const raw = settings.textOverrides?.details_parts_order || '';
    const custom = raw
      .split(',')
      .map((part) => part.trim())
      .filter((part): part is typeof defaultSectionOrder[number] => (defaultSectionOrder as readonly string[]).includes(part));
    const merged = [...custom, ...defaultSectionOrder.filter((part) => !custom.includes(part))];
    return merged.filter((part) => !mergedCardOnlySections.has(part));
  }, [settings.textOverrides?.details_parts_order]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ map: true, stats: true, charts: true, quick_actions: true });
  const toggleSection = (id: string) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const [priceData, setPriceData] = useState<number[]>([]);
  const [rawPropertyTypes, setRawPropertyTypes] = useState<Array<{ name: string; value: number }>>([]);
  const [operations, setOperations] = useState<Record<string, unknown>[]>([]);
  const [marketingRequests, setMarketingRequests] = useState<Record<string, unknown>[]>([]);
  const [selectedStatus] = useState<string>('ALL');
  const [selectedRange] = useState<string>('year');
  const [showTour, setShowTour] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [hasDataError, setHasDataError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const chartLabels = useMemo(() => {
    if (priceData.length === 0) return [];
    const today = new Date();
    return Array.from({ length: 12 }, (_, index) =>
      t(`chart.months.short.${new Date(today.getFullYear(), today.getMonth() - 11 + index, 1).getMonth() + 1}`)
    );
  }, [priceData.length, t]);

  const propertyTypes = useMemo(
    () =>
      rawPropertyTypes.map((item, index) => {
        const key = `property.type.${item.name.toLowerCase()}`;
        const translated = t(key);
        return {
          ...item,
          name: translated === key ? item.name : translated,
          color: ['bg-indigo-400', 'bg-slate-400', 'bg-gray-400', 'bg-primary dark:bg-slate-600'][index % 4],
        };
      }),
    [rawPropertyTypes, t]
  );

  const tourSteps = useMemo(() => buildTourSteps(t), [t]);

  useEffect(() => {
    if (shouldShowOnboarding(user)) {
      const timer = window.setTimeout(() => setShowTour(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, [user]);

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      if (!token) return;
      setIsDataLoading(true);
      setHasDataError(false);
      try {
        let startDateStr = '';
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

        const chartQuery = `${statusQuery}${rangeQuery}`.replace(/^&/, '');
        const statsQuery = statusQuery.substring(1);
        const results = await Promise.allSettled([
          api.get(`/financial/chart-data${chartQuery ? `?${chartQuery}` : ''}`, { signal }),
          api.get(`/properties/stats${statsQuery ? `?${statsQuery}` : ''}`, { signal }),
          api.get('/activities/me', { signal }),
          api.get('/marketing/email-marketing/public', { signal }),
        ]);
        if (signal.aborted) return;
        setHasDataError(results.some((result) => result.status === 'rejected'));
        const [priceRes, statsRes, opsRes, adsRes] = results.map((result) =>
          result.status === 'fulfilled' ? result.value : { data: undefined }
        );

        if (priceRes.data !== undefined) {
          try {
            setPriceData(dashboardSeries(priceRes.data));
          } catch { setPriceData([]); setHasDataError(true); }
        } else { setPriceData([]); }
        if (statsRes.data !== undefined) {
          try {
            setRawPropertyTypes(dashboardPropertyTypes(statsRes.data));
          } catch { setRawPropertyTypes([]); setHasDataError(true); }
        } else { setRawPropertyTypes([]); }

        const normalizeList = (payload: unknown): Record<string, unknown>[] => {
          if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
          const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
          if (Array.isArray(record?.data)) return record.data.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
          if (Array.isArray(record?.items)) return record.items.filter(item => item && typeof item === 'object') as Record<string, unknown>[];
          return [];
        };

        if (opsRes.data !== undefined) setOperations(normalizeList(opsRes.data));
        if (adsRes.data !== undefined) setMarketingRequests(normalizeList(adsRes.data));
      } catch (error) {
        if (signal.aborted) return;
        setHasDataError(true);
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (!signal.aborted) setIsDataLoading(false);
      }
    },
    [token, selectedStatus, selectedRange]
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData, reloadKey]);

  const savedPalette = useMemo(() => {
    let raw: Record<string, unknown> = {};
    try { const value: unknown = JSON.parse(settings.textOverrides[DETAILS_DESIGN_KEY] || '{}'); if (value && typeof value === 'object' && !Array.isArray(value)) raw = value as Record<string, unknown>; } catch {}
    const palette: Record<string, string> = {};
    const prefix = settings.isDark ? 'dark' : 'light';
    for (const [key, css] of [['Background', '--background'], ['Surface', '--card'], ['Text', '--foreground']] as const) {
      const value = raw[`${prefix}${key}`];
      if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) palette[css] = value;
    }
    if (palette['--foreground']) palette['--navy-primary'] = palette['--card-foreground'] = palette['--foreground'];
    return palette as CSSProperties;
  }, [settings.isDark, settings.textOverrides]);

  if (settingsLoading) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.content} role="status" aria-label={t('details.scene.loading')}>
          <div className="h-10 w-64 rounded bg-muted" />
          <div className="mt-8 h-64 rounded-xl bg-muted motion-safe:animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('common.details') || 'التفاصيل'} message={message} isAdmin={isAdmin} />;
  }

  const sectionCards: Record<string, { id: string; title: string; icon: React.ElementType; content: React.ReactNode }> = {
    map: {
      id: 'map',
      title: design.enable3d && detailsPartStatus('map') === 'enabled' && settings.sectionFlags.scan_map !== 'closed'
        ? (language === 'ar' ? 'الخريطة ثلاثية الأبعاد' : '3D neighborhood map') : t('details.map.title'),
      icon: MapIcon,
      content:
        detailsPartStatus('map') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.map.title')} message={settings.detailsPartMessages?.map} />
        ) : settings.sectionFlags.scan_map === 'hidden' ? null : settings.sectionFlags.scan_map === 'closed' ? (
          <ComingSoonInline sectionName={t('details.map.title')} message={settings.sectionMessages.scan_map} />
        ) : (
          <DetailsNeighborhood showTitle={false} />
        ),
    },
    stats: {
      id: 'stats',
      title: t('details.stats.title'),
      icon: BarChart3,
      content:
        detailsPartStatus('stats') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.stats.title')} message={settings.detailsPartMessages?.stats} />
        ) : settings.sectionFlags.financial === 'hidden' ? null : settings.sectionFlags.financial === 'closed' ? (
          <ComingSoonInline sectionName={t('details.stats.title')} message={settings.sectionMessages.financial} />
        ) : (
          <PropertyInfoCards
            id="tour-target-stats"
            operations={operations}
            marketingRequests={marketingRequests}
            userRole={user?.role}
            variant="details"
          />
        ),
    },
    charts: {
      id: 'charts',
      title: t('details.charts.title'),
      icon: PieChart,
      content:
        detailsPartStatus('charts') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.charts.title')} message={settings.detailsPartMessages?.charts} />
        ) : settings.sectionFlags.financial === 'hidden' && user?.role !== 'admin' ? null : settings.sectionFlags.financial === 'closed' && user?.role !== 'admin' ? (
          <ComingSoonInline sectionName={t('details.charts.title')} message={settings.sectionMessages.financial} />
        ) : (
          <div className={studio.charts}>
            <div><PriceTrendChart data={priceData} labels={chartLabels} /></div>
            <div><PropertyDistributionChart data={propertyTypes} /></div>
          </div>
        ),
    },
    ads: {
      id: 'ads',
      title: language === 'ar' ? 'الإعلانات' : 'Ads',
      icon: Megaphone,
      content:
        detailsPartStatus('ads') === 'soon' ? (
          <ComingSoonInline sectionName={language === 'ar' ? 'الإعلانات' : 'Ads'} message={settings.detailsPartMessages?.ads} />
        ) : marketingRequests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {marketingRequests.slice(0, 6).map((request: Record<string, unknown>, index: number) => {
              const isOffer = request.category === 'offers';
              const priceVal = request.price ? Number(request.price) : 0;
              const areaVal = request.area ? Number(request.area) : 0;
              const mediaFiles = Array.isArray(request.mediaFiles) ? (request.mediaFiles as string[]) : [];
              const imageUrl = mediaFiles.length > 0 ? mediaFiles[0] : null;

              return (
                <div
                  key={(request.id as string) || index}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:border-[var(--gold-accent)]"
                >
                  {imageUrl && (
                    <div className="mb-4 h-40 w-full overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt={String(request.subject || request.title || '')} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate text-foreground">{String(request.title || request.subject || request.name || (language === 'ar' ? 'طلب إعلان' : 'Ad request'))}</p>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground shrink-0">
                      {String(request.dealType || (language === 'ar' ? 'عرض' : 'Offer'))}
                    </span>
                  </div>
                  {isOffer && (priceVal > 0 || areaVal > 0) && (
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
                      {priceVal > 0 && (
                        <span className="font-bold text-[var(--gold-accent)]">
                          <SaudiRiyalAmount amount={priceVal} locale={language === 'ar' ? 'ar-SA' : 'en-US'} />
                        </span>
                      )}
                      {areaVal > 0 && <span className="text-muted-foreground">{areaVal} {language === 'ar' ? 'م²' : 'm²'}</span>}
                    </div>
                  )}
                  <p className="mt-2 text-xs leading-5 text-muted-foreground line-clamp-2">
                    {String(request.description || request.content || request.message || '')}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm font-medium text-muted-foreground">
            {language === 'ar' ? 'لا توجد بيانات إعلانات حالياً' : 'No ads data available yet'}
          </div>
        ),
    },
    previous_logs: {
      id: 'previous_logs',
      title: language === 'ar' ? 'السجل السابق' : 'Previous logs',
      icon: History,
      content:
        detailsPartStatus('previous_logs') === 'soon' ? (
          <ComingSoonInline sectionName={language === 'ar' ? 'السجل السابق' : 'Previous logs'} message={settings.detailsPartMessages?.previous_logs} />
        ) : (
          <RecentActivity />
        ),
    },
    quick_actions: {
      id: 'quick_actions',
      title: t('details.quickActions.title'),
      icon: Zap,
      content:
        detailsPartStatus('quick_actions') === 'soon' ? (
          <ComingSoonInline sectionName={t('details.quickActions.title')} message={settings.detailsPartMessages?.quick_actions} />
        ) : (
          <QuickActions id="tour-target-quick-actions" variant="details" />
        ),
    },
  };

  const sectionStylesMap: Record<string, {
    iconColorKey: string;
    iconSizeKey: string;
    titleColorKey: string;
    titleSizeKey: string;
  }> = {
    map: { iconColorKey: 'mapIconColor', iconSizeKey: 'mapIconSize', titleColorKey: 'mapTitleColor', titleSizeKey: 'mapTitleSize' },
    stats: { iconColorKey: 'statsIconColor', iconSizeKey: 'statsIconSize', titleColorKey: 'statsTitleColor', titleSizeKey: 'statsTitleSize' },
    charts: { iconColorKey: 'chartsIconColor', iconSizeKey: 'chartsIconSize', titleColorKey: 'chartsTitleColor', titleSizeKey: 'chartsTitleSize' },
    ads: { iconColorKey: 'adsIconColor', iconSizeKey: 'adsIconSize', titleColorKey: 'adsTitleColor', titleSizeKey: 'adsTitleSize' },
    quick_actions: { iconColorKey: 'quickActionsIconColor', iconSizeKey: 'quickActionsIconSize', titleColorKey: 'quickActionsTitleColor', titleSizeKey: 'quickActionsTitleSize' },
    previous_logs: { iconColorKey: 'statsIconColor', iconSizeKey: 'statsIconSize', titleColorKey: 'statsTitleColor', titleSizeKey: 'statsTitleSize' },
  };

  // Keep section links and panels in the administrator’s configured order.
  const accordionSections = orderedSections.filter(id => sectionCards[id]?.content !== null && detailsPartStatus(id) !== 'hidden');
  const showMapDescription = design.enable3d && detailsPartStatus('map') === 'enabled' && settings.sectionFlags.scan_map !== 'closed';

  return (
    <>
      <DetailsStudioSurface
        className={`${styles.dashboard} ${studio.page}`}
        icons={design.showSectionIcons}
        style={savedPalette}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className={`${styles.content} ${studio.content}`}>
          <header className={studio.intro}>
            <svg className={studio.skyline} viewBox="0 0 220 60" fill="none" aria-hidden="true" focusable="false">
              <path className={studio.horizon} d="M2 54H218" />
              <defs>
                <g id="workspace-skyline">
                  <path pathLength="1" d="M4 54H18V35L33 29L48 35V54H60V21L78 13L96 21V54H108V10L127 3L146 10V54H157V30L174 23L191 30V54H216" />
                  <path pathLength="1" d="M33 29V54M78 13V54M64 28L76 23M64 36L76 31M64 44L76 39M127 3V54M132 15L141 18M132 24L141 27M132 33L141 36M132 42L141 45M174 23V54" />
                </g>
              </defs>
              <use href="#workspace-skyline" opacity=".3" />
              <use href="#workspace-skyline" className={studio.skylineTrace} />
            </svg>
            <h1 className={studio.title}>{language === 'ar' ? 'مساحة أعمالك العقارية' : 'Your property workspace'}</h1>
            {accordionSections.length > 0 && (
              <nav className={studio.jumps} aria-label={language === 'ar' ? 'أقسام مساحة العمل' : 'Workspace sections'}>
                {accordionSections.map((id, index) => {
                  const section = sectionCards[id];
                  const Icon = section.icon;
                  return (
                    <Button key={id} variant="ghost" className={studio.jump} asChild>
                      <a style={{ "--jump-index": index } as CSSProperties} href={`#workspace-section-${id}`} onClick={() => setExpandedSections(prev => ({ ...prev, [id]: true }))}>
                        <Icon size={16} aria-hidden="true" />
                        {section.title}
                      </a>
                    </Button>
                  );
                })}
              </nav>
            )}
          </header>
          <div className={`${styles.workspaceLayout} ${studio.workspace}`} data-workspace-layout>
          <div className={`${styles.workspaceMain} ${studio.workspaceMain}`}>
          <div id="details-workspace" className={`${styles.workspaceArrival} ${studio.arrival}`} tabIndex={-1} />

          {/* ================================================================
              2. Data Alert & Retry Banner
              ================================================================ */}
          <div className={hasDataError ? styles.retryRow : 'sr-only'}>
            <p role="status" className="text-sm font-medium text-muted-foreground">
              {isDataLoading
                ? language === 'ar'
                  ? 'جارٍ تحديث بيانات لوحة المعلومات…'
                  : 'Updating your dashboard…'
                : language === 'ar'
                ? 'لوحة معلوماتك العقارية'
                : 'Your property dashboard'}
            </p>
            {hasDataError && (
              <button
                type="button"
                disabled={isDataLoading || !token}
                onClick={() => setReloadKey((value) => value + 1)}
                className={styles.retryBtn}
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${isDataLoading ? 'animate-spin motion-reduce:animate-none' : ''}`}
                />
                {language === 'ar' ? 'تحديث البيانات' : 'Refresh data'}
              </button>
            )}
          </div>

          {hasDataError && (
            <p
              role="alert"
              className="mb-6 rounded-2xl border border-amber-600/30 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              {language === 'ar'
                ? 'تعذّر تحميل بعض البيانات. قد تكون المعلومات المعروضة غير مكتملة؛ استخدم زر تحديث البيانات للمحاولة مجددًا.'
                : 'Some data could not be loaded. The information shown may be incomplete; use Refresh data to try again.'}
            </p>
          )}

          <div className={`${styles.sectionsStack} ${studio.sectionGrid}`} aria-busy={isDataLoading}>
            {accordionSections.map((sectionId) => {
              const section = sectionCards[sectionId];
              if (!section || section.content === null || detailsPartStatus(sectionId as Parameters<typeof detailsPartStatus>[0]) === 'hidden') return null;

              const stylesConfig = sectionStylesMap[sectionId];
              const settingsRecord = settings as unknown as Record<string, unknown>;
              const customIconColor = stylesConfig ? (settingsRecord[stylesConfig.iconColorKey] as string | undefined) : undefined;
              const customIconSizeRaw = stylesConfig ? settingsRecord[stylesConfig.iconSizeKey] : undefined;
              const customIconSize = typeof customIconSizeRaw === 'string' ? parseFloat(customIconSizeRaw) : undefined;
              const customTitleColor = stylesConfig ? (settingsRecord[stylesConfig.titleColorKey] as string | undefined) : undefined;
              const customTitleSizeRaw = stylesConfig ? settingsRecord[stylesConfig.titleSizeKey] : undefined;
              const customTitleSize = typeof customTitleSizeRaw === 'string' ? parseFloat(customTitleSizeRaw) : undefined;

              const isExpanded = showTour || expandedSections[sectionId] !== false;
              const SectionIcon = section.icon;

              return (
                <motion.div
                  viewport={{ once: true, amount: 'some' }}
                  onViewportEnter={entry => entry?.target.setAttribute('data-arrived', 'true')}
                  key={section.id}
                  className={`${styles.sectionCard} ${studio.card}`}
                  data-home-section={sectionId}
                  id={`workspace-section-${sectionId}`}
                  tabIndex={-1}
                >
                  <button
                    type="button"
                    id={`section-btn-${sectionId}`}
                    aria-expanded={isExpanded}
                    aria-controls={`section-panel-${sectionId}`}
                    onClick={() => toggleSection(sectionId)}
                    className={`${styles.sectionHeaderBtn} ${studio.header}`}
                  >
                    <div className={styles.sectionHeaderMain}>
                      <div
                        data-details-heading-icon
                        className="p-2 rounded-xl bg-muted/60 border border-border text-foreground flex items-center justify-center"
                        style={{
                          color: resolveSurfaceColor(customIconColor, settings.isDark),
                          width: customIconSize ? `${customIconSize + 16}px` : undefined,
                          height: customIconSize ? `${customIconSize + 16}px` : undefined,
                        }}
                      >
                        <SectionIcon
                          style={{
                            color: resolveSurfaceColor(customIconColor, settings.isDark),
                            width: customIconSize ? `${customIconSize}px` : undefined,
                            height: customIconSize ? `${customIconSize}px` : undefined,
                          }}
                        />
                      </div>
                      <div className={studio.sectionHeading}>
                        <h2 className={styles.sectionTitle} style={{
                          color: resolveSurfaceColor(customTitleColor, settings.isDark),
                          fontSize: customTitleSize && customTitleSize !== 16 ? `${customTitleSize}px` : undefined,
                        }}>
                          {section.title}
                        </h2>
                        {sectionId === 'map' && showMapDescription && (
                          <p>{language === 'ar' ? 'تعرّف على المبنى والخدمات المحيطة به.' : 'Explore the building and its nearby amenities.'}</p>
                        )}
                      </div>
                    </div>

                    <div className={`${styles.sectionHeaderMeta} ${studio.headerMeta}`}>
                      <ChevronDown
                        className={`${styles.sectionChevron} ${isExpanded ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: "hidden" }}
                    inert={!isExpanded}
                    aria-hidden={!isExpanded}
                    id={`section-panel-${sectionId}`}
                    role="region"
                    aria-labelledby={`section-btn-${sectionId}`}
                  >
                    <div className={`${styles.sectionBody} ${studio.body}`}>
                    {isDataLoading && (sectionId === 'stats' || sectionId === 'charts') ? (
                      sectionId === 'stats' ? (
                        <div className={studio.statsLoading} aria-hidden="true">
                          <Skeleton className="h-12 rounded-lg motion-reduce:animate-none" />
                          <Skeleton className="h-12 rounded-lg motion-reduce:animate-none" />
                        </div>
                      ) : (
                        <div className="min-h-56 rounded-2xl border border-border bg-card p-6" aria-hidden="true">
                          <Skeleton className="h-5 w-36 motion-reduce:animate-none" />
                          <div className="mt-6 grid grid-cols-2 gap-4">
                            <Skeleton className="h-32 rounded-xl motion-reduce:animate-none" />
                            <Skeleton className="h-32 rounded-xl motion-reduce:animate-none" />
                          </div>
                        </div>
                      )
                    ) : (
                      section.content
                    )}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
          </div>

          </div>
        </div>
      </DetailsStudioSurface>

      {showTour && user && (
        <Tutorial
          steps={tourSteps}
          open={showTour}
          onComplete={() => {
            saveOnboardingStatus(user, 'completed');
            setShowTour(false);
          }}
          onSkip={() => {
            saveOnboardingStatus(user, 'skipped');
            setShowTour(false);
          }}
        />
      )}
    </>
  );
}
