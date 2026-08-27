// Mirror of the backend ServiceFormDef schema (real-estate-back/src/settings/service-form.defaults.ts).
// Form definitions are stored as settings keys `service_form_<category>` (JSON string).

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'date'
  | 'time'
  | 'checkbox'
  | 'file'
  | 'terms'
  | 'divider';

export interface FieldOption {
  value: string;
  label: string;
}

export interface VisibleWhen {
  field: string;
  /** string or string array — visible when the current value matches ANY entry */
  equals?: string | string[];
  /** string or string array — visible when the current value matches NONE of the entries */
  notEquals?: string | string[];
}

export interface FieldDef {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[]; // select/radio
  /** Fixed DTO column: clientName|phone|city|district|quantity|serviceType|description|termsAccepted,
   *  dotted jsonb path: metadata.x | firstParty.x | secondParty.x,
   *  or '' (not persisted on its own; may still feed templates) */
  target: string;
  /** Visual group; a divider is rendered when it changes */
  section?: string;
  visibleWhen?: VisibleWhen;
  half?: boolean;
  dir?: 'rtl' | 'ltr';
  defaultValue?: string;
}

export interface TemplateRule {
  /** missing `when` always matches; first matching rule wins */
  when?: VisibleWhen;
  template: string;
}

export interface ServiceFormDef {
  version: 1;
  descriptionTemplate?: string | TemplateRule[];
  serviceTypeTemplate?: string | TemplateRule[];
  /** used when the serviceType-targeting field is empty (marketing parity: service || "Photography Session") */
  serviceTypeFallback?: string;
  fields: FieldDef[];
}
