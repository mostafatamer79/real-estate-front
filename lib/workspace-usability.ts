import type { FieldDef } from '@/types/service-form';

export function paginationItems(currentPage: number, totalPages: number): Array<number | 'start-gap' | 'end-gap'> {
  if (!Number.isFinite(totalPages) || totalPages < 1) return [];
  const total = Math.floor(totalPages);
  const current = Math.min(total, Math.max(1, Math.floor(currentPage) || 1));
  const pages = [...new Set([1, current - 1, current, current + 1, total].filter(page => page >= 1 && page <= total))].sort((a,b) => a-b);
  const result: Array<number | 'start-gap' | 'end-gap'> = [];
  for (const page of pages) {
    const previous = result.at(-1);
    if (typeof previous === 'number' && page - previous === 2) result.push(previous + 1);
    else if (typeof previous === 'number' && page - previous > 2) result.push(page < current ? 'start-gap' : 'end-gap');
    result.push(page);
  }
  return result;
}

function searchable(value: unknown): string {
  return String(value ?? '').toLocaleLowerCase().normalize('NFKC').replace(/[أإآ]/g,'ا').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 0x06F0 : 0x0660)));
}
interface SearchableRequest { clientName?: string; serviceType?: string; phone?: string; city?: string; district?: string; id?: string; status?: string; targetDepartment?: string; createdAt?: string; }
export function filterServiceRequests<T extends SearchableRequest>(requests: T[], options: { query?: string; department?: string; status?: string; order?: string }): T[] {
  const query = searchable(options.query).trim();
  const timestamp = (value?: string) => { const time = Date.parse(value || ''); return Number.isFinite(time) ? time : 0; };
  return requests.filter(request => (!options.department || request.targetDepartment === options.department) && (!options.status || options.status === 'all' || request.status === options.status) && (!query || [request.clientName, request.serviceType, request.phone, request.city, request.district, request.id].some(value => searchable(value).includes(query))))
    .sort((a,b) => options.order === 'name' ? String(a.clientName || '').localeCompare(String(b.clientName || ''), 'ar') : options.order === 'oldest' ? timestamp(a.createdAt) - timestamp(b.createdAt) : timestamp(b.createdAt) - timestamp(a.createdAt));
}

export function serviceFieldError(field: FieldDef, value: unknown, language: 'ar' | 'en'): string | null {
  if (field.type === 'file' || field.type === 'divider') return null;
  const ar = language === 'ar';
  const empty = field.type === 'terms' || field.type === 'checkbox' ? value !== true : String(value ?? '').trim() === '';
  if (empty) return field.required || field.type === 'terms' ? (ar ? 'هذا الحقل مطلوب' : 'This field is required') : null;
  if (field.type === 'number' && (!Number.isFinite(Number(value)) || Number(value) < 1 || (field.target === 'quantity' && !Number.isInteger(Number(value))))) return ar ? 'أدخل عددًا صحيحًا لا يقل عن 1' : 'Enter a valid number of at least 1';
  if ((field.type === 'select' || field.type === 'radio') && !field.options?.some(option => option.value === value && !option.disabled)) return ar ? 'اختر خيارًا متاحًا من القائمة' : 'Choose an available option';
  return null;
}

/** Browser history may contain about:blank even on a direct entry. */
export function canNavigateBack(currentUrl: string, historyLength: number, referrer: string, entry?: { index: number; previousUrl?: string }): boolean {
  if (historyLength <= 1 || (entry && entry.index <= 0)) return false;
  const candidate = entry ? entry.previousUrl : referrer;
  if (!candidate) return false;
  try { return new URL(candidate).origin === new URL(currentUrl).origin; }
  catch { return false; }
}
