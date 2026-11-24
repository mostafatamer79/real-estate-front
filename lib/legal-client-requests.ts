import type { ServiceRequest } from './service-request-api';
export type LegalClientRequest = ServiceRequest & { firstParty?: unknown; secondParty?: unknown };
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
export function legalMoney(value: unknown): number | null {
  if (!(typeof value === 'number' || (typeof value === 'string' && value.trim()))) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}
function legalRequest(value: unknown): value is LegalClientRequest {
  if (!record(value) || typeof value.id !== 'string' || !value.id.trim() || value.category !== 'legal' ||
    typeof value.serviceType !== 'string' || typeof value.status !== 'string') return false;
  for (const key of ['city','district','description','clientName','phone','userId','paymentStatus']) {
    if (!(value[key] === undefined || value[key] === null || typeof value[key] === 'string')) return false;
  }
  if (!(value.invoiceSent === undefined || typeof value.invoiceSent === 'boolean') ||
    ![undefined,null,'pending','accepted','rejected'].includes(value.clientDecision as undefined | null | string)) return false;
  if (value.invoicePrice !== undefined && value.invoicePrice !== null && legalMoney(value.invoicePrice) === null) return false;
  if (value.user !== undefined && value.user !== null && (!record(value.user) || !(value.user.id === undefined || typeof value.user.id === 'string'))) return false;
  return true;
}
export function legalRequestPage(value: unknown): {items:LegalClientRequest[];total:number;totalPages:number} {
  if (!record(value) || !Array.isArray(value.items) || !value.items.every(legalRequest) || value.items.length > 30 ||
    typeof value.total !== 'number' || !Number.isSafeInteger(value.total) || value.total < value.items.length || value.total < 0 ||
    typeof value.totalPages !== 'number' || !Number.isSafeInteger(value.totalPages) || value.totalPages < 0 ||
    Math.max(1,value.totalPages) !== Math.max(1,Math.ceil(value.total / 30))) throw new Error('Invalid legal requests response');
  if (new Set(value.items.map(item=>item.id)).size !== value.items.length) throw new Error('Duplicate legal requests');
  return {items:value.items,total:value.total,totalPages:Math.max(1,value.totalPages)};
}
export function canDecideLegalInvoice(request: LegalClientRequest, userId?: string): boolean {
  const owner = request.userId || request.user?.id;
  return Boolean(userId && owner === userId && request.invoiceSent && request.clientDecision === 'pending' && request.paymentStatus !== 'paid');
}
export function legalDecisionResult(value: unknown, id: string, decision:'accepted'|'rejected'): LegalClientRequest {
  if (!legalRequest(value) || value.id !== id || !value.invoiceSent || value.clientDecision !== decision) throw new Error('Invalid legal invoice decision response');
  return value;
}
