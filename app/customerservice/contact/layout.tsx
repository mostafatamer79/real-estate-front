import { publicPageMetadata } from "@/lib/seo-data";

export function generateMetadata() { return publicPageMetadata("/customerservice/contact"); }

export default function PublicLayout({ children }: { children: React.ReactNode }) { return children; }
