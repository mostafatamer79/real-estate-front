import type { ProviderOffer } from './providers';

type Selection = { providerId: string; amount: number; platformFee: number };
type Contact = { unlocked: boolean; phone: string | null; name?: string };
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const amount = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const identifier = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const offer = (value: unknown): value is ProviderOffer => record(value) && identifier(value.providerId) && amount(value.amount) &&
  (value.deliveryMode === 'online' || value.deliveryMode === 'in_person') && typeof value.createdAt === 'string' &&
  (value.note === undefined || typeof value.note === 'string');
const selection = (value: unknown): value is Selection => record(value) && identifier(value.providerId) && amount(value.amount) && amount(value.platformFee);

/** Validate before formatting values; never reveal a locked contact payload. */
export function providerPanelView(value: unknown, contactValue: unknown, admin = false): { offers: ProviderOffer[]; selection: Selection | null; contact: Contact | null } {
  if (!record(value) || !Array.isArray(value.offers) || !value.offers.every(offer) ||
    !(value.selection === null || selection(value.selection))) throw new Error('Invalid provider offers response');
  let contact: Contact | null = null;
  if (!admin) {
    if (!record(contactValue) || typeof contactValue.unlocked !== 'boolean' ||
      !(contactValue.phone === null || typeof contactValue.phone === 'string') ||
      !(contactValue.name === undefined || typeof contactValue.name === 'string')) throw new Error('Invalid provider contact response');
    contact = contactValue.unlocked
      ? { unlocked: true, phone: contactValue.phone, ...(typeof contactValue.name === 'string' ? {name: contactValue.name} : {}) }
      : { unlocked: false, phone: null };
  }
  return { offers: value.offers, selection: value.selection, contact };
}
