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

export interface ServiceCatalogEntry {
  title: string;
  description: string;
  index: string;
  options: string[];
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
