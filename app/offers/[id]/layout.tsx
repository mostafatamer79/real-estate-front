import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbSchema, buildOfferMetadata, isIndexableOffer, isPageEnabled, offerTitle, offerDescription } from "@/lib/seo";
import { getSeoOffer, getSeoSettings } from "@/lib/seo-data";

type Props = { children: React.ReactNode; params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const [offer, settings] = await Promise.all([getSeoOffer(id), getSeoSettings()]);
  return buildOfferMetadata(offer, isPageEnabled("/offers", settings));
}

export default async function OfferLayout({ children, params }: Props) {
  const { id } = await params;
  const [offer, settings] = await Promise.all([getSeoOffer(id), getSeoSettings()]);
  if (!isIndexableOffer(offer) || !isPageEnabled("/offers", settings)) return children;
  const title = offerTitle(offer);
  const description = offerDescription(offer);
  return <>
    <JsonLd data={breadcrumbSchema(`/offers/${id}`, title)} />
    <JsonLd data={{ "@context": "https://schema.org", "@type": "RealEstateListing", name: title, description, url: absoluteUrl(`/offers/${id}`), inLanguage: "ar-SA", ...(offer.updatedAt && Number.isFinite(Date.parse(offer.updatedAt)) ? { dateModified: offer.updatedAt } : {}) }} />
    <section className="bg-slate-950 text-white px-6 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-4 text-sm text-slate-300 flex gap-3"><Link href="/" className="underline">الرئيسية</Link><span>/</span><Link href="/offers" className="underline">العروض العقارية</Link></nav>
        <h1 className="text-2xl font-bold mb-3">{title}</h1>
        <p className="text-slate-300 leading-loose">{description}</p>
      </div>
    </section>
    {children}
  </>;
}
