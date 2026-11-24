import { safeReturnTo } from './auth-navigation';
import { isPublicBrowsingPath } from './seo';

/** Leave sign-in for a public page without returning to an authentication guard. */
export function publicLoginExit(value: string | null | undefined, origin?: string): string {
  let candidate = value;
  if (origin && candidate) {
    try {
      const url = new URL(candidate, origin);
      if (url.origin !== origin) return '/';
      candidate = url.pathname + url.search + url.hash;
    } catch { return '/'; }
  }
  const safe = safeReturnTo(candidate);
  if (!safe) return '/';
  const pathname = new URL(safe, 'https://local.invalid').pathname;
  return isPublicBrowsingPath(pathname) || ['/services/form', '/services/legal', '/customerservice/support'].includes(pathname) ? safe : '/';
}
