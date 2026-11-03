import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/seo/JsonLd";
import HomeRedirect from "@/components/seo/HomeRedirect";
import { absoluteUrl, PUBLIC_PAGES, SITE_NAME, SITE_DESCRIPTION, buildPageMetadata, isPageEnabled } from "@/lib/seo";
import { getSeoSettings } from "@/lib/seo-data";
import { SERVICE_CATALOG } from "@/lib/service-catalog";

export const metadata = buildPageMetadata("/", PUBLIC_PAGES["/"].title, SITE_DESCRIPTION);

export default async function Home() {
  const settings = await getSeoSettings();
  const links = Object.entries(PUBLIC_PAGES).filter(([path]) => path !== "/" && isPageEnabled(path, settings));
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <HomeRedirect />
      <JsonLd data={{ "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, alternateName: "Digital Brokerage", url: absoluteUrl("/"), logo: absoluteUrl("/icons/icon-512x512.png") },
        { "@type": "WebSite", "@id": absoluteUrl("/#website"), name: SITE_NAME, alternateName: "Digital Brokerage", url: absoluteUrl("/"), inLanguage: "ar-SA", publisher: { "@id": absoluteUrl("/#organization") } },
      ] }} />
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="flex items-center justify-between gap-5 mb-16">
          <Image src="/icons/white.png" alt={SITE_NAME} width={180} height={70} className="h-16 w-auto object-contain" priority />
          <Link href="/login" className="rounded-xl border border-white/20 px-5 py-3 hover:bg-white/10">تسجيل الدخول</Link>
        </div>
        <div className="max-w-3xl space-y-7">
          <p className="text-sm text-slate-300" lang="en" dir="ltr">Digital Brokerage · Saudi Arabia</p>
          <h1 className="text-4xl sm:text-6xl font-bold leading-snug">الوساطة الرقمية للخدمات والعروض العقارية في السعودية</h1>
          <p className="text-lg leading-loose text-slate-300">{SITE_DESCRIPTION}</p>
          <div className="flex flex-wrap gap-4">
            {isPageEnabled("/offers", settings) && <Link href="/offers" className="rounded-xl bg-white px-6 py-4 font-bold text-slate-950">استعرض العروض العقارية</Link>}
            <Link href="/about" className="rounded-xl border border-white/20 px-6 py-4">تعرف على المنصة</Link>
          </div>
        </div>
        <section className="mt-20" aria-labelledby="platform-features">
          <h2 id="platform-features" className="text-3xl font-bold mb-7">منظومة متكاملة لاحتياجاتك العقارية</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["العروض والطلبات العقارية", "استعرض العروض حسب المدينة والحي والمساحة والسعر، وسجل طلبك العقاري وتابع التواصل والمواعيد من حسابك."],
              ["إدارة الأملاك والمباني", "أدوات لإدارة العقارات والوحدات والمستأجرين والعقود والصيانة من حسابك في المنصة."],
              ["المحفظة والمالية", "تابع الفواتير والعمولات والمستندات والحركة المالية المرتبطة بخدماتك من حسابك."],
              ["خدمات عقارية مساندة", "تعرف على خدمات التسويق العقاري والبناء والمقاولات والخدمات القانونية وخدمات ما بعد الشراء."],
            ].map(([title, text]) => <article key={title} className="rounded-2xl border border-white/10 p-6"><h3 className="text-xl font-bold mb-3">{title}</h3><p className="leading-loose text-slate-300">{text}</p></article>)}
          </div>
        </section>
        {isPageEnabled("/services", settings) && <section className="mt-16" aria-labelledby="property-services">
          <h2 id="property-services" className="text-3xl font-bold mb-7">الخدمات العقارية</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(SERVICE_CATALOG).filter(([id]) => !settings.some((setting) => setting.key === `module_services_${id}` && ["disabled", "soon"].includes(setting.value))).map(([, service]) => <article key={service.title} className="rounded-2xl bg-white/5 p-6"><h3 className="text-xl font-bold mb-3"><Link href="/services" className="hover:underline">{service.title}</Link></h3><p className="leading-loose text-slate-300">{service.description}</p></article>)}
          </div>
        </section>}
        <nav aria-label="تصفح المنصة" className="mt-16 border-t border-white/10 pt-8 flex flex-wrap gap-6">
          {links.map(([path, page]) => <Link key={path} href={path} className="text-slate-300 hover:text-white hover:underline">{page.title}</Link>)}
        </nav>
      </div>
    </div>
  );
}
