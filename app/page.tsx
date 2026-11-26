import JsonLd from "@/components/seo/JsonLd";
import PortalHome from "@/components/home/PortalHome";
import { absoluteUrl, PUBLIC_PAGES, SITE_NAME, SITE_DESCRIPTION, buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/", PUBLIC_PAGES["/"].title, SITE_DESCRIPTION);

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": absoluteUrl("/#organization"),
              name: SITE_NAME,
              alternateName: "Digital Brokerage",
              url: absoluteUrl("/"),
              logo: absoluteUrl("/icons/icon-512x512.png"),
            },
            {
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: SITE_NAME,
              alternateName: "Digital Brokerage",
              url: absoluteUrl("/"),
              inLanguage: "ar-SA",
              publisher: { "@id": absoluteUrl("/#organization") },
            },
          ],
        }}
      />
      <PortalHome />
    </>
  );
}
