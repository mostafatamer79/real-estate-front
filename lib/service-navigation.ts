import {
  SERVICE_CATALOG, LEGAL_SUBCATEGORIES, getServiceNamesForCategory, getServiceDisplayName,
  type CustomServiceItem, type CustomServiceCategory,
} from './service-catalog';

export interface ServiceSelection {
  category?: string;
  branch?: string;
  service?: string;
}

export function serviceTree(custom: CustomServiceItem[] = [], categories: CustomServiceCategory[] = []) {
  return [
    ...Object.entries(SERVICE_CATALOG),
    ...categories.filter(category => category.status !== 'disabled')
      .map(category => [category.id, { title: category.title }] as const),
  ].map(([id, category]) => ({
    id, title: category.title,
    children: id === 'legal'
      ? LEGAL_SUBCATEGORIES.filter(sub => getServiceNamesForCategory('legal', custom).includes(sub.title)).map(sub => ({ id: sub.formKey, title: getServiceDisplayName('legal', sub.title, custom), services: getServiceNamesForCategory(sub.formKey, custom) }))
      : [{ id, title: category.title, services: getServiceNamesForCategory(id, custom) }],
  }));
}

export function serviceGrant(grants: string[], category: string): 'approved' | 'partial' | 'unapproved' {
  if (grants.some(grant => category === grant || category.startsWith(`${grant}_`))) return 'approved';
  if (grants.some(grant => grant.startsWith(`${category}_`))) return 'partial';
  return 'unapproved';
}

export function requestServiceBranch(request: { category?: string | null; serviceType: string; metadata?: Record<string, unknown>; serviceCategory?: string }) {
  if (request.serviceCategory) return request.serviceCategory;
  if (request.category !== 'legal') return request.category;
  const type = request.serviceType || '';
  const metadata = request.metadata || {};
  if (/توثيق|إفراغ|افراغ|notary|notarization/.test(type) || metadata.deedInfo) return 'legal_documentation';
  if (/منازع|نزاع|dispute/.test(type) || metadata.disputeType) return 'legal_disputes';
  if (/عقد|عقود|contracts/.test(type) || metadata.contractDetails) return 'legal_contracts';
  return 'legal_other';
}

export function requestMatchesService(
  request: { category?: string | null; serviceType: string; metadata?: Record<string, unknown>; serviceCategory?: string },
  selection: ServiceSelection,
) {
  const category = request.category ?? '';
  return (!selection.category || category === selection.category || category.startsWith(`${selection.category}_`))
    && (!selection.branch || requestServiceBranch(request) === selection.branch)
    && (!selection.service || request.serviceType === selection.service);
}
