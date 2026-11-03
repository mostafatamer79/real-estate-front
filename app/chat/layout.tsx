import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/chat", "المحادثات", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
