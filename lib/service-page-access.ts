type ServiceState = 'enabled' | 'soon' | 'disabled';

/** Mirror category availability for direct navigation as well as directory links. */
export function servicePageAccess({ section, category = 'enabled', subcategory = 'enabled', admin = false, preview = false }: {
  section: 'open' | 'closed' | 'hidden' | undefined;
  category?: ServiceState;
  subcategory?: ServiceState;
  admin?: boolean;
  preview?: boolean;
}): ServiceState | 'section' {
  if (section !== 'open' && !admin) return 'section';
  if (category === 'disabled' || subcategory === 'disabled') return 'disabled';
  if ((category === 'soon' || subcategory === 'soon') && !(admin && preview)) return 'soon';
  return 'enabled';
}
