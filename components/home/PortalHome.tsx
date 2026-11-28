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
import Footer from "@/app/src/components/Footer";
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
    requiresAuth: true,
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
    requiresAuth: true,
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
  const [platformEntered, setPlatformEntered] = useState(false);
  const [platformInView, setPlatformInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [doorOpen, setDoorOpen] = useState(false);
  const [isEnteringDoor, setIsEnteringDoor] = useState(false);
  const [isInsideRoom, setIsInsideRoom] = useState(false);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);

  // Feedback form state (wired to opinionApi)
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const mainRef = useRef<HTMLElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const portalRef = useRef<HTMLElement | null>(null);
  const platformRef = useRef<HTMLElement | null>(null);
  const nodeButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
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
      try { sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch {}
      setView("home");
      if (SECTION_HASHES.has(hashId)) {
        requestAnimationFrame(() => {
          document.getElementById(hashId)?.scrollIntoView({ behavior: "auto" });
        });
      }
      return;
    }

    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch {}
    setView(seen ? "home" : "intro");
  }, []);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => header.parentElement?.style.setProperty("--db-header-height", `${header.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => observer.disconnect();
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
      let hasToken = false;
      try { hasToken = Boolean(localStorage.getItem("token")); } catch {}
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

  // Observe #platform visibility for entrance sequence & pausing offscreen SVG animations
  useEffect(() => {
    if (view !== "home") return;
    const section = platformRef.current;
    if (!section) return;

    const reduceMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMedia.matches) {
      setPlatformEntered(true);
    }

    const handleVisibility = () => {
      setPageVisible(!document.hidden);
    };
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);

    if (typeof IntersectionObserver === "undefined") {
      setPlatformEntered(true);
      setPlatformInView(true);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setPlatformInView(entry.isIntersecting);
          if (entry.isIntersecting) {
            setPlatformEntered(true);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [view]);

  const handleNodeKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    const total = FEATURE_NODES.length;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = isAr ? (index - 1 + total) % total : (index + 1) % total;
    } else if (event.key === "ArrowLeft") {
      nextIndex = isAr ? (index + 1) % total : (index - 1 + total) % total;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = total - 1;
    }
    if (nextIndex !== null) {
      event.preventDefault();
      const targetNode = FEATURE_NODES[nextIndex];
      setActiveNodeId(targetNode.id);
      nodeButtonRefs.current[nextIndex]?.focus();
    }
  };

  const enterServicesDoor = useCallback((focusOnOpen = false) => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDoorOpen(true);
      setIsInsideRoom(true);
      return;
    }
    setDoorOpen(true);
    setIsEnteringDoor(true);
    const timer = setTimeout(() => {
      setIsInsideRoom(true);
      setIsEnteringDoor(false);
      if (focusOnOpen) {
        requestAnimationFrame(() => {
          const firstBtn = serviceCatsRef.current?.querySelector("button");
          firstBtn?.focus({ preventScroll: true });
        });
      }
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const exitServicesDoor = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setIsInsideRoom(false);
      setDoorOpen(false);
      return;
    }
    setIsEnteringDoor(true);
    setIsInsideRoom(false);
    const timer = setTimeout(() => {
      setIsEnteringDoor(false);
      setDoorOpen(false);
      requestAnimationFrame(() => {
        document.getElementById("door-toggle")?.focus({ preventScroll: true });
      });
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  const toggleServicesDoor = useCallback(
    (focusOnOpen = false) => {
      if (doorOpen || isInsideRoom) {
        exitServicesDoor();
      } else {
        enterServicesDoor(focusOnOpen);
      }
    },
    [doorOpen, isInsideRoom, exitServicesDoor, enterServicesDoor],
  );

  useEffect(() => {
    if (!isInsideRoom) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        exitServicesDoor();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isInsideRoom, exitServicesDoor]);

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

  const activeNodeIndex = Math.max(
    0,
    FEATURE_NODES.findIndex((node) => node.id === activeNodeId),
  );
  const activeNode = FEATURE_NODES[activeNodeIndex] || FEATURE_NODES[0];
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

      <header ref={headerRef} className="db-masthead">
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
            <section
              ref={platformRef}
              className={`db-section db-platform${platformEntered ? " is-entered" : ""}`}
              data-paused={!platformInView || !pageVisible ? "true" : "false"}
              id="platform"
            >
              <div className="db-section-heading db-platform-heading">
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

              <div
                className="db-platform-stage"
                data-active-index={activeNodeIndex}
                style={{ "--active-progress": activeNodeIndex / (FEATURE_NODES.length - 1) } as React.CSSProperties}
              >
                {/* Animated SVG Connections (Desktop 4-column arc) */}
                <svg
                  className="db-platform-svg db-platform-svg-desktop"
                  viewBox="0 0 1000 140"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="db-svg-track"
                    d="M 125 76 C 205 28, 295 28, 375 76 C 455 124, 545 124, 625 76 C 705 28, 795 28, 875 76"
                  />
                  <path
                    className="db-svg-draw"
                    pathLength={100}
                    d="M 125 76 C 205 28, 295 28, 375 76 C 455 124, 545 124, 625 76 C 705 28, 795 28, 875 76"
                  />
                  <path
                    className="db-svg-progress"
                    pathLength={100}
                    d="M 125 76 C 205 28, 295 28, 375 76 C 455 124, 545 124, 625 76 C 705 28, 795 28, 875 76"
                  />
                  <path
                    className="db-svg-flow"
                    d="M 125 76 C 205 28, 295 28, 375 76 C 455 124, 545 124, 625 76 C 705 28, 795 28, 875 76"
                  />
                  {[125, 375, 625, 875].map((cx, idx) => (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={76}
                      r={idx === activeNodeIndex ? 5.5 : 3.5}
                      className={`db-svg-anchor${idx === activeNodeIndex ? " is-active" : ""}`}
                    />
                  ))}
                </svg>

                {/* Animated SVG Connections (Mobile 2x2 grid) */}
                <svg
                  className="db-platform-svg db-platform-svg-mobile"
                  viewBox="0 0 400 320"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="db-svg-track"
                    d="M 100 66 Q 200 36 300 66 Q 334 146 100 226 Q 200 258 300 226"
                  />
                  <path
                    className="db-svg-draw"
                    pathLength={100}
                    d="M 100 66 Q 200 36 300 66 Q 334 146 100 226 Q 200 258 300 226"
                  />
                  <path
                    className="db-svg-flow"
                    d="M 100 66 Q 200 36 300 66 Q 334 146 100 226 Q 200 258 300 226"
                  />
                </svg>

                <div className="db-feature-nodes" role="group" aria-label={isAr ? "مسارات المنصة" : "Platform pillars"}>
                  {FEATURE_NODES.map((node, index) => {
                    const pressed = activeNodeId === node.id;
                    return (
                      <button
                        key={node.id}
                        ref={(el) => {
                          nodeButtonRefs.current[index] = el;
                        }}
                        type="button"
                        aria-pressed={pressed}
                        style={{ "--node-index": index } as React.CSSProperties}
                        onClick={() => setActiveNodeId(node.id)}
                        onKeyDown={(e) => handleNodeKeyDown(index, e)}
                      >
                        <span className="db-node-circle">
                          <span className="db-node-num">{node.num}</span>
                          <span className="db-node-arrow" aria-hidden="true">↖</span>
                        </span>
                        <strong>{isAr ? node.labelAr : node.labelEn}</strong>
                        <small>{isAr ? node.shortAr : node.shortEn}</small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="db-node-detail" aria-live="polite">
                <div key={activeNode.id} className="db-node-detail-copy">
                  <span className="db-node-detail-badge">
                    {activeNode.num} / {isAr ? activeNode.labelAr : activeNode.labelEn}
                  </span>
                  <h3 id="node-title">{isAr ? activeNode.titleAr : activeNode.titleEn}</h3>
                  <p id="node-description">
                    {isAr ? activeNode.descriptionAr : activeNode.descriptionEn}
                  </p>
                </div>
                <Link
                  key={`${activeNode.id}-action`}
                  id="node-action"
                  className="db-outline db-node-action-link"
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
                    <Link href={resolvePlatformHref("/services")} onClick={(e) => handleAuthAwareNav("/services", true, e)}>
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
                <div
                  className={`db-door-surround${doorOpen ? " is-open" : ""}${isEnteringDoor ? " is-entering" : ""}`}
                >
                  <div className="db-door-inner" aria-hidden={!doorOpen}>
                    <span className="db-door-inner-title">
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
                    <ul className="db-door-inner-list">
                      {realServices.slice(0, 5).map((service, idx) => (
                        <li
                          key={service.id}
                          className={idx === selectedServiceIndex ? "is-active" : undefined}
                        >
                          {service.title}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    id="door-toggle"
                    className={`db-wood-door${doorOpen ? " open" : ""}`}
                    aria-expanded={doorOpen || isInsideRoom}
                    aria-controls="door-categories"
                    aria-label={
                      doorOpen || isInsideRoom
                        ? isAr
                          ? "إغلاق باب الخدمات"
                          : "Close services door"
                        : isAr
                          ? "افتح باب الخدمات وادخل للمنصة"
                          : "Open services door and step inside"
                    }
                    onClick={() => toggleServicesDoor(false)}
                  >
                    <span className="db-door-face db-door-front">
                      <span className="db-door-handle" aria-hidden="true" />
                      <span className="db-door-prompt">
                        {doorOpen || isInsideRoom
                          ? isAr
                            ? "اضغط لإغلاق الباب"
                            : "Click to close"
                          : isAr
                            ? "افتح لتكتشف ↖"
                            : "Open to explore ↖"}
                      </span>
                    </span>
                    <span className="db-door-face db-door-back" aria-hidden="true" />
                    <span className="db-door-edge" aria-hidden="true" />
                  </button>

                  <span className="db-door-number" aria-hidden="true">
                    DB / 02
                  </span>
                </div>

                <div className="db-door-content">
                  <div id="door-welcome" className="db-door-panel" hidden={doorOpen}>
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
                      aria-expanded={doorOpen || isInsideRoom}
                      aria-controls="door-categories"
                      onClick={() => enterServicesDoor(true)}
                    >
                      {isAr ? "افتح باب الخدمات ←" : "Open services door →"}
                    </button>
                  </div>

                  <div id="door-categories" className="db-door-panel" hidden={!doorOpen}>
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
                              resolvePlatformHref(activeService.status === "soon"
                                ? activeService.previewHref
                                : activeService.href)
                            }
                            onClick={(e) => handleAuthAwareNav(activeService.status === "soon" ? activeService.previewHref : activeService.href, true, e)}
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

            {/* Immersive Walkthrough Interior Stage ("كني دخلت صدق") */}
            <div
              className={`db-inside-portal-overlay${isInsideRoom ? " is-active" : ""}${isEnteringDoor ? " is-entering" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label={isAr ? "بهو الخدمات العقارية الداخلي" : "Interior Services Hall"}
              hidden={!isInsideRoom && !isEnteringDoor}
            >
              <div className="db-inside-backdrop-image" aria-hidden="true" />
              <div className="db-inside-ambient-glow" aria-hidden="true" />

              <header className="db-inside-topbar">
                <div className="db-inside-brand">
                  <span className="db-inside-badge">
                    {isAr ? "02 / بهو الخدمات العقارية" : "02 / INTERIOR SERVICES HALL"}
                  </span>
                  <span className="db-inside-location">
                    {isAr ? "أنت الآن داخل فضاء الخدمات" : "You have stepped inside"}
                  </span>
                </div>

                <button
                  type="button"
                  className="db-inside-exit-button"
                  onClick={exitServicesDoor}
                  aria-label={isAr ? "الرجوع للخارج وإغلاق الباب" : "Step outside and close door"}
                >
                  <span>{isAr ? "الرجوع للخارج" : "Step Outside"}</span>
                  <span className="db-exit-icon" aria-hidden="true">
                    {isAr ? "↩" : "↪"}
                  </span>
                </button>
              </header>

              <div className="db-inside-content">
                <div className="db-inside-header">
                  <span className="db-inside-welcome-tag">
                    {isAr ? "استكشف الخدمات من الداخل" : "Explore Services From Within"}
                  </span>
                  <h2>
                    {isAr ? (
                      <>
                        خدمات متكاملة.
                        <br />
                        ترافق كل خطوة في رحلتك.
                      </>
                    ) : (
                      <>
                        Integrated Services.
                        <br />
                        Accompanying every step of your journey.
                      </>
                    )}
                  </h2>
                  <p>
                    {isAr
                      ? "اختر فئة الخدمة المناسبة لتتعرّف على متطلباتها وتبدأ طلبك مباشرة بموثوقية والتزام."
                      : "Select a service category to review requirements and start your verified request."}
                  </p>
                </div>

                <div className="db-inside-services-grid">
                  <div
                    className="db-inside-tabs"
                    role="tablist"
                    aria-label={isAr ? "فئات الخدمات" : "Service categories"}
                  >
                    {realServices.map((service, idx) => (
                      <button
                        key={service.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedServiceIndex === idx}
                        className={`db-inside-tab-item${selectedServiceIndex === idx ? " is-active" : ""}`}
                        onClick={() => setSelectedServiceIndex(idx)}
                      >
                        <span className="db-tab-num">0{idx + 1}</span>
                        <span className="db-tab-title">{service.title}</span>
                        {service.status === "soon" && !isAdmin ? (
                          <span className="db-soon-pill">{isAr ? "قريبًا" : "Soon"}</span>
                        ) : (
                          <span className="db-tab-arrow" aria-hidden="true">↖</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {activeService && (
                    <div className="db-inside-detail-card" aria-live="polite">
                      <div className="db-inside-card-header">
                        <span className="db-detail-kicker">
                          {isAr ? "تفاصيل الخدمة المختارة" : "Selected Service Details"}
                        </span>
                        <h3>{activeService.title}</h3>
                      </div>
                      <p className="db-inside-card-desc">{activeService.description}</p>

                      <div className="db-inside-card-actions">
                        {activeService.status === "soon" && !isAdmin ? (
                          <span className="db-soon-pill">
                            {isAr ? "هذه الخدمة ستتوفر قريبًا" : "Coming soon"}
                          </span>
                        ) : (
                          <Link
                            className="db-inside-action-btn"
                            href={resolvePlatformHref(
                              activeService.status === "soon"
                                ? activeService.previewHref
                                : activeService.href,
                            )}
                            onClick={(e) =>
                              handleAuthAwareNav(
                                activeService.status === "soon"
                                  ? activeService.previewHref
                                  : activeService.href,
                                true,
                                e,
                              )
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

                        <button
                          type="button"
                          className="db-inside-secondary-btn"
                          onClick={exitServicesDoor}
                        >
                          {isAr ? "الرجوع للخارج ↩" : "Return outside ↩"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <footer className="db-inside-footer">
                <p>
                  {isAr
                    ? "جميع الخدمات تخضع للأنظمة والمعايير المعتمدة من الهيئة العامة للعقار (فال)."
                    : "All services comply with Real Estate General Authority standards."}
                </p>
                <button
                  type="button"
                  className="db-inside-close-text"
                  onClick={exitServicesDoor}
                >
                  {isAr ? "إغلاق والعودة للرئيسية ↩" : "Close and return to home ↩"}
                </button>
              </footer>
            </div>

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

            {/* Homepage Footer */}
            <Footer />
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
