'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText, Loader2, MoreHorizontal, Scale, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { legalServiceCopy } from '@/components/services/legal-service-copy';
import { LEGAL_SUBCATEGORIES, getServiceDisplayName, getServiceNamesForCategory } from '@/lib/service-catalog';
import styles from '../services-redesign.module.css';
import { servicePageAccess } from '@/lib/service-page-access';

const icons = { disputes: Scale, contracts: FileText, documentation: ShieldCheck, other: MoreHorizontal };
function LegalSelection() {
  const { language } = useLanguage();
  const { settings, isLoading } = useSettings();
  const { user, isLoading: authLoading } = useAuth();
  const search = useSearchParams();
  const ar = language === 'ar';
  const admin = user?.role === 'admin';
  const preview = search.get('preview') === '1';
  const section = settings.sectionFlags.services;
  const status = settings.moduleFlags.services_legal || 'enabled';
  const unavailable = servicePageAccess({ section, category: status, admin, preview }) !== 'enabled';
  const availableNames = getServiceNamesForCategory('legal', settings.customServices);
  const categories = LEGAL_SUBCATEGORIES.filter(category => availableNames.includes(category.title) && settings.moduleFlags[category.formKey] !== 'disabled');

  const Back = ar ? ArrowRight : ArrowLeft;
  const Forward = ar ? ArrowLeft : ArrowRight;
  const previewLabel = ar ? "معاينة كمسؤول" : "Admin preview";

  return (
    <section className={styles.page} dir={ar ? "rtl" : "ltr"} aria-labelledby="legal-page-title">
      <div className={styles.shell}>
        <Button asChild variant="ghost" className={styles.back}>
          <Link href="/services"><Back aria-hidden="true" />{ar ? "العودة للخدمات" : "Back to services"}</Link>
        </Button>
        {isLoading || authLoading ? (
          <p role="status" className={styles.loading}>
            <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
            {ar ? "جارٍ تحميل الخدمات…" : "Loading services…"}
          </p>
        ) : unavailable ? (
          <header className={styles.intro}>
            <h1 id="legal-page-title">{status === "soon"
              ? (ar ? "هذه الخدمة ستتوفر قريبًا" : "This service is coming soon")
              : (ar ? "هذه الخدمة غير متاحة حاليًا" : "This service is currently unavailable")}</h1>
            <p role="status">{(section !== "open" && !admin ? settings.sectionMessages.services : settings.moduleMessages.services_legal)
              || (ar ? "يمكنك العودة لاستعراض الخدمات المتاحة." : "Return to explore the available services.")}</p>
            {admin && status === "soon" && (
              <Button asChild variant="outline" className={styles.action}>
                <Link href="/services/legal?preview=1">{previewLabel}<Forward aria-hidden="true" /></Link>
              </Button>
            )}
          </header>
        ) : (
          <>
            <header className={styles.intro}>
              <h1 id="legal-page-title">{ar ? "الخدمات القانونية" : "Legal services"}</h1>
              <p>{ar ? "اختر نوع الخدمة القانونية لفتح النموذج المخصص." : "Choose a legal specialty to open its request form."}</p>
              {preview && admin && <p role="status">{ar ? "أنت في وضع معاينة المسؤول." : "You are viewing an admin preview."}</p>}
            </header>
            <section className={styles.directory} aria-labelledby="legal-directory">
              <h2 id="legal-directory">{ar ? "التخصصات القانونية" : "Legal specialties"}</h2>
              {categories.length > 0 ? (
                <ul className={styles.directoryList}>
                  {categories.map(category => {
                    const Icon = icons[category.id];
                    const soon = settings.moduleFlags[category.formKey] === "soon";
                    const configuredName = getServiceDisplayName("legal", category.title, settings.customServices);
                    const copy = legalServiceCopy[category.id];
                    const title = configuredName !== category.title || ar ? configuredName : copy.title;
                    const href = `/services/form?type=legal&category=${encodeURIComponent(category.id)}`;
                    return (
                      <li key={category.id}>
                        <span className={styles.icon}><Icon aria-hidden="true" /></span>
                        <div className={styles.categoryCopy}>
                          <h3>{title}</h3>
                          <p>{ar ? category.description : copy.description}</p>
                        </div>
                        <div className={styles.statusActions}>
                          {soon && <span className={styles.soon}>{ar ? "قريبًا" : "Soon"}</span>}
                          {(!soon || admin) && (
                            <Button asChild variant="outline" className={styles.action}>
                              <Link href={href + (admin && (preview || soon) ? "&preview=1" : "")}>
                                {soon ? previewLabel : ar ? "ابدأ الطلب" : "Start request"}
                                <Forward aria-hidden="true" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <p role="status">{ar ? "لا توجد خدمات قانونية متاحة حاليًا." : "No legal services are currently available."}</p>}
            </section>
          </>
        )}
      </div>
    </section>
  );
}

export default function LegalServiceSelectionPage() {
  return <Suspense fallback={<div className={styles.page} aria-busy="true" />}><LegalSelection /></Suspense>;
}
