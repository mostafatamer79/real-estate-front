interface WalletInvoiceInput {
  id: string;
  invoice?: string;
  date?: string;
  service?: string;
  amount?: string;
  originalStatus?: string;
  isPendingDecision?: boolean;
  raw?: Record<string, unknown>;
}

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim() ? value : fallback;

function amount(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
  return Number.isFinite(number) ? number : fallback;
}

export function mapWalletInvoice(invoice: WalletInvoiceInput) {
  const raw = invoice.raw ?? {};
  const request = typeof raw.serviceRequest === 'object' && raw.serviceRequest !== null
    ? raw.serviceRequest as Record<string, unknown> : {};
  const details = { ...request, ...Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== null && value !== undefined)) };
  const user = typeof raw.user === 'object' && raw.user !== null
    ? raw.user as Record<string, unknown> : {};
  const financial = raw.total !== undefined && raw.total !== null && raw.amount !== undefined && raw.amount !== null;
  const quantity = amount(details.quantity, 1);
  const unitPrice = amount(details.price, amount(raw.amount, amount(invoice.amount)));
  const financialSummary = financial ? {
    subtotal: amount(raw.amount), tax: amount(raw.tax), serviceFee: amount(raw.serviceFee), total: amount(raw.total),
  } : undefined;
  return {
    ...invoice, ...raw,
    id: invoice.id,
    invoiceNumber: text(raw.invoiceNumber, invoice.invoice || invoice.id.substring(0, 8).toUpperCase()),
    createdAt: text(raw.createdAt, invoice.date),
    clientName: text(details.clientName, text(user.name, [text(user.firstName), text(user.lastName)].filter(Boolean).join(' ') || 'غير متوفر')),
    phone: text(details.phone, text(user.phone, 'غير متوفر')),
    city: text(details.city, 'غير متوفر'), district: text(details.district, 'غير متوفر'),
    serviceType: text(details.serviceType, invoice.service || text(raw.description, 'خدمة')),
    category: text(details.category, 'other'), quantity, price: unitPrice,
    amount: String(financialSummary?.total ?? amount(invoice.amount, unitPrice * quantity)),
    description: text(raw.description, invoice.service),
    status: text(request.status, text(raw.status, 'pending')),
    paymentStatus: text(raw.paymentStatus, (raw.status === 'paid' || invoice.originalStatus === 'paid') ? 'paid' : 'unpaid'),
    userId: text(raw.userId), updatedAt: text(raw.updatedAt),
    estimatedCost: amount(raw.estimatedCost), finalCost: amount(raw.finalCost),
    assignedAgentId: text(raw.assignedAgentId) || null, assignedAt: text(raw.assignedAt) || null,
    completedAt: text(raw.completedAt) || null, invoiceGenerated: true,
    isPendingDecision: invoice.isPendingDecision ?? false,
    financialSummary,
  };
}
