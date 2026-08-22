/**
 * Tiny haptic feedback helper (mobile only).
 * Silently no-ops on unsupported browsers / desktop.
 */

export function haptic(pattern: number | number[] = 8) {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}

/** Short tick — taps, tab switches, toggles */
export const hapticTick = () => haptic(6);

/** Success chirp — completed actions */
export const hapticSuccess = () => haptic([10, 40, 18]);

/** Error buzz — failed actions */
export const hapticError = () => haptic([16, 50, 16]);
