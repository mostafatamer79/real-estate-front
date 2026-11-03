export type GeideaSession = { sessionId: string; scriptUrl: string };
export type GeideaPaymentTarget = { bookingId?: string; invoiceId?: string; subscriptionId?: string; walletTopupAmount?: number };
export type GeideaVerification = { paid: boolean; status?: 'pending' | 'failed' | 'cancelled' };

export function geideaPendingKey(userId: string, target: GeideaPaymentTarget): string {
  return 'geidea:pending:' + JSON.stringify([userId, target.bookingId || null, target.invoiceId || null,
    target.subscriptionId || null, target.walletTopupAmount ?? null]);
}

export function readGeideaPending(key: string): string | null {
  try {
    const value = window.sessionStorage.getItem(key);
    return value && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) ? value : null;
  } catch { return null; }
}

export function saveGeideaPending(key: string, orderId: string | null): void {
  try {
    if (orderId) window.sessionStorage.setItem(key, orderId);
    else window.sessionStorage.removeItem(key);
  } catch { /* Storage restrictions must not prevent a verified payment. */ }
}
type CheckoutResult = {
  orderId?: string; responseCode?: string; detailedResponseCode?: string;
  detailResponseCode?: string; reference?: string;
};

export class GeideaCheckoutError extends Error {
  readonly responseCode?: string;
  readonly detailedResponseCode?: string;
  readonly reference?: string;

  constructor(reason: string, result: CheckoutResult = {}) {
    super(reason);
    this.name = 'GeideaCheckoutError';
    const code = (value: unknown) => typeof value === 'string' && /^[0-9.]{1,16}$/.test(value) ? value : undefined;
    this.responseCode = code(result.responseCode);
    this.detailedResponseCode = code(result.detailedResponseCode || result.detailResponseCode);
    this.reference = typeof result.reference === 'string'
      && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(result.reference) ? result.reference : undefined;
  }
}
type CheckoutConstructor = new (
  onSuccess: (result: CheckoutResult) => void,
  onError: (result: CheckoutResult) => void,
  onCancel: (result: CheckoutResult) => void,
) => { startPayment: (sessionId: string) => void };

declare global {
  interface Window { GeideaCheckout?: CheckoutConstructor }
}

let scriptPromise: Promise<CheckoutConstructor> | undefined;

async function loadCheckout(scriptUrl: string): Promise<CheckoutConstructor> {
  const allowed = [
    'https://www.ksamerchant.geidea.net/hpp/geideaCheckout.min.js',
    'https://www.merchant.geidea.net/hpp/geideaCheckout.min.js',
    'https://payments.geidea.ae/hpp/geideaCheckout.min.js',
  ];
  if (!allowed.includes(scriptUrl)) throw new Error('Invalid Geidea script URL');
  if (window.GeideaCheckout) return window.GeideaCheckout;
  if (!scriptPromise) {
    scriptPromise = new Promise<CheckoutConstructor>((resolve, reject) => {
      const script = document.createElement('script');
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        scriptPromise = undefined;
        reject(new Error('failed'));
      };
      const timer = setTimeout(fail, 15_000);
      script.src = scriptUrl;
      script.async = true;
      script.onerror = fail;
      script.onload = () => {
        if (!window.GeideaCheckout) return fail();
        clearTimeout(timer);
        resolve(window.GeideaCheckout);
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export async function payWithGeidea(
  session: GeideaSession,
  verifyOrder: (orderId: string) => Promise<GeideaVerification>,
): Promise<void> {
  const Checkout = await loadCheckout(session.scriptUrl);
  return new Promise((resolve, reject) => {
    let handled = false;
    const finish = (error: string, result?: CheckoutResult) => {
      if (handled) return;
      handled = true;
      reject(new GeideaCheckoutError(error, result));
    };
    const verify = (result: CheckoutResult = {}) => {
      if (handled) return;
      handled = true;
      if (!result.orderId) return reject(new GeideaCheckoutError('failed', result));
      verifyOrder(result.orderId).then(
        ({ paid, status }) => paid ? resolve() : reject(new GeideaCheckoutError(status || 'pending', result)),
        () => reject(new GeideaCheckoutError('pending', result)),
      );
    };
    const checkout = new Checkout(
      verify,
      (result = {}) => result.orderId ? verify(result) : finish('failed', result),
      (result = {}) => result.orderId ? verify(result) : finish('cancelled', result),
    );
    checkout.startPayment(session.sessionId);
  });
}
