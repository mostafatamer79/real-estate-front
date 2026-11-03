import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/services/my-requests", "طلبات الخدمات", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
