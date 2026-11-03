import type { Metadata } from "next";

export const SITE_NAME = "الوساطة الرقمية";
export const SITE_DESCRIPTION = "منصة الوساطة الرقمية للخدمات العقارية في السعودية. استعرض العروض العقارية وتعرف على خدمات التسويق العقاري وإدارة الأملاك والخدمات القانونية والبناء وخدمات ما بعد الشراء.";
const DEFAULT_SITE_URL = "https://www.digitalbrokerage.sa";
export const OFFER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PUBLIC_PAGES: Record<string, { title: string; description: string; section?: string }> = {
  "/": { title: "الوساطة الرقمية | منصة الخدمات والعروض العقارية في السعودية", description: SITE_DESCRIPTION },
  "/about": { title: "عن الوساطة الرقمية", description: "تعرف على الوساطة الرقمية ومنظومة الخدمات العقارية: العروض والطلبات، إدارة الأملاك، التسويق العقاري والخدمات المساندة في السعودية." },
  "/offers": { title: "العروض العقارية في السعودية", description: "استعرض العروض العقارية المتاحة وتفاصيل العقارات حسب المدينة والحي والمساحة والسعر عبر الوساطة الرقمية.", section: "offers" },
  "/services": { title: "الخدمات العقارية", description: "تعرف على خدمات ما بعد الشراء، والخدمات القانونية، والبناء والمقاولات، والتسويق العقاري والخدمات الاستشارية عبر الوساطة الرقمية.", section: "services" },
  "/customerservice": { title: "خدمة العملاء والتواصل", description: "تواصل مع فريق الوساطة الرقمية للاستفسار عن المنصة والخدمات العقارية وطرق الحصول على المساعدة.", section: "customerservice" },
  "/customerservice/contact": { title: "اتصل بنا", description: "طرق التواصل مع فريق الوساطة الرقمية للإجابة عن استفساراتك حول العروض والخدمات العقارية.", section: "customerservice" },
  "/customerservice/faq": { title: "الأسئلة الشائعة عن الخدمات العقارية", description: "إجابات الأسئلة الشائعة حول الوساطة الرقمية والعروض والطلبات العقارية والخدمات والمدفوعات.", section: "customerservice" },
  "/info": { title: "الشروط والسياسات ومعلومات المنصة", description: "اطلع على معلومات الوساطة الرقمية والشروط والأحكام وسياسة الاستخدام والتراخيص وطرق التواصل.", section: "info" },
};

export type PublicSetting = { key: string; value: string };
export type SeoOffer = {
  id: string;
  isActive: boolean;
  propertyType?: string;
  city?: string;
  neighborhood?: string;
  area?: number | string;
  price?: number | string;
  additionalNotes?: string;
  mediaFiles?: string[];
  updatedAt?: string;
};

export function getSiteUrl(): string {
  try {
    const url = new URL(process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function isPublicBrowsingPath(path: string): boolean {
  if (Object.hasOwn(PUBLIC_PAGES, path)) return true;
  const match = /^\/offers\/([^/]+)$/.exec(path);
  return Boolean(match && OFFER_ID_PATTERN.test(match[1]));
}

export function isPageEnabled(path: string, settings: PublicSetting[]): boolean {
  const section = PUBLIC_PAGES[path]?.section || PUBLIC_PAGES[`/${path.split("/")[1]}`]?.section;
  return !section || settings.some((setting) => setting.key === `section_${section}` && setting.value === "open");
}

export function isIndexableOffer(offer: Pick<SeoOffer, "id" | "isActive">): boolean {
  return offer.isActive === true && OFFER_ID_PATTERN.test(offer.id);
}

export function plainText(value: string, maxLength = 170): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function shareImage(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, `${getSiteUrl()}/`);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return undefined;
    if (/\.(mp4|webm|mov)(?:$|\?)/i.test(url.href)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

export function buildPageMetadata(
  path: string,
  title: string,
  description: string,
  options: { index?: boolean; image?: string; siteName?: string } = {},
): Metadata {
  const siteName = options.siteName || SITE_NAME;
  const pageTitle = path === "/" ? title : `${title} | ${siteName}`;
  const url = absoluteUrl(path === "/customerservice/contact" ? "/customerservice" : path);
  const image = shareImage(options.image) || absoluteUrl("/icons/icon-512x512.png");
  const index = options.index ?? isPublicBrowsingPath(path);
  return {
    title: pageTitle,
    description: plainText(description),
    alternates: { canonical: url },
    robots: { index, follow: true, googleBot: { index, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { title: pageTitle, description: plainText(description), url, siteName, locale: "ar_SA", type: "website", images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title: pageTitle, description: plainText(description), images: [image] },
  };
}

export function offerTitle(offer: SeoOffer): string {
  return [offer.propertyType || "عقار", offer.city, offer.neighborhood].filter(Boolean).map((value) => plainText(value!)).join(" - ");
}

export function offerDescription(offer: SeoOffer): string {
  return plainText([
    offerTitle(offer),
    offer.area ? `المساحة ${offer.area} م²` : "",
    Number(offer.price) > 0 ? `السعر ${Number(offer.price).toLocaleString("ar-SA")} ريال سعودي` : "",
    offer.additionalNotes || "استعرض تفاصيل العرض العقاري عبر الوساطة الرقمية.",
  ].filter(Boolean).join(". "));
}

export function buildOfferMetadata(offer: SeoOffer, index = true): Metadata {
  return buildPageMetadata(`/offers/${offer.id}`, offerTitle(offer), offerDescription(offer), {
    index: index && isIndexableOffer(offer),
    image: offer.mediaFiles?.map(shareImage).find(Boolean),
  });
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbSchema(path: string, title: string) {
  const items = [{ "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") }];
  if (path.startsWith("/offers/")) items.push({ "@type": "ListItem", position: 2, name: "العروض العقارية", item: absoluteUrl("/offers") });
  if (path !== "/") items.push({ "@type": "ListItem", position: items.length + 1, name: title, item: absoluteUrl(path) });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}
