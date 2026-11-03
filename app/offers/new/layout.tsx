import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/offers/new", "إضافة عرض عقاري", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
