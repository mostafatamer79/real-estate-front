import OffersClient from "./OffersClient";
import JsonLd from "@/components/seo/JsonLd";
import { PUBLIC_PAGES, breadcrumbSchema, isPageEnabled } from "@/lib/seo";
import { publicPageMetadata, getSeoSettings } from "@/lib/seo-data";

export function generateMetadata() { return publicPageMetadata("/offers"); }

export default async function OffersPage() {
  const settings = await getSeoSettings();
  if (!isPageEnabled("/offers", settings)) return <OffersClient />;
  return <>
    <JsonLd data={breadcrumbSchema("/offers", PUBLIC_PAGES["/offers"].title)} />
    <OffersClient />
  </>;
}
