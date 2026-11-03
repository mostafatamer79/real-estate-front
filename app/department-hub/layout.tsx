import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/department-hub", "الأقسام", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
