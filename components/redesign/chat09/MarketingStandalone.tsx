"use client";

import React, { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Megaphone, ClipboardList,
  Sparkles, ChevronLeft, Briefcase
} from 'lucide-react';

import MobileAppHeader from '@/app/src/components/MobileAppHeader';
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from '@/components/ui/mobile-tabs';
import { TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import { useSectionGuard } from '@/hooks/useSectionGuard';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

// Preserved modular sections (consumed read-only)
import PhotographyFlow from '@/components/marketing/PhotographyFlow';
import AdsPromotionSection from '@/components/marketing/AdsPromotionSection';
import WorkflowSection from '@/components/marketing/WorkflowSection';
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';

import {
  MarketingTab,
  isValidMarketingTab,
  canUserAccessMarketing
} from '@/lib/redesign-chat09-financial-marketing';

import styles from './marketing-standalone.module.css';

interface MarketingStandaloneProps {
  embedded?: boolean;
}

export default function MarketingStandalone({
  embedded = false
}: MarketingStandaloneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [, startTransition] = useTransition();

  const tabParam = searchParams?.get('tab');
  const initialActive = isValidMarketingTab(tabParam) ? tabParam : 'advertising';

  const [activeTab, setActiveTab] = useState<MarketingTab>(initialActive);
  const { isOpen, message, isAdmin } = useSectionGuard('marketing');

  // Verify authorization
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (!canUserAccessMarketing(user)) {
          router.push('/');
        }
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // Handle tab change with deep linking support
  const handleTabChange = useCallback((newTab: string) => {
    if (isValidMarketingTab(newTab)) {
      setActiveTab(newTab);
      if (!embedded && typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tab', newTab);
        startTransition(() => {
          window.history.replaceState(null, '', currentUrl.toString());
        });
      }
    }
  }, [embedded]);

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t('action.marketing') || (isRtl ? 'التسويق' : 'Marketing')}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div
      className={styles.marketingRoot}
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="chat09-marketing-standalone"
    >
      {!embedded && (
        <MobileAppHeader
          theme="light"
          title={t('action.marketing') || (isRtl ? 'التسويق' : 'Marketing')}
        />
      )}

      {/* Architectural Hero Header */}
      {!embedded && (
        <section className={styles.heroBanner}>
          <div className={styles.heroArtworkWrapper}>
            <Image
              src="/artworks/chat09-marketing-terrace.webp"
              alt="Marketing Terrace Pavilion"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-3">
                <div className={styles.heroBadge}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('marketing.header.badge') || (isRtl ? 'مركز التسويق والترويج' : 'Marketing & Promotion Hub')}</span>
                </div>
                <h1 className={styles.heroTitle}>
                  {t('marketing.title') || (isRtl ? 'إدارة الحملات والتسويق العقاري' : 'Marketing & Campaign Hub')}
                </h1>
                <p className={styles.heroSubtitle}>
                  {t('marketing.header.desc') ||
                    (isRtl
                      ? 'إطلاق الحملات الإعلانية وجلسات التصوير الاحترافي وإدارة طلبات الترويج بكفاءة.'
                      : 'Launch advertising campaigns, schedule professional photography, and manage promotion requests.')}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Body with Tabs */}
      <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'}>
        <SegmentedTabs value={activeTab} onValueChange={handleTabChange} className={styles.tabsContainer}>
          <div className={styles.tabsScroll}>
            <SegmentedList className={styles.tabsList}>
              <SegmentedTrigger value="advertising" className={styles.tabTrigger}>
                <Megaphone className="w-4 h-4" />
                <span>{t('marketing.tab.ads') || (isRtl ? 'الحملات الإعلانية' : 'Ad Campaigns')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="photography" className={styles.tabTrigger}>
                <Camera className="w-4 h-4" />
                <span>{t('marketing.tab.photography') || (isRtl ? 'التصوير الاحترافي' : 'Photography')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="requests" className={styles.tabTrigger}>
                <ClipboardList className="w-4 h-4" />
                <span>{t('marketing.tab.requests') || (isRtl ? 'متابعة الطلبات' : 'My Requests')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="general_requests" className={styles.tabTrigger}>
                <Briefcase className="w-4 h-4" />
                <span>{t('marketing.tab.general_requests') || (isRtl ? 'الطلبات العامة' : 'General Requests')}</span>
              </SegmentedTrigger>
            </SegmentedList>
          </div>

          <div className="mt-6 sm:mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TabsContent value="advertising" className="m-0 focus-visible:outline-none">
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <AdsPromotionSection />
                  </Suspense>
                </TabsContent>

                <TabsContent value="photography" className="m-0 focus-visible:outline-none">
                  <PhotographyFlow />
                </TabsContent>

                <TabsContent value="requests" className="m-0 focus-visible:outline-none">
                  <WorkflowSection />
                </TabsContent>

                <TabsContent value="general_requests" className="m-0 focus-visible:outline-none">
                  <ServiceRequestsTable
                    title={t('marketing.tab.general_requests') || (isRtl ? 'الطلبات العامة للقسم' : 'Department General Requests')}
                    subtitle={t('marketing.history.desc') || (isRtl ? 'سجل الطلبات والمهام التسويقية المشتركة' : 'Marketing requests and shared tasks')}
                    department="marketing"
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </SegmentedTabs>
      </div>

      {!embedded && (
        <button
          type="button"
          onClick={() => router.push('/details')}
          aria-label={isRtl ? 'الرجوع إلى التفاصيل' : 'Back to details'}
          className={styles.floatingBackBtn}
        >
          <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
