import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_PAGES, isPageEnabled } from "@/lib/seo";
import { getSeoSettings, getPublicOffers } from "@/lib/seo-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSeoSettings();
  const pages: MetadataRoute.Sitemap = Object.keys(PUBLIC_PAGES)
    .filter((path) => path !== "/customerservice/contact" && isPageEnabled(path, settings))
    .map((path) => ({ url: absoluteUrl(path) }));
  if (!isPageEnabled("/offers", settings)) return pages;
  // Fail transiently rather than publish a misleading empty sitemap during an API outage.
  const offers = await getPublicOffers();
  return [...pages, ...offers.map((offer) => ({
    url: absoluteUrl(`/offers/${offer.id}`),
    ...(offer.updatedAt && Number.isFinite(Date.parse(offer.updatedAt)) ? { lastModified: new Date(offer.updatedAt) } : {}),
  }))];
}
