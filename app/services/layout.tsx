import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { PUBLIC_PAGES, breadcrumbSchema, isPageEnabled } from "@/lib/seo";
import { publicPageMetadata, getSeoSettings } from "@/lib/seo-data";

const path = "/services";
export function generateMetadata() { return publicPageMetadata(path); }

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSeoSettings();
  if (!isPageEnabled(path, settings)) return children;
  return <>
    <JsonLd data={breadcrumbSchema(path, PUBLIC_PAGES[path].title)} />
    <section dir="rtl" lang="ar" className="bg-slate-950 text-white px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-slate-300 underline">الرئيسية</Link>
        <h1 className="text-2xl sm:text-3xl font-bold mt-5 mb-3">{PUBLIC_PAGES[path].title}</h1>
        <p className="text-slate-300 leading-loose max-w-3xl">{PUBLIC_PAGES[path].description}</p>
      </div>
    </section>
    {children}
  </>;
}
