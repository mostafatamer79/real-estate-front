"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpLeft, Building2, ChevronLeft, ChevronRight, Expand, MousePointer2, Play, RotateCcw } from "lucide-react";
import HomeAccountLink from "@/components/HomeAccountLink";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { SERVICE_CATALOG } from "@/lib/service-catalog";
import type { createBuildingScene } from "./building-scene";
import "./home-walkthrough.css";

type Scene = ReturnType<typeof createBuildingScene>;
export default function HomeWalkthrough() {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const ar = language === "ar";
  const [active, setActive] = useState(0);
  const [feature, setFeature] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [introActive, setIntroActive] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const canvas = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const labels = useRef<(HTMLButtonElement | null)[]>([]);
  const selectRef = useRef<(floor: number) => void>(() => {});
  const theme = useRef(settings.isDark); theme.current = settings.isDark;
  const introProgress = useRef<HTMLDivElement>(null);
  const introButton = useRef<HTMLButtonElement>(null);
  const floors = useMemo(() => ar ? [
    { name: "الاستقبال", subtitle: "تعرّف على المنصة وابدأ من المكان المناسب", title: "كل ما تحتاجه.\nابدأ من الاستقبال.", intro: "الوساطة الرقمية تجمع خدماتك العقارية ومساحات العمل والعروض في منصة واحدة. تعرّف على كل طابق، ثم اختر القسم المناسب لك عندما تكون جاهزًا.", href: "/login", action: "تسجيل الدخول أو إنشاء حساب", note: "يمكنك استعراض الدليل والعروض دون حساب. تحتاج إلى تسجيل الدخول للطلبات ومساحات العمل.", items: [
      ["حسابك وبياناتك", "أنشئ حسابك، أكمل بياناتك الشخصية والتوثيق المطلوب، ثم حدّث ملفك ومستنداتك من صفحة الحساب."],
      ["متابعة واضحة", "تابع طلباتك ورسائلك وإشعاراتك، وراجع المستندات والفواتير المرتبطة بالخدمات من حسابك."],
      ["المساعدة والتواصل", "اطلع على الأسئلة الشائعة أو تواصل مع خدمة العملاء إذا احتجت إلى مساعدة في اختيار الخدمة أو استخدام المنصة."],
    ] },
    { name: "الخدمات", subtitle: "من اختيار الخدمة إلى متابعة الطلب", title: "خدمات للعقار.\nفي كل مرحلة.", intro: "اختر نوع الخدمة، تعرّف على متطلباتها، وأرسل بيانات طلبك ومرفقاته. يمكنك بعد ذلك متابعة الحالة والتواصل المرتبط بالطلب من حسابك.", href: "/services", action: "استعرض الخدمات", note: "تختلف متطلبات الخدمة وتوافرها بحسب القسم. تظهر لك التفاصيل قبل تقديم الطلب.", items: Object.values(SERVICE_CATALOG).map(service => [service.title, service.description]) },
    { name: "الداخلية", subtitle: "مساحة العمل والإدارة لفريقك", title: "عمليات مترابطة.\nوعمل منظّم.", intro: "الداخلية هي مساحة تنفيذ العمل وإدارته. تنتقل منها إلى الأدوات المتاحة لحسابك لإدارة الأملاك والعمليات المالية والقانونية والتسويقية، ضمن صلاحيات فريقك.", href: "/internal", action: "افتح مساحة العمل الداخلية", note: "تحتاج إلى تسجيل الدخول. الأقسام والإجراءات المتاحة تعتمد على صلاحيات حسابك.", items: [
      ["إدارة الأملاك والمباني", "نظّم العقارات والوحدات والمستأجرين، وتابع عقود الإيجار والمدفوعات والصيانة والمستندات المرتبطة بها."],
      ["المالية والمستندات", "راجع المدفوعات والمصروفات والعمولات والفواتير، وتابع الملفات والحركات المالية بحسب الصلاحيات المتاحة."],
      ["القانونية والتسويق", "تابع الطلبات القانونية والعقود والتوثيق، وأدر طلبات التصوير والتسويق والحملات من أقسام العمل المختصة."],
      ["الفريق والتواصل", "تعاون عبر المحادثات المرتبطة بالعمل، وراجع الطلبات والمهام المتاحة لكل عضو بحسب دوره في الفريق."],
    ] },
    { name: "العروض والطلبات", subtitle: "اكتشف العقار المناسب وتابع اهتمامك به", title: "ابحث عن عقارك.\nوتابع الخطوة التالية.", intro: "استعرض العروض العقارية، قارن المعلومات المتاحة، ثم افتح تفاصيل العقار. وإذا كنت تبحث عن مواصفات محددة، يمكنك تقديم طلب عقاري من حسابك.", href: "/offers", action: "استكشف العروض العقارية", note: "تصفح العروض متاح للزوار. المواعيد والطلبات والتواصل المرتبط بحسابك قد تتطلب تسجيل الدخول.", items: [
      ["البحث والتصفية", "استعرض العقارات بحسب المدينة والحي والنوع والمساحة والسعر، لتصل إلى العروض الأقرب لاحتياجك."],
      ["تفاصيل العقار", "اطلع على الصور والموقع والمواصفات والمعلومات والمرفقات التي يتيحها صاحب العرض قبل اتخاذ الخطوة التالية."],
      ["الطلبات والمواعيد", "سجّل احتياجك العقاري، وتابع طلباتك ومواعيد الزيارة والتواصل المرتبط بالعقار من حسابك."],
    ] },
  ] : [
    { name: "Reception", subtitle: "Find your way around the platform", title: "Everything you need.\nStart at reception.", intro: "Digital Brokerage brings property services, internal workspaces, and listings together. Explore each floor and open the right area when you are ready.", href: "/login", action: "Sign in or create an account", note: "Explore this guide and public listings without an account. Requests and workspaces require sign-in.", items: [
      ["Your account", "Create an account, complete your profile and required verification, and manage your details and documents."],
      ["Stay informed", "Follow your requests, conversations, and notifications, and review service documents and invoices in your account."],
      ["Help and support", "Read frequently asked questions or contact customer service for help choosing a service or using the platform."],
    ] },
    { name: "Services", subtitle: "From choosing a service to following your request", title: "Property services.\nAt every stage.", intro: "Choose a service, review its requirements, and submit your information and attachments. Follow its progress and related conversations in your account.", href: "/services", action: "Explore services", note: "Requirements and availability vary by service. Review the details before submitting a request.", items: [
      ["After-purchase services", "Home maintenance, cleaning, moving, furnishing, security systems, and other services for your property."],
      ["Legal services", "Property disputes, contracts, documentation, and other legal requests."],
      ["Construction and contracting", "Construction, engineering design, finishing, and site supervision services."],
      ["Property marketing", "Property photography and advertising campaign requests."],
      ["Other services", "Property valuation, surveying, financing enquiries, and other property-related requests."],
    ] },
    { name: "Internal workspace", subtitle: "The workspace for your team and operations", title: "Connected operations.\nOrganized work.", intro: "Internal is where work is managed and delivered. Open the property, financial, legal, and marketing tools available to your team and account.", href: "/internal", action: "Open the Internal workspace", note: "Sign-in is required. Available departments and actions depend on your account permissions.", items: [
      ["Property management", "Organize properties, units, tenants, leases, payments, maintenance, and related documents."],
      ["Finance and documents", "Review payments, expenses, commissions, invoices, files, and financial activity within your permissions."],
      ["Legal and marketing", "Manage legal requests, contracts, and documentation, alongside photography and marketing work in the relevant departments."],
      ["Team and conversations", "Collaborate through work-related conversations and access requests and activities appropriate to each team member’s role."],
    ] },
    { name: "Offers & requests", subtitle: "Find a property and follow your next step", title: "Find your property.\nFollow what comes next.", intro: "Browse listings, compare the available information, and open a property's details. Submit a property request from your account when you have specific requirements.", href: "/offers", action: "Explore property listings", note: "Visitors can browse listings. Appointments, requests, and account conversations may require sign-in.", items: [
      ["Search and filter", "Find listings by city, neighborhood, property type, area, and price."],
      ["Property details", "Review the photographs, location, specifications, and documents provided with a listing."],
      ["Requests and appointments", "Submit your property requirements and follow requests, visit appointments, and related conversations in your account."],
    ] },
  ], [ar]);
  const select = (floor: number) => { setActive(floor); setFeature(0); scene.current?.selectFloor(floor); };
  selectRef.current = select;
  const current = floors[active];
  const selectedItem = current.items[feature] || current.items[0];
  const itemKey = `${active}:${feature}`;
  const isSaved = saved.includes(itemKey);
  const finishIntro = () => {
    scene.current?.stopIntro(); setIntroActive(false);
    try { sessionStorage.setItem("db-cinematic-intro-seen", "1"); } catch {}
  };
  useEffect(() => {
    try { if (sessionStorage.getItem("db-cinematic-intro-seen") || matchMedia("(prefers-reduced-motion: reduce)").matches) setIntroActive(false); } catch { setIntroActive(false); }
  }, []);
  useEffect(() => { scene.current?.setTheme(settings.isDark); }, [settings.isDark]);
  useEffect(() => { scene.current?.setExpanded(expanded); }, [expanded]);
  useEffect(() => { scene.current?.setGuides(floors.map(floor => ({ name: floor.name, items: floor.items }))); }, [floors, ready]);
  useEffect(() => {
    if (!introActive || !ready || !scene.current) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden"; introButton.current?.focus();
    scene.current.playIntro(() => { setIntroActive(false); try { sessionStorage.setItem("db-cinematic-intro-seen", "1"); } catch {} }, value => {
      if (introProgress.current) introProgress.current.style.transform = `scaleX(${value})`;
    });
    return () => { document.documentElement.style.overflow = previous; scene.current?.stopIntro(); };
  }, [introActive, ready]);
  useEffect(() => {
    let cancelled = false;
    const host = canvas.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => { scene.current?.setReducedMotion(media.matches); if (media.matches) setIntroActive(false); };
    const fail = () => { if (!cancelled) { setUnavailable(true); setReady(false); setIntroActive(false); } };
    host.addEventListener("scene-unavailable", fail); media.addEventListener("change", motion);
    import("./building-scene").then(({ createBuildingScene }) => {
      if (cancelled) return;
      try {
        scene.current = createBuildingScene(host, projected => {
          for (const floor of projected) {
            const element = labels.current[floor.floor]; if (!element) continue;
            element.style.transform = `translate(-50%, -50%) translate(${floor.x.toFixed(1)}px, ${floor.y.toFixed(1)}px)`;
            element.style.visibility = floor.visible ? "visible" : "hidden";
          }
        }, floor => selectRef.current(floor));
        scene.current.setTheme(theme.current); motion(); setReady(true);
      } catch { fail(); }
    }).catch(fail);
    return () => { cancelled = true; host.removeEventListener("scene-unavailable", fail); media.removeEventListener("change", motion); scene.current?.dispose(); scene.current = null; };
  }, []);

  return <div className={`floor-guide demo-layout ${introActive ? "is-intro" : ""}`} dir={ar ? "rtl" : "ltr"} data-home-demo>
    {introActive && <div className="floor-cinematic-intro" role="dialog" aria-modal="true" aria-labelledby="cinematic-intro-title" onKeyDown={event => {
      if (event.key === "Escape") finishIntro(); if (event.key === "Tab") { event.preventDefault(); introButton.current?.focus(); }
    }}><div className="floor-intro-brand"><span>{ar ? "مرحبًا بك في" : "WELCOME TO"}</span><h2 id="cinematic-intro-title">{ar ? "الوساطة الرقمية" : "Digital Brokerage"}</h2><p>{ar ? "أربعة طوابق. تجربة واحدة." : "Four floors. One experience."}</p></div>
      <div className="floor-intro-bottom"><button ref={introButton} type="button" onClick={finishIntro}>{ar ? "ابدأ التجربة" : "Start exploring"}<ArrowUpLeft size={16} /></button><div className="floor-intro-track" aria-hidden="true"><div ref={introProgress} /></div></div>
    </div>}
    <header className="demo-page-heading" inert={introActive}><p>{ar ? "الوساطة الرقمية / معاينة تفاعلية" : "DIGITAL BROKERAGE / INTERACTIVE DEMO"}</p><h1>{ar ? "تعرّف على المنصة، طابقًا بطابق." : "Discover the platform, floor by floor."}</h1><span>{ar ? "اختر طابقًا من المجسم، واستكشف تفاصيله هنا. كل التجربة في هذه الصفحة." : "Choose a floor in the model and explore its details here. Everything stays on this page."}</span></header>
    <div className="demo-page-grid" inert={introActive}>
      <section className="demo-copy" aria-labelledby="demo-floor-title">
        <nav className="demo-floor-tabs" aria-label={ar ? "طوابق المنصة" : "Platform floors"}>{floors.map((floor, index) => <button key={floor.name} type="button" data-select-floor={index + 1} aria-pressed={active === index} onClick={() => select(index)}><span>0{index + 1}</span>{floor.name}</button>)}</nav>
        <div className="demo-copy-heading"><span className="demo-floor-badge">0{active + 1}</span><p>{current.subtitle}</p></div>
        <h2 id="demo-floor-title">{current.name}</h2><p className="demo-floor-intro">{current.intro}</p>
        <div className="demo-features" role="group" aria-label={ar ? "اختر جزءًا لتجربته" : "Choose a feature to preview"}>{current.items.map(([title], index) => <button key={title} type="button" aria-pressed={feature === index} onClick={() => { setFeature(index); scene.current?.setFeature(index); }}>{title}</button>)}</div>
        <div className="demo-detail" aria-live="polite"><span>{ar ? "داخل هذا القسم" : "IN THIS AREA"}</span><h3>{selectedItem[0]}</h3><p>{selectedItem[1]}</p>
          <button className={`demo-save ${isSaved ? "is-saved" : ""}`} type="button" aria-pressed={isSaved} onClick={() => setSaved(previous => isSaved ? previous.filter(key => key !== itemKey) : [...previous, itemKey])}>{isSaved ? (ar ? "تمت الإضافة إلى قائمتي ✓" : "Added to my list ✓") : (ar ? "أضف إلى قائمة التجربة" : "Add to demo list")}</button>
        </div>
        <div className="demo-actions"><HomeAccountLink withIcons /><span>{ar ? `قائمة التجربة: ${saved.length}` : `Demo list: ${saved.length}`}</span></div>
        <p className="demo-disclaimer">{ar ? "هذه معاينة تفاعلية. الاختيارات هنا لا تُرسل طلبات ولا تنفّذ مدفوعات." : "This is an interactive demo. Selections do not submit requests or make payments."}</p>
      </section>
      <aside className="floor-model-panel" aria-label={ar ? "المجسم التفاعلي بجانب المحتوى" : "Interactive model beside the content"}>
        <div className="floor-model-heading"><span><Building2 size={16} />{ar ? "مبنى المنصة" : "The platform building"}</span><span>0{active + 1} / 04</span></div>
        <div className={`floor-model-stage ${ready ? "is-ready" : ""}`}><div className="floor-model-canvas" ref={canvas} data-building-scene />{!ready && <div className="floor-model-fallback" aria-hidden="true" />}
          {ready && !unavailable && <div className="floor-model-labels" role="group" aria-label={ar ? "اختر الطابق من المجسم" : "Select a model floor"}>{floors.map((floor, index) => <button key={floor.name} ref={element => { labels.current[index] = element; }} type="button" aria-pressed={active === index} onClick={() => select(index)}><span>0{index + 1}</span><strong>{floor.name}</strong></button>)}</div>}
        </div>
        <div className="floor-model-tools"><button type="button" disabled={!ready || unavailable} onClick={() => scene.current?.rotate(-1)} aria-label={ar ? "تدوير يمينًا" : "Rotate right"}><ChevronRight size={17} /></button><button type="button" disabled={!ready || unavailable} aria-pressed={expanded} onClick={() => setExpanded(!expanded)}><Expand size={15} />{expanded ? (ar ? "تجميع الطوابق" : "Bring together") : (ar ? "فصل الطوابق" : "Separate floors")}</button><button type="button" disabled={!ready || unavailable} onClick={() => scene.current?.rotate(1)} aria-label={ar ? "تدوير يسارًا" : "Rotate left"}><ChevronLeft size={17} /></button><button type="button" disabled={!ready || unavailable} onClick={() => { setExpanded(false); scene.current?.resetView(); }} aria-label={ar ? "إعادة ضبط المجسم" : "Reset model view"}><RotateCcw size={14} /></button><button type="button" onClick={() => setIntroActive(true)} aria-label={ar ? "إعادة المقدمة" : "Replay intro"}><Play size={14} /></button></div>
        <p className="floor-model-help"><MousePointer2 size={13} />{ar ? "اسحب المجسم يمينًا ويسارًا، أو اختر طابقًا." : "Drag the model left or right, or select a floor."}</p>
      </aside>
    </div>
  </div>;
}
