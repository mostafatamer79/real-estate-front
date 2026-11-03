import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/share-opinion", "شاركنا رأيك", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
