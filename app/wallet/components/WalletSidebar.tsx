"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import styles from '../wallet-redesign.module.css';

const tabs = [
  { id: 'invoices', flag: 'wallet_invoices', icon: '/icons/الفواتير.png', label: 'wallet.invoices', fallback: 'الفواتير' },
  { id: 'commission', flag: 'wallet_commissions', icon: '/icons/العمولات.png', label: 'wallet.commission', fallback: 'العمولات' },
  { id: 'files', flag: 'wallet_files', icon: '/icons/الملفات والمستندات.png', label: 'wallet.files', fallback: 'الملفات' },
  { id: 'invest', flag: 'wallet_investments', icon: '/icons/الاستثمارات.png', label: 'wallet.invest', fallback: 'الاستثمارات' },
] as const;

export default function WalletTabs() {
  const { t } = useLanguage();
  const { settings } = useSettings();
  const visibleTabs = tabs.filter(({ flag }) => settings.moduleFlags[flag] !== 'disabled');

  return (
    <header className={styles.tabHeader}>
      <div className={styles.tabHeading}>
        <h1>{t('wallet.wallet') || 'المحفظة'}</h1>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('wallet.backToHome') || 'العودة للرئيسية'}
        </Link>
      </div>
      {visibleTabs.length > 0 && (
        <TabsList className={styles.tabList} aria-label={t('wallet.sidebar.mainMenu') || 'قائمة المحفظة'}>
          {visibleTabs.map(({ id, flag, icon, label, fallback }) => {
            const isSoon = settings.moduleFlags[flag] === 'soon';
            return (
              <TabsTrigger key={id} value={id} className={styles.tabTrigger} disabled={isSoon}>
                <span aria-hidden="true" className={styles.tabIcon} style={{ maskImage: `url("${icon}")` }} />
                <span>{t(label) || fallback}</span>
                {isSoon && <small>{t('common.soon') || 'قريباً'}</small>}
              </TabsTrigger>
            );
          })}
        </TabsList>
      )}
    </header>
  );
}
