import { publicPageMetadata } from "@/lib/seo-data";

export function generateMetadata() { return publicPageMetadata("/customerservice/faq"); }

export default function PublicLayout({ children }: { children: React.ReactNode }) { return children; }
