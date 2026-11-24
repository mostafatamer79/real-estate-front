export interface FaqItemInput {
  id: string;
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  categoryId?: string | null;
  categoryAr?: string | null;
  categoryEn?: string | null;
  sortOrder?: number | null;
  color?: string | null;
  fontSize?: string | null;
}

export interface FaqCategoryInput {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder?: number | null;
}

export interface FaqSectionOutput {
  category: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
    color?: string | null;
    fontSize?: string | null;
  }>;
}

/**
 * Builds localized FAQ sections from backend items and categories.
 * Guarantees:
 * 1. Zero question drops: orphaned category IDs are retained under their category name or general fallback.
 * 2. Published empty array returns [] without silent fallback to hardcoded default data.
 * 3. Sorting by sortOrder is preserved within categories and sections.
 */
export function buildFaqSections(
  faqs: FaqItemInput[] | null,
  categories: FaqCategoryInput[] | null,
  language: "ar" | "en",
  options?: { fallbackDataIfNull?: FaqSectionOutput[] }
): FaqSectionOutput[] {
  // If faqs is null (initial loading or unhandled error state), use fallback data if provided
  if (faqs === null) {
    return options?.fallbackDataIfNull || [];
  }

  // If faqs is explicitly an empty array (published empty state), do NOT fallback to default data
  if (faqs.length === 0) {
    return [];
  }

  const isAr = language === "ar";
  const validCategoryIds = new Set((categories || []).map((c) => c.id));

  const itemsByKnownCat = new Map<string, Array<{
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    color?: string | null;
    fontSize?: string | null;
  }>>();

  const uncategorizedItems: Array<{
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    category: string;
    color?: string | null;
    fontSize?: string | null;
  }> = [];

  for (const item of faqs) {
    const question = isAr ? item.questionAr : item.questionEn;
    const answer = isAr ? item.answerAr : item.answerEn;
    const sortOrder = item.sortOrder ?? 0;
    const color = item.color;
    const fontSize = item.fontSize;

    if (item.categoryId && validCategoryIds.has(item.categoryId)) {
      const arr = itemsByKnownCat.get(item.categoryId) || [];
      arr.push({ id: item.id, question, answer, sortOrder, color, fontSize });
      itemsByKnownCat.set(item.categoryId, arr);
    } else {
      // Either categoryId is missing OR categoryId is orphaned (not present in categories)
      let catName = isAr ? item.categoryAr : item.categoryEn;
      if (!catName || !catName.trim()) {
        catName = isAr ? "أسئلة عامة" : "General Questions";
      }
      uncategorizedItems.push({
        id: item.id,
        question,
        answer,
        sortOrder,
        category: catName.trim(),
        color,
        fontSize,
      });
    }
  }

  // Sort items within known categories
  for (const [catId, arr] of itemsByKnownCat.entries()) {
    arr.sort((a, b) => a.sortOrder - b.sortOrder);
    itemsByKnownCat.set(catId, arr);
  }

  const sections: FaqSectionOutput[] = [];
  const orderedCats = (categories || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Add known category sections
  for (const cat of orderedCats) {
    const arr = itemsByKnownCat.get(cat.id) || [];
    if (arr.length === 0) continue;
    sections.push({
      category: isAr ? cat.nameAr : cat.nameEn,
      items: arr.map(({ id, question, answer, color, fontSize }) => ({
        id,
        question,
        answer,
        color,
        fontSize,
      })),
    });
  }

  // Add uncategorized and orphaned items without dropping any question
  if (uncategorizedItems.length > 0) {
    const uncatMap = new Map<string, Array<{
      id: string;
      question: string;
      answer: string;
      sortOrder: number;
      color?: string | null;
      fontSize?: string | null;
    }>>();

    for (const u of uncategorizedItems) {
      const arr = uncatMap.get(u.category) || [];
      arr.push({
        id: u.id,
        question: u.question,
        answer: u.answer,
        sortOrder: u.sortOrder,
        color: u.color,
        fontSize: u.fontSize,
      });
      uncatMap.set(u.category, arr);
    }

    for (const [catName, arr] of uncatMap.entries()) {
      arr.sort((a, b) => a.sortOrder - b.sortOrder);
      sections.push({
        category: catName,
        items: arr.map(({ id, question, answer, color, fontSize }) => ({
          id,
          question,
          answer,
          color,
          fontSize,
        })),
      });
    }
  }

  return sections;
}

/**
 * Resolves a requested tab key against available tabs, normalizing legacy aliases.
 */
export function resolveInfoTab(
  requestedTab: string | null | undefined,
  validTabs: Array<{ key: string }>,
  defaultFallbackKey: string = "terms_short"
): string {
  const aliasMap: Record<string, string> = {
    terms: "terms_short",
    privacy: "usage",
  };

  const raw = (requestedTab || "").trim().toLowerCase();
  const normalized = aliasMap[raw] || raw;
  const validKeys = validTabs.map((t) => t.key);

  if (validKeys.includes(normalized)) {
    return normalized;
  }

  return validKeys[0] || defaultFallbackKey;
}

export interface OpinionValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    email?: string;
    message?: string;
  };
}

/**
 * Validates opinion form submission.
 */
export function validateOpinionForm(
  data: { name: string; email?: string; message: string },
  language: "ar" | "en"
): OpinionValidationResult {
  const isAr = language === "ar";
  const errors: { name?: string; email?: string; message?: string } = {};

  const trimmedName = (data.name || "").trim();
  const trimmedMessage = (data.message || "").trim();
  const trimmedEmail = (data.email || "").trim();

  if (!trimmedName) {
    errors.name = isAr ? "يرجى إدخال الاسم الكريم" : "Please enter your name";
  } else if (trimmedName.length < 2) {
    errors.name = isAr ? "يجب أن يتكون الاسم من حرفين على الأقل" : "Name must be at least 2 characters";
  }

  if (!trimmedMessage) {
    errors.message = isAr ? "يرجى كتابة رأيك أو مقترحك" : "Please write your opinion or suggestion";
  } else if (trimmedMessage.length < 10) {
    errors.message = isAr ? "يرجى كتابة رسالة مفصلة (10 أحرف على الأقل)" : "Please provide more details (at least 10 characters)";
  }

  if (trimmedEmail) {
    // Basic RFC 5322 compatible email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      errors.email = isAr ? "يرجى إدخال عنوان بريد إلكتروني صحيح" : "Please enter a valid email address";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Deterministically navigates back if in an active browsing session,
 * otherwise navigates to the designated fallback route.
 */
export function safeNavigateBack(
  router: { back: () => void; push: (url: string) => void },
  fallbackPath: string = "/"
): void {
  if (typeof window !== "undefined" && window.history.length > 1 && document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (referrerUrl.host === window.location.host) {
        router.back();
        return;
      }
    } catch {
      // In case referrer is unparseable
    }
  }
  router.push(fallbackPath);
}
