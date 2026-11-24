"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Hammer, Loader2, Megaphone, MoreHorizontal, Scale, ShoppingBag, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import ServiceNetwork from "@/components/services/ServiceNetwork";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { requestTrackingHref } from "@/lib/auth-navigation";
import styles from "./services-redesign.module.css";

const baseCategories = [
  { id: "postPurchase", icon: ShoppingBag },
  { id: "legal", icon: Scale },
  { id: "construction", icon: Hammer },
  { id: "marketing", icon: Megaphone },
  { id: "other", icon: MoreHorizontal },
];

export default function Services() {
  const { t, language } = useLanguage();
  const ar = language === "ar";
  const { isOpen, message, isAdmin } = useSectionGuard("services");
  const { settings, isLoading } = useSettings();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [selectedId, setSelectedId] = useState("postPurchase");
  const Forward = ar ? ArrowLeft : ArrowRight;
  const Back = ar ? ArrowRight : ArrowLeft;

  const categories = [
    ...baseCategories.map(category => ({
      ...category,
      title: t(`services.${category.id}`),
      description: t(`services.${category.id}.description`),
      status: settings.moduleFlags[`services_${category.id}`],
    })),
    ...settings.customCategories.map(category => ({
      ...category,
      icon: Sparkles,
      status: category.status === "soon" || category.status === "disabled"
        ? category.status : settings.moduleFlags[`services_${category.id}`],
    })),
  ].filter(category => category.status !== "disabled").map(category => {
    const href = category.id === "legal" ? "/services/legal" : `/services/form?type=${encodeURIComponent(category.id)}`;
    return { ...category, href, previewHref: `${href}${href.includes("?") ? "&" : "?"}preview=1` };
  });
  const selected = categories.find(category => category.id === selectedId) || categories[0];

  const renderAction = (category: typeof categories[number], prominent = false) => {
    const soon = category.status === "soon";
    const soonLabel = <span className={styles.soon}>{ar ? "قريبًا" : "Soon"}</span>;
    if (soon && !isAdmin) return soonLabel;
    const action = (
      <Button asChild variant={prominent ? "default" : "outline"} className={styles.action}>
        <Link href={soon ? category.previewHref : category.href}>
          {soon ? t("services.adminPreview") : category.id === "legal"
            ? (ar ? "اختر التخصص" : "Choose a specialty")
            : (ar ? "ابدأ الطلب" : "Start request")}
          <Forward aria-hidden="true" />
        </Link>
      </Button>
    );
    return soon ? <div className={styles.statusActions}>{soonLabel}{action}</div> : action;
  };

  if (isLoading || isAuthLoading) {
    return <section className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.shell}>
        <p className={styles.loading} role="status"><Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          {ar ? "جارٍ تحميل الخدمات…" : "Loading services…"}</p>
      </div>
    </section>;
  }

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t("footer.services")} message={message} isAdmin={isAdmin} />;
  }

  return (
    <section className={styles.page} dir={ar ? "rtl" : "ltr"} aria-labelledby="services-page-title">
      <div className={styles.shell}>
        <Button asChild variant="ghost" className={styles.back}>
          <Link href="/details"><Back aria-hidden="true" />{t("common.back")}</Link>
        </Button>

        <div className={styles.hero}>
          <div className={styles.intro}>
            <h1 id="services-page-title">{t("services.title")}</h1>
            <p>{t("services.intro")}</p>
            <nav className={styles.links} aria-label={t("services.linksLabel")}>
              <Button asChild variant="outline" className={styles.action}>
                <Link href={requestTrackingHref(user)} aria-label={t("services.myRequestsAria")}>
                  {t("services.myRequests")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className={styles.action}>
                <Link href="/service-providers" aria-label={t("services.providerPortalAria")}>
                  {t("services.providerPortal")}
                </Link>
              </Button>
            </nav>
          </div>
          {selected && <>
            <ServiceNetwork categories={categories} selectedId={selected.id}
              onSelect={setSelectedId} label={ar ? "اختر فئة من شبكة الخدمات" : "Choose a category from the service network"} />
            <div className={styles.selection} id="selected-service">
              <div aria-live="polite">
                <div key={selected.id} className={styles.selectionCopy}>
                  <h2>{selected.title}</h2>
                  {selected.description && <p>{selected.description}</p>}
                </div>
              </div>
              {renderAction(selected, true)}
            </div>
          </>}
        </div>

        <section className={styles.directory} aria-labelledby="service-directory">
          <h2 id="service-directory">{ar ? "دليل الخدمات التخصصية" : "Specialized services"}</h2>
          {categories.length ? (
            <ul className={styles.directoryList}>
              {categories.map(category => (
                <li key={category.id}>
                  <span className={styles.icon}><category.icon aria-hidden="true" /></span>
                  <div className={styles.categoryCopy}>
                    <h3>{category.title}</h3>
                    {category.description && <p>{category.description}</p>}
                  </div>
                  {renderAction(category)}
                </li>
              ))}
            </ul>
          ) : <p role="status">{ar ? "لا توجد خدمات متاحة حاليًا." : "No services are currently available."}</p>}
        </section>
      </div>
    </section>
  );
}
