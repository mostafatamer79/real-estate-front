import type { GeideaPaymentTarget } from './geidea';

export type CheckoutTargetType = 'invoice' | 'booking' | 'subscription';

export interface CheckoutTargetInfo {
  type: CheckoutTargetType | null;
  id: string | null;
  returnUrl: string | null;
  loginHref: string;
}

/**
 * Validates whether an object is a well-formed single-target checkout object.
 */
export function isValidCheckoutTarget(target: unknown): target is GeideaPaymentTarget {
  if (!target || typeof target !== 'object') return false;
  const t = target as Record<string, unknown>;
  const allowedKeys = ['invoiceId', 'bookingId', 'subscriptionId'];
  const allKeys = Object.keys(t);
  if (allKeys.length !== 1) return false;
  const key = allKeys[0];
  if (!allowedKeys.includes(key)) return false;
  const val = t[key];
  return typeof val === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Extracts validated target type and ID from a GeideaPaymentTarget.
 */
export function getTargetMetadata(target: GeideaPaymentTarget | null): {
  type: CheckoutTargetType | null;
  id: string | null;
} {
  if (!target) return { type: null, id: null };
  if (target.invoiceId) return { type: 'invoice', id: target.invoiceId };
  if (target.bookingId) return { type: 'booking', id: target.bookingId };
  if (target.subscriptionId) return { type: 'subscription', id: target.subscriptionId };
  return { type: null, id: null };
}

/**
 * Generates a safe redirect URL for guests to log in and return to the exact validated checkout target.
 */
export function buildGuestLoginUrl(target: GeideaPaymentTarget | null): string {
  if (!target || !isValidCheckoutTarget(target)) {
    return '/login?next=%2Fwallet';
  }
  const { type, id } = getTargetMetadata(target);
  if (!type || !id) {
    return '/login?next=%2Fwallet';
  }

  const queryKey = type === 'invoice' ? 'invoiceId' : type === 'booking' ? 'bookingId' : 'subscriptionId';
  const returnPath = `/checkout?${queryKey}=${encodeURIComponent(id)}`;
  return `/login?next=${encodeURIComponent(returnPath)}`;
}

/**
 * Returns localized operational labels for checkout targets.
 */
export function getTargetDisplayLabel(
  type: CheckoutTargetType | null,
  language: 'ar' | 'en'
): string {
  const isAr = language === 'ar';
  switch (type) {
    case 'invoice':
      return isAr ? 'سداد فاتورة منصة' : 'Platform Invoice Payment';
    case 'booking':
      return isAr ? 'سداد حجز عقاري' : 'Property Booking Payment';
    case 'subscription':
      return isAr ? 'سداد اشتراك باقة' : 'Package Subscription Payment';
    default:
      return isAr ? 'دفع إلكتروني آمن' : 'Secure Online Payment';
  }
}
