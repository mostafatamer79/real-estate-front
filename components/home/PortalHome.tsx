"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { opinionApi } from "@/lib/api";
import { loginHref, requestTrackingHref, safeReturnTo } from "@/lib/auth-navigation";
import { validateOpinionForm } from "@/lib/redesign-chat11-content";
import BuildingIntro from "./BuildingIntro";
import "./portal-home.css";

type ViewMode = "intro" | "home";
type FeatureNodeId = "offers" | "services" | "internal" | "requests";

interface FeatureNode {
  id: FeatureNodeId;
  num: string;
  labelAr: string;
  labelEn: string;
  shortAr: string;
  shortEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionAr: string;
  actionEn: string;
  href: string;
  requiresAuth: boolean;
}

const FEATURE_NODES: FeatureNode[] = [
  {
    id: "offers",
    num: "01",
    labelAr: "اكتشف العقارات",
    labelEn: "Explore Properties",
    shortAr: "ابحث، قارن، واقترب",
    shortEn: "Search, compare, explore",
    titleAr: "اكتشف العقارات",
    titleEn: "Explore Properties",
    descriptionAr:
      "ابحث في العروض بحسب المدينة والحي والنوع والمساحة والسعر، وافتح الصور والموقع والمواصفات المتاحة.",
    descriptionEn:
      "Search property offers by city, district, type, area, and price, and view photos, locations, and full specifications.",
    actionAr: "استكشف العروض",
    actionEn: "Explore Offers",
    href: "/offers",
    requiresAuth: false,
  },
  {
    id: "services",
    num: "02",
    labelAr: "اطلب خدمة",
    labelEn: "Request a Service",
    shortAr: "من الاختيار إلى المتابعة",
    shortEn: "From selection to tracking",
    titleAr: "اطلب الخدمة المناسبة",
    titleEn: "Request the Right Service",
    descriptionAr:
      "اختر الخدمة، راجع متطلباتها، ثم أرسل بيانات طلبك ومرفقاته وتابع حالته من حسابك.",
    descriptionEn:
      "Select a service, review its requirements, submit your details and attachments, and track its status from your account.",
    actionAr: "استعرض الخدمات",
    actionEn: "Browse Services",
    href: "/services",
    requiresAuth: false,
  },
  {
    id: "internal",
    num: "03",
    labelAr: "نظّم أعمالك",
    labelEn: "Organize Operations",
    shortAr: "أملاكك وتفاصيلها",
    shortEn: "Properties & details",
    titleAr: "نظّم أعمالك العقارية",
    titleEn: "Organize Your Operations",
    descriptionAr:
      "مساحة عمل للفريق لإدارة العقارات والوحدات والمستأجرين والعقود والمدفوعات والصيانة، بحسب صلاحيات الحساب.",
    descriptionEn:
      "A team workspace for managing properties, units, tenants, contracts, payments, and maintenance based on account permissions.",
    actionAr: "افتح مساحة العمل",
    actionEn: "Open Workspace",
    href: "/internal",
    requiresAuth: true,
  },
  {
    id: "requests",
    num: "04",
    labelAr: "تابع طلباتك",
    labelEn: "Track Your Requests",
    shortAr: "خطوات واضحة في حسابك",
    shortEn: "Clear steps in your account",
    titleAr: "تابع التفاصيل من حسابك",
    titleEn: "Track Details in Your Account",
    descriptionAr:
      "راجع طلباتك ومحادثاتك وإشعاراتك، وتابع الملفات والفواتير المرتبطة بخدماتك.",
    descriptionEn:
      "Review your requests, conversations, and notifications, and follow files and invoices linked to your services.",
    actionAr: "افتح الطلبات",
    actionEn: "Open Requests",
    href: "/orders",
    requiresAuth: true,
  },
];

const BASE_SERVICE_IDS = [
  "postPurchase",
  "legal",
  "construction",
  "marketing",
  "other",
] as const;

const ABOUT_CAPABILITIES = [
  {
    titleAr: "المحفظة والمالية",
    titleEn: "Wallet & Financials",
    textAr:
      "تبدأ الدورة بضبط التعاملات؛ حيث تغطي المحفظة الفواتير، والعمولات، والملفات، والاستثمارات، مما يتيح للمستفيدين تتبع الحركة المالية والتدفقات النقدية بدقة ووضوح.",
    textEn:
      "The transaction lifecycle begins with verified financial governance: invoices, commissions, escrow documents, and property investments, enabling transparent cash flow tracking.",
    pointsAr: ["فواتير", "عمولات", "مستندات", "استثمارات"],
    pointsEn: ["Invoices", "Commissions", "Documents", "Investments"],
  },
  {
    titleAr: "منظومة الخدمات العقارية",
    titleEn: "Professional Real Estate Services",
    textAr:
      "توفر المنصة للمستفيدين منظومة متكاملة تشمل خدمات ما بعد الشراء، والخدمات القانونية، والبناء والمقاولات، وخدمات التسويق، وغيرها، مع إتاحة تسعير مستقل ومحدد لكل خدمة.",
    textEn:
      "Comprehensive professional service ecosystem encompassing post-purchase assistance, legal consulting, contracting and construction, and verified marketing with independent pricing per service.",
    pointsAr: [
      "خدمات ما بعد الشراء",
      "الخدمات القانونية",
      "البناء والمقاولات",
      "خدمات التسويق",
      "أخرى",
    ],
    pointsEn: ["After-sales", "Legal services", "Construction", "Marketing", "Other"],
  },
  {
    titleAr: "إدارة وطرح العروض",
    titleEn: "Property Offers & Listings",
    textAr:
      "وفي الجانب العقاري التفاعلي، يتيح النظام للمستفيدين طرح عروضهم العقارية لتجمعها المنصة وتيسر إدارتها في مسار موحد، يسهل من خلاله متابعة حالة العرض، والتواصل اللحظي، وحفظ الملفات المرتبطة به.",
    textEn:
      "An interactive property marketplace enabling users to publish, manage, and track real estate offers within a unified pipeline with instant communication and verified records.",
    pointsAr: ["إضافة عروض", "إدارة العروض", "ملاحظات وتعديل", "تواصل مرن ولحظي"],
    pointsEn: ["Create offers", "Offer management", "Notes & revisions", "Real-time chat"],
  },
  {
    titleAr: "طلبات الشراء والاستئجار",
    titleEn: "Property Requests & Inquiries",
    textAr:
      "تمكن المنصة المستفيدين من تقديم طلباتهم العقارية بدقة، لتتولى المنصة فلترتها ومطابقتها ذكياً مع العروض المتاحة، تسريعاً لعملية التنفيذ وإتمام الصفقات.",
    textEn:
      "Targeted property requisition system that accurately captures buyer/renter requirements, intelligently matching them against verified listings for faster transaction closing.",
    pointsAr: ["إضافة طلبات", "متابعة حالة الطلب", "مطابقة ذكية", "أرشيف الطلبات"],
    pointsEn: ["Submit requests", "Status tracking", "Smart matching", "Request archive"],
  },
];

const INTRO_SEEN_KEY = "db-intro-seen";
const SECTION_HASHES = new Set([
  "portal",
  "platform",
  "service-door",
  "about",
  "feedback",
  "contact",
]);

export default function PortalHome() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { settings } = useSettings();
  const isAr = language === "ar";
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState<ViewMode | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<FeatureNodeId>("offers");
  const [doorOpen, setDoorOpen] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);

  // Feedback form state (wired to opinionApi)
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const mainRef = useRef<HTMLElement | null>(null);
  const portalRef = useRef<HTMLElement | null>(null);
  const portalCopyRef = useRef<HTMLDivElement | null>(null);
  const portalBottomRef = useRef<HTMLDivElement | null>(null);
  const portalInsideRef = useRef<HTMLDivElement | null>(null);
  const serviceCatsRef = useRef<HTMLDivElement | null>(null);
  const supportDialogRef = useRef<HTMLDialogElement | null>(null);
  const lastFocusedBeforeDialogRef = useRef<HTMLElement | null>(null);

  // Determine initial stage (Intro vs Home) without flashing 3D on back-navigation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashId = window.location.hash.replace(/^#/, "").split("/")[0];

    if (params.get("intro") === "1" || hashId === "intro") {
      setView("intro");
      return;
    }

    if (params.get("view") === "home" || SECTION_HASHES.has(hashId)) {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      setView("home");
      if (SECTION_HASHES.has(hashId)) {
        requestAnimationFrame(() => {
          document.getElementById(hashId)?.scrollIntoView({ behavior: "auto" });
        });
      }
      return;
    }

    const seen = sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
    setView(seen ? "home" : "intro");
  }, []);

  const enterHome = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // ignore storage failure
    }
    setMobileMenuOpen(false);
    setView("home");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      mainRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const replayIntro = useCallback(() => {
    try {
      sessionStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      // ignore storage failure
    }
    setMobileMenuOpen(false);
    setView("intro");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    });
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      setMobileMenuOpen(false);
      if (view !== "home") {
        try {
          sessionStorage.setItem(INTRO_SEEN_KEY, "1");
        } catch {
          // ignore
        }
        setView("home");
        requestAnimationFrame(() => {
          const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
        });
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    },
    [view],
  );

  // Bidirectional scroll-driven circular stone portal animation
  useEffect(() => {
    if (view !== "home") return;
    const portal = portalRef.current;
    if (!portal) return;

    const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let currentProgress = 0;
    let lastTime = 0;

    const renderPortal = (now: number) => {
      rafId = 0;
      if (document.hidden) return;

      const rect = portal.getBoundingClientRect();
      const targetProgress = Math.max(
        0,
        Math.min(1, -rect.top / Math.max(1, portal.offsetHeight - window.innerHeight)),
      );
      const dt = Math.min(64, now - (lastTime || now - 16));
      lastTime = now;

      currentProgress = reduceMedia.matches
        ? 0
        : currentProgress + (targetProgress - currentProgress) * (1 - Math.exp(-dt / 100));

      const open = Math.max(0, Math.min(1, currentProgress / 0.8));
      const fade = 1 - Math.max(0, Math.min(1, (currentProgress - 0.04) / 0.25));
      const inside = Math.max(0, Math.min(1, (currentProgress - 0.38) / 0.22));

      portal.style.setProperty("--open", String(open));
      portal.style.setProperty("--fade", String(fade));
      portal.style.setProperty("--inside", String(inside));

      if (portalCopyRef.current) portalCopyRef.current.inert = fade < 0.1;
      if (portalBottomRef.current) portalBottomRef.current.inert = fade < 0.1;
      if (portalInsideRef.current) {
        portalInsideRef.current.inert = inside < 0.7;
        portalInsideRef.current.style.visibility = inside > 0.01 ? "visible" : "hidden";
      }

      if (Math.abs(targetProgress - currentProgress) > 0.0002 && !reduceMedia.matches) {
        rafId = window.requestAnimationFrame(renderPortal);
      }
    };

    const requestPortalFrame = () => {
      if (!document.hidden && !rafId) {
        rafId = window.requestAnimationFrame(renderPortal);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else {
        requestPortalFrame();
      }
    };

    window.addEventListener("scroll", requestPortalFrame, { passive: true });
    window.addEventListener("resize", requestPortalFrame);
    reduceMedia.addEventListener("change", requestPortalFrame);
    document.addEventListener("visibilitychange", onVisibilityChange);
    requestPortalFrame();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestPortalFrame);
      window.removeEventListener("resize", requestPortalFrame);
      reduceMedia.removeEventListener("change", requestPortalFrame);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [view]);

  // Auth-aware link resolution
  const resolvePlatformHref = useCallback(
    (target: string, requiresAuth = true) => {
      if (!requiresAuth) return target;
      const safeTarget = safeReturnTo(target) || "/details";
      return isAuthenticated ? safeTarget : loginHref(safeTarget);
    },
    [isAuthenticated],
  );

  const handleAuthAwareNav = useCallback(
    (target: string, requiresAuth: boolean, event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!requiresAuth || !authLoading) return;
      const hasToken = typeof window !== "undefined" && Boolean(localStorage.getItem("token"));
      if (hasToken !== isAuthenticated) {
        event.preventDefault();
        const safeTarget = safeReturnTo(target) || "/details";
        router.push(hasToken ? safeTarget : loginHref(safeTarget));
      }
    },
    [authLoading, isAuthenticated, router],
  );

  // Real service catalog from settings + translations
  const realServices = useMemo(() => {
    const base = BASE_SERVICE_IDS.map((id) => ({
      id,
      title: t(`services.${id}`),
      description: t(`services.${id}.description`),
      status: settings.moduleFlags[`services_${id}`],
    }));

    const custom = (settings.customCategories || []).map((cat) => ({
      id: cat.id,
      title: cat.title,
      description: cat.description,
      status:
        cat.status === "soon" || cat.status === "disabled"
          ? cat.status
          : settings.moduleFlags[`services_${cat.id}`],
    }));

    return [...base, ...custom]
      .filter((cat) => cat.status !== "disabled")
      .map((cat) => {
        const href =
          cat.id === "legal"
            ? "/services/legal"
            : `/services/form?type=${encodeURIComponent(cat.id)}`;
        const previewHref = `${href}${href.includes("?") ? "&" : "?"}preview=1`;
        return { ...cat, href, previewHref };
      });
  }, [settings.customCategories, settings.moduleFlags, t]);

  const activeService = realServices[selectedServiceIndex] || realServices[0];

  const openDoorAndFocus = () => {
    setDoorOpen(true);
    requestAnimationFrame(() => {
      const firstBtn = serviceCatsRef.current?.querySelector("button");
      firstBtn?.focus({ preventScroll: true });
    });
  };

  // Support dialog controls
  const openSupportDialog = () => {
    setMobileMenuOpen(false);
    lastFocusedBeforeDialogRef.current = document.activeElement as HTMLElement | null;
    const dialog = supportDialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("button, a")?.focus();
    }
  };

  const closeSupportDialog = () => {
    const dialog = supportDialogRef.current;
    if (dialog?.open) {
      dialog.close();
      if (lastFocusedBeforeDialogRef.current?.isConnected) {
        lastFocusedBeforeDialogRef.current.focus();
      }
    }
  };

  // Real feedback submission via opinionApi
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackStatus(null);

    const validation = validateOpinionForm(
      {
        name: feedbackName.trim() || (isAr ? "زائر المنصة" : "Platform Visitor"),
        email: feedbackEmail,
        message: feedbackMessage,
      },
      isAr ? "ar" : "en",
    );

    if (!validation.isValid) {
      const firstErr =
        validation.errors.message ||
        validation.errors.email ||
        validation.errors.name ||
        (isAr
          ? "اكتب ملاحظة من خمسة أحرف على الأقل لتوضيح رأيك."
          : "Please write at least 5 characters.");
      setFeedbackError(firstErr);
      return;
    }

    setFeedbackSubmitting(true);
    try {
      await opinionApi.create({
        name: feedbackName.trim() || (isAr ? "زائر المنصة" : "Platform Visitor"),
        email: feedbackEmail.trim() || undefined,
        message: feedbackMessage.trim(),
      });
      const okMsg = isAr
        ? "شكرًا لك! تم إرسال رأيك بنجاح إلى فريق الوساطة الرقمية."
        : "Thank you! Your feedback has been submitted successfully.";
      setFeedbackStatus(okMsg);
      toast.success(okMsg);
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackMessage("");
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : isAr
            ? "تعذر إرسال رأيك حاليًا، يرجى المحاولة لاحقًا."
            : "Failed to submit feedback. Please try again later.";
      setFeedbackError(errMsg);
      toast.error(errMsg);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const activeNode =
    FEATURE_NODES.find((node) => node.id === activeNodeId) || FEATURE_NODES[0];
  const nodeResolvedHref =
    activeNode.id === "requests" ? requestTrackingHref(user) : activeNode.href;

  const primaryEmail = settings.contactEmail || "info@digital-brokerage.com";
  const supportEmail = "support@digitalbrokerage.sa";
  const accountEntryHref = isAuthenticated ? "/details" : "/login";

  return (
    <div className="db-shell" dir={isAr ? "rtl" : "ltr"}>
      <a className="db-skip" href="#main">
        {isAr ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>

      <header className="db-masthead">
        <a
          className="db-brand"
          href="#portal"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("portal");
          }}
          aria-label={isAr ? "الوساطة الرقمية — الرئيسية" : "Digital Brokerage — Home"}
        >
          <img src="/artworks/banan/brand.png" width={48} height={48} alt="" />
          <span>
            {isAr ? "الوساطة الرقمية" : "Digital Brokerage"}
            <small lang="en">DIGITAL BROKERAGE</small>
          </span>
        </a>

        <nav aria-label={isAr ? "التنقل الرئيسي" : "Main navigation"}>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("about");
            }}
          >
            {isAr ? "من نحن" : "About Us"}
          </a>
          <a
            href="#feedback"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("feedback");
            }}
          >
            {isAr ? "شاركنا رأيك" : "Share Feedback"}
          </a>
          <button type="button" onClick={openSupportDialog}>
            {isAr ? "خدمة العملاء" : "Customer Service"}
          </button>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
          >
            {isAr ? "اتصل بنا" : "Contact Us"}
          </a>
        </nav>

        <div className="db-masthead-actions">
          <button
            type="button"
            className="db-lang-toggle"
            onClick={toggleLanguage}
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
          >
            {isAr ? "EN" : "عربي"}
          </button>

          <Link className="db-outline db-login-link" href={accountEntryHref}>
            <span>
              {isAuthenticated
                ? isAr
                  ? "مساحتي"
                  : "My Workspace"
                : isAr
                  ? "دخول المنصة"
                  : "Sign In"}
            </span>
            <span aria-hidden="true">↖</span>
          </Link>

          <button
            type="button"
            className="db-menu-toggle db-outline"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {isAr ? "القائمة" : "Menu"}
          </button>
        </div>
      </header>

      <nav
        id="mobile-menu"
        className="db-mobile-menu"
        aria-label={isAr ? "قائمة الهاتف" : "Mobile menu"}
        hidden={!mobileMenuOpen}
      >
        <a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("about");
          }}
        >
          {isAr ? "من نحن" : "About Us"}
        </a>
        <a
          href="#feedback"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("feedback");
          }}
        >
          {isAr ? "شاركنا رأيك" : "Share Feedback"}
        </a>
        <button type="button" onClick={openSupportDialog}>
          {isAr ? "خدمة العملاء" : "Customer Service"}
        </button>
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("contact");
          }}
        >
          {isAr ? "اتصل بنا" : "Contact Us"}
        </a>
        <button type="button" onClick={replayIntro}>
          {isAr ? "الجولة المعمارية" : "Architectural Tour"}
        </button>
      </nav>

      <main id="main" ref={mainRef} className="db-main" tabIndex={-1}>
        {view === "intro" && <BuildingIntro onEnterHome={enterHome} />}

        {view === "home" && (
          <div aria-label={isAr ? "الرئيسية" : "Home"}>
            {/* Circular Stone Portal */}
            <section ref={portalRef} className="db-portal-journey" id="portal">
              <div className="db-portal-stage">
                <div className="db-portal-photo">
                  <img
                    src="/artworks/banan/portal-detail-v2.webp"
                    width={1672}
                    height={941}
                    alt={
                      isAr
                        ? "البوابة الحجرية الدائرية المطلة على فيلا ومسبح"
                        : "Circular stone portal overlooking a villa and pool"
                    }
                  />
                </div>
                <div className="db-portal-ring" aria-hidden="true" />
                <div ref={portalCopyRef} className="db-portal-copy">
                  <span className="db-eyebrow">
                    {isAr
                      ? "ليست مجرد وجهة. بداية جديدة."
                      : "Not just a destination. A new beginning."}
                  </span>
                  <h1>
                    {isAr ? (
                      <>
                        مكان يشبهك.
                        <br />
                        ورحلة <em>تجمعك.</em>
                      </>
                    ) : (
                      <>
                        A place like you.
                        <br />
                        A journey <em>connected.</em>
                      </>
                    )}
                  </h1>
                  <p>
                    {isAr ? (
                      <>
                        عقارات تكتشفها. خدمات تربط التفاصيل.
                        <br />
                        ورحلة تبدأ من هنا.
                      </>
                    ) : (
                      <>
                        Properties to discover. Services that connect every detail.
                        <br />A journey that starts here.
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    className="db-outline"
                    onClick={() => scrollToSection("platform")}
                  >
                    <span>{isAr ? "اكتشف المنصة" : "Explore Platform"}</span>
                    <span aria-hidden="true">↖</span>
                  </button>
                  <span className="db-latin">A place. A possibility.</span>
                </div>

                <div ref={portalInsideRef} className="db-portal-inside">
                  <span className="db-eyebrow">
                    {isAr ? "من البحث إلى المتابعة" : "From search to follow-up"}
                  </span>
                  <h2>
                    {isAr ? (
                      <>
                        أنت الآن،
                        <br />
                        أقرب إلى مكانك.
                      </>
                    ) : (
                      <>
                        You are now
                        <br />
                        closer to your place.
                      </>
                    )}
                  </h2>
                  <button
                    type="button"
                    className="db-light-button"
                    onClick={() => scrollToSection("platform")}
                  >
                    {isAr ? "اكتشف المنصة ↓" : "Explore Platform ↓"}
                  </button>
                </div>

                <div ref={portalBottomRef} className="db-portal-bottom">
                  <button type="button" className="db-text-button" onClick={replayIntro}>
                    {isAr ? "إعادة الجولة المعمارية ↗" : "Replay Architectural Tour ↗"}
                  </button>
                  <span>{isAr ? "مرّر لتفتح البوابة ↓" : "Scroll to open the portal ↓"}</span>
                  <span lang="en">THE THRESHOLD / 01</span>
                </div>
              </div>
            </section>

            {/* Platform Feature Circles */}
            <section className="db-section db-platform" id="platform">
              <div className="db-section-heading">
                <div>
                  <span className="db-eyebrow">
                    {isAr ? "01 / كل التفاصيل، متصلة" : "01 / EVERY DETAIL, CONNECTED"}
                  </span>
                  <h2>
                    {isAr ? (
                      <>
                        عقار. خدمات. إدارة.
                        <br />
                        في منصة <em>واحدة.</em>
                      </>
                    ) : (
                      <>
                        Property. Services. Management.
                        <br />
                        In <em>one</em> platform.
                      </>
                    )}
                  </h2>
                </div>
                <p>
                  {isAr ? (
                    <>
                      للباحث عن عقار، ومالك العقار، وفريق العمل.
                      <br />
                      ابدأ بما تحتاجه، ثم تابع الخطوة التالية.
                    </>
                  ) : (
                    <>
                      For property seekers, owners, and operations teams.
                      <br />
                      Start with what you need, then follow the next step.
                    </>
                  )}
                </p>
              </div>

              <div className="db-feature-nodes">
                {FEATURE_NODES.map((node) => {
                  const pressed = activeNodeId === node.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() => setActiveNodeId(node.id)}
                    >
                      <span className="db-node-circle">
                        {node.num} <span aria-hidden="true">↖</span>
                      </span>
                      <strong>{isAr ? node.labelAr : node.labelEn}</strong>
                      <small>{isAr ? node.shortAr : node.shortEn}</small>
                    </button>
                  );
                })}
              </div>

              <div className="db-node-detail" aria-live="polite">
                <div>
                  <h3 id="node-title">{isAr ? activeNode.titleAr : activeNode.titleEn}</h3>
                  <p id="node-description">
                    {isAr ? activeNode.descriptionAr : activeNode.descriptionEn}
                  </p>
                </div>
                <Link
                  id="node-action"
                  className="db-outline"
                  href={resolvePlatformHref(nodeResolvedHref, activeNode.requiresAuth)}
                  onClick={(e) =>
                    handleAuthAwareNav(nodeResolvedHref, activeNode.requiresAuth, e)
                  }
                >
                  <span>{isAr ? activeNode.actionAr : activeNode.actionEn}</span>
                  <span aria-hidden="true">↖</span>
                </Link>
              </div>
            </section>

            {/* Platform Services Wooden Door */}
            <section className="db-services-section db-section" id="service-door">
              <div className="db-section-heading">
                <div>
                  <span className="db-eyebrow">
                    {isAr ? "02 / افتح باب الاحتمالات" : "02 / OPEN THE DOOR OF POSSIBILITIES"}
                  </span>
                  <h2>
                    <Link href="/services">
                      {isAr ? "خدمات المنصة ↖" : "Platform Services ↖"}
                    </Link>
                  </h2>
                </div>
                <p>
                  {isAr ? (
                    <>
                      خدمات متخصصة.
                      <br />
                      لكل مرحلة من رحلة العقار.
                    </>
                  ) : (
                    <>
                      Specialized services.
                      <br />
                      For every stage of the real estate journey.
                    </>
                  )}
                </p>
              </div>

              <div className="db-door-layout">
                <div className="db-door-surround">
                  <div className="db-door-inner">
                    <span>
                      {isAr ? (
                        <>
                          لكل احتياج
                          <br />
                          باب مفتوح.
                        </>
                      ) : (
                        <>
                          For every need
                          <br />
                          an open door.
                        </>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    id="door-toggle"
                    className={`db-wood-door${doorOpen ? " open" : ""}`}
                    aria-expanded={doorOpen}
                    aria-controls="door-categories"
                    onClick={() => setDoorOpen((prev) => !prev)}
                  >
                    <span className="db-door-engraving">
                      {isAr ? (
                        <>
                          الوساطة
                          <br />
                          الرقمية
                        </>
                      ) : (
                        <>
                          Digital
                          <br />
                          Brokerage
                        </>
                      )}
                    </span>
                    <span className="db-door-handle" aria-hidden="true" />
                    <span className="db-door-prompt">
                      {isAr ? "افتح لتكتشف ↖" : "Open to explore ↖"}
                    </span>
                  </button>

                  <span className="db-door-number" aria-hidden="true">
                    DB / 02
                  </span>
                </div>

                <div className="db-door-content">
                  <div id="door-welcome" hidden={doorOpen}>
                    <h3>
                      {isAr ? (
                        <>
                          كل رحلة تبدأ
                          <br />
                          بخطوة مناسبة.
                        </>
                      ) : (
                        <>
                          Every journey starts
                          <br />
                          with the right step.
                        </>
                      )}
                    </h3>
                    <p>
                      {isAr
                        ? "افتح الباب للتعرّف على فئات الخدمات، ثم اختر ما يناسب احتياجك."
                        : "Open the door to browse service categories and choose what fits your need."}
                    </p>
                    <button
                      type="button"
                      className="db-text-button"
                      id="open-door"
                      onClick={openDoorAndFocus}
                    >
                      {isAr ? "افتح باب الخدمات ←" : "Open services door →"}
                    </button>
                  </div>

                  <div id="door-categories" hidden={!doorOpen}>
                    <div ref={serviceCatsRef} className="db-service-categories">
                      {realServices.map((service, idx) => (
                        <button
                          key={service.id}
                          type="button"
                          aria-pressed={selectedServiceIndex === idx}
                          onClick={() => setSelectedServiceIndex(idx)}
                        >
                          <span>{service.title}</span>
                          {service.status === "soon" && !isAdmin ? (
                            <span className="db-soon-pill">
                              {isAr ? "قريبًا" : "Soon"}
                            </span>
                          ) : (
                            <span aria-hidden="true">↖</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {activeService && (
                      <div className="db-service-description" aria-live="polite">
                        <h3>{activeService.title}</h3>
                        <p>{activeService.description}</p>
                        {activeService.status === "soon" && !isAdmin ? (
                          <span className="db-soon-pill">
                            {isAr ? "هذه الخدمة ستتوفر قريبًا" : "Coming soon"}
                          </span>
                        ) : (
                          <Link
                            className="db-primary"
                            href={
                              activeService.status === "soon"
                                ? activeService.previewHref
                                : activeService.href
                            }
                          >
                            <span>
                              {activeService.status === "soon"
                                ? t("services.adminPreview")
                                : activeService.id === "legal"
                                  ? isAr
                                    ? "اختر التخصص القانوني"
                                    : "Choose legal specialty"
                                  : isAr
                                    ? "ابدأ طلب الخدمة"
                                    : "Start service request"}
                            </span>
                            <span aria-hidden="true">↖</span>
                          </Link>
                        )}
                      </div>
                    )}

                    <p className="db-fine">
                      {isAr
                        ? "تختلف متطلبات الخدمة وتوافرها بحسب القسم. يمكنك أيضًا استعراض جميع الخدمات من صفحة الخدمات."
                        : "Service availability and requirements vary by category."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* About Us (Full content from /about + Digital Experience) */}
            <section id="about" className="db-section db-about">
              <span className="db-eyebrow">{isAr ? "03 / من نحن" : "03 / ABOUT US"}</span>
              <div className="db-about-layout">
                <h2>
                  {isAr ? (
                    <>
                      تقنية تقرّبك.
                      <br />
                      وتفاصيل
                      <br />
                      <em>تطمئنك.</em>
                    </>
                  ) : (
                    <>
                      Technology that brings
                      <br />
                      clarity and
                      <br />
                      <em>confidence.</em>
                    </>
                  )}
                </h2>

                <div>
                  <h3>{isAr ? "الوساطة الرقمية السعودية" : "Saudi Digital Brokerage"}</h3>
                  <p>
                    {isAr
                      ? 'نحن منصة "الوساطة الرقمية" منصة سعودية متخصصة في قطاع تكنولوجيا العقار انطلقنا لنقدم نموذجاً متطوراً يجمع بين الحلول التقنية المبتكرة والالتزام بالأنظمة، حيث نوفر بيئة رقمية متكاملة لخدمات الوساطة وإدارة العقارات، تهدف إلى تسهيل التعاملات العقارية، وتسريع إجراءاتها، ورفع كفاءتها، بما يضمن حقوق جميع الأطراف ويوفر تجربة مستخدم آمنة وموثوقة.'
                      : 'We are "Digital Brokerage", a Saudi platform specializing in property technology. We launched to provide an advanced model merging innovative digital solutions with strict regulatory compliance, delivering a cohesive ecosystem for real estate brokerage and property operations.'}
                  </p>
                  <p>
                    {isAr
                      ? "ونعتمد في أعمالنا على بنية تحتية تقنية متقدمة تحمي البيانات وتضمن سرية المعلومات، مع التزامنا الكامل باللوائح والتشريعات التي تنظم القطاع العقاري في المملكة العربية السعودية، لنكون الشريك الرقمي الموثوق في تطوير التعاملات العقارية وتنظيمها."
                      : "Our engineering foundation safeguards sensitive transactional data and adheres strictly to the regulatory statutes established across the Kingdom of Saudi Arabia, positioning our platform as a dependable digital partner in real estate governance."}
                  </p>

                  <details className="db-about-details">
                    <summary>
                      {isAr
                        ? "تعرّف على المنصة وإمكاناتها والتجربة الرقمية"
                        : "Explore platform capabilities and digital experience"}
                    </summary>

                    <div className="db-digital-highlight">
                      <h3>
                        {isAr
                          ? "البنية التقنية للبيانات العقارية"
                          : "Real Estate Intelligence Engine"}
                      </h3>
                      <p>
                        {isAr
                          ? "تجربة رقمية موحدة تجمع بين الخرائط الذكية ومسح الأحياء المدعوم بالذكاء الاصطناعي. تبدأ العملية بمسح الحي جغرافياً، ليقوم النظام بتحليل البيانات وتحويلها إلى مسار متكامل يشمل الخرائط التفاعلية والتقارير الفنية المؤتمتة لدعم اتخاذ القرار."
                          : "A unified digital experience combining smart maps and AI-assisted district scanning. The system processes spatial parameters into interactive maps and automated technical reports to support decisive actions."}
                      </p>
                    </div>

                    <h3>
                      {isAr
                        ? "كل جزء في المنصة يخدم قراراً أو إجراءً داخل الرحلة العقارية."
                        : "Every platform component powers a concrete decision in the real estate journey."}
                    </h3>
                    <p>
                      {isAr
                        ? "صُممت المنصة لتكامل أقسامها وترابطها، بما يضمن ربط كافة الإجراءات والعمليات بسياقها التنظيمي داخل النظام، لتوفير تجربة شاملة تمكّن المستفيدين عبر المسارات التالية:"
                        : "Built for systemic cohesion, our architecture connects every procedure directly to its verifiable regulatory record across four primary functional pillars:"}
                    </p>

                    {ABOUT_CAPABILITIES.map((item) => (
                      <div key={item.titleEn}>
                        <h3>{isAr ? item.titleAr : item.titleEn}</h3>
                        <p>{isAr ? item.textAr : item.textEn}</p>
                        <ul>
                          {(isAr ? item.pointsAr : item.pointsEn).map((pt) => (
                            <li key={pt}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    <h3>
                      {isAr
                        ? "هدفنا أن تكون كل خطوة عقارية قابلة للفهم، المتابعة، والتوثيق."
                        : "Our objective: make every real estate step transparent, trackable, and documented."}
                    </h3>
                    <p>
                      {isAr
                        ? "تجمع الوساطة الرقمية الأدوات التي يحتاجها المستفيد ومقدم الخدمة في منصة واحدة؛ لتتحول العملية العقارية من إجراءات متفرقة إلى تجربة تشغيل واضحة ومتكاملة."
                        : "Digital Brokerage consolidates the verified toolsets required by both clients and licensed practitioners, transforming disparate procedures into an integrated operational workflow."}
                    </p>
                  </details>
                </div>
              </div>
            </section>

            {/* Landscape CTA */}
            <section className="db-landscape">
              <img
                src="/artworks/banan/banan-penthouse-terrace.jpg"
                width={1376}
                height={768}
                alt={
                  isAr
                    ? "تصوّر معماري لشرفة سكنية بألوان طبيعية"
                    : "Architectural visualization of a residential terrace"
                }
                loading="lazy"
              />
              <div>
                <span className="db-eyebrow">
                  {isAr ? "خطوتك القادمة، تبدأ هنا" : "Your next step starts here"}
                </span>
                <h2>
                  {isAr ? (
                    <>
                      افتح باب
                      <br />
                      الاحتمالات.
                    </>
                  ) : (
                    <>
                      Open the door
                      <br />
                      of possibilities.
                    </>
                  )}
                </h2>
                <Link className="db-light-button" href={accountEntryHref}>
                  <span>{isAr ? "ابدأ رحلتك" : "Start Your Journey"}</span>
                  <span aria-hidden="true">↖</span>
                </Link>
              </div>
            </section>

            {/* Real Feedback Form (opinionApi) */}
            <section id="feedback" className="db-section db-feedback">
              <div>
                <span className="db-eyebrow">
                  {isAr ? "04 / نصغي لك" : "04 / WE LISTEN"}
                </span>
                <h2>
                  {isAr ? (
                    <>
                      رأيك يصنع
                      <br />
                      <em>الفرق.</em>
                    </>
                  ) : (
                    <>
                      Your feedback
                      <br />
                      makes a <em>difference.</em>
                    </>
                  )}
                </h2>
                <p>
                  {isAr
                    ? "شاركنا ملاحظتك عن التجربة؛ تصل رسالتك مباشرة إلى فريق الوساطة الرقمية."
                    : "Share your thoughts about the experience directly with the Digital Brokerage team."}
                </p>
                <p className="db-fine">
                  {isAr
                    ? "تُرسل الملاحظة عبر نظام الآراء الرسمي للمنصة."
                    : "Submitted directly through the official platform feedback API."}
                </p>
              </div>

              <form id="feedback-form" onSubmit={handleFeedbackSubmit} noValidate>
                <label htmlFor="feedback-name">
                  {isAr ? "الاسم " : "Name "}
                  <span className="db-muted">
                    {isAr ? "(اختياري)" : "(optional)"}
                  </span>
                </label>
                <input
                  id="feedback-name"
                  autoComplete="name"
                  maxLength={80}
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                  disabled={feedbackSubmitting}
                />

                <label htmlFor="feedback-email">
                  {isAr ? "البريد الإلكتروني " : "Email "}
                  <span className="db-muted">
                    {isAr ? "(اختياري)" : "(optional)"}
                  </span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  maxLength={120}
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  disabled={feedbackSubmitting}
                />

                <label htmlFor="feedback-message">
                  {isAr ? "رأيك في التجربة *" : "Your feedback *"}
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  maxLength={2000}
                  value={feedbackMessage}
                  onChange={(e) => {
                    setFeedbackMessage(e.target.value);
                    if (feedbackError) setFeedbackError(null);
                  }}
                  aria-invalid={Boolean(feedbackError)}
                  aria-describedby={feedbackError ? "feedback-error" : undefined}
                  disabled={feedbackSubmitting}
                />

                {feedbackError && (
                  <p id="feedback-error" className="db-error" role="alert">
                    {feedbackError}
                  </p>
                )}

                <button
                  type="submit"
                  className="db-primary"
                  disabled={feedbackSubmitting}
                >
                  <span>
                    {feedbackSubmitting
                      ? isAr
                        ? "جارٍ الإرسال…"
                        : "Sending…"
                      : isAr
                        ? "إرسال الرأي"
                        : "Submit Feedback"}
                  </span>
                  <span aria-hidden="true">↖</span>
                </button>

                {feedbackStatus && (
                  <p id="feedback-status" className="db-status-ok" role="status">
                    {feedbackStatus}
                  </p>
                )}
              </form>
            </section>

            {/* Footer with real contact channels & links */}
            <footer id="contact" className="db-footer">
              <div className="db-brand">
                <span>
                  {isAr ? "الوساطة الرقمية" : "Digital Brokerage"}
                  <small>DIGITAL BROKERAGE</small>
                </span>
              </div>

              <div>
                <h3>{isAr ? "لنبقَ على تواصل" : "Stay in touch"}</h3>
                <a href={`mailto:${primaryEmail}`} dir="ltr">
                  {primaryEmail}
                </a>
                {supportEmail !== primaryEmail && (
                  <a href={`mailto:${supportEmail}`} dir="ltr">
                    {supportEmail}
                  </a>
                )}
                {settings.contactPhone && (
                  <a href={`tel:${settings.contactPhone}`} dir="ltr">
                    {settings.contactPhone}
                  </a>
                )}
                <a
                  href="https://x.com/DB_Aqar"
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                >
                  @DB_Aqar ↗
                </a>
              </div>

              <div>
                <button
                  type="button"
                  className="db-text-button"
                  onClick={openSupportDialog}
                >
                  {isAr ? "خدمة العملاء ↖" : "Customer Service ↖"}
                </button>
                <Link href="/customerservice">
                  {isAr ? "مركز الدعم والتذاكر ↖" : "Support Center ↖"}
                </Link>
                <Link href="/info?tab=terms">
                  {isAr ? "الشروط والأحكام ↖" : "Terms & Conditions ↖"}
                </Link>
                <Link href="/info?tab=usage">
                  {isAr ? "سياسة الاستخدام ↖" : "Usage Policy ↖"}
                </Link>
                <button
                  type="button"
                  className="db-text-button"
                  onClick={() => scrollToSection("about")}
                >
                  {isAr ? "من نحن ↖" : "About Us ↖"}
                </button>
              </div>
            </footer>
          </div>
        )}
      </main>

      {/* Customer Service Dialog */}
      <dialog
        ref={supportDialogRef}
        id="support-dialog"
        className="db-dialog"
        onClick={(e) => {
          if (e.target === supportDialogRef.current) {
            closeSupportDialog();
          }
        }}
      >
        <button
          type="button"
          className="db-dialog-close db-square"
          onClick={closeSupportDialog}
          aria-label={isAr ? "إغلاق" : "Close"}
        >
          ×
        </button>
        <span className="db-eyebrow">{isAr ? "نحن على تواصل" : "We are here to help"}</span>
        <h2>{isAr ? "كيف يمكننا مساعدتك؟" : "How can we help?"}</h2>
        <p>
          {isAr
            ? "للتواصل مع فريق الوساطة الرقمية:"
            : "Reach out to the Digital Brokerage team:"}
        </p>
        <a href={`mailto:${primaryEmail}`} dir="ltr">
          {primaryEmail}
        </a>
        {supportEmail !== primaryEmail && (
          <a href={`mailto:${supportEmail}`} dir="ltr">
            {supportEmail}
          </a>
        )}
        {settings.contactPhone && (
          <a href={`tel:${settings.contactPhone}`} dir="ltr">
            {settings.contactPhone}
          </a>
        )}
        <a
          href="https://x.com/DB_Aqar"
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
        >
          @DB_Aqar ↗
        </a>
        <div style={{ marginTop: 24 }}>
          <Link
            href="/customerservice"
            className="db-primary"
            onClick={closeSupportDialog}
          >
            <span>{isAr ? "فتح مركز خدمة العملاء" : "Open Customer Service"}</span>
            <span aria-hidden="true">↖</span>
          </Link>
        </div>
      </dialog>
    </div>
  );
}
