/**
 * Safe helpers and data adapters for the Department Requests redesign.
 * Enforces canonical department authorization, numeral normalization (supporting currency 0),
 * request filtering, and recoverable error management.
 */

import { canonicalDeptSlug, canAccessDepartment } from "./redesign-department-navigation";

export interface DepartmentUser {
  id?: string;
  role?: string;
  departments?: unknown;
  departmentPermissions?: Record<string, unknown>;
  firstName?: string;
  lastName?: string;
}

export interface DepartmentPriceEntry {
  price: number;
  addedBy?: string;
  note?: string;
  addedAt?: string;
}

export interface DepartmentServiceRequest {
  id: string;
  userId?: string;
  clientName: string;
  phone: string;
  city: string;
  district?: string;
  serviceType: string;
  category: string;
  status: string;
  description?: string;
  createdAt: string;
  quantity: number;
  price: number;
  invoiceSent?: boolean;
  invoicePrice?: number | null;
  clientDecision?: string | null;
  invoiceNumber?: string | null;
  firstParty?: unknown;
  secondParty?: unknown;
  metadata?: Record<string, unknown>;
  departmentPrices?: Record<string, DepartmentPriceEntry>;
  chatRoomId?: string | null;
  user?: { id: string; firstName?: string; lastName?: string; email?: string };
  assignedAgentId?: string | null;
  adminComment?: string;
}

/**
 * Normalizes Arabic-Indic, Eastern Arabic-Indic, and Western numeric strings to a standard JS number.
 * Explicitly preserves zero (0) rather than treating it as falsy or empty.
 */
export function parseLocaleNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;

  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";

  const raw = String(value).trim();
  if (!raw) return NaN;

  const normalized = raw
    .replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(easternArabicIndic.indexOf(d)))
    .replace(/,/g, ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Validates an offer price input.
 * Supports free/waived consultations or priced services (>= 0).
 */
export function validateOfferPrice(value: string | number | null | undefined): {
  valid: boolean;
  price: number;
  error?: string;
} {
  const n = parseLocaleNumber(value);
  if (isNaN(n)) {
    return { valid: false, price: NaN, error: "يرجى إدخال مبلغ صحيح (مثال: 250)" };
  }
  if (n < 0) {
    return { valid: false, price: n, error: "لا يمكن أن يكون مبلغ العرض سالباً" };
  }
  return { valid: true, price: n };
}

/**
 * Checks whether the user can manage (e.g. submit offers or perform actions) in the given department.
 * View-only roles or users with 'view' permission cannot submit prices or manage offers.
 */
export function canManageDepartmentRequests(
  user: DepartmentUser | null | undefined,
  rawDept: string
): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "manager") return true;

  const canonical = canonicalDeptSlug(rawDept);
  if (!canAccessDepartment(user, canonical)) return false;

  const perms = (user.departmentPermissions || {}) as Record<string, unknown>;
  const val = perms[canonical] ?? perms[rawDept];

  if (val === "view" || val === "none" || val === false) {
    return false;
  }

  // If role is a viewer role
  if (user.role === "viewer") return false;

  return true;
}

/**
 * Filters requests safely against search keywords and the "assigned to me" toggle.
 */
export function filterDepartmentRequests(
  requests: DepartmentServiceRequest[],
  searchTerm: string,
  showOnlyMine: boolean,
  currentUserId?: string
): DepartmentServiceRequest[] {
  const q = (searchTerm || "").trim().toLowerCase();

  return requests.filter((r) => {
    if (showOnlyMine && currentUserId) {
      if (r.assignedAgentId !== currentUserId) {
        return false;
      }
    }

    if (!q) return true;

    const client = String(r.clientName || "").toLowerCase();
    const type = String(r.serviceType || "").toLowerCase();
    const city = String(r.city || "").toLowerCase();
    const district = String(r.district || "").toLowerCase();
    const desc = String(r.description || "").toLowerCase();
    const id = String(r.id || "").toLowerCase();

    return (
      client.includes(q) ||
      type.includes(q) ||
      city.includes(q) ||
      district.includes(q) ||
      desc.includes(q) ||
      id.includes(q)
    );
  });
}
