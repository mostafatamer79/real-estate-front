import { Suspense } from 'react';
import Content from '@/components/properties/BuildingManagementWorkspace';

export default function Page() {
  return <Suspense fallback={<p role="status" className="p-6">جارٍ التحميل…</p>}><Content /></Suspense>;
}
