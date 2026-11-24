import { Suspense } from 'react';
import SignIn from '@/components/auth/SignIn';
export default function LoginPage() {
  return <Suspense fallback={<p role="status" className="p-6">جارٍ التحميل…</p>}><SignIn /></Suspense>;
}
