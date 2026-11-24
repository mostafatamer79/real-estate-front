type PriceRequest = {
  targetDepartment?: string | null;
  invoiceSent?: boolean;
  clientDecision?: string | null;
  paymentStatus?: string;
  departmentPrices?: Record<string, unknown> | null;
};
type DepartmentUser = {
  role?: string;
  departments?: string[];
  departmentPermissions?: Record<string, unknown>;
} | null | undefined;

export function requestPriceDepartment(request: PriceRequest): string {
  const departments: Record<string, string> = {
    real_estate: 'properties', marketing: 'marketing', legal: 'legal', finance: 'finance', employees: 'employees',
  };
  return departments[request.targetDepartment || ''] || 'properties';
}

// Presentation mirrors the existing server rule; the API remains authoritative.
export function canPriceServiceRequest(user: DepartmentUser, request: PriceRequest): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const department = requestPriceDepartment(request);
  const permission = user.departmentPermissions?.[department];
  if (permission === false || permission === 'none' || permission === 'view') return false;
  if (permission === true || permission === 'manage') return true;
  const roleDepartments: Record<string, string> = {
    legal: 'legal', legal_admin: 'legal', marketing: 'marketing', marketing_admin: 'marketing', finance: 'finance', finance_admin: 'finance',
  };
  return (user.departments || []).includes(department) || roleDepartments[user.role || ''] === department;
}

export function serviceRequestInvoiceLocked(request: PriceRequest): boolean {
  return Boolean(request.invoiceSent || request.clientDecision === 'accepted' || request.paymentStatus === 'paid');
}

export function serviceRequestPriceLocked(request: PriceRequest): boolean {
  return serviceRequestInvoiceLocked(request) || Boolean(request.departmentPrices?.[requestPriceDepartment(request)]);
}

export function serviceRequestPricePayload(request: PriceRequest, rawPrice: string, note: string) {
  const price = Number(rawPrice);
  const cents = price * 100;
  // service_requests.price is decimal(12,2). Validate before the confirmation
  // so the invoice cannot silently round a sub-cent or out-of-range quote.
  if (!rawPrice.trim() || !Number.isFinite(price) || price <= 0 || price >= 10_000_000_000 ||
    Math.abs(cents - Math.round(cents)) > Number.EPSILON * Math.max(1, cents) * 4) {
    throw new Error('invalid_price');
  }
  return { price, note, deptSlug: requestPriceDepartment(request) };
}
