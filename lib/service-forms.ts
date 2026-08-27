import { FieldDef, ServiceFormDef, TemplateRule, VisibleWhen } from '@/types/service-form';

export const SERVICE_FORM_KEY_PREFIX = 'service_form_';

/** Set a value at a dotted path ("metadata.x", "firstParty.agent.name"), creating intermediate objects. */
export function setPath(obj: Record<string, any>, dottedPath: string, value: any): void {
  const parts = dottedPath.split('.');
  let cur: Record<string, any> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof cur[key] !== 'object' || cur[key] === null) cur[key] = {};
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

/** Read a value at a dotted path; undefined when any segment is missing. */
export function getPath(obj: Record<string, any> | null | undefined, dottedPath: string): any {
  if (!obj) return undefined;
  let cur: any = obj;
  for (const key of dottedPath.split('.')) {
    if (typeof cur !== 'object' || cur === null) return undefined;
    cur = cur[key];
  }
  return cur;
}

/** Replace `{fieldId}` placeholders with the matching form values (missing → empty string). */
export function interpolateTemplate(template: string, values: Record<string, any>): string {
  return template.replace(/\{([^}]+)\}/g, (_m, id: string) => {
    const v = values[id.trim()];
    return v === undefined || v === null ? '' : String(v);
  });
}

/** Structural check so corrupt JSON never reaches the renderer. */
export function isServiceFormDef(value: any): value is ServiceFormDef {
  return (
    !!value &&
    typeof value === 'object' &&
    value.version === 1 &&
    Array.isArray(value.fields)
  );
}

/**
 * Resolve the form definition for a category from the SettingsContext `serviceForms`
 * map (raw JSON strings keyed by `service_form_<category>`, pre-populated from
 * GET /settings/public). Returns null when missing or unparseable — the caller may
 * then fall back to fetching GET /settings/service-forms/:category.
 */
export function resolveServiceForm(
  category: string,
  serviceForms: Record<string, string> | undefined | null,
): ServiceFormDef | null {
  if (!serviceForms) return null;
  const raw = serviceForms[`${SERVICE_FORM_KEY_PREFIX}${category}`];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isServiceFormDef(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Normalize an unknown API payload into a ServiceFormDef (handles {data} / {def} wrappers). */
export function coerceServiceFormDef(payload: any): ServiceFormDef | null {
  if (isServiceFormDef(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (isServiceFormDef(payload.data)) return payload.data;
    if (isServiceFormDef(payload.def)) return payload.def;
    if (isServiceFormDef(payload.form)) return payload.form;
  }
  return null;
}

/** Evaluate a VisibleWhen condition against the current form values.
 *  equals: string | string[] — any match. notEquals: string | string[] — none match. */
export function matchesVisibleWhen(cond: VisibleWhen, values: Record<string, any>): boolean {
  const current = values[cond.field];
  if (cond.equals !== undefined) {
    const allowed = Array.isArray(cond.equals) ? cond.equals : [cond.equals];
    return allowed.includes(current);
  }
  if (cond.notEquals !== undefined) {
    const blocked = Array.isArray(cond.notEquals) ? cond.notEquals : [cond.notEquals];
    return !blocked.includes(current);
  }
  return true;
}

/** Evaluate a field's conditional visibility against the current form values. */
export function isFieldVisible(field: FieldDef, values: Record<string, any>): boolean {
  if (!field.visibleWhen) return true;
  return matchesVisibleWhen(field.visibleWhen, values);
}

/**
 * Apply a template (plain string or ordered TemplateRule[]) against the form values.
 * For rule arrays the first rule whose `when` matches (missing `when` always matches)
 * is interpolated; when no rule matches, undefined is returned so the caller keeps
 * the raw value. `{fieldId}` placeholders interpolate from `values` (missing → '').
 */
export function applyTemplate(
  tpl: string | TemplateRule[] | undefined,
  values: Record<string, any>,
): string | undefined {
  if (tpl === undefined) return undefined;
  if (typeof tpl === 'string') return interpolateTemplate(tpl, values);
  if (Array.isArray(tpl)) {
    for (const rule of tpl) {
      if (!rule || typeof rule.template !== 'string') continue;
      if (!rule.when || matchesVisibleWhen(rule.when, values)) {
        return interpolateTemplate(rule.template, values);
      }
    }
  }
  return undefined;
}
