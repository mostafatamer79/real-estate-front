/**
 * Strict financial amount parsing, validation, and formatting for wallet redesign.
 * Enforces finite positive decimal(2) precision, confirmed balance bounds,
 * and explicit unavailable balance states.
 */

export type AmountValidationError =
  | 'BALANCE_UNAVAILABLE'
  | 'INVALID_FORMAT'
  | 'SUB_CENT'
  | 'ZERO_OR_NEGATIVE'
  | 'EXCEEDS_BALANCE'
  | 'BELOW_MIN'
  | 'EXCEEDS_MAX';

/**
 * Normalizes Eastern Arabic numerals and Arabic decimal commas to standard digits.
 */
export function normalizeNumericString(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/٫/g, '.')
    .replace(/,/g, '');
}

/**
 * Type guard checking if the balance is a known, confirmed, non-negative finite number.
 */
export function isConfirmedBalance(balance: unknown): balance is number {
  return (
    typeof balance === 'number' &&
    Number.isFinite(balance) &&
    !Number.isNaN(balance) &&
    balance >= 0
  );
}

/**
 * Strict parser for positive currency amounts with maximum 2 decimal places.
 * Rejects negative numbers, zero, NaN, Infinity, and sub-cent values.
 */
export function parseFinitePositiveDecimal(
  raw: unknown
): { valid: true; value: number } | { valid: false; error: AmountValidationError } {
  if (raw === null || raw === undefined) {
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  let cleaned = '';
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || Number.isNaN(raw)) {
      return { valid: false, error: 'INVALID_FORMAT' };
    }
    if (raw <= 0) {
      return { valid: false, error: 'ZERO_OR_NEGATIVE' };
    }
    cleaned = raw.toString();
  } else if (typeof raw === 'string') {
    cleaned = normalizeNumericString(raw);
    if (!cleaned) {
      return { valid: false, error: 'INVALID_FORMAT' };
    }
  } else {
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  // Reject negative sign explicitly
  if (cleaned.startsWith('-') || cleaned.startsWith('+')) {
    const num = Number(cleaned);
    if (num <= 0) {
      return { valid: false, error: 'ZERO_OR_NEGATIVE' };
    }
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  // Regex check for unsigned integer or decimal number:
  // e.g. "123", "123.4", "123.45"
  const regex = /^\d+(?:\.(\d+))?$/;
  const match = cleaned.match(regex);
  if (!match) {
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  const fraction = match[1];
  if (fraction && fraction.length > 2) {
    return { valid: false, error: 'SUB_CENT' };
  }

  const value = Number(cleaned);
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  // Sub-cent check on rounded cents as a secondary safety check
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 1e-6) {
    return { valid: false, error: 'SUB_CENT' };
  }

  if (cents <= 0) {
    return { valid: false, error: 'ZERO_OR_NEGATIVE' };
  }

  return { valid: true, value: cents / 100 };
}

/**
 * Validates a withdrawal request against a confirmed balance.
 * Requires:
 * 1. Confirmed balance is available (not null/undefined/NaN).
 * 2. Amount is finite positive decimal(2).
 * 3. Amount does not exceed confirmed balance.
 */
export function validateWithdrawal(
  amountInput: unknown,
  confirmedBalance: number | null | undefined,
  isAvailable: boolean = true
): { ok: true; amount: number } | { ok: false; error: AmountValidationError } {
  if (!isAvailable || !isConfirmedBalance(confirmedBalance)) {
    return { ok: false, error: 'BALANCE_UNAVAILABLE' };
  }

  const parsed = parseFinitePositiveDecimal(amountInput);
  if (!parsed.valid) {
    return { ok: false, error: parsed.error };
  }

  const withdrawalCents = Math.round(parsed.value * 100);
  const balanceCents = Math.round(confirmedBalance * 100);

  if (withdrawalCents > balanceCents) {
    return { ok: false, error: 'EXCEEDS_BALANCE' };
  }

  return { ok: true, amount: withdrawalCents / 100 };
}

/**
 * Validates a wallet top-up / credit addition amount.
 * Enforces positive decimal(2) within [min, max] bounds.
 */
export function validateTopupAmount(
  amountInput: unknown,
  min = 1,
  max = 10000
): { ok: true; amount: number } | { ok: false; error: AmountValidationError } {
  const parsed = parseFinitePositiveDecimal(amountInput);
  if (!parsed.valid) {
    return { ok: false, error: parsed.error };
  }

  if (parsed.value < min) {
    return { ok: false, error: 'BELOW_MIN' };
  }

  if (parsed.value > max) {
    return { ok: false, error: 'EXCEEDS_MAX' };
  }

  return { ok: true, amount: parsed.value };
}

/**
 * Formats confirmed balance for high-contrast financial display.
 * Returns an explicit fallback string if the balance is unconfirmed or unavailable.
 */
export function formatConfirmedBalance(
  balance: number | null | undefined,
  locale = 'en-US',
  fallback = '—'
): string {
  if (!isConfirmedBalance(balance)) {
    return fallback;
  }
  return Number(balance).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
