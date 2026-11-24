import JsonLd from "@/components/seo/JsonLd";
import { PUBLIC_PAGES, breadcrumbSchema, isPageEnabled } from "@/lib/seo";
import { publicPageMetadata, getSeoSettings } from "@/lib/seo-data";

const path = "/about";
export function generateMetadata() { return publicPageMetadata(path); }

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSeoSettings();
  if (!isPageEnabled(path, settings)) return children;
  return <>
    <JsonLd data={breadcrumbSchema(path, PUBLIC_PAGES[path].title)} />
    {children}
  </>;
}
