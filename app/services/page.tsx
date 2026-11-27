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
import {
  getCustomServicesForCategory,
  getServiceDisplayName,
  getServiceNamesForCategory,
  LEGAL_SUBCATEGORIES,
  makeServiceItemFlagKey,
} from "@/lib/service-catalog";
import { legalServiceCopy } from "@/components/services/legal-service-copy";
import styles from "./services-redesign.module.css";

const baseCategories = [
  { id: "postPurchase", icon: ShoppingBag },
  { id: "legal", icon: Scale },
  { id: "construction", icon: Hammer },
  { id: "marketing", icon: Megaphone },
  { id: "other", icon: MoreHorizontal },
];

const englishServiceLabels: Record<string, string> = {
  "الغاز": "Gas",
  "نقل وتركيب الأثاث": "Furniture moving & installation",
  "التأمين على المنزل": "Home insurance",
  "الصيانة (سباكة / كهرباء)": "Maintenance (plumbing / electrical)",
  "خدمة التنظيف": "Cleaning service",
  "تنسيق حدائق": "Landscaping",
  "أنظمة أمنية": "Security systems",
  "مقاول عظم": "Structural contractor",
  "تصميم هندسي": "Engineering design",
  "تشطيبات": "Finishing",
  "كهرباء": "Electrical",
  "سباكة": "Plumbing",
  "نجارة": "Carpentry",
  "دهانات": "Painting",
  "ألمنيوم": "Aluminium",
  "إشراف هندسي": "Engineering supervision",
  "تصميم داخلي": "Interior design",
  "تصوير فوتوغرافي للعقار": "Property photography",
  "حملة إعلانية (وسائل التواصل الاجتماعي)": "Social media campaign",
  "حملة إعلانية (إعلانات طرق/تقليدية)": "Outdoor / traditional campaign",
  "التقييم العقاري": "Property valuation",
  "المسح الهندسي": "Engineering survey",
  "تمويل عقاري": "Property financing",
  "أخرى": "Other",
};

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

  const selectedBranches = (() => {
    if (!selected) return [];
    const categorySoon = selected.status === "soon";
    const categoryCustom = getCustomServicesForCategory(settings.customServices, selected.id);

    if (selected.id === "legal") {
      const availableNames = getServiceNamesForCategory("legal", settings.customServices);
      const legalItems = LEGAL_SUBCATEGORIES
        .filter((sub) => availableNames.includes(sub.title) && settings.moduleFlags[sub.formKey] !== "disabled")
        .map((sub) => {
          const configuredName = getServiceDisplayName("legal", sub.title, settings.customServices);
          const copy = legalServiceCopy[sub.id];
          const label = configuredName !== sub.title || ar ? configuredName : copy.title;
          const soon = categorySoon || settings.moduleFlags[sub.formKey] === "soon";
          const href = `/services/form?type=legal&category=${encodeURIComponent(sub.id)}${soon && isAdmin ? "&preview=1" : ""}`;
          return { key: sub.id, label, soon, href };
        });

      const knownTitles = new Set(LEGAL_SUBCATEGORIES.map((sub) => sub.title));
      const extraLegal = categoryCustom
        .filter((item) => !item.deleted && !knownTitles.has(item.name))
        .flatMap((item) => {
          const itemStatus = item.status || settings.moduleFlags[makeServiceItemFlagKey("legal", item.name)] || "enabled";
          if (itemStatus === "disabled") return [];
          const soon = categorySoon || itemStatus === "soon";
          const label = item.displayName || (ar ? item.name : englishServiceLabels[item.name] || item.name);
          const href = `/services/form?type=legal&category=other&service=${encodeURIComponent(item.name)}${soon && isAdmin ? "&preview=1" : ""}`;
          return [{ key: item.id, label, soon, href }];
        });

      return [...legalItems, ...extraLegal];
    }

    const names = getServiceNamesForCategory(selected.id, settings.customServices);
    return names.flatMap((name) => {
      const customItem = categoryCustom.find((item) => item.name === name);
      const flagStatus = settings.moduleFlags[makeServiceItemFlagKey(selected.id, name)];
      const itemStatus = customItem?.status || flagStatus || "enabled";
      if (itemStatus === "disabled") return [];
      const soon = categorySoon || itemStatus === "soon";
      const displayName = getServiceDisplayName(selected.id, name, settings.customServices);
      const label = !ar && displayName === name ? (englishServiceLabels[name] || displayName) : displayName;
      const href = `/services/form?type=${encodeURIComponent(selected.id)}&service=${encodeURIComponent(name)}${soon && isAdmin ? "&preview=1" : ""}`;
      return [{ key: `${selected.id}-${name}`, label, soon, href }];
    });
  })();

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
      {selected && (
        <div key={selected.id} className={styles.pageWatermark} aria-hidden="true">
          <selected.icon strokeWidth={1.1} />
        </div>
      )}
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
              {selectedBranches.length > 0 ? (
                <div key={`branches-${selected.id}`} className={styles.branchesPanel}>
                  <h3 className={styles.branchesHeading}>
                    {ar ? "الخدمات المتوفرة ضمن هذا القسم" : "Available services in this category"}
                  </h3>
                  <ul className={styles.branchesGrid}>
                    {selectedBranches.map((branch) => (
                      <li key={branch.key} className={styles.branchItem}>
                        {branch.soon && !isAdmin ? (
                          <span className={styles.branchDisabled}>
                            <span>{branch.label}</span>
                            <span className={styles.branchSoonBadge}>{ar ? "قريبًا" : "Soon"}</span>
                          </span>
                        ) : (
                          <Link href={branch.href} className={styles.branchLink}>
                            <span>{branch.label}</span>
                            <span className={styles.branchMeta}>
                              {branch.soon && <span className={styles.branchSoonBadge}>{ar ? "قريبًا" : "Soon"}</span>}
                              <Forward aria-hidden="true" className={styles.branchArrow} />
                            </span>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className={styles.branchesEmpty} role="status">
                  {ar ? "لا توجد خدمات فرعية متاحة في هذا القسم حاليًا." : "No branch services are currently available in this category."}
                </p>
              )}
            </div>
          </>}
        </div>
      </div>
    </section>
  );
}
