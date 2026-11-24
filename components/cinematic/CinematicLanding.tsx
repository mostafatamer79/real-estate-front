"use client";

import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpLeft,
  ShieldCheck,
  Sparkles,
  Building2,
  ArrowUp,
  Compass,
  Eye,

  Calculator,
  Calendar,
  MapPin,

  CheckCircle2,
  X,

  Coins,
} from "lucide-react";
import HomeAccountLink from "@/components/HomeAccountLink";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import styles from "./cinematic-landing.module.css";

// SVG Suite (Pure vector, zero raster images, animated CAD and architectural drawings)
import BananFacadeSvg from "./svg/BananFacadeSvg";
import BananMasterplanSvg, { BANAN_VECTOR_HOTSPOTS, type MasterplanHotspot } from "./svg/BananMasterplanSvg";
import {
  BananVillaBlueprintSvg,
  HorizonPenthouseSvg,
  CommercialTowerSvg,
  InvestmentPlotsSvg,
} from "./svg/EstateBlueprintsSvg";
import ServicesAtelierSvg from "./svg/ServicesAtelierSvg";
import FinaleSkylineSvg from "./svg/FinaleSkylineSvg";
import { RegaSealSvg, NafathSealSvg, EjarSealSvg, WafiSealSvg } from "./svg/TrustSealsSvg";

// Dynamically import the real interactive 3D neighborhood drone scene with SSR disabled
const DetailsNeighborhood = dynamic(
  () => import("@/components/details/DetailsNeighborhood"),
  {
    ssr: false,
    loading: () => (
      <div className={styles.scene3dLoader}>
        <div className={styles.loaderSpinner} />
        <span>جاري تحميل المشهد ثلاثي الأبعاد والتحليق الافتراضي...</span>
      </div>
    ),
  }
);

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(query).matches : false),
    () => false
  );
}

const ACT_THRESHOLDS = [
  { id: 1, hash: "#act-arrival", nameAr: "01 الوصول", nameEn: "01 ARRIVAL" },
  { id: 2, hash: "#act-masterplan", nameAr: "02 بنان 3D", nameEn: "02 3D BANAN" },
  { id: 3, hash: "#act-collections", nameAr: "03 الأصول", nameEn: "03 ESTATES" },
  { id: 4, hash: "#act-atelier", nameAr: "04 المنظومة", nameEn: "04 ATELIER" },
  { id: 5, hash: "#act-finale", nameAr: "05 الخاتمة", nameEn: "05 FINALE" },
];

export default function CinematicLanding() {
  const { language, toggleLanguage } = useLanguage();
  const { settings } = useSettings();
  const ar = language === "ar";

  const isReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // Navigation & Active Section Tracking
  const [activeAct, setActiveAct] = useState<number>(1);
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  // Masterplan Explorer View: 'svg' (interactive animated vector map) | '3d' (drone scene)
  const [masterplanView, setMasterplanView] = useState<"svg" | "3d">("svg");
  const [activeHotspot, setActiveHotspot] = useState<MasterplanHotspot | null>(BANAN_VECTOR_HOTSPOTS[0]);

  // Tactile Material Inspection Dock
  const [activeMaterial, setActiveMaterial] = useState<number | null>(1);

  // Search Console State
  const [searchPropertyType, setSearchPropertyType] = useState<string>("villa");
  const [searchArea, setSearchArea] = useState<string>("banan");
  const [searchBudget, setSearchBudget] = useState<string>("any");

  // Financial ROI & Mortgage Simulator State
  const [propertyPrice, setPropertyPrice] = useState<number>(3800000);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [loanYears, setLoanYears] = useState<number>(25);

  // VIP Tour & Consultation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("مشروع بنان - فلل ريزيدنس الفاخرة");

  // Ambient Dust Particles Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate Mortgage & Investment Metrics
  const calculatedMetrics = useMemo(() => {
    const downPaymentAmount = (propertyPrice * downPaymentPct) / 100;
    const loanAmount = propertyPrice - downPaymentAmount;
    const annualInterestRate = 0.042; // 4.2% typical Saudi mortgage rate
    const monthlyInterestRate = annualInterestRate / 12;
    const totalMonths = loanYears * 12;

    const monthlyInstallment =
      loanAmount > 0
        ? (loanAmount *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths))) /
          (Math.pow(1 + monthlyInterestRate, totalMonths) - 1)
        : 0;

    const annualRentYieldRate = 0.088; // 8.8% average net cap rate in Banan
    const estimatedAnnualRent = propertyPrice * annualRentYieldRate;
    const estimatedMonthlyRent = estimatedAnnualRent / 12;

    return {
      downPaymentAmount: Math.round(downPaymentAmount),
      loanAmount: Math.round(loanAmount),
      monthlyInstallment: Math.round(monthlyInstallment),
      estimatedAnnualRent: Math.round(estimatedAnnualRent),
      estimatedMonthlyRent: Math.round(estimatedMonthlyRent),
      netRoiPct: (annualRentYieldRate * 100).toFixed(1),
    };
  }, [propertyPrice, downPaymentPct, loanYears]);

  // Window Scroll & Active Section Detection via IntersectionObserver
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === "act-arrival") setActiveAct(1);
            else if (id === "act-masterplan") setActiveAct(2);
            else if (id === "act-collections") setActiveAct(3);
            else if (id === "act-atelier") setActiveAct(4);
            else if (id === "act-finale") setActiveAct(5);
          }
        });
      },
      { threshold: 0.3 }
    );

    const sections = document.querySelectorAll("[data-act-section]");
    sections.forEach((sec) => observer.observe(sec));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Ambient Dust Particle Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: -Math.random() * 0.28 - 0.08,
      alpha: Math.random() * 0.45 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const alpha = p.alpha * (0.6 + Math.sin(p.pulse) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha.toFixed(2)})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(212, 175, 55, 0.35)";
        ctx.fill();
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isReducedMotion]);

  const scrollToAct = (hash: string) => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setModalSuccess(false);
      setIsModalOpen(false);
      setClientName("");
      setClientPhone("");
    }, 2400);
  };

  const materials = [
    {
      id: 1,
      nameAr: "ترافرتين روماني منحوت",
      nameEn: "Honed Roman Travertine",
      descAr: "حجر طبيعي مسامي عازل للحرارة يعكس شمس نجد الذهبية ويدوم لأجيال بتناغم بيئي فائق.",
      descEn: "Porous natural thermal stone reflecting the golden desert light with timeless endurance.",
      badgeAr: "مستدام وبارد",
      badgeEn: "Sustainable Thermal",
    },
    {
      id: 2,
      nameAr: "برونز معماري معتق",
      nameEn: "Brushed Architectural Bronze",
      descAr: "تفاصيل معدنية نقية بلمسات حرفية مقاومة للعوامل الجوية تمنح الواجهات هيبة استثنائية.",
      descEn: "Precision metallic accents crafted to resist desert weathering with stately presence.",
      badgeAr: "حرفية يدوية",
      badgeEn: "Artisanal Craft",
    },
    {
      id: 3,
      nameAr: "زجاج كريستالي منخفض الانبعاث",
      nameEn: "Low-E Crystal Glazing",
      descAr: "واجهات ممتدة بإنفاذية ضوئية تفوق 88% مع عزل حراري وصوتي بنسبة 99.4%.",
      descEn: "Panoramic floor-to-ceiling glazing with 88% light transmission and 99.4% solar rejection.",
      badgeAr: "عزل حراري 99%",
      badgeEn: "Acoustic & Solar Guard",
    },
    {
      id: 4,
      nameAr: "مسطحات مائية عاكسة",
      nameEn: "Reflecting Water Surfaces",
      descAr: "قنوات وأحواض مائية هادئة تخفض درجات الحرارة المحيطة بمقدار 4 درجات وتضفي سكينة بصرية.",
      descEn: "Tranquil water features regulating ambient temperature and creating sublime stillness.",
      badgeAr: "تلطيف مناخي",
      badgeEn: "Microclimate Cooling",
    },
  ];

  return (
    <div className={styles.landingRoot} dir={ar ? "rtl" : "ltr"}>
      {/* FLOATING AMBIENT CANVAS */}
      <canvas ref={canvasRef} className={styles.particleCanvas} aria-hidden="true" />

      {/* FIXED CAD OVERLAY TELEMETRY */}
      <div className={styles.cadOverlay} aria-hidden="true">
        <div className={styles.cadTopBar}>
          <div className="flex items-center gap-2">
            <span className={styles.cadCrosshair} />
            <span>RIYADH NORTH // 24.8712° N, 46.5921° E</span>
          </div>
          <span className="hidden sm:inline">BANAN SMART CITY // VECTOR BLUEPRINT</span>
        </div>
        <div className={styles.cadBottomBar}>
          <span className="hidden sm:inline">DIGITAL BROKERAGE PLATFORM // VERIFIED REGA</span>
          <span>SCALE 1:1 CAD // PURE SVG ANIMATION</span>
        </div>
      </div>

      {/* FLOATING ACT RADAR (SIDE TIMELINE NAV) */}
      <nav className={styles.actRadar} aria-label={ar ? "فصول التجربة" : "Experience Timeline"}>
        <ul className={styles.radarList}>
          {ACT_THRESHOLDS.map((act) => (
            <li key={act.id}>
              <button
                type="button"
                onClick={() => scrollToAct(act.hash)}
                className={`${styles.radarBtn} ${activeAct === act.id ? styles.radarActive : ""}`}
                aria-label={ar ? `الانتقال إلى ${act.nameAr}` : `Jump to ${act.nameEn}`}
              >
                <span className={styles.radarDot} />
                <span className={styles.radarLabel}>
                  {ar ? act.nameAr : act.nameEn}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* FLOATING GLASS NAVIGATION HEADER */}
      <header
        className={`${styles.cinematicNav} ${isNavScrolled ? styles.navScrolled : ""}`}
        role="banner"
      >
        <Link href="/" className={styles.navBrand} aria-label={ar ? "الرئيسية" : "Home"}>
          <Image
            src={
              settings.isDark
                ? settings.logoWhiteUrl || "/icons/white.png"
                : settings.logoBlackUrl || "/icons/black.png"
            }
            width={124}
            height={44}
            alt={ar ? "الوساطة الرقمية" : "Digital Brokerage"}
            className={styles.navLogo}
            priority
            unoptimized
          />
          <div className={styles.navBrandText}>
            <span className={styles.navBrandTitle}>
              {ar ? "الوساطة الرقمية" : "Digital Brokerage"}
            </span>
            <span className={styles.navBrandSub}>
              {ar ? "مخطط بنان المعماري" : "Banan Architectural Vector"}
            </span>
          </div>
        </Link>

        <nav className={styles.navCenter} aria-label={ar ? "التنقل الرئيسي" : "Main Navigation"}>
          <ul className={styles.navLinks}>
            <li>
              <button
                type="button"
                onClick={() => scrollToAct("#act-masterplan")}
                className={styles.navLink}
              >
                {ar ? "مشروع بنان 3D" : "Banan 3D City"}
              </button>
            </li>
            <li>
              <Link href="/offers" className={styles.navLink}>
                {ar ? "العروض العقارية" : "Offerings"}
              </Link>
            </li>
            <li>
              <Link href="/services" className={styles.navLink}>
                {ar ? "دليل الخدمات" : "Services"}
              </Link>
            </li>
            <li>
              <Link href="/services/legal" className={styles.navLink}>
                {ar ? "الحلول القانونية" : "Legal Advisory"}
              </Link>
            </li>
            <li>
              <Link href="/about" className={styles.navLink}>
                {ar ? "عن المنصة" : "About"}
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.navActions}>
          <button
            type="button"
            onClick={toggleLanguage}
            className={styles.langBtn}
            aria-label={ar ? "تغيير اللغة إلى الإنجليزية" : "Switch to Arabic"}
          >
            {ar ? "English" : "العربية"}
          </button>
          <HomeAccountLink withIcons />
        </div>
      </header>

      {/* =========================================================================
          ACT 1: THE ARRIVAL & ANIMATED SVG ARCHITECTURAL FACADE
          ========================================================================= */}
      <section
        id="act-arrival"
        data-act-section
        className={styles.heroSection}
        aria-label={ar ? "الوصول المعماري ومخطط الواجهة" : "The Architectural Arrival"}
      >
        <div className={styles.heroSvgWrapper}>
          <BananFacadeSvg className={styles.heroFacadeSvg} />
          <div className={styles.heroVignette} />
        </div>

        <div className={styles.heroContentContainer}>
          <div className={styles.heroBadgeRow}>
            <span className={styles.heroPillBadge}>
              <Sparkles size={14} className="text-amber-400" aria-hidden="true" />
              {ar ? "الوجهة المعمارية الأيقونية • الرياض الجديدة" : "Iconic Architectural Landmark • New Riyadh"}
            </span>
            <span className={styles.heroPillBadge}>
              <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
              {ar ? "ترخيص وساطة معتمد (فال)" : "REGA-Certified Brokerage"}
            </span>
          </div>

          <div className={styles.heroTitles}>
            <span className={styles.heroEyebrow}>
              {ar ? "مشروع مدينة بنان • مجتمع ذكي متكامل" : "Banan Smart City • Integrated Living"}
            </span>
            <h1 className={styles.heroMainTitle}>
              {ar ? "مساحة تشبه طموحك" : "A Space Befitting Ambition"}
            </h1>
            <p className={styles.heroSubtitle}>
              {ar
                ? "بين فخامة العمارة الكلاسيكية والمدن الذكية المستدامة، نضع بين يديك أندر الأصول العقارية في بنان وعاصمة المستقبل، بإشراف وحوكمة رسمية متكاملة."
                : "Between timeless neoclassical grandeur and futuristic smart communities, discover prime architectural estates in Banan and Riyadh with certified governance."}
            </p>
          </div>

          {/* INTEGRATED ARCHITECTURAL SEARCH CONSOLE */}
          <div className={styles.searchConsoleBox} role="search" aria-label={ar ? "محرك البحث العقاري الفوري" : "Property Search Engine"}>
            <div className={styles.searchGrid}>
              {/* Type Field */}
              <div className={styles.searchField}>
                <label className={styles.searchLabel} htmlFor="prop-type-select">
                  <Building2 size={15} aria-hidden="true" />
                  <span>{ar ? "فئة الأصل العقاري" : "Estate Type"}</span>
                </label>
                <select
                  id="prop-type-select"
                  value={searchPropertyType}
                  onChange={(e) => setSearchPropertyType(e.target.value)}
                  className={styles.searchSelect}
                >
                  <option value="villa">{ar ? "فلل ريزيدنس بنان الفاخرة" : "Banan Sovereign Villas"}</option>
                  <option value="penthouse">{ar ? "بنتهاوس الأفق المعلق" : "Horizon Sky Penthouses"}</option>
                  <option value="mansion">{ar ? "قصور ومحميات خاصة" : "Private Estates & Mansions"}</option>
                  <option value="commercial">{ar ? "أبراج ومقرات أعمال ذكية" : "Commercial & Tech Towers"}</option>
                  <option value="investment">{ar ? "مخططات وأراضٍ استثمارية" : "Prime Investment Plots"}</option>
                </select>
              </div>

              {/* Area Field */}
              <div className={styles.searchField}>
                <label className={styles.searchLabel} htmlFor="prop-area-select">
                  <MapPin size={15} aria-hidden="true" />
                  <span>{ar ? "المنطقة والموقع" : "Location"}</span>
                </label>
                <select
                  id="prop-area-select"
                  value={searchArea}
                  onChange={(e) => setSearchArea(e.target.value)}
                  className={styles.searchSelect}
                >
                  <option value="banan">{ar ? "مدينة بنان الذكية (شمال الرياض)" : "Banan Smart City (Riyadh North)"}</option>
                  <option value="hittin">{ar ? "حي حطين الراقي" : "Hittin Prime District"}</option>
                  <option value="narjis">{ar ? "حي النرجس وسدرة" : "Al-Narjis & Sedra"}</option>
                  <option value="malqa">{ar ? "الملقا والقيروان" : "Al-Malqa & Al-Qairawan"}</option>
                  <option value="kafd">{ar ? "المركز المالي كافد (KAFD)" : "King Abdullah Financial District"}</option>
                </select>
              </div>

              {/* Budget Field */}
              <div className={styles.searchField}>
                <label className={styles.searchLabel} htmlFor="prop-budget-select">
                  <Coins size={15} aria-hidden="true" />
                  <span>{ar ? "النطاق الاستثماري" : "Investment Budget"}</span>
                </label>
                <select
                  id="prop-budget-select"
                  value={searchBudget}
                  onChange={(e) => setSearchBudget(e.target.value)}
                  className={styles.searchSelect}
                >
                  <option value="any">{ar ? "كافة النطاقات الاستثمارية" : "All Investment Brackets"}</option>
                  <option value="2-5m">{ar ? "2,000,000 - 5,000,000 ريال" : "2M - 5M SAR"}</option>
                  <option value="5-10m">{ar ? "5,000,000 - 10,000,000 ريال" : "5M - 10M SAR"}</option>
                  <option value="10-25m">{ar ? "10,000,000 - 25,000,000 ريال" : "10M - 25M SAR"}</option>
                  <option value="25m+">{ar ? "25,000,000+ ريال (أصول نخبوية)" : "25M+ SAR (Exclusive Assets)"}</option>
                </select>
              </div>

              {/* Action Button */}
              <div className={styles.searchActionField}>
                <Link
                  href={`/offers?type=${searchPropertyType}&city=${searchArea}`}
                  className={styles.searchSubmitBtn}
                >
                  <span>{ar ? "استعراض الأصول" : "Explore Estates"}</span>
                  <ArrowUpLeft size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4 LIVE PLATFORM STAT METRIC BADGES */}
          <div className={styles.metricCounterRow}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>23,000+</span>
              <span className={styles.metricLabel}>
                {ar ? "وحدة سكنية وذكية في بنان" : "Smart Units in Banan City"}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>4.8B+ SAR</span>
              <span className={styles.metricLabel}>
                {ar ? "إجمالي الصفقات الموثقة" : "Documented Transactions"}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>9.4%</span>
              <span className={styles.metricLabel}>
                {ar ? "متوسط العائد الاستثماري السنوي" : "Average Annual Net ROI"}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>100%</span>
              <span className={styles.metricLabel}>
                {ar ? "حوكمة وترخيص حكومي معتمد" : "Fully REGA & Nafath Verified"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT 2: BANAN 3D & ANIMATED VECTOR MASTERPLAN EXPLORER
          ========================================================================= */}
      <section
        id="act-masterplan"
        data-act-section
        className={styles.masterplanSection}
        aria-label={ar ? "المخطط العام التفاعلي والاستكشاف ثلاثي الأبعاد" : "Interactive Masterplan Explorer"}
      >
        <div className={styles.sectionHeaderWrap}>
          <div className={styles.sectionBadge}>
            <Compass size={14} aria-hidden="true" />
            <span>{ar ? "02 / العبور والتحليق المعماري" : "02 / The Approach & Spatial Flight"}</span>
          </div>
          <h2 className={styles.sectionTitle}>
            {ar ? "استكشف مشروع بنان التفاعلي" : "Interactive Banan City Masterplan"}
          </h2>
          <p className={styles.sectionDesc}>
            {ar
              ? "مخطط متجهي حي تفاعلي بالكامل يوضح شبكة الطرق، حركة المرور الذكية، البحيرات الكريستالية، ومواقع الأصول المعمارية."
              : "A living interactive vector masterplan illustrating transit grids, animated traffic flow, crystal lagoons, and estate enclaves."}
          </p>

          {/* 2-WAY VIEW SWITCHER TABS */}
          <div className={styles.viewModeSwitcher} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={masterplanView === "svg"}
              onClick={() => setMasterplanView("svg")}
              className={`${styles.viewTabBtn} ${masterplanView === "svg" ? styles.viewTabActive : ""}`}
            >
              <Eye size={16} aria-hidden="true" />
              <span>{ar ? "المخطط المتجهي الحي (Animated SVG Plan)" : "Animated Vector Masterplan"}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={masterplanView === "3d"}
              onClick={() => setMasterplanView("3d")}
              className={`${styles.viewTabBtn} ${masterplanView === "3d" ? styles.viewTabActive : ""}`}
            >
              <Compass size={16} aria-hidden="true" />
              <span>{ar ? "المشهد ثلاثي الأبعاد الحي (3D Drone Scene)" : "Live 3D Drone Scene"}</span>
            </button>
          </div>
        </div>

        {/* MASTERPLAN STAGE CONTAINER */}
        <div className={styles.masterplanStage}>
          {masterplanView === "svg" ? (
            <div className={styles.vectorMasterplanContainer}>
              <BananMasterplanSvg
                activeId={activeHotspot?.id || null}
                onSelectHotspot={(hotspot) => setActiveHotspot(hotspot)}
                className={styles.masterplanSvg}
              />

              {/* Hotspot Detail Card */}
              {activeHotspot && (
                <div className={styles.hotspotDetailCard} role="region" aria-live="polite">
                  <div className={styles.hotspotCardHeader}>
                    <span className={styles.hotspotCardTag}>
                      {ar ? activeHotspot.tagAr : activeHotspot.tagEn}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveHotspot(null)}
                      className={styles.hotspotCloseBtn}
                      aria-label={ar ? "إغلاق البطاقة" : "Close"}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <h3 className={styles.hotspotCardTitle}>
                    {ar ? activeHotspot.nameAr : activeHotspot.nameEn}
                  </h3>
                  <p className={styles.hotspotCardDesc}>
                    {ar ? activeHotspot.descAr : activeHotspot.descEn}
                  </p>
                  <Link
                    href={`/offers?amenity=${activeHotspot.id}`}
                    className={styles.hotspotCardLink}
                  >
                    <span>{ar ? "استعراض الأصول المجاورة لهذا المعلم" : "View Properties Near This Amenity"}</span>
                    <ArrowUpLeft size={14} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.threeSceneContainer}>
              <DetailsNeighborhood showTitle={false} />
            </div>
          )}
        </div>

        {/* TACTILE MATERIAL INSPECTION DOCK */}
        <div className={styles.materialDockWrap}>
          <div className={styles.materialDockHeader}>
            <span className={styles.materialDockEyebrow}>
              {ar ? "هوية المواد والتشطيبات الفاخرة" : "Material Palette & Architectural Finishes"}
            </span>
            <span className={styles.materialDockSub}>
              {ar ? "انقر على المادة لمعاينة خصائصها الإنشائية والبيئية" : "Select a material to inspect its thermal and acoustic properties"}
            </span>
          </div>

          <div className={styles.materialGrid}>
            {materials.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMaterial(activeMaterial === m.id ? null : m.id)}
                className={`${styles.materialCard} ${activeMaterial === m.id ? styles.materialCardActive : ""}`}
                aria-pressed={activeMaterial === m.id}
              >
                <div className={styles.materialCardTop}>
                  <span className={styles.materialNumber}>0{m.id}</span>
                  <span className={styles.materialBadge}>
                    {ar ? m.badgeAr : m.badgeEn}
                  </span>
                </div>
                <h4 className={styles.materialTitle}>
                  {ar ? m.nameAr : m.nameEn}
                </h4>
                <p className={styles.materialDesc}>
                  {ar ? m.descAr : m.descEn}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT 3: THE REVEAL — CURATED BLUEPRINTS (PURE ANIMATED SVGS)
          ========================================================================= */}
      <section
        id="act-collections"
        data-act-section
        className={styles.collectionsSection}
        aria-label={ar ? "الأصول والتحف المعمارية المختارة" : "Curated Estate Collections"}
      >
        <div className={styles.sectionHeaderWrap}>
          <div className={styles.sectionBadge}>
            <Sparkles size={14} aria-hidden="true" />
            <span>{ar ? "03 / الكشف والمعاينة" : "03 / Curated Offerings"}</span>
          </div>
          <h2 className={styles.sectionTitle}>
            {ar ? "مخططات وتحف معمارية نادرة في بنان والرياض" : "Bespoke Architectural Blueprints"}
          </h2>
          <p className={styles.sectionDesc}>
            {ar
              ? "مجموعة منتقاة تمثل قمة التميز الهندسي، معروضة عبر مخططات مسقطية ومقاطع إنشائية دقيقة تبرز تفاصيل التصميم."
              : "A rigorously curated collection presented through precision vector elevations and floorplan cross-sections."}
          </p>
        </div>

        {/* 4 GRAND ARCHITECTURAL ESTATE CARDS WITH ANIMATED BLUEPRINTS */}
        <div className={styles.estateGrid}>
          {/* Card 1: Banan Sovereign Villa */}
          <article className={styles.estateCard}>
            <div className={styles.estateSvgWrap}>
              <BananVillaBlueprintSvg className={styles.estateSvgElement} />
              <div className={styles.estateBadgeTag}>
                {ar ? "فلل ريزيدنس بنان" : "Banan Sovereign Villas"}
              </div>
            </div>
            <div className={styles.estateCardBody}>
              <div className={styles.estateMetaRow}>
                <span>{ar ? "مدينة بنان • شمال الرياض" : "Banan Smart City, Riyadh North"}</span>
                <span className={styles.estatePrice}>{ar ? "من 6,800,000 ريال" : "From 6.8M SAR"}</span>
              </div>
              <h3 className={styles.estateTitle}>
                {ar ? "قصور وفلل ريزيدنس بنان ذات الأفنية العاكسة" : "Banan Reflection Courtyard Mansions"}
              </h3>
              <p className={styles.estateSummary}>
                {ar
                  ? "فلل مستقلة بارتفاع مزدوج، أسقف زجاجية بانورامية مطلة على أحواض سباحة هادئة، وتشطيبات ترافرتين إيطالي ورخام طبيعي."
                  : "Private double-height villas with floor-to-ceiling panoramic glass facing illuminated pools, Italian travertine, and bespoke lighting."}
              </p>
              <div className={styles.estateSpecsRow}>
                <span>5-7 {ar ? "أجنحة نوم" : "Bedrooms"}</span>
                <span>•</span>
                <span>850 - 1,450 م²</span>
                <span>•</span>
                <span>{ar ? "مسبح خاص وفناء نحدي" : "Private Pool & Court"}</span>
              </div>
              <Link href="/offers?type=villa" className={styles.estateActionBtn}>
                <span>{ar ? "معاينة تفاصيل الفلل المتاحة" : "View Villa Collection"}</span>
                <ArrowUpLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Card 2: Horizon Sky Penthouse */}
          <article className={styles.estateCard}>
            <div className={styles.estateSvgWrap}>
              <HorizonPenthouseSvg className={styles.estateSvgElement} />
              <div className={styles.estateBadgeTag}>
                {ar ? "بنتهاوس الأفق" : "Horizon Sky Penthouses"}
              </div>
            </div>
            <div className={styles.estateCardBody}>
              <div className={styles.estateMetaRow}>
                <span>{ar ? "أبراج بنان المعلقة" : "Banan Sky Towers, High Floor"}</span>
                <span className={styles.estatePrice}>{ar ? "من 4,200,000 ريال" : "From 4.2M SAR"}</span>
              </div>
              <h3 className={styles.estateTitle}>
                {ar ? "بنتهاوس الأفق مع سبا خاص وتراس معلق" : "Sky Penthouses with Suspended Infinity Spa"}
              </h3>
              <p className={styles.estateSummary}>
                {ar
                  ? "شرفات معلقة فسيحة تضم حوض سباحة دافئ وإطلالة بانورامية بزاوية 270 درجة على بحيرات بنان وأفق مدينة الرياض المتلألئ."
                  : "Wraparound sky terrace featuring an infinity spa overlooking Banan waterways and the vibrant illuminated Riyadh city lights."}
              </p>
              <div className={styles.estateSpecsRow}>
                <span>4 {ar ? "أجنحة نوم" : "Suites"}</span>
                <span>•</span>
                <span>420 م² {ar ? "مساحة وتراس" : "Total Area"}</span>
                <span>•</span>
                <span>{ar ? "إطلالة 270° كاملة" : "270° Skyline View"}</span>
              </div>
              <Link href="/offers?type=penthouse" className={styles.estateActionBtn}>
                <span>{ar ? "معاينة بنتهاوس الأفق" : "View Penthouse Details"}</span>
                <ArrowUpLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Card 3: Landmark Commercial & Financial Towers */}
          <article className={styles.estateCard}>
            <div className={styles.estateSvgWrap}>
              <CommercialTowerSvg className={styles.estateSvgElement} />
              <div className={styles.estateBadgeTag}>
                {ar ? "مقرات وأبراج أعمال" : "Smart Corporate Towers"}
              </div>
            </div>
            <div className={styles.estateCardBody}>
              <div className={styles.estateMetaRow}>
                <span>{ar ? "المركز المالي الذكي" : "Banan Smart Tech District"}</span>
                <span className={styles.estatePrice}>{ar ? "من 12,500,000 ريال" : "From 12.5M SAR"}</span>
              </div>
              <h3 className={styles.estateTitle}>
                {ar ? "أبراج ومقرات الأعمال الذكية ذات الاستدامة العالية" : "Banan Next-Gen Financial & Corporate HQs"}
              </h3>
              <p className={styles.estateSummary}>
                {ar
                  ? "مساحات مكتبية مرنة حائزة على تصنيف LEED البلاتيني، مزودة بأنظمة ذكاء اصطناعي لإدارة الطاقة وربط فائق السرعة."
                  : "Flexible commercial headquarters built to international LEED Platinum standards with AI energy optimization."}
              </p>
              <div className={styles.estateSpecsRow}>
                <span>1,200 - 8,000 م²</span>
                <span>•</span>
                <span>{ar ? "شهادة استدامة بلاتينية" : "LEED Platinum"}</span>
                <span>•</span>
                <span>{ar ? "مصاعد سريعة ذكية" : "Smart Lifts"}</span>
              </div>
              <Link href="/offers?type=commercial" className={styles.estateActionBtn}>
                <span>{ar ? "استعراض المقرات التجارية" : "View Commercial Spaces"}</span>
                <ArrowUpLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>

          {/* Card 4: High-Yield Institutional Portfolios */}
          <article className={styles.estateCard}>
            <div className={styles.estateSvgWrap}>
              <InvestmentPlotsSvg className={styles.estateSvgElement} />
              <div className={styles.estateBadgeTag}>
                {ar ? "أصول استثمارية" : "Institutional Portfolios"}
              </div>
            </div>
            <div className={styles.estateCardBody}>
              <div className={styles.estateMetaRow}>
                <span>{ar ? "مخططات الرياض الاستراتيجية" : "Strategic Development Plots"}</span>
                <span className={styles.estatePrice}>{ar ? "عوائد تصل إلى 11.4%" : "Up to 11.4% Cap Rate"}</span>
              </div>
              <h3 className={styles.estateTitle}>
                {ar ? "المحافظ العقارية والأراضي الاستثمارية النوعية" : "Institutional Land & Development Portfolios"}
              </h3>
              <p className={styles.estateSummary}>
                {ar
                  ? "فرص استثمارية كبرى موجهة لصناديق الاستثمار والمستثمرين الاستراتيجيين مع دراسات جدوى مالية معتمدة."
                  : "High-yield strategic land assets and closed portfolios structured for sovereign capital and wealth funds."}
              </p>
              <div className={styles.estateSpecsRow}>
                <span>5,000 - 45,000 م²</span>
                <span>•</span>
                <span>{ar ? "دراسة جدوى جاهزة" : "Certified Feasibility"}</span>
                <span>•</span>
                <span>{ar ? "إفراغ فوري معتمد" : "Instant Escrow"}</span>
              </div>
              <Link href="/offers?type=investment" className={styles.estateActionBtn}>
                <span>{ar ? "استعراض الفرص الاستثمارية" : "View Investment Assets"}</span>
                <ArrowUpLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>

        {/* SECTION FOOTER CTA */}
        <div className={styles.sectionCtaBanner}>
          <div className={styles.ctaBannerText}>
            <h3>{ar ? "هل تبحث عن مواصفات معمارية خاصة؟" : "Seeking Bespoke Architectural Specifications?"}</h3>
            <p>
              {ar
                ? "فريقنا المتخصص في الاستشارات العقارية الخاصة مستعد لتوفير أصول غير معلنة تلائم متطلباتك بدقة."
                : "Our private advisory team curates off-market prime assets tailored precisely to your acquisition mandate."}
            </p>
          </div>
          <div className={styles.ctaBannerActions}>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={styles.primaryGoldBtn}
            >
              <span>{ar ? "طلب استشارة خاصة أو جولة" : "Request Private Consultation"}</span>
              <Calendar size={16} aria-hidden="true" />
            </button>
            <Link href="/offers" className={styles.secondaryGlassBtn}>
              <span>{ar ? "تصفح كافة العروض (60+)" : "Explore All Offers"}</span>
              <ArrowUpLeft size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT 4: ATELIER & FINANCIAL SIMULATOR + SERVICES
          ========================================================================= */}
      <section
        id="act-atelier"
        data-act-section
        className={styles.atelierSection}
        aria-label={ar ? "المنظومة المتكاملة وحاسبة الاستثمار" : "Platform Atelier & Financial Simulator"}
      >
        <div className={styles.sectionHeaderWrap}>
          <div className={styles.sectionBadge}>
            <Calculator size={14} aria-hidden="true" />
            <span>{ar ? "04 / المنظومة المالية والخدمية" : "04 / Atelier & Financial Hub"}</span>
          </div>
          <h2 className={styles.sectionTitle}>
            {ar ? "محاكاة الاستثمار والتمويل العقاري الذكي" : "Smart Investment & Mortgage Simulator"}
          </h2>
          <p className={styles.sectionDesc}>
            {ar
              ? "احسب خطتك التمويلية والعائد الإيجاري المتوقع بدقة متناهية، واكتشف منظومة الخدمات المعتمدة المرافقة لصفقتك."
              : "Model your mortgage installments, rental yields, and net returns with precision, backed by our certified platform services."}
          </p>
        </div>

        <div className={styles.atelierTwoColGrid}>
          {/* COLUMN 1: LIVE INTERACTIVE FINANCIAL CALCULATOR */}
          <div className={styles.calculatorCard}>
            <div className={styles.calculatorCardHeader}>
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-amber-400" aria-hidden="true" />
                <h3 className={styles.calculatorTitle}>
                  {ar ? "حاسبة التمويل والعوائد الاستثمارية" : "Mortgage & ROI Simulator"}
                </h3>
              </div>
              <span className={styles.calculatorBadge}>
                {ar ? "حساب فوري مباشر" : "Live Calculation"}
              </span>
            </div>

            {/* Slider 1: Property Price */}
            <div className={styles.calcSliderGroup}>
              <div className={styles.calcLabelRow}>
                <label htmlFor="prop-price-slider">{ar ? "قيمة الأصل العقاري" : "Property Value"}</label>
                <span className={styles.calcValDisplay}>
                  {propertyPrice.toLocaleString()} {ar ? "ريال" : "SAR"}
                </span>
              </div>
              <input
                id="prop-price-slider"
                type="range"
                min={1500000}
                max={25000000}
                step={250000}
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className={styles.rangeSlider}
              />
              <div className={styles.sliderMinMax}>
                <span>1.5M SAR</span>
                <span>25M SAR</span>
              </div>
            </div>

            {/* Slider 2: Down Payment */}
            <div className={styles.calcSliderGroup}>
              <div className={styles.calcLabelRow}>
                <label htmlFor="down-payment-slider">{ar ? "الدفعة الأولى المقدمة" : "Down Payment"}</label>
                <span className={styles.calcValDisplay}>
                  {downPaymentPct}% ({calculatedMetrics.downPaymentAmount.toLocaleString()} {ar ? "ريال" : "SAR"})
                </span>
              </div>
              <input
                id="down-payment-slider"
                type="range"
                min={10}
                max={50}
                step={5}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className={styles.rangeSlider}
              />
              <div className={styles.sliderMinMax}>
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Slider 3: Loan Tenure */}
            <div className={styles.calcSliderGroup}>
              <div className={styles.calcLabelRow}>
                <label htmlFor="loan-tenure-slider">{ar ? "مدة التمويل العقاري" : "Financing Tenure"}</label>
                <span className={styles.calcValDisplay}>
                  {loanYears} {ar ? "سنة" : "Years"}
                </span>
              </div>
              <input
                id="loan-tenure-slider"
                type="range"
                min={10}
                max={30}
                step={5}
                value={loanYears}
                onChange={(e) => setLoanYears(Number(e.target.value))}
                className={styles.rangeSlider}
              />
              <div className={styles.sliderMinMax}>
                <span>10 {ar ? "سنوات" : "Yrs"}</span>
                <span>30 {ar ? "سنة" : "Yrs"}</span>
              </div>
            </div>

            {/* Real-Time Result Cards */}
            <div className={styles.calcResultsGrid}>
              <div className={styles.calcResultBox}>
                <span className={styles.calcResultLabel}>
                  {ar ? "القسط الشهري التقديري" : "Estimated Monthly Installment"}
                </span>
                <span className={styles.calcResultValue}>
                  {calculatedMetrics.monthlyInstallment.toLocaleString()}
                  <span className={styles.calcCurrency}> {ar ? "ريال/شهر" : "SAR/mo"}</span>
                </span>
              </div>

              <div className={styles.calcResultBox}>
                <span className={styles.calcResultLabel}>
                  {ar ? "الدخل الإيجاري السنوي المتوقع" : "Expected Annual Rent"}
                </span>
                <span className={styles.calcResultValueHighlight}>
                  {calculatedMetrics.estimatedAnnualRent.toLocaleString()}
                  <span className={styles.calcCurrency}> {ar ? "ريال/سنة" : "SAR/yr"}</span>
                </span>
              </div>

              <div className={styles.calcResultBox}>
                <span className={styles.calcResultLabel}>
                  {ar ? "صافي العائد الاستثماري (Cap Rate)" : "Estimated Net Yield"}
                </span>
                <span className={styles.calcResultValueHighlight}>
                  {calculatedMetrics.netRoiPct}%
                </span>
              </div>

              <div className={styles.calcResultBox}>
                <span className={styles.calcResultLabel}>
                  {ar ? "مبلغ التمويل المتبقي" : "Net Financed Amount"}
                </span>
                <span className={styles.calcResultValue}>
                  {calculatedMetrics.loanAmount.toLocaleString()}
                  <span className={styles.calcCurrency}> {ar ? "ريال" : "SAR"}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={styles.calcCtaBtn}
            >
              <span>{ar ? "طلب دراسة جدوى استثمارية مخصصة" : "Request Certified Financial Mandate"}</span>
              <ArrowUpLeft size={16} aria-hidden="true" />
            </button>
          </div>

          {/* COLUMN 2: SERVICES ATELIER & ANIMATED CAD VECTOR */}
          <div className={styles.servicesAtelierCol}>
            <div className={styles.servicesColHeader}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" aria-hidden="true" />
                <h3 className={styles.servicesColTitle}>
                  {ar ? "منظومة الخدمات والوساطة المعتمدة" : "Certified Brokerage Ecosystem"}
                </h3>
              </div>
              <span className={styles.servicesColSub}>
                {ar ? "خدمات متكاملة ترافقك في كل خطوة" : "Comprehensive Advisory"}
              </span>
            </div>

            {/* Animated Services Vector Blueprint */}
            <div className={styles.servicesSvgStage}>
              <ServicesAtelierSvg className={styles.servicesSvg} />
            </div>

            <div className={styles.servicesStack}>
              {/* Service 1 */}
              <Link href="/services" className={styles.serviceItemCard}>
                <div className={styles.serviceItemIconBox}>
                  <Building2 size={20} aria-hidden="true" />
                </div>
                <div className={styles.serviceItemText}>
                  <h4>{ar ? "خدمات ما بعد الشراء والتشغيل المتكامل" : "Post-Purchase & Facility Operations"}</h4>
                  <p>
                    {ar
                      ? "إدارة شاملة للأملاك، الصيانة الوقائية الفنية، التأثيث والتصميم الداخلي مع كبار المهندسين."
                      : "Turnkey property management, preventive maintenance, bespoke interior fit-out, and tenant care."}
                  </p>
                </div>
                <ArrowUpLeft size={18} className={styles.serviceItemArrow} aria-hidden="true" />
              </Link>

              {/* Service 2 */}
              <Link href="/services/legal" className={styles.serviceItemCard}>
                <div className={styles.serviceItemIconBox}>
                  <ShieldCheck size={20} aria-hidden="true" />
                </div>
                <div className={styles.serviceItemText}>
                  <h4>{ar ? "الحوكمة والاستشارات القانونية المعتمدة" : "Legal Governance & Notary Escrow"}</h4>
                  <p>
                    {ar
                      ? "صياغة وتدقيق العقود العقارية، التحقق من الصكوك، والإفراغ الفوري عبر بوابة وزارة العدل ونفاذ."
                      : "Precision title deed verification, contract governance, and instant escrow documentation."}
                  </p>
                </div>
                <ArrowUpLeft size={18} className={styles.serviceItemArrow} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT 5: THE FINALE & ANIMATED SKYLINE SVG
          ========================================================================= */}
      <section
        id="act-finale"
        data-act-section
        className={styles.finaleSection}
        aria-label={ar ? "الخاتمة وحجز الجولات والاعتماد الرسمي" : "The Finale & Verification"}
      >
        <div className={styles.finaleSvgBackdrop}>
          <FinaleSkylineSvg className={styles.finaleSkylineSvg} />
          <div className={styles.finaleOverlay} />
        </div>

        <div className={styles.finaleContentWrap}>
          <div className={styles.finaleHeroBox}>
            <span className={styles.sectionBadge}>
              <Sparkles size={14} aria-hidden="true" />
              <span>{ar ? "05 / الخاتمة والانطلاق" : "05 / The Finale"}</span>
            </span>
            <h2 className={styles.finaleMainHeading}>
              {ar ? "خطوتك القادمة تبدأ هنا" : "Your Next Step Begins Here"}
            </h2>
            <p className={styles.finaleSubHeading}>
              {ar
                ? "من أول استفسار وحتى استلام المفتاح ونقل الملكية، نضع خبراتنا المعمارية والقانونية بين يديك لنصنع تجربة استثمار استثنائية تفوق التوقعات."
                : "From the initial consultation to handover and certified deed transfer, our architectural and legal expertise ensures an unparalleled acquisition experience."}
            </p>

            <div className={styles.finaleActionButtons}>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={styles.finalePrimaryBtn}
              >
                <span>{ar ? "حجز جولة خاصة في مشروع بنان" : "Book Private Tour in Banan"}</span>
                <Calendar size={18} aria-hidden="true" />
              </button>
              <Link href="/offers" className={styles.finaleSecondaryBtn}>
                <span>{ar ? "استعراض كافة العروض" : "Browse All Estates"}</span>
                <ArrowUpLeft size={18} aria-hidden="true" />
              </Link>
              <HomeAccountLink withIcons />
            </div>
          </div>

          {/* OFFICIAL REGULATORY TRUST BADGES (PURE VECTOR SEALS) */}
          <div className={styles.regulatoryTrustContainer}>
            <div className={styles.trustItem}>
              <div className={styles.trustSealSvgWrap}>
                <RegaSealSvg />
              </div>
              <div className={styles.trustText}>
                <strong>{ar ? "الهيئة العامة للعقار (فال)" : "REGA Certified (Fal)"}</strong>
                <span>{ar ? "ترخيص وساطة وتسويق عقاري رسمي" : "Official Brokerage & Marketing License"}</span>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustSealSvgWrap}>
                <NafathSealSvg />
              </div>
              <div className={styles.trustText}>
                <strong>{ar ? "النفاذ الوطني الموحد" : "Nafath Digital SSO"}</strong>
                <span>{ar ? "تحقق رسمي فوري لهوية الأطراف" : "Instant National Identity Verification"}</span>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustSealSvgWrap}>
                <EjarSealSvg />
              </div>
              <div className={styles.trustText}>
                <strong>{ar ? "منصة إيجار المعتمدة" : "Ejar Network"}</strong>
                <span>{ar ? "توثيق العقود السكنية والتجارية" : "Unified Standard Lease Governance"}</span>
              </div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustSealSvgWrap}>
                <WafiSealSvg />
              </div>
              <div className={styles.trustText}>
                <strong>{ar ? "برنامج وافي الحكومي" : "Wafi Framework"}</strong>
                <span>{ar ? "حماية مشاريع البيع على الخارطة" : "Off-Plan Acquisition Protection"}</span>
              </div>
            </div>
          </div>

          {/* ARCHITECTURAL MINIMAL FOOTER */}
          <footer className={styles.landingFooter} role="contentinfo">
            <div className={styles.footerUpperRow}>
              <div className={styles.footerBrandBlock}>
                <Image
                  src={
                    settings.isDark
                      ? settings.logoWhiteUrl || "/icons/white.png"
                      : settings.logoBlackUrl || "/icons/black.png"
                  }
                  width={110}
                  height={38}
                  alt={ar ? "الوساطة الرقمية" : "Digital Brokerage"}
                  unoptimized
                />
                <span className={styles.footerBrandDesc}>
                  {ar
                    ? "منصة وساطة معمارية ورقمية معتمدة بالمملكة العربية السعودية."
                    : "Certified architectural & digital real estate brokerage in Saudi Arabia."}
                </span>
              </div>

              <ul className={styles.footerNavigationLinks}>
                <li>
                  <Link href="/offers" className={styles.footerNavLink}>
                    {ar ? "العروض العقارية" : "Offerings"}
                  </Link>
                </li>
                <li>
                  <Link href="/services" className={styles.footerNavLink}>
                    {ar ? "دليل الخدمات" : "Services"}
                  </Link>
                </li>
                <li>
                  <Link href="/services/legal" className={styles.footerNavLink}>
                    {ar ? "الحلول القانونية" : "Legal Advisory"}
                  </Link>
                </li>
                <li>
                  <Link href="/about" className={styles.footerNavLink}>
                    {ar ? "عن المنصة" : "About"}
                  </Link>
                </li>
                <li>
                  <Link href="/customerservice" className={styles.footerNavLink}>
                    {ar ? "خدمة العملاء" : "Customer Support"}
                  </Link>
                </li>
              </ul>

              <button
                type="button"
                onClick={scrollToTop}
                className={styles.backToTopBtn}
                aria-label={ar ? "العودة إلى أعلى الصفحة" : "Back to top"}
              >
                <span>{ar ? "أعلى الصفحة" : "Back to Top"}</span>
                <ArrowUp size={15} aria-hidden="true" />
              </button>
            </div>

            <div className={styles.footerLowerRow}>
              <p>
                {ar
                  ? "جميع الحقوق محفوظة © 2026 منصة الوساطة الرقمية • مرخصة من الهيئة العامة للعقار (فال)"
                  : "All Rights Reserved © 2026 Digital Brokerage Platform • Certified by REGA"}
              </p>
              <div className={styles.footerLegalLinks}>
                <Link href="/about">{ar ? "الشروط والأحكام" : "Terms & Conditions"}</Link>
                <span>•</span>
                <Link href="/about">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</Link>
              </div>
            </div>
          </footer>
        </div>
      </section>

      {/* =========================================================================
          VIP PRIVATE TOUR & CONSULTATION MODAL
          ========================================================================= */}
      {isModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)} />
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-amber-400" aria-hidden="true" />
                <h3 className={styles.modalHeading}>
                  {ar ? "حجز جولة خاصة أو استشارة استثمارية" : "Book Private Tour or Consultation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={styles.modalCloseBtn}
                aria-label={ar ? "إغلاق" : "Close"}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {modalSuccess ? (
              <div className={styles.modalSuccessBox}>
                <CheckCircle2 size={44} className="text-emerald-400" aria-hidden="true" />
                <h4>{ar ? "تم استلام طلبك بنجاح" : "Request Received Successfully"}</h4>
                <p>
                  {ar
                    ? "سيتواصل معك مستشارنا العقاري المعتمد خلال أقل من ساعتين لتنسيق موعد الجولة الخاصة وتزويدك بكافة الكتيبات."
                    : "Our certified private advisor will contact you within 2 hours to confirm your private tour itinerary."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="client-name-input">
                    {ar ? "الاسم الكامل الكريم" : "Full Name"}
                  </label>
                  <input
                    id="client-name-input"
                    type="text"
                    required
                    placeholder={ar ? "مثال: عبد الرحمن السديري" : "e.g. John Doe"}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="client-phone-input">
                    {ar ? "رقم الجوال للتواصل" : "Mobile Number"}
                  </label>
                  <input
                    id="client-phone-input"
                    type="tel"
                    required
                    placeholder={ar ? "05xxxxxxxx" : "+966 5x xxx xxxx"}
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="interest-select">
                    {ar ? "الأصل أو المشروع المطلوب معاينته" : "Estate or Project of Interest"}
                  </label>
                  <select
                    id="interest-select"
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="مشروع بنان - فلل ريزيدنس الفاخرة">
                      {ar ? "مشروع بنان - فلل ريزيدنس الفاخرة" : "Banan Smart City - Sovereign Villas"}
                    </option>
                    <option value="بنتهاوس الأفق وسماء بنان">
                      {ar ? "بنتهاوس الأفق وسماء بنان" : "Horizon Sky Penthouses"}
                    </option>
                    <option value="الأبراج الذكية والمقرات التجارية">
                      {ar ? "الأبراج الذكية والمقرات التجارية" : "Smart Corporate Towers"}
                    </option>
                    <option value="استشارة استثمارية عامة">
                      {ar ? "استشارة استثمارية وتمويلية شاملة" : "Comprehensive Advisory & Valuation"}
                    </option>
                  </select>
                </div>

                <p className={styles.formDisclaimer}>
                  <ShieldCheck size={14} className="text-emerald-400" aria-hidden="true" />
                  <span>
                    {ar
                      ? "بياناتك محمية وموثقة وفق نظام حماية البيانات الشخصية بالمملكة."
                      : "Your data is strictly confidential and protected under Saudi PDP regulations."}
                  </span>
                </p>

                <button type="submit" className={styles.modalSubmitBtn}>
                  <span>{ar ? "تأكيد طلب الجولة الخاصة" : "Confirm Private Tour Request"}</span>
                  <ArrowUpLeft size={16} aria-hidden="true" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
