import type { GeideaPaymentTarget } from './geidea';

export function checkoutTarget(query: URLSearchParams): GeideaPaymentTarget | null {
  const keys = ['invoiceId', 'bookingId', 'subscriptionId'] as const;
  const selected = keys.filter(key => query.has(key));
  if (selected.length !== 1 || query.getAll(selected[0]).length !== 1) return null;
  const value = query.get(selected[0]) || '';
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) return null;
  return { [selected[0]]: value };
}
