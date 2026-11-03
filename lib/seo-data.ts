import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchPublicSettings, getApiBaseUrl } from "@/lib/runtime-config";
import { OFFER_ID_PATTERN, PUBLIC_PAGES, buildPageMetadata, isPageEnabled, isIndexableOffer, type SeoOffer } from "@/lib/seo";

// React cache deduplicates metadata/layout reads within a render; nothing is shared between users.
export const getSeoSettings = cache(fetchPublicSettings);

export async function publicPageMetadata(path: string) {
  const page = PUBLIC_PAGES[path];
  const settings = await getSeoSettings();
  return buildPageMetadata(path, page.title, page.description, { index: isPageEnabled(path, settings) });
}

export const getPublicOffers = cache(async (): Promise<SeoOffer[]> => {
  const response = await fetch(`${getApiBaseUrl()}/offers?isActive=true`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Public listings unavailable: ${response.status}`);
  const offers: unknown = await response.json();
  if (!Array.isArray(offers)) throw new Error("Invalid public listings response");
  return offers.filter((offer): offer is SeoOffer => Boolean(offer && typeof offer === "object" && typeof offer.id === "string" && isIndexableOffer(offer)));
});

export const getSeoOffer = cache(async (id: string): Promise<SeoOffer> => {
  if (!OFFER_ID_PATTERN.test(id)) notFound();
  const response = await fetch(`${getApiBaseUrl()}/offers/${id}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Public listing unavailable: ${response.status}`);
  const offer: SeoOffer = await response.json();
  if (offer.id !== id) throw new Error("Invalid public listing response");
  return offer;
});
