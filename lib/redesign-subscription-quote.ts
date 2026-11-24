/**
 * Quote logic for the redesigned subscription selection page (app/subscriptions/new).
 *
 * The pricing source (GET /subscriptions/department-pricing) is the only source of
 * truth for department/seat prices. This module separates three concerns that the
 * previous implementation conflated:
 *
 * 1. Whether the pricing data was actually loaded ("ready") — a failed request must
 *    never be substituted with zeros, otherwise a failed pricing request produces a
 *    fake "free" subscription.
 * 2. Whether a price is known at all ("missing" → unknown) versus a legitimate
 *    explicit zero price returned by the API.
 * 3. Whether the local selection is complete enough to submit a quote request.
 *
 * The server still recalculates and validates the final amount, discounts, seats
 * and activation; these helpers only build the user-facing quote preview.
 */

export type BillingPeriod = "شهري" | "سنوي";

export interface DepartmentPriceEntry {
  monthly?: unknown;
  yearly?: unknown;
}

export interface SubscriptionPricingData {
  departmentPrices?: Record<string, DepartmentPriceEntry>;
  employeeSeatMonthlyPrice?: unknown;
  employeeSeatYearlyPrice?: unknown;
}

/** Availability of the pricing source, tracked separately from its values. */
export type PricingStatus = "loading" | "ready" | "unavailable";

export interface CustomQuoteSelection {
  selectedDepartments: readonly string[];
  /** Finite, non-negative integer count of employee seats (0 when not applicable). */
  employeeSeats: number;
  billingPeriod: BillingPeriod;
}

export interface QuoteLine {
  department: string;
  /** `null` when the pricing source does not provide this price. */
  price: number | null;
}

export interface SeatQuote {
  count: number;
  /** `null` when the pricing source does not provide the seat price. */
  unitPrice: number | null;
  total: number | null;
}

export interface CustomQuote {
  lines: QuoteLine[];
  /** `null` when the employees department is not part of the selection. */
  seats: SeatQuote | null;
  /** `null` when any needed price is unknown; a legitimate 0 stays 0. */
  total: number | null;
  hasUnknownPrices: boolean;
}

export type CustomQuoteBlockReason =
  | "pricing-loading"
  | "pricing-unavailable"
  | "no-departments"
  | "missing-department-price"
  | "missing-seat-price"
  | "missing-seats";

export type CustomQuoteGate =
  | { canSubmit: true; blockReason: null }
  | { canSubmit: false; blockReason: CustomQuoteBlockReason };

/** Upper bound for employee seats so quantities stay finite and sane. */
export const MAX_EMPLOYEE_SEATS = 500;

/**
 * Convert a raw price value into a known finite price, or `null` when the value
 * is missing/unusable. An explicit `0` (or `"0"`) is a legitimate known price.
 */
export function toKnownPrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  // Negative amounts are never legitimate prices; treat them as unknown rather
  // than letting a malformed value flow into a quote total.
  if (parsed < 0) return null;
  return parsed;
}

/**
 * Normalize a raw seat-count input into a finite, non-negative integer clamped
 * to MAX_EMPLOYEE_SEATS. NaN / negative / fractional input is clamped safely.
 */
export function normalizeSeats(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value !== "number" && typeof value !== "string") return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const floored = Math.floor(parsed);
  if (floored <= 0) return 0;
  return Math.min(floored, MAX_EMPLOYEE_SEATS);
}

function periodKey(billingPeriod: BillingPeriod): "monthly" | "yearly" {
  return billingPeriod === "سنوي" ? "yearly" : "monthly";
}

export function readDepartmentPrice(
  pricing: SubscriptionPricingData | null | undefined,
  department: string,
  billingPeriod: BillingPeriod,
): number | null {
  const entry = pricing?.departmentPrices?.[department];
  if (!entry) return null;
  return toKnownPrice(entry[periodKey(billingPeriod)]);
}

export function readSeatPrice(
  pricing: SubscriptionPricingData | null | undefined,
  billingPeriod: BillingPeriod,
): number | null {
  return toKnownPrice(
    billingPeriod === "سنوي" ? pricing?.employeeSeatYearlyPrice : pricing?.employeeSeatMonthlyPrice,
  );
}

/**
 * Build the per-line quote preview for the current selection. Unknown prices are
 * surfaced as `null` lines instead of being silently replaced with zeros.
 */
export function buildCustomQuote(
  pricing: SubscriptionPricingData | null | undefined,
  selection: CustomQuoteSelection,
): CustomQuote {
  const selectedDepts = Array.isArray(selection?.selectedDepartments)
    ? selection.selectedDepartments
    : [];

  const lines: QuoteLine[] = selectedDepts.map((department) => ({
    department,
    price: readDepartmentPrice(pricing, department, selection.billingPeriod),
  }));

  const isEmployeesSelected = selectedDepts.includes("admin.dept.hr");
  let seats: SeatQuote | null = null;
  if (isEmployeesSelected) {
    const seatCount = normalizeSeats(selection?.employeeSeats);
    const unitPrice = readSeatPrice(pricing, selection.billingPeriod);
    const total = unitPrice === null ? null : unitPrice * seatCount;
    seats = { count: seatCount, unitPrice, total };
  }

  const hasUnknownPrices =
    lines.some((line) => line.price === null) || (seats !== null && seats.total === null);

  const total = hasUnknownPrices
    ? null
    : lines.reduce((sum, line) => sum + (line.price ?? 0), 0) + (seats === null ? 0 : (seats.total ?? 0));

  return { lines, seats, total, hasUnknownPrices };
}

/**
 * Decide whether the custom quote may be submitted. A failed pricing request
 * ("unavailable") and an in-flight load ("loading") always block submission,
 * regardless of any locally-cached numbers.
 */
export function resolveCustomQuoteGate(input: {
  pricingStatus: PricingStatus;
  pricing: SubscriptionPricingData | null | undefined;
  selection: CustomQuoteSelection;
}): CustomQuoteGate {
  if (input.pricingStatus === "loading") {
    return { canSubmit: false, blockReason: "pricing-loading" };
  }
  if (input.pricingStatus === "unavailable") {
    return { canSubmit: false, blockReason: "pricing-unavailable" };
  }

  const selectedDepts = Array.isArray(input.selection?.selectedDepartments)
    ? input.selection.selectedDepartments
    : [];

  if (selectedDepts.length === 0) {
    return { canSubmit: false, blockReason: "no-departments" };
  }

  const quote = buildCustomQuote(input.pricing, input.selection);

  if (quote.lines.some((line) => line.price === null)) {
    return { canSubmit: false, blockReason: "missing-department-price" };
  }
  if (quote.seats !== null && quote.seats.unitPrice === null) {
    return { canSubmit: false, blockReason: "missing-seat-price" };
  }
  if (quote.seats !== null && quote.seats.count < 1) {
    return { canSubmit: false, blockReason: "missing-seats" };
  }

  return { canSubmit: true, blockReason: null };
}
