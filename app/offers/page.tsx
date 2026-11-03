import Link from "next/link";
import OffersClient from "./OffersClient";
import JsonLd from "@/components/seo/JsonLd";
import { PUBLIC_PAGES, breadcrumbSchema, isPageEnabled, offerTitle, offerDescription } from "@/lib/seo";
import { publicPageMetadata, getSeoSettings, getPublicOffers } from "@/lib/seo-data";

export function generateMetadata() { return publicPageMetadata("/offers"); }

export default async function OffersPage() {
  const settings = await getSeoSettings();
  if (!isPageEnabled("/offers", settings)) return <OffersClient />;
  const offers = await getPublicOffers();
  return <>
    <JsonLd data={breadcrumbSchema("/offers", PUBLIC_PAGES["/offers"].title)} />
    <OffersClient>
      <section className="bg-slate-950 text-white px-4 sm:px-6 py-8 sm:py-10" dir="rtl" aria-labelledby="public-offers-heading">
        <div className="mx-auto max-w-6xl">
          <nav className="mb-6 text-sm text-slate-300"><Link href="/" className="underline">الرئيسية</Link> / العروض العقارية</nav>
          <h1 id="public-offers-heading" className="text-3xl font-bold mb-4">العروض العقارية في السعودية</h1>
          <p className="text-slate-300 leading-loose">{PUBLIC_PAGES["/offers"].description}</p>
          {offers.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-7">
            {offers.slice(0, 24).map((offer) => <article key={offer.id} className="rounded-2xl border border-white/15 p-5">
              <h2 className="text-lg font-bold"><Link href={`/offers/${offer.id}`} className="hover:underline">{offerTitle(offer)}</Link></h2>
              <p className="mt-3 text-sm text-slate-300 leading-loose">{offerDescription(offer)}</p>
            </article>)}
          </div>}
        </div>
      </section>
    </OffersClient>
  </>;
}
