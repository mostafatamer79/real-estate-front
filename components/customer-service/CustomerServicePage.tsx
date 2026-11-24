"use client";

import MobileAppHeader from "@/app/src/components/MobileAppHeader";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail, MessageCircle, Phone,
  Send,
  X,
  ChevronLeft, ArrowRight, CheckCircle2, AlertCircle, MessageSquare,
  Search, RefreshCw, LayoutGrid, HelpCircle, Compass, ShieldCheck,
  Clock, ExternalLink
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customerServiceFeedbackApi, type CustomerServiceFeedback } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import styles from "./customer-service.module.css";
import {
  getRouteMeta,
  getTicketStatusDetails,
  filterTickets,
  formatTicketDateTime,
} from "@/lib/redesign-chat04-support";

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

export interface FeedbackSubmitValues {
  name: string;
  contactMethod: "email" | "phone";
  email?: string;
  phoneNumber?: string;
  type: "complaint" | "inquiry" | "suggestion";
  question: string;
  charCount?: number;
  maxCharacters?: number;
  pagePath: string;
}

export interface ExecuteFeedbackSubmitParams {
  isSubmitting?: boolean;
  values: FeedbackSubmitValues;
  api: {
    create: (data: {
      name: string;
      contactMethod: "email" | "phone";
      email?: string;
      phoneNumber?: string;
      question: string;
      type?: "complaint" | "inquiry" | "suggestion";
      pagePath?: string;
    }) => Promise<{ success: boolean; data: CustomerServiceFeedback }>;
  };
  isMounted?: () => boolean;
  onNotice?: (type: "success" | "error", message: string) => void;
  onSuccess?: (feedback: CustomerServiceFeedback) => Promise<void> | void;
  onError?: (err: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface ExecuteFeedbackSubmitResult {
  status: "success" | "error" | "validation_error" | "blocked_by_mutex" | "unmounted";
  data?: CustomerServiceFeedback;
  error?: unknown;
  reason?: string;
}

export async function executeFeedbackSubmit({
  isSubmitting = false,
  values,
  api,
  isMounted = () => true,
  onNotice,
  onSuccess,
  onError,
  successMessage = "Success",
  errorMessage = "Failed to send. Please try again.",
}: ExecuteFeedbackSubmitParams): Promise<ExecuteFeedbackSubmitResult> {
  if (isSubmitting) {
    return { status: "blocked_by_mutex" };
  }

  const trimmedName = values.name.trim();
  const trimmedQuestion = values.question.trim();
  const maxChars = values.maxCharacters ?? 200;
  const currentChars = values.charCount ?? trimmedQuestion.length;

  if (!trimmedName || !trimmedQuestion || currentChars > maxChars) {
    return { status: "validation_error", reason: "Missing required fields or character limit exceeded" };
  }

  if (values.contactMethod === "email" && (!values.email || !values.email.trim())) {
    return { status: "validation_error", reason: "Email required for email contact method" };
  }

  if (values.contactMethod === "phone" && (!values.phoneNumber || !values.phoneNumber.trim())) {
    return { status: "validation_error", reason: "Phone required for phone contact method" };
  }

  try {
    const res = await api.create({
      name: trimmedName,
      contactMethod: values.contactMethod,
      email: values.contactMethod === "email" ? values.email?.trim() : undefined,
      phoneNumber: values.contactMethod === "phone" ? values.phoneNumber?.trim() : undefined,
      type: values.type,
      question: trimmedQuestion,
      pagePath: values.pagePath,
    });

    if (!isMounted()) {
      return { status: "unmounted" };
    }

    if (onNotice) {
      onNotice("success", successMessage);
    }
    if (onSuccess) {
      await onSuccess(res.data);
    }
    return { status: "success", data: res.data };
  } catch (err: unknown) {
    if (!isMounted()) {
      return { status: "unmounted" };
    }
    if (onNotice) {
      onNotice("error", errorMessage);
    }
    if (onError) {
      onError(err);
    }
    return { status: "error", error: err };
  }
}

export interface ExecuteTicketRefreshParams {
  api: {
    listMine: () => Promise<{ success: boolean; data: CustomerServiceFeedback[] }>;
  };
  isAuthenticated: boolean;
  requestId: number;
  currentRequestIdRef: { current: number };
  isMounted?: () => boolean;
  onStart?: () => void;
  onSuccess?: (tickets: CustomerServiceFeedback[]) => void;
  onError?: (err: unknown) => void;
  onFinally?: () => void;
}

export interface ExecuteTicketRefreshResult {
  status: "success" | "error" | "unauthenticated" | "stale_or_unmounted";
  data?: CustomerServiceFeedback[];
  error?: unknown;
}

export async function executeTicketRefresh({
  api,
  isAuthenticated,
  requestId,
  currentRequestIdRef,
  isMounted = () => true,
  onStart,
  onSuccess,
  onError,
  onFinally,
}: ExecuteTicketRefreshParams): Promise<ExecuteTicketRefreshResult> {
  if (!isAuthenticated) {
    return { status: "unauthenticated" };
  }

  if (onStart) {
    onStart();
  }

  try {
    const res = await api.listMine();
    if (!isMounted() || currentRequestIdRef.current !== requestId) {
      return { status: "stale_or_unmounted" };
    }
    const tickets = Array.isArray(res?.data) ? res.data : [];
    if (onSuccess) {
      onSuccess(tickets);
    }
    return { status: "success", data: tickets };
  } catch (err: unknown) {
    if (!isMounted() || currentRequestIdRef.current !== requestId) {
      return { status: "stale_or_unmounted" };
    }
    if (onError) {
      onError(err);
    }
    return { status: "error", error: err };
  } finally {
    if (isMounted() && currentRequestIdRef.current === requestId && onFinally) {
      onFinally();
    }
  }
}

export interface ExecuteTicketReplyParams {
  ticketId: string;
  draft: string;
  replyingTicketId?: string | null;
  api: {
    replyAsUser: (ticketId: string, reply: string) => Promise<{ success: boolean; data: CustomerServiceFeedback }>;
  };
  refreshTickets?: () => Promise<CustomerServiceFeedback[] | null>;
  isMounted?: () => boolean;
  onDraftClear?: (ticketId: string) => void;
  onSuccess?: (refreshedTickets: CustomerServiceFeedback[] | null, replyData: CustomerServiceFeedback) => void;
  onNotice?: (type: "success" | "error", message: string) => void;
  onError?: (err: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
}

export interface ExecuteTicketReplyResult {
  status: "success" | "error" | "empty_draft" | "blocked_by_mutex" | "unmounted";
  data?: CustomerServiceFeedback;
  refreshed?: CustomerServiceFeedback[] | null;
  error?: unknown;
}

export async function executeTicketReply({
  ticketId,
  draft,
  replyingTicketId,
  api,
  refreshTickets,
  isMounted = () => true,
  onDraftClear,
  onSuccess,
  onNotice,
  onError,
  successMessage = "Reply sent successfully",
  errorMessage = "Failed to send reply. Please try again.",
}: ExecuteTicketReplyParams): Promise<ExecuteTicketReplyResult> {
  if (replyingTicketId) {
    return { status: "blocked_by_mutex" };
  }

  const trimmedReply = draft.trim();
  if (!trimmedReply) {
    return { status: "empty_draft" };
  }

  try {
    const res = await api.replyAsUser(ticketId, trimmedReply);
    if (!isMounted()) {
      return { status: "unmounted" };
    }

    if (onDraftClear) {
      onDraftClear(ticketId);
    }

    let refreshed: CustomerServiceFeedback[] | null = null;
    if (refreshTickets) {
      refreshed = await refreshTickets();
    }

    if (onNotice) {
      onNotice("success", successMessage);
    }
    if (onSuccess) {
      onSuccess(refreshed, res.data);
    }

    return { status: "success", data: res.data, refreshed };
  } catch (err: unknown) {
    if (!isMounted()) {
      return { status: "unmounted" };
    }
    if (onNotice) {
      onNotice("error", errorMessage);
    }
    if (onError) {
      onError(err);
    }
    return { status: "error", error: err };
  }
}

export interface CustomerServicePageProps {
  sourcePath?: string;
}

export function CustomerServicePage({ sourcePath }: CustomerServicePageProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const actualSourcePath = resolveSourcePath(sourcePath, pathname);
  const routeMeta = getRouteMeta(actualSourcePath);

  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { isOpen, message, isAdmin } = useSectionGuard("customerservice");
  const { settings } = useSettings();

  const [question, setQuestion] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [type, setType] = useState<"complaint" | "inquiry" | "suggestion">("inquiry");
  const [name, setName] = useState("");
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARACTERS = 200;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<CustomerServiceFeedback[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<CustomerServiceFeedback | null>(null);
  const [ticketReplyDrafts, setTicketReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [submitNotice, setSubmitNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search & Filter state for tickets
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  const isMountedRef = useRef(true);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticketRequestIdRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  const showSubmitNotice = (noticeType: "success" | "error", noticeMessage: string) => {
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    setSubmitNotice({ type: noticeType, message: noticeMessage });
    noticeTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setSubmitNotice(null);
      }
    }, 4500);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/details");
  };

  useEffect(() => {
    if (!user) return;
    setName((current) => current || `${user.firstName || ""} ${user.lastName || ""}`.trim());
    setEmail((current) => current || user.email || "");
    setPhoneNumber((current) => current || user.phone || "");
    if (user.email) setContactMethod("email");
    else if (user.phone) setContactMethod("phone");
  }, [user]);

  const refreshTickets = async (): Promise<CustomerServiceFeedback[] | null> => {
    if (!isAuthenticated) return null;
    const reqId = ++ticketRequestIdRef.current;
    let listResult: CustomerServiceFeedback[] | null = null;

    await executeTicketRefresh({
      api: customerServiceFeedbackApi,
      isAuthenticated,
      requestId: reqId,
      currentRequestIdRef: ticketRequestIdRef,
      isMounted: () => isMountedRef.current,
      onStart: () => {
        setTicketsLoading(true);
        setTicketsError(null);
      },
      onSuccess: (list) => {
        setTickets(list);
        setTicketsError(null);
        listResult = list;
        // Keep selected ticket in sync if currently open
        if (selectedTicket) {
          const fresh = list.find((t) => t.id === selectedTicket.id);
          if (fresh) {
            setSelectedTicket(fresh);
          }
        }
      },
      onError: () => {
        const errorMsg =
          language === "ar"
            ? "تعذر تحميل التذاكر من الخادم. يرجى المحاولة مرة أخرى."
            : "Failed to load tickets from server. Please retry.";
        setTicketsError(errorMsg);
      },
      onFinally: () => {
        setTicketsLoading(false);
      },
    });

    return listResult;
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshTickets();
    } else {
      setTickets([]);
      setTicketsError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARACTERS) {
      setQuestion(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await executeFeedbackSubmit({
        isSubmitting: false,
        values: {
          name,
          contactMethod,
          email: contactMethod === "email" ? email : undefined,
          phoneNumber: contactMethod === "phone" ? phoneNumber : undefined,
          type,
          question,
          charCount,
          maxCharacters: MAX_CHARACTERS,
          pagePath: actualSourcePath,
        },
        api: customerServiceFeedbackApi,
        isMounted: () => isMountedRef.current,
        onNotice: (noticeType, noticeMsg) => {
          showSubmitNotice(noticeType, noticeMsg);
        },
        onSuccess: async () => {
          setQuestion("");
          setCharCount(0);
          if (!user) {
            setEmail("");
            setPhoneNumber("");
            setName("");
          }
          await refreshTickets();
          if (routeMeta.tabKey === "support") {
            setShowNewTicketForm(false);
          }
        },
        onError: () => {},
        successMessage: t("cs.alert.success"),
        errorMessage:
          language === "ar"
            ? "فشل إرسال الرسالة. حاول مرة أخرى."
            : "Failed to send. Please try again.",
      });
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const submitTicketReply = async (ticketId: string) => {
    if (replyingTicketId) return;
    const draft = ticketReplyDrafts[ticketId] || "";
    if (!draft.trim()) return;

    setReplyingTicketId(ticketId);
    try {
      await executeTicketReply({
        ticketId,
        draft,
        replyingTicketId: null,
        api: customerServiceFeedbackApi,
        refreshTickets,
        isMounted: () => isMountedRef.current,
        onDraftClear: (id) => {
          setTicketReplyDrafts((current) => ({ ...current, [id]: "" }));
        },
        onSuccess: (refreshedList) => {
          if (refreshedList) {
            setSelectedTicket(refreshedList.find((t) => t.id === ticketId) || null);
          }
        },
        onNotice: (noticeType, noticeMsg) => {
          showSubmitNotice(noticeType, noticeMsg);
        },
        onError: () => {
          // Draft is preserved because onDraftClear is not called
        },
        successMessage:
          language === "ar" ? "تم إرسال ردك بنجاح." : "Your reply has been sent.",
        errorMessage:
          language === "ar"
            ? "فشل إرسال الرد. حاول مرة أخرى."
            : "Failed to send reply. Please try again.",
      });
    } finally {
      if (isMountedRef.current) {
        setReplyingTicketId(null);
      }
    }
  };

  const filteredTickets = useMemo(() => {
    return filterTickets(tickets, ticketSearch, ticketStatusFilter);
  }, [tickets, ticketSearch, ticketStatusFilter]);

  const activeTicketStats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => t.status === "new" || t.status === "customer_replied").length;
    const replied = tickets.filter((t) => t.status === "replied").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    return { total, pending, replied, resolved };
  }, [tickets]);

  const ticketStatusStyleClass = (status: CustomerServiceFeedback["status"]) => {
    switch (status) {
      case "resolved":
        return styles.statusBadgeResolved;
      case "replied":
        return styles.statusBadgeReplied;
      case "customer_replied":
        return styles.statusBadgeCustomerReplied;
      case "new":
      default:
        return styles.statusBadgeNew;
    }
  };

  if (!isOpen) {
    return (
      <div className="calm-page calm-screen min-h-dvh-safe bg-muted flex items-center justify-center p-3 sm:p-6">
        <ComingSoonOverlay sectionName={t("cs.title")} message={message} isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.pageContainer} calm-page calm-screen min-h-dvh-safe pb-16 overflow-x-hidden`}
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        backgroundColor: settings.csBg || undefined,
        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
      }}
    >
      <MobileAppHeader theme="light" title={t("cs.title")} />

      {/* Floating Alert Notice */}
      <AnimatePresence>
        {submitNotice && (
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            className="fixed left-1/2 top-5 z-[10000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
            role="status"
            aria-live="polite"
          >
            <div
              className={`flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xl ${
                submitNotice.type === "success" ? "border-emerald-200 dark:border-emerald-900/40" : "border-red-200 dark:border-red-900/40"
              }`}
              style={{ backgroundColor: settings.csCardBg || undefined }}
            >
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  submitNotice.type === "success" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                }`}
              >
                {submitNotice.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 dark:text-slate-100">
                  {submitNotice.type === "success"
                    ? language === "ar"
                      ? "تم بنجاح"
                      : "Success"
                    : language === "ar"
                    ? "تنبيه"
                    : "Notice"}
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground dark:text-slate-300">
                  {submitNotice.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubmitNotice(null)}
                aria-label={language === "ar" ? "إغلاق التنبيه" : "Close notice"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Architectural Hero Header */}
      <header className={styles.heroSection} style={{ backgroundColor: settings.csCardBg || undefined }}>
        {/* Architectural Concierge Artwork */}
        <div className={styles.heroArtwork}>
          <Image
            src="/artworks/chat04-concierge.svg"
            alt="Customer Service Architectural Concierge"
            width={400}
            height={250}
            priority
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <button
            type="button"
            onClick={handleBack}
            className="mb-6 inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card/80 px-4 text-xs font-black transition-all hover:bg-muted"
            aria-label={language === "ar" ? "الرجوع للصفحة السابقة" : "Go back"}
          >
            {language === "ar" ? <ArrowRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {language === "ar" ? "رجوع" : "Back"}
          </button>

          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-600/20 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{language === "ar" ? routeMeta.badgeAr : routeMeta.badgeEn}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {language === "ar" ? routeMeta.titleAr : routeMeta.titleEn}
            </h1>
            <p className="text-muted-foreground dark:text-slate-400 text-sm sm:text-base leading-relaxed font-medium">
              {language === "ar" ? routeMeta.subtitleAr : routeMeta.subtitleEn}
            </p>
          </div>

          {/* Sub-Navigation Bar */}
          <nav
            className={`${styles.subNavBar} mt-8 max-w-3xl`}
            role="tablist"
            aria-label={language === "ar" ? "أقسام خدمة العملاء" : "Customer service sections"}
          >
            <Link
              href="/customerservice"
              role="tab"
              aria-selected={routeMeta.tabKey === "hub"}
              className={`${styles.navTabLink} ${routeMeta.tabKey === "hub" ? styles.navTabLinkActive : ""}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>{language === "ar" ? "المركز الرئيسي" : "Care Hub"}</span>
            </Link>

            <Link
              href="/customerservice/contact"
              role="tab"
              aria-selected={routeMeta.tabKey === "contact"}
              className={`${styles.navTabLink} ${routeMeta.tabKey === "contact" ? styles.navTabLinkActive : ""}`}
            >
              <Phone className="w-4 h-4" />
              <span>{language === "ar" ? "اتصل بنا" : "Contact Us"}</span>
            </Link>

            <Link
              href="/customerservice/support"
              role="tab"
              aria-selected={routeMeta.tabKey === "support"}
              className={`${styles.navTabLink} ${routeMeta.tabKey === "support" ? styles.navTabLinkActive : ""}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{language === "ar" ? "تذاكر الدعم" : "Support Tickets"}</span>
              {isAuthenticated && tickets.length > 0 && (
                <span className={styles.navTabBadge}>
                  {tickets.length}
                </span>
              )}
            </Link>

            <Link
              href="/customerservice/faq"
              className={styles.navTabLink}
              title={language === "ar" ? "الأسئلة الشائعة" : "FAQ"}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{language === "ar" ? "الأسئلة الشائعة" : "FAQ"}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <Link
              href="/services"
              className={styles.navTabLink}
              title={language === "ar" ? "دليل الخدمات العقارية" : "Real Estate Services"}
            >
              <Compass className="w-4 h-4" />
              <span>{language === "ar" ? "الخدمات" : "Services"}</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-10">
        {/* Top Channels Strip (Displayed on Hub and Contact, configurable via settings) */}
        {settings.uiFlags?.show_cs_channels !== false && (routeMeta.tabKey === "hub" || routeMeta.tabKey === "contact") && (
          <section className="mb-12" aria-labelledby="channels-heading">
            <h2 id="channels-heading" className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">
              {language === "ar" ? "قنوات التواصل المعتمدة" : "Direct Official Channels"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {settings.contactPhone?.trim() && (
                <a
                  href={`tel:${settings.contactPhone}`}
                  className={`${styles.cardBase} ${styles.cardHoverable} p-5 flex items-center gap-4 text-start group`}
                >
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-muted-foreground">{t("cs.contactNum")}</p>
                    <p className="text-sm font-black font-mono mt-0.5" dir="ltr">{settings.contactPhone}</p>
                  </div>
                </a>
              )}

              <a
                href={`mailto:${settings.contactEmail || "support@example.com"}`}
                className={`${styles.cardBase} ${styles.cardHoverable} p-5 flex items-center gap-4 text-start group`}
              >
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-muted-foreground">{t("cs.email")}</p>
                  <p className="text-sm font-black font-mono mt-0.5 truncate" dir="ltr">
                    {settings.contactEmail || "support@example.com"}
                  </p>
                </div>
              </a>

              <a
                href={getXProfileUrl(settings.contactTwitter || "")}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.cardBase} ${styles.cardHoverable} p-5 flex items-center gap-4 text-start group`}
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-500/10 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-muted-foreground">X (Twitter)</p>
                  <p className="text-sm font-black font-mono mt-0.5 truncate" dir="ltr">
                    {getXDisplayHandle(settings.contactTwitter || "") || "@Support"}
                  </p>
                </div>
              </a>
            </div>
          </section>
        )}

        {/* VIEW 1: HUB OVERVIEW (/customerservice) */}
        {routeMeta.tabKey === "hub" && (
          <div className="space-y-12">
            {/* Quick Gateways Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label={language === "ar" ? "بوابات سريعة" : "Quick portals"}>
              {/* Card 1: Support Tickets Gateway */}
              <div className={`${styles.cardBase} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black mb-1">
                    {language === "ar" ? "تذاكر الدعم والاستفسارات" : "Support Tickets & Cases"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {isAuthenticated
                      ? language === "ar"
                        ? `لديك ${activeTicketStats.total} تذكرة مسجلة (${activeTicketStats.pending} قيد المتابعة، ${activeTicketStats.replied} تم الرد).`
                        : `You have ${activeTicketStats.total} registered tickets (${activeTicketStats.pending} in progress, ${activeTicketStats.replied} replied).`
                      : language === "ar"
                      ? "سجل الدخول للاطلاع على استفساراتك وتتبع ردود الدعم الفني."
                      : "Sign in to track your inquiries and view customer support replies."}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/customerservice/support"
                    className="inline-flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    <span>{language === "ar" ? "الانتقال لمركز التذاكر" : "Open Support Tickets"}</span>
                    {language === "ar" ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
                  </Link>
                </div>
              </div>

              {/* Card 2: FAQ Gateway */}
              <div className={`${styles.cardBase} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black mb-1">
                    {language === "ar" ? "الأسئلة الشائعة والمعلومات" : "Frequently Asked Questions"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {language === "ar"
                      ? "إجابات فورية وشاملة لكافة أسئلة البحث، الشراء، التوثيق، والدفع العقاري."
                      : "Instant answers for common real estate questions, buying, leasing, and verified payments."}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/customerservice/faq"
                    className="inline-flex items-center gap-2 text-xs font-black text-blue-700 dark:text-blue-400 hover:underline"
                  >
                    <span>{language === "ar" ? "تصفح الأسئلة الشائعة" : "Browse FAQs"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Real Estate Services Gateway */}
              <div className={`${styles.cardBase} p-6 flex flex-col justify-between`}>
                <div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black mb-1">
                    {language === "ar" ? "الخدمات والطلبات العقارية" : "Real Estate Services Catalog"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    {language === "ar"
                      ? "طلب تقييم عقاري، استشارة قانونية، فحص هندسي، أو خدمات تسويقية متقدمة."
                      : "Request property appraisal, legal advisory, engineering inspection, or marketing services."}
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>{language === "ar" ? "استعراض دليل الخدمات" : "View Services Catalog"}</span>
                    {language === "ar" ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
                  </Link>
                </div>
              </div>
            </section>

            {/* Direct Inquiry Form (Hub view) */}
            {settings.uiFlags?.show_cs_form !== false && (
              <section className="space-y-4" aria-labelledby="hub-form-heading">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 id="hub-form-heading" className="text-lg font-black">
                      {language === "ar" ? "إرسال استفسار أو بلاغ مباشر" : "Send an Inquiry or Feedback"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      {language === "ar"
                        ? "أرسل رسالتك مباشرة وسيقوم فريق خدمة العملاء بالتواصل معك."
                        : "Send your message directly and our team will get in touch with you."}
                    </p>
                  </div>
                  <Link
                    href="/customerservice/contact"
                    className="text-xs font-black text-muted-foreground hover:underline"
                  >
                    {language === "ar" ? "صفحة التواصل الكاملة" : "Full contact page"}
                  </Link>
                </div>

                <div className={`${styles.cardBase} p-6 sm:p-8`}>
                  {renderFeedbackForm()}
                </div>
              </section>
            )}
          </div>
        )}

        {/* VIEW 2: CONTACT FOCUSED (/customerservice/contact) */}
        {routeMeta.tabKey === "contact" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Column */}
              <div className="lg:col-span-2">
                <div className={`${styles.cardBase} p-6 sm:p-8`}>
                  <div className="mb-6 border-b pb-4">
                    <h2 className="text-lg font-black mb-1">
                      {language === "ar" ? "نموذج التواصل والمراسلة المباشرة" : "Direct Contact & Dispatch Form"}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      {language === "ar"
                        ? "املأ البيانات أدناه لاختيار نوع المراسلة وسنقوم بمتابعة طلبك وتزويدك بالرد."
                        : "Complete the details below to dispatch your inquiry, complaint, or proposal."}
                    </p>
                  </div>
                  {renderFeedbackForm()}
                </div>
              </div>

              {/* Informational Side Column */}
              <div className="space-y-6">
                <div className={`${styles.cardBase} p-6 space-y-4`}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black">
                        {language === "ar" ? "أوقات استجابة الدعم" : "Support Hours"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {language === "ar" ? "على مدار الساعة لكافة الاستفسارات" : "24/7 coverage for real estate inquiries"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 text-xs font-medium text-muted-foreground leading-relaxed">
                    {language === "ar"
                      ? "يتم توثيق كافة المراسلات والشكاوى لضمان جودة الخدمة وتقديم حلول موثوقة تلبي تطلعاتكم."
                      : "All inquiries and complaints are logged under verified tickets to ensure high service standards."}
                  </div>

                  {isAuthenticated && (
                    <div className="border-t pt-4">
                      <p className="text-xs font-bold text-muted-foreground mb-2">
                        {language === "ar" ? "هل تبحث عن رسائلك السابقة؟" : "Looking for previous tickets?"}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-xs font-black h-9 rounded-xl"
                        onClick={() => router.push("/customerservice/support")}
                      >
                        {language === "ar" ? "متابعة تذاكر الدعم" : "View Support Tickets"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SUPPORT TICKETS FOCUSED (/customerservice/support) */}
        {routeMeta.tabKey === "support" && (
          <div className="space-y-8">
            {!isAuthenticated ? (
              <section
                className={`${styles.cardBase} p-8 text-center max-w-xl mx-auto space-y-5`}
                aria-label={language === "ar" ? "تسجيل الدخول لمتابعة التذاكر" : "Login to view tickets"}
              >
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-black mb-1">
                    {language === "ar" ? "سجل متابعة تذاكر الدعم" : "Support Ticket Portal"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                    {language === "ar"
                      ? "يرجى تسجيل الدخول بحسابك لعرض تذاكرك الحالية ومتابعة ردود فريق خدمة العملاء وإرسال التعقيبات."
                      : "Please sign in to view your open support tickets, read responses, and submit follow-up replies."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    type="button"
                    className={`${styles.btnBrass} h-11 px-8 text-xs font-black uppercase tracking-wider`}
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(actualSourcePath)}`)}
                  >
                    {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 px-6 text-xs font-black rounded-xl"
                    onClick={() => router.push("/customerservice/contact")}
                  >
                    {language === "ar" ? "إرسال استفسار عام كزائر" : "Contact as Guest"}
                  </Button>
                </div>
              </section>
            ) : (
              <div className="space-y-6">
                {/* Header Controls: Search, Filter, Refresh, and New Ticket Toggle */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative min-w-[220px]">
                      <Search className="w-4 h-4 absolute inset-inline-start-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder={language === "ar" ? "بحث برقم التذكرة أو المحتوى..." : "Search tickets..."}
                        className="h-10 ps-9 rounded-xl text-xs font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl text-xs font-bold">
                      {[
                        { id: "all", labelAr: "الكل", labelEn: "All" },
                        { id: "new", labelAr: "جديد", labelEn: "New" },
                        { id: "replied", labelAr: "تم الرد", labelEn: "Replied" },
                        { id: "resolved", labelAr: "تم الحل", labelEn: "Resolved" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTicketStatusFilter(item.id)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            ticketStatusFilter === item.id
                              ? "bg-card text-foreground shadow-sm font-black"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {language === "ar" ? item.labelAr : item.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl text-xs font-black gap-2"
                      onClick={() => refreshTickets()}
                      disabled={ticketsLoading}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${ticketsLoading ? "animate-spin" : ""}`} />
                      <span>
                        {ticketsLoading
                          ? language === "ar"
                            ? "جار التحديث..."
                            : "Updating..."
                          : language === "ar"
                          ? "تحديث السجل"
                          : "Refresh"}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      className={`${styles.btnBrass} h-10 rounded-xl text-xs font-black gap-2`}
                      onClick={() => setShowNewTicketForm((cur) => !cur)}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {showNewTicketForm
                          ? language === "ar"
                            ? "إخفاء النموذج"
                            : "Hide Form"
                          : language === "ar"
                          ? "استفسار جديد"
                          : "New Ticket"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Collapsible New Ticket Creation Form */}
                <AnimatePresence>
                  {showNewTicketForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={`${styles.cardBase} p-6 sm:p-8 mb-6 border-amber-600/30`}>
                        <div className="flex items-center justify-between mb-4 border-b pb-3">
                          <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{language === "ar" ? "فتح تذكرة استفسار أو شكوى جديدة" : "Open New Support Case"}</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowNewTicketForm(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {renderFeedbackForm()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Banner with Retry Button */}
                {ticketsError && (
                  <div
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/20 p-4 text-xs"
                    role="alert"
                  >
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span>{ticketsError}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg text-xs font-black uppercase tracking-wider border-red-200 hover:bg-red-100 text-red-700 dark:text-red-300 dark:border-red-800"
                      onClick={() => refreshTickets()}
                    >
                      {language === "ar" ? "إعادة المحاولة" : "Retry"}
                    </Button>
                  </div>
                )}

                {/* Tickets Grid / Empty State */}
                {ticketsLoading && tickets.length === 0 ? (
                  <div className={`${styles.cardBase} p-12 text-center text-xs font-black uppercase tracking-widest text-muted-foreground`}>
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 opacity-60" />
                    <span>{language === "ar" ? "جار تحميل التذاكر..." : "Loading tickets..."}</span>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className={`${styles.cardBase} p-12 text-center space-y-3`}>
                    <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-black">
                      {tickets.length === 0
                        ? language === "ar"
                          ? "لا توجد رسائل بعد"
                          : "No messages yet"
                        : language === "ar"
                        ? "لا توجد نتائج تطابق معايير البحث الحالية."
                        : "No tickets match your filter criteria."}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {tickets.length === 0
                        ? language === "ar"
                          ? "يمكنك إرسال استفسارك الأول باستخدام زر 'استفسار جديد'."
                          : "You can submit your first inquiry using the 'New Ticket' button above."
                        : language === "ar"
                        ? "جرب إزالة معايير التصفية أو تغيير كلمات البحث."
                        : "Try clearing search keywords or selecting all statuses."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTickets.map((ticket) => {
                      const statusDetails = getTicketStatusDetails(ticket.status, language === "ar" ? "ar" : "en");
                      return (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className={`${styles.cardBase} ${styles.cardHoverable} p-5 text-start flex flex-col justify-between group`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-xs font-mono font-black text-muted-foreground">
                                #{ticket.id.slice(0, 8)}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${ticketStatusStyleClass(ticket.status)}`}
                                aria-label={statusDetails.ariaLabel}
                              >
                                {statusDetails.label}
                              </span>
                            </div>

                            <div className="inline-block mb-2">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {ticket.type === "complaint"
                                  ? language === "ar"
                                    ? "شكوى"
                                    : "Complaint"
                                  : ticket.type === "suggestion"
                                  ? language === "ar"
                                    ? "اقتراح"
                                    : "Suggestion"
                                  : language === "ar"
                                  ? "استفسار"
                                  : "Inquiry"}
                              </span>
                            </div>

                            <p className="line-clamp-2 text-xs font-medium leading-relaxed mb-4">
                              {ticket.question}
                            </p>
                          </div>

                          <div className="border-t pt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTicketDateTime(ticket.updatedAt || ticket.createdAt, language === "ar" ? "ar" : "en")}</span>
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 font-bold group-hover:underline">
                              {language === "ar" ? "عرض التفاصيل" : "View Details"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Accessible Scrollable Ticket Dialog */}
      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent
          className={`${styles.dialogPortalContent} flex flex-col max-h-[85dvh] w-[95vw] sm:max-w-2xl overflow-hidden rounded-[1.25rem] p-0 border`}
        >
          {selectedTicket && (() => {
            const statusDetails = getTicketStatusDetails(selectedTicket.status, language === "ar" ? "ar" : "en");
            return (
              <>
                <DialogHeader className="border-b p-4 sm:p-6 text-start shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <DialogTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                        <span>{language === "ar" ? "تذكرة الدعم" : "Support Ticket"} #{selectedTicket.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider rounded bg-muted px-2 py-0.5 border">
                          {selectedTicket.type === "complaint"
                            ? language === "ar"
                              ? "شكوى"
                              : "Complaint"
                            : selectedTicket.type === "suggestion"
                            ? language === "ar"
                              ? "اقتراح"
                              : "Suggestion"
                            : language === "ar"
                            ? "استفسار"
                            : "Inquiry"}
                        </span>
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-xs text-muted-foreground font-medium">
                        {language === "ar" ? "تاريخ الإنشاء: " : "Created: "}
                        {formatTicketDateTime(selectedTicket.createdAt, language === "ar" ? "ar" : "en")}
                      </DialogDescription>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 ${ticketStatusStyleClass(selectedTicket.status)}`}
                      aria-label={statusDetails.ariaLabel}
                    >
                      {statusDetails.label}
                    </span>
                  </div>
                </DialogHeader>

                {/* Scrollable Conversation Trail */}
                <div className="space-y-4 p-4 sm:p-6 overflow-y-auto flex-1">
                  {/* User Initial Inquiry */}
                  <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-muted p-4">
                    <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {language === "ar" ? "رسالتك الأصلية" : "Your Initial Inquiry"}
                    </p>
                    <p className="whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed">
                      {selectedTicket.question}
                    </p>
                  </div>

                  {/* Customer Service Admin Reply */}
                  {selectedTicket.adminReply && (
                    <div className="ms-auto max-w-[88%] rounded-2xl rounded-tl-sm bg-blue-500/10 border border-blue-500/20 p-4">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        {language === "ar" ? "فريق خدمة العملاء" : "Customer Service Team"}
                      </p>
                      <p className="whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed">
                        {selectedTicket.adminReply}
                      </p>
                      {selectedTicket.adminRepliedAt && (
                        <p className="mt-2 text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70">
                          {formatTicketDateTime(selectedTicket.adminRepliedAt, language === "ar" ? "ar" : "en")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Subsequent User Reply */}
                  {selectedTicket.userReply && (
                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-muted p-4">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {language === "ar" ? "تعقيبك الأخير" : "Your Latest Reply"}
                      </p>
                      <p className="whitespace-pre-wrap text-xs sm:text-sm font-medium leading-relaxed">
                        {selectedTicket.userReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Reply Footer (If ticket is not yet resolved) */}
                {selectedTicket.status !== "resolved" && (
                  <DialogFooter className="border-t p-3 sm:p-5 shrink-0 bg-muted/40">
                    <div className="w-full space-y-3">
                      <Label htmlFor={`cs-reply-${selectedTicket.id}`} className="text-xs font-black">
                        {language === "ar" ? "إضافة تعقيب أو رد على التذكرة:" : "Add reply to ticket:"}
                      </Label>
                      <Textarea
                        id={`cs-reply-${selectedTicket.id}`}
                        value={ticketReplyDrafts[selectedTicket.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTicketReplyDrafts((current) => ({ ...current, [selectedTicket.id]: val }));
                        }}
                        disabled={replyingTicketId === selectedTicket.id}
                        className="min-h-20 rounded-xl text-xs font-medium"
                        placeholder={
                          language === "ar"
                            ? "اكتب ردك أو استفسارك الإضافي هنا..."
                            : "Write your follow-up reply here..."
                        }
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {ticketReplyDrafts[selectedTicket.id]?.length || 0}/500
                        </span>
                        <Button
                          type="button"
                          disabled={
                            replyingTicketId === selectedTicket.id ||
                            !(ticketReplyDrafts[selectedTicket.id] || "").trim()
                          }
                          onClick={() => submitTicketReply(selectedTicket.id)}
                          className={`${styles.btnBrass} h-9 px-5 text-xs font-black gap-2`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>
                            {replyingTicketId === selectedTicket.id
                              ? language === "ar"
                                ? "جار الإرسال..."
                                : "Sending..."
                              : language === "ar"
                              ? "إرسال الرد"
                              : "Send Reply"}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </DialogFooter>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Admin Quick Action Floating Button */}
      {user?.role === "admin" && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/details")}
          aria-label={language === "ar" ? "لوحة الإدارة والتفاصيل" : "Admin dashboard & details"}
          className="fixed bottom-6 inset-inline-start-6 w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-50 group border border-white/10"
        >
          <ChevronLeft className={`w-6 h-6 ${language === "ar" ? "rotate-180" : ""}`} />
        </motion.button>
      )}
    </div>
  );

  // Helper renderer for feedback form with proper label IDs
  function renderFeedbackForm() {
    return (
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Name input */}
        <div className="space-y-1.5">
          <Label htmlFor="cs-name" className="text-xs font-black">
            {t("cs.name")}
          </Label>
          <Input
            id="cs-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="h-11 rounded-xl text-xs font-medium"
            placeholder={language === "ar" ? "اسمك الكريم" : "Your full name"}
            required
          />
        </div>

        {/* Message Type Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black">
            {language === "ar" ? "نوع الرسالة أو الطلب" : "Inquiry Type"}
          </Label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl text-xs font-bold" role="radiogroup">
            <button
              type="button"
              disabled={isSubmitting}
              role="radio"
              aria-checked={type === "inquiry"}
              onClick={() => setType("inquiry")}
              className={`h-9 rounded-lg transition-all ${
                type === "inquiry" ? "bg-card text-foreground shadow-sm font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "ar" ? "استفسار" : "Inquiry"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              role="radio"
              aria-checked={type === "complaint"}
              onClick={() => setType("complaint")}
              className={`h-9 rounded-lg transition-all ${
                type === "complaint" ? "bg-card text-foreground shadow-sm font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "ar" ? "شكوى" : "Complaint"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              role="radio"
              aria-checked={type === "suggestion"}
              onClick={() => setType("suggestion")}
              className={`h-9 rounded-lg transition-all ${
                type === "suggestion" ? "bg-card text-foreground shadow-sm font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {language === "ar" ? "اقتراح" : "Suggestion"}
            </button>
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="space-y-1.5">
          <Label className="text-xs font-black">
            {language === "ar" ? "طريقة التواصل المفضلة للرد" : "Preferred Reply Method"}
          </Label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl text-xs font-bold" role="radiogroup">
            <button
              type="button"
              disabled={isSubmitting}
              role="radio"
              aria-checked={contactMethod === "email"}
              onClick={() => setContactMethod("email")}
              className={`h-9 rounded-lg flex items-center justify-center gap-2 transition-all ${
                contactMethod === "email" ? "bg-card text-foreground shadow-sm font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "البريد الإلكتروني" : "Email"}</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              role="radio"
              aria-checked={contactMethod === "phone"}
              onClick={() => setContactMethod("phone")}
              className={`h-9 rounded-lg flex items-center justify-center gap-2 transition-all ${
                contactMethod === "phone" ? "bg-card text-foreground shadow-sm font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{language === "ar" ? "الجوال / هاتف" : "Phone"}</span>
            </button>
          </div>
        </div>

        {/* Contact Method Input (Email or Phone) */}
        {contactMethod === "email" ? (
          <div className="space-y-1.5">
            <Label htmlFor="cs-email" className="text-xs font-black">
              {t("cs.email")}
            </Label>
            <Input
              id="cs-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="h-11 rounded-xl text-xs font-medium"
              placeholder="name@example.com"
              dir="ltr"
              required
            />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="cs-phone" className="text-xs font-black">
              {t("cs.phone")}
            </Label>
            <Input
              id="cs-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSubmitting}
              className="h-11 rounded-xl text-xs font-medium"
              placeholder="05xxxxxxxx"
              dir="ltr"
              required
            />
          </div>
        )}

        {/* Question / Message Textarea */}
        <div className="space-y-1.5">
          <Label htmlFor="cs-question" className="text-xs font-black">
            {type === "complaint"
              ? language === "ar"
                ? "تفاصيل الشكوى..."
                : "Complaint details..."
              : type === "suggestion"
              ? language === "ar"
                ? "اكتب اقتراحك هنا..."
                : "Write your suggestion here..."
              : t("cs.placeholder.inquiry")}
          </Label>
          <div className="relative">
            <Textarea
              id="cs-question"
              value={question}
              onChange={handleQuestionChange}
              disabled={isSubmitting}
              className="min-h-[110px] rounded-xl text-xs font-medium resize-none pb-7"
              placeholder={
                type === "complaint"
                  ? language === "ar"
                    ? "يرجى توضيح تفاصيل الشكوى بدقة لمتابعتها..."
                    : "Please describe complaint details..."
                  : language === "ar"
                  ? "اكتب تفاصيل استفسارك أو طلبك..."
                  : "Enter your inquiry or request details..."
              }
              required
            />
            <div
              className={`absolute bottom-2.5 inset-inline-end-3 text-[10px] font-mono font-bold ${
                charCount >= MAX_CHARACTERS ? "text-red-500" : "text-muted-foreground"
              }`}
            >
              {charCount}/{MAX_CHARACTERS}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !question.trim() ||
            !name.trim() ||
            (contactMethod === "email" ? !email.trim() : !phoneNumber.trim()) ||
            charCount > MAX_CHARACTERS
          }
          className={`${styles.btnBrass} w-full h-11 text-xs font-black uppercase tracking-wider gap-2`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{language === "ar" ? "جار الإرسال..." : "Sending..."}</span>
            </>
          ) : (
            <>
              <span>{t("cs.submit")}</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>
    );
  }
}

export default function CustomerService(props: CustomerServicePageProps = {}) {
  return <CustomerServicePage {...props} />;
}
