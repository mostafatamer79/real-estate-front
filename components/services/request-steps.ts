import type { FieldDef } from "@/types/service-form";

export function getRequestFieldSteps(fields: FieldDef[], category: string) {
  const byId = new Map(fields.map(field => [field.id, field]));
  const serviceFields = new Set<string>();
  const dependencies = new Set(fields.flatMap(field => field.visibleWhen ? [field.visibleWhen.field] : []));

  for (const field of fields) {
    const isServiceChoice = field.target === "serviceType" || field.target === "metadata.catalogService"
      || (category === "legal_disputes" && field.target === "metadata.disputeType")
      || ((category === "legal_contracts" || category === "legal_other") && field.target === "metadata.type");
    if (!isServiceChoice || !field.options?.length) continue;

    // Show the controls that reveal a service selector in the same step.
    let prerequisite: FieldDef | undefined = field;
    while (prerequisite && !serviceFields.has(prerequisite.id)) {
      serviceFields.add(prerequisite.id);
      prerequisite = byId.get(prerequisite.visibleWhen?.field ?? "");
    }
  }

  return new Map(fields.map(field => [
    field.id,
    serviceFields.has(field.id) ? 0 : field.type === "terms" && !dependencies.has(field.id) ? 2 : 1,
  ] as const));
}
