import type { CreateOfferDto, UpdateOfferDto } from '@/types/api';

export const offerEditorFields = ['propertyType','area','price','city','neighborhood','propertyAge','direction','deedType','propertyCondition','additionalNotes'] as const;
export type OfferEditorField = typeof offerEditorFields[number];
export type OfferEditorValues = Record<OfferEditorField, string>;
export const emptyOfferEditor: OfferEditorValues = { propertyType:'', area:'', price:'', city:'', neighborhood:'', propertyAge:'', direction:'', deedType:'', propertyCondition:'', additionalNotes:'' };

export function offerEditorValues(value: Partial<CreateOfferDto>): OfferEditorValues {
  return Object.fromEntries(offerEditorFields.map(key => [key, value[key] === undefined || value[key] === null ? '' : String(value[key])])) as OfferEditorValues;
}

/** Edit only the fields this form owns; never replace images, ownership or other listing data. */
export function offerEditorPayload(values: OfferEditorValues, original?: OfferEditorValues): UpdateOfferDto {
  const output: Record<string, string | number> = {};
  for (const key of offerEditorFields) {
    const value = values[key].trim();
    if (key !== 'additionalNotes' && !value) throw new Error('required');
    if (!original && key === 'additionalNotes' && !value) continue;
    if (key === 'area' || key === 'price') {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) throw new Error('positive');
      if (!original || numeric !== Number(original[key])) output[key] = numeric;
    } else if (!original || value !== original[key].trim()) {
      output[key] = value;
    }
  }
  return output;
}
