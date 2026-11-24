import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'تعديل العرض العقاري', robots: { index: false, follow: false } };

export default function EditOfferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
