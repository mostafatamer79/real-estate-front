/**
 * Safe helpers and data adapters for the Disputes redesign.
 * Prevents runtime errors from null/malformed party objects (such as `typeof null === 'object'`),
 * provides accessible status mapping, recoverable error states, and safe search filtering.
 */

export interface SafePartyInfo {
  name: string;
  role?: string;
  phone?: string;
  idNumber?: string;
  nationality?: string;
  city?: string;
  nationalAddress?: string;
}

/**
 * Safely extracts party information, preventing runtime crashes when party is null,
 * undefined, a primitive string, or a structured object.
 *
 * NOTE: In JavaScript `typeof null === 'object'` evaluates to true.
 * This helper explicitly guards against null/non-object dereferencing.
 */
export function safeExtractParty(party: unknown, fallback: string = "—"): SafePartyInfo {
  if (party === null || party === undefined) {
    return { name: fallback };
  }

  if (typeof party === "string") {
    const trimmed = party.trim();
    return { name: trimmed || fallback };
  }

  if (typeof party === "object") {
    const p = party as Record<string, unknown>;
    const nameStr =
      typeof p.name === "string"
        ? p.name.trim()
        : typeof p.title === "string"
        ? p.title.trim()
        : typeof p.fullName === "string"
        ? p.fullName.trim()
        : "";

    return {
      name: nameStr || fallback,
      role: typeof p.role === "string" && p.role.trim() ? p.role.trim() : undefined,
      phone: typeof p.phone === "string" && p.phone.trim() ? p.phone.trim() : undefined,
      idNumber: typeof p.idNumber === "string" && p.idNumber.trim() ? p.idNumber.trim() : undefined,
      nationality: typeof p.nationality === "string" && p.nationality.trim() ? p.nationality.trim() : undefined,
      city: typeof p.city === "string" && p.city.trim() ? p.city.trim() : undefined,
      nationalAddress: typeof p.nationalAddress === "string" && p.nationalAddress.trim() ? p.nationalAddress.trim() : undefined,
    };
  }

  return { name: String(party).trim() || fallback };
}

export interface DisputeStatusConfig {
  key: string;
  labelAr: string;
  labelEn: string;
  badgeClass: string;
  dotClass: string;
}

export const DISPUTE_STATUS_CONFIG: Record<string, DisputeStatusConfig> = {
  inProgress: {
    key: "inProgress",
    labelAr: "قيد المراجعة",
    labelEn: "Under Review",
    badgeClass: "text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    dotClass: "bg-amber-500 animate-pulse",
  },
  in_progress: {
    key: "in_progress",
    labelAr: "قيد المراجعة",
    labelEn: "Under Review",
    badgeClass: "text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    dotClass: "bg-amber-500 animate-pulse",
  },
  completed: {
    key: "completed",
    labelAr: "مكتملة",
    labelEn: "Completed",
    badgeClass: "text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    dotClass: "bg-emerald-500",
  },
  pending: {
    key: "pending",
    labelAr: "معلقة",
    labelEn: "Pending",
    badgeClass: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  },
  cancelled: {
    key: "cancelled",
    labelAr: "ملغاة",
    labelEn: "Cancelled",
    badgeClass: "text-rose-800 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/50",
    dotClass: "bg-rose-500",
  },
};

export function getDisputeStatusConfig(status: string | null | undefined): DisputeStatusConfig {
  const normalized = String(status || "").trim();
  if (DISPUTE_STATUS_CONFIG[normalized]) {
    return DISPUTE_STATUS_CONFIG[normalized];
  }
  return {
    key: normalized || "unknown",
    labelAr: normalized || "غير محدد",
    labelEn: normalized || "Unspecified",
    badgeClass: "text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    dotClass: "bg-slate-400",
  };
}

/**
 * Filter disputes safely against a search query across number, type, parties, and description.
 */
export function filterDisputes<T extends {
  disputeNumber?: string | null;
  disputeType?: string | null;
  firstParty?: unknown;
  secondParty?: unknown;
  disputeDescription?: string | null;
}>(disputes: T[], query: string): T[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return disputes;

  return disputes.filter((item) => {
    const num = String(item.disputeNumber || "").toLowerCase();
    const type = String(item.disputeType || "").toLowerCase();
    const desc = String(item.disputeDescription || "").toLowerCase();
    const p1 = safeExtractParty(item.firstParty).name.toLowerCase();
    const p2 = safeExtractParty(item.secondParty).name.toLowerCase();

    return (
      num.includes(q) ||
      type.includes(q) ||
      desc.includes(q) ||
      p1.includes(q) ||
      p2.includes(q)
    );
  });
}

/**
 * Fallback translation labels for disputes page to prevent raw keys from leaking to UI.
 */
export const DISPUTES_STRINGS: Record<string, { ar: string; en: string }> = {
  "disputes.title": {
    ar: "المنازعات العقارية",
    en: "Real Estate Disputes",
  },
  "disputes.tab.disputes": {
    ar: "قائمة النزاعات",
    en: "Disputes List",
  },
  "disputes.tab.service_requests": {
    ar: "إدارة الخدمات",
    en: "Legal Service Requests",
  },
  "disputes.empty": {
    ar: "لا توجد قضايا أو نزاعات مسجلة",
    en: "No disputes currently recorded",
  },
  "disputes.details": {
    ar: "تفاصيل القضية",
    en: "Dispute Details",
  },
  "disputes.firstParty": {
    ar: "الطرف الأول",
    en: "First Party",
  },
  "disputes.secondParty": {
    ar: "الطرف الثاني",
    en: "Second Party",
  },
  "disputes.searchPlaceholder": {
    ar: "ابحث بالرقم، النوع، الأطراف، أو الوصف...",
    en: "Search by number, type, parties, or description...",
  },
  "disputes.activeReviews": {
    ar: "قضايا تحت المراجعة",
    en: "Cases Under Review",
  },
  "disputes.activeReviewsSub": {
    ar: "تتطلب متابعة قانونية مستمرة",
    en: "Requires ongoing legal follow-up",
  },
  "disputes.loadError": {
    ar: "تعذر تحميل قائمة النزاعات حالياً. يرجى إعادة المحاولة.",
    en: "Unable to load disputes list right now. Please retry.",
  },
  "disputes.retry": {
    ar: "إعادة المحاولة",
    en: "Retry",
  },
  "disputes.newRequest": {
    ar: "طلب جديد",
    en: "New Request",
  },
};

export function getDisputeText(key: string, language: "ar" | "en", customT?: (k: string) => string): string {
  if (customT) {
    const val = customT(key);
    if (val && val !== key) return val;
  }
  const entry = DISPUTES_STRINGS[key];
  if (entry) {
    return language === "ar" ? entry.ar : entry.en;
  }
  return key;
}
