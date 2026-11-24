import type { LegalCategoryId } from "@/lib/service-catalog";

export const legalServiceCopy: Record<LegalCategoryId, { title: string; description: string }> = {
  disputes: { title: "Property disputes", description: "Ownership, sale, mortgage and property disputes." },
  contracts: { title: "Contracts", description: "Prepare a contract or send one for review." },
  documentation: { title: "Documentation", description: "Property deeds and sale documentation." },
  other: { title: "Legal advice", description: "Legal consultations and reports." },
};
