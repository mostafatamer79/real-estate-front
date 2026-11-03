import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata("/verify-otp", "التحقق من البريد الإلكتروني", "صفحة مخصصة لمستخدمي الوساطة الرقمية.", { index: false });

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
