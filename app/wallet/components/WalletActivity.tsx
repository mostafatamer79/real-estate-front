"use client";

import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

export type WalletEntry = {
  id: string; amount: number | string; description?: string; status: string;
  referenceType?: string; fromUserId?: string; toUserId?: string; transactionDate: string;
};

export default function WalletActivity({ entries }: { entries: WalletEntry[] }) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const ar = language === 'ar';
  const statusText: Record<string, string> = ar
    ? { completed: 'مكتملة', pending: 'قيد المعالجة', failed: 'فشلت', cancelled: 'ملغاة' }
    : { completed: 'Completed', pending: 'Pending', failed: 'Failed', cancelled: 'Cancelled' };
  return (
    <section className="mt-6 rounded-2xl border bg-white p-5" dir={ar ? 'rtl' : 'ltr'}>
      <h2 className="mb-4 text-lg font-bold">{ar ? 'سجل المدفوعات والمحفظة' : 'Payments and wallet activity'}</h2>
      {!entries.length ? <p className="text-sm text-slate-500">{ar ? 'لا توجد حركات حتى الآن.' : 'No activity yet.'}</p> : (
        <ul className="divide-y">
          {entries.slice(0, 30).map(entry => (
            <li key={entry.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium">{entry.description || (ar ? 'حركة مالية' : 'Transaction')}</p>
                <p className="text-xs text-slate-500">{statusText[entry.status] || entry.status} · {new Date(entry.transactionDate).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')}</p>
                {entry.referenceType === 'geidea_payment' && <p className="text-xs text-slate-500">{ar ? 'دفع بالبطاقة؛ لا يخصم من رصيد المحفظة' : 'Card payment; does not reduce wallet balance'}</p>}
              </div>
              <span className="shrink-0 text-sm font-bold" dir="ltr">
                {entry.toUserId === user?.id ? '+' : '−'} <SaudiRiyalAmount amount={Number(entry.amount)} locale={ar ? 'ar-SA' : 'en-US'} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
