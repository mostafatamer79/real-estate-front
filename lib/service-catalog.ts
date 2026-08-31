// Central service catalog — single source for the service categories, their Arabic
// presentation (title/description/index), and their selectable service option lists.
// Previously triplicated across app/services/form/page.tsx and the admin services page.

export type ServiceCategoryId =
  | 'postPurchase'
  | 'legal'
  | 'construction'
  | 'marketing'
  | 'leasing'
  | 'visit'
  | 'other';

export type ServiceItemStatus = 'enabled' | 'soon' | 'disabled';

export interface ServiceCatalogEntry {
  title: string;
  description: string;
  index: string;
  options: string[];
}

export interface CustomServiceCategory {
  id: string;
  title: string;
  description: string;
  status: ServiceItemStatus;
  index?: string;
  createdAt?: string;
}

export interface CustomServiceItem {
  id: string;
  category: string;
  name: string;
  status: ServiceItemStatus;
  createdAt?: string;
}

export const SERVICE_CATALOG: Record<ServiceCategoryId, ServiceCatalogEntry> = {
  postPurchase: {
    title: 'خدمات ما بعد الشراء',
    description: 'نقدم لك حلولاً متكاملة للعناية بمنزلك وتجهيزه بأفضل المعايير.',
    index: '01',
    options: ['الغاز', 'نقل وتركيب الأثاث', 'التأمين على المنزل', 'الصيانة (سباكة / كهرباء)', 'خدمة التنظيف', 'تنسيق حدائق', 'أنظمة أمنية', 'أخرى'],
  },
  legal: {
    title: 'الخدمات القانونية',
    description: 'حلول قانونية احترافية مدعومة بفريق من الخبراء لضمان حقوقك العقارية.',
    index: '02',
    options: [],
  },
  construction: {
    title: 'خدمات البناء والمقاولات',
    description: 'خبرة متكاملة في البناء، التشطيب، والإشراف الهندسي.',
    index: '03',
    options: ['مقاول عظم', 'تصميم هندسي', 'تشطيبات', 'كهرباء', 'سباكة', 'نجارة', 'دهانات', 'ألمنيوم', 'إشراف هندسي', 'تصميم داخلي', 'أخرى'],
  },
  marketing: {
    title: 'خدمات التسويق العقاري',
    description: 'نبرز جمال عقارك بأحدث تقنيات التصوير والحملات الجذابة.',
    index: '04',
    options: ['تصوير فوتوغرافي للعقار', 'حملة إعلانية (وسائل التواصل الاجتماعي)', 'حملة إعلانية (إعلانات طرق/تقليدية)', 'أخرى'],
  },
  leasing: {
    title: 'خدمات التأجير والإدارة',
    description: 'إدارة ذكية لعقودك وتحصيل إيجاراتك بكل يسر وأمان.',
    index: '05',
    options: ['تأجير العقار', 'إدارة عقود الإيجار', 'تحصيل الإيجارات', 'أخرى'],
  },
  visit: {
    title: 'طلب زيارة العقار',
    description: 'خدمات ميدانية لمعاينة العقار، تصويره، أو استلام تقارير مفصلة عنه.',
    index: '06',
    options: ['زيارة شخصية', 'زيارة بالنيابة', 'تصوير العقار', 'تقرير مفصل', 'جولة مع الوكيل', 'أخرى'],
  },
  other: {
    title: 'خدمات أخرى',
    description: 'خدمات استشارية وتقييمية شاملة تلبي كافة احتياجاتك العقارية.',
    index: '07',
    options: ['التقييم العقاري', 'المسح الهندسي', 'تمويل عقاري', 'أخرى'],
  },
};

export const SERVICE_CATEGORY_IDS = Object.keys(SERVICE_CATALOG) as ServiceCategoryId[];

export type LegalCategoryId = 'disputes' | 'contracts' | 'documentation' | 'other';

export interface LegalSubcategory {
  id: LegalCategoryId;
  /** Settings key suffix: service_form_legal_<formKey> and module_legal_<formKey> */
  formKey: 'legal_disputes' | 'legal_contracts' | 'legal_documentation' | 'legal_other';
  title: string;
  description: string;
}

export const LEGAL_SUBCATEGORIES: LegalSubcategory[] = [
  { id: 'disputes',      formKey: 'legal_disputes',      title: 'المنازعات العقارية', description: 'منازعات الملكية، البيع، الرهن والمخالفات' },
  { id: 'contracts',     formKey: 'legal_contracts',     title: 'العقود',             description: 'إنشاء العقود أو إرسالها للمراجعة' },
  { id: 'documentation', formKey: 'legal_documentation', title: 'التوثيق',            description: 'رفع صك الملكية ومستندات البيع' },
  { id: 'other',         formKey: 'legal_other',         title: 'أخرى',               description: 'استشارات قانونية أو تقارير قانونية' },
];

export const CUSTOM_SERVICE_CATALOG_KEY = 'custom_service_catalog';
export const CUSTOM_SERVICE_CATEGORIES_KEY = 'custom_service_categories';

export const makeServicePriceKey = (category: string, service: string) =>
  `service_price_${category}_${service}`.replace(/\s+/g, "_").toLowerCase();

export const makeServiceItemFlagKey = (category: string, service: string) =>
  `service_item_${category}_${service}`.replace(/\s+/g, "_").toLowerCase();

export const normalizeServiceStatus = (value: unknown): ServiceItemStatus => {
  if (value === 'soon' || value === 'disabled') return value;
  return 'enabled';
};


export const slugifyCustomCategory = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\u0600-\u06ff-]/g, '');
  return normalized || `category_${Date.now()}`;
};

export const parseCustomCategories = (raw: string | undefined | null): CustomServiceCategory[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): CustomServiceCategory | null => {
        if (!item || typeof item !== 'object') return null;
        const id = String(item.id || '').trim();
        const title = String(item.title || '').trim();
        if (!id || !title) return null;
        return {
          id,
          title,
          description: String(item.description || '').trim(),
          status: normalizeServiceStatus(item.status),
          index: typeof item.index === 'string' ? item.index : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
        };
      })
      .filter((item): item is CustomServiceCategory => Boolean(item));
  } catch {
    return [];
  }
};

export const parseCustomServices = (raw: string | undefined | null): CustomServiceItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): CustomServiceItem | null => {
        if (!item || typeof item !== 'object') return null;
        const category = String(item.category || '').trim();
        const name = String(item.name || '').trim();
        if (!category || !name) return null;
        return {
          id: String(item.id || `${category}_${name}`),
          category,
          name,
          status: normalizeServiceStatus(item.status),
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
        };
      })
      .filter((item): item is CustomServiceItem => Boolean(item));
  } catch {
    return [];
  }
};

export const getCustomServicesForCategory = (
  customServices: CustomServiceItem[] | undefined,
  category: string,
) => (customServices || []).filter((service) => service.category === category);

export const getServiceNamesForCategory = (
  category: string,
  customServices: CustomServiceItem[] | undefined,
) => {
  const base = SERVICE_CATALOG[category as ServiceCategoryId]?.options || [];
  const custom = getCustomServicesForCategory(customServices, category).map((service) => service.name);
  return Array.from(new Set([...base, ...custom]));
};
