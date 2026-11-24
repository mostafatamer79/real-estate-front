import { CustomerServiceFeedback } from "@/lib/api";

export type CustomerServiceRoute = "/customerservice" | "/customerservice/contact" | "/customerservice/support";

export type CustomerServiceTabKey = "hub" | "contact" | "support";

export interface RouteMeta {
  tabKey: CustomerServiceTabKey;
  path: CustomerServiceRoute;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badgeAr: string;
  badgeEn: string;
}

export const ROUTE_REGISTRY: Record<CustomerServiceTabKey, RouteMeta> = {
  hub: {
    tabKey: "hub",
    path: "/customerservice",
    titleAr: "مركز خدمة وتجربة العملاء",
    titleEn: "Customer Experience & Care Hub",
    subtitleAr: "فريقنا الاستشاري المتخصص مستعد لخدمتكم ومتابعة كافة العمليات والاستفسارات العقارية بأعلى معايير الدقة.",
    subtitleEn: "Our advisory team is ready to support all your real estate inquiries and cases with dedicated precision.",
    badgeAr: "خدمة العملاء المباشرة",
    badgeEn: "Direct Concierge",
  },
  contact: {
    tabKey: "contact",
    path: "/customerservice/contact",
    titleAr: "قنوات التواصل المباشر والمراسلة",
    titleEn: "Direct Contact & Inquiry Dispatch",
    subtitleAr: "تواصل مع فريقنا عبر القنوات الرسمية أو أرسل استفسارك أو شكواك وسنقوم بالرد السريع.",
    subtitleEn: "Reach out via our direct communication channels or send an inquiry, complaint, or proposal.",
    badgeAr: "مراسلة مباشرة",
    badgeEn: "Direct Messaging",
  },
  support: {
    tabKey: "support",
    path: "/customerservice/support",
    titleAr: "تذاكر الدعم وسجل الاستفسارات",
    titleEn: "Support Cases & Inquiry History",
    subtitleAr: "سجل متكامل لمتابعة استفساراتك وشكاواك وتحديثات الدعم الفني والردود عليها.",
    subtitleEn: "Track your submitted inquiries, technical tickets, and real-time customer service responses.",
    badgeAr: "سجل الحالات والمتابعة",
    badgeEn: "Case Tracking",
  },
};

export function resolveSourcePath(sourcePath?: string, pathname?: string | null): string {
  if (sourcePath && typeof sourcePath === "string" && sourcePath.trim()) {
    return sourcePath.trim();
  }
  if (pathname && typeof pathname === "string" && pathname.trim()) {
    const clean = pathname.trim();
    if (clean.startsWith("/customerservice/contact")) return "/customerservice/contact";
    if (clean.startsWith("/customerservice/support")) return "/customerservice/support";
    if (clean.startsWith("/customerservice")) return "/customerservice";
    return clean;
  }
  return "/customerservice";
}

export function getRouteMeta(sourcePath: string): RouteMeta {
  if (sourcePath.includes("/contact")) return ROUTE_REGISTRY.contact;
  if (sourcePath.includes("/support")) return ROUTE_REGISTRY.support;
  return ROUTE_REGISTRY.hub;
}

export function getXProfileUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

export function getXDisplayHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const path = trimmed.replace(/\/+$/, "").split("/").pop();
    return path ? `@${path}` : trimmed;
  }
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export interface TicketStatusDetails {
  label: string;
  variant: "new" | "replied" | "customer_replied" | "resolved";
  ariaLabel: string;
}

export function getTicketStatusDetails(
  status: CustomerServiceFeedback["status"],
  lang: "ar" | "en"
): TicketStatusDetails {
  switch (status) {
    case "resolved":
      return {
        label: lang === "ar" ? "تم الحل" : "Resolved",
        variant: "resolved",
        ariaLabel: lang === "ar" ? "حالة التذكرة: تم الحل" : "Ticket status: Resolved",
      };
    case "replied":
      return {
        label: lang === "ar" ? "تم الرد من الإدارة" : "Agent Replied",
        variant: "replied",
        ariaLabel: lang === "ar" ? "حالة التذكرة: تم الرد من الإدارة" : "Ticket status: Replied",
      };
    case "customer_replied":
      return {
        label: lang === "ar" ? "تم إرسال ردك" : "Reply Sent",
        variant: "customer_replied",
        ariaLabel: lang === "ar" ? "حالة التذكرة: تم إرسال رد العميل" : "Ticket status: Customer Replied",
      };
    case "new":
    default:
      return {
        label: lang === "ar" ? "قيد المراجعة" : "Under Review",
        variant: "new",
        ariaLabel: lang === "ar" ? "حالة التذكرة: قيد المراجعة" : "Ticket status: New",
      };
  }
}

export function filterTickets(
  tickets: CustomerServiceFeedback[],
  query: string,
  statusFilter: string
): CustomerServiceFeedback[] {
  if (!Array.isArray(tickets)) return [];
  const normalizedQuery = query.trim().toLowerCase();
  
  return tickets.filter((t) => {
    if (!t) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) {
      return false;
    }
    if (!normalizedQuery) return true;
    
    const idMatch = t.id?.toLowerCase().includes(normalizedQuery);
    const questionMatch = t.question?.toLowerCase().includes(normalizedQuery);
    const replyMatch = t.adminReply?.toLowerCase().includes(normalizedQuery);
    const userReplyMatch = t.userReply?.toLowerCase().includes(normalizedQuery);
    return Boolean(idMatch || questionMatch || replyMatch || userReplyMatch);
  });
}

export function formatTicketDateTime(dateStr?: string | null, lang: "ar" | "en" = "ar"): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export interface FeedbackValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateFeedbackForm(
  values: {
    name: string;
    contactMethod: "email" | "phone";
    email?: string;
    phoneNumber?: string;
    question: string;
  },
  maxCharacters: number = 200,
  lang: "ar" | "en" = "ar"
): FeedbackValidationResult {
  const errors: Record<string, string> = {};
  const nameTrimmed = values.name.trim();
  const questionTrimmed = values.question.trim();

  if (!nameTrimmed) {
    errors.name = lang === "ar" ? "الاسم مطلوب" : "Name is required";
  }

  if (values.contactMethod === "email") {
    const emailTrimmed = values.email?.trim() || "";
    if (!emailTrimmed) {
      errors.email = lang === "ar" ? "البريد الإلكتروني مطلوب" : "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = lang === "ar" ? "صيغة البريد الإلكتروني غير صالحة" : "Invalid email format";
    }
  } else if (values.contactMethod === "phone") {
    const phoneTrimmed = values.phoneNumber?.trim() || "";
    if (!phoneTrimmed) {
      errors.phoneNumber = lang === "ar" ? "رقم الجوال مطلوب" : "Phone number is required";
    } else if (phoneTrimmed.length < 9) {
      errors.phoneNumber = lang === "ar" ? "رقم الجوال غير صالح" : "Invalid phone number";
    }
  }

  if (!questionTrimmed) {
    errors.question = lang === "ar" ? "نص الرسالة مطلوب" : "Message text is required";
  } else if (questionTrimmed.length > maxCharacters) {
    errors.question =
      lang === "ar"
        ? `الحد الأقصى للنص هو ${maxCharacters} حرفاً`
        : `Maximum length is ${maxCharacters} characters`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
