"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Briefcase,
  UploadCloud,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";
import {
  formatLicenseDate,
  licenseDatesError,
  providerLicenseExpired,
} from "@/lib/provider-license-dates";
import { loginHref } from "@/lib/auth-navigation";
import {
  providerApi,
  providerError,
  providerStatus,
  deliveryLabel,
  type DeliveryMode,
  type ProviderProfile,
  type ProviderOpportunity,
  type ProviderSpecialization,
  type ProviderRegistrationField,
} from "@/lib/providers";
import ServiceCategoryBrowser from "@/components/providers/ServiceCategoryBrowser";
import { type ServiceSelection } from "@/lib/service-navigation";
import ServiceCategoryTree from "@/components/providers/ServiceCategoryTree";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  matchesFieldCategories,
  matchesSpecialization,
  calculateMinOffer,
  calculateMaxOffer,
  isOpportunityActionable,
  validateUploadFile,
  validateOfferSubmission,
  getTrackingNavigationContract,
} from "@/lib/redesign-chat02-provider-helpers";
import NafathVerification from "@/components/profile/NafathVerification";
import styles from "./provider-registration.module.css";

const INVITE_STORAGE_KEY = "providerInvitationToken";
type InviteState = "idle" | "checking" | "valid" | "invalid" | "missing";

export default function ProviderPage() {
  const { user, isLoading, isAuthenticated, updateUser } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const ar = language === "ar";

  // Keep a stable ref for language to prevent re-creating load callback when language changes
  const arRef = useRef(ar);
  arRef.current = ar;

  const mountedRef = useRef(true);
  const loadRevision = useRef(0);
  const hasHydratedFormRef = useRef(false);
  const dirtyFieldsRef = useRef<Set<string>>(new Set());

  // Server state
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [error, setError] = useState("");
  const [offerError, setOfferError] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [inviteState, setInviteState] = useState<InviteState>("idle");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");

  // Metadata catalogs
  const [registrationFields, setRegistrationFields] = useState<ProviderRegistrationField[]>([]);
  const [specializations, setSpecializations] = useState<ProviderSpecialization[]>([]);

  // Registration Form State (persisted across language toggle, failed submit, and refresh)
  const [kind, setKind] = useState<"general" | "notary">("general");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>([]);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseDocument, setLicenseDocument] = useState("");
  const [licenseIssueDate, setLicenseIssueDate] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [specializationId, setSpecializationId] = useState("");
  const [registrationAnswers, setRegistrationAnswers] = useState<Record<string, string>>({});

  // Opportunities & Marketplace State
  const [page, setPage] = useState(1);
  const [displayedPage, setDisplayedPage] = useState(1);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [opportunityError, setOpportunityError] = useState("");
  const [serviceSelection, setServiceSelection] = useState<ServiceSelection>({});
  const [total, setTotal] = useState(0);
  const [opportunities, setOpportunities] = useState<ProviderOpportunity[]>([]);
  const [selected, setSelected] = useState<ProviderOpportunity | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<DeliveryMode>("online");
  const [offerNote, setOfferNote] = useState("");

  const licenseBlocked =
    !!profile && (!!licenseDatesError(profile, ar) || providerLicenseExpired(profile));

  const markDirty = (fieldName: string) => {
    dirtyFieldsRef.current.add(fieldName);
  };

  const load = useCallback(
    async (targetPage = page) => {
      const revision = ++loadRevision.current;
      if (!hasHydratedFormRef.current) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      try {
        const [profileResult, typeResult, fieldResult] = await Promise.all([
          providerApi.mine(),
          providerApi.specializations(),
          providerApi.registrationFields(),
        ]);

        if (revision !== loadRevision.current || !mountedRef.current) return;

        const next = profileResult.data || null;
        setProfile(next);
        setProfileReady(true);
        setSpecializations(typeResult.data || []);
        setRegistrationFields(fieldResult.data || []);

        // Initial hydration: only populate form fields on initial hydration if they are not dirty
        if (!hasHydratedFormRef.current) {
          hasHydratedFormRef.current = true;
          if (next) {
            if (!dirtyFieldsRef.current.has("kind")) setKind(next.kind || "general");
            if (!dirtyFieldsRef.current.has("specializationId")) {
              setSpecializationId(next.specializationId || "");
            }
            if (!dirtyFieldsRef.current.has("registrationAnswers")) {
              setRegistrationAnswers(next.registrationAnswers || {});
            }
            if (!dirtyFieldsRef.current.has("city")) setCity(next.city || "");
            if (!dirtyFieldsRef.current.has("categories")) {
              setCategories(next.requestedCategories || []);
            }
            if (!dirtyFieldsRef.current.has("deliveryModes")) {
              setDeliveryModes(next.deliveryModes || []);
            }
            if (!dirtyFieldsRef.current.has("licenseNumber")) {
              setLicenseNumber(next.licenseNumber || "");
            }
            if (!dirtyFieldsRef.current.has("licenseDocument")) {
              setLicenseDocument(next.licenseDocument || "");
            }
            if (!dirtyFieldsRef.current.has("licenseIssueDate")) {
              setLicenseIssueDate(next.licenseIssueDate || "");
            }
            if (!dirtyFieldsRef.current.has("licenseExpiryDate")) {
              setLicenseExpiryDate(next.licenseExpiryDate || "");
            }
            if (!dirtyFieldsRef.current.has("notes")) setNotes(next.notes || "");
          }
        }

        // Fetch opportunities only if approved and license is not expired
        if (
          next?.status === "approved" &&
          !licenseDatesError(next) &&
          !providerLicenseExpired(next)
        ) {
          setOpportunitiesLoading(true);
          setOpportunityError("");
          try {
            const oppResult = await providerApi.opportunities(targetPage, {
              category: serviceSelection.branch || serviceSelection.category,
              service: serviceSelection.service,
            });
            if (revision !== loadRevision.current || !mountedRef.current) return;
            setOpportunities(oppResult.data?.items || []);
            setTotal(oppResult.data?.total || 0);
            setDisplayedPage(targetPage);
          } catch (oppErr) {
            if (revision !== loadRevision.current || !mountedRef.current) return;
            // On pagination failure, do not leave stale opportunities actionable as the new page.
            setOpportunityError(
              providerError(
                oppErr,
                arRef.current
                  ? "تعذر تحميل الفرص المتاحة للصفحة المطلوبة"
                  : "Could not load available opportunities for requested page",
              ),
            );
          } finally {
            if (revision === loadRevision.current && mountedRef.current) {
              setOpportunitiesLoading(false);
            }
          }
        } else {
          setOpportunities([]);
          setTotal(0);
          setDisplayedPage(1);
        }
      } catch (err) {
        if (revision !== loadRevision.current || !mountedRef.current) return;
        setError(
          providerError(
            err,
            arRef.current ? "تعذر تحميل بيانات المزود" : "Could not load provider data",
          ),
        );
      } finally {
        if (revision === loadRevision.current && mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, serviceSelection],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const queryInvite = new URLSearchParams(window.location.search).get("invite")?.trim() || "";
    if (queryInvite) {
      try {
        sessionStorage.setItem(INVITE_STORAGE_KEY, queryInvite);
      } catch {
        // Storage may be unavailable; keep in state.
      }
      setInviteToken(queryInvite);
      return;
    }
    try {
      const storedInvite = sessionStorage.getItem(INVITE_STORAGE_KEY)?.trim() || "";
      if (storedInvite) setInviteToken(storedInvite);
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentInvite =
        new URLSearchParams(window.location.search).get("invite")?.trim() ||
        inviteToken ||
        (() => {
          try {
            return sessionStorage.getItem(INVITE_STORAGE_KEY)?.trim() || "";
          } catch {
            return "";
          }
        })();
      try {
        sessionStorage.setItem("providerRegistrationReturn", "1");
        if (currentInvite) {
          sessionStorage.setItem(INVITE_STORAGE_KEY, currentInvite);
        }
      } catch {
        // Ignore storage errors.
      }
      const returnPath = currentInvite
        ? `/service-providers?invite=${encodeURIComponent(currentInvite)}`
        : "/service-providers";
      router.replace(loginHref(returnPath));
    } else if (isAuthenticated) {
      void load();
    }
  }, [isLoading, isAuthenticated, router, load, inviteToken]);

  useEffect(() => {
    if (!isAuthenticated || !profileReady) return;
    if (profile) {
      setInviteError("");
      if (profile.status === "approved") {
        try {
          sessionStorage.removeItem(INVITE_STORAGE_KEY);
          sessionStorage.removeItem("providerRegistrationReturn");
        } catch {
          // Ignore storage errors.
        }
      } else if (profile.status === "pending" && !user?.nafathVerifiedAt) {
        try {
          sessionStorage.setItem("providerRegistrationReturn", "1");
        } catch {
          // Ignore storage errors.
        }
      }
      return;
    }

    if (!inviteToken) {
      setInviteState("missing");
      setInviteExpiresAt(null);
      setInviteError(
        ar
          ? "يتطلب التسجيل كمزود خدمة جديد رابط دعوة صالح من الإدارة."
          : "Registering as a new provider requires a valid invitation link from the administration.",
      );
      return;
    }

    let cancelled = false;
    setInviteState("checking");
    setInviteError("");
    providerApi
      .validateInvitation(inviteToken)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.valid) {
          setInviteState("valid");
          setInviteExpiresAt(res.data.expiresAt || null);
          setInviteError("");
        } else {
          setInviteState("invalid");
          setInviteExpiresAt(null);
          setInviteError(
            ar
              ? "رابط الدعوة غير صالح أو منتهي الصلاحية. يرجى طلب رابط دعوة جديد من الإدارة."
              : "The invitation link is invalid or expired. Please request a new invitation link from the administration.",
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setInviteState("invalid");
        setInviteExpiresAt(null);
        setInviteError(
          providerError(
            err,
            ar
              ? "رابط الدعوة غير صالح أو منتهي الصلاحية. يرجى طلب رابط دعوة جديد من الإدارة."
              : "The invitation link is invalid or expired. Please request a new invitation link from the administration.",
          ),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, profileReady, profile, inviteToken, ar, user?.nafathVerifiedAt]);

  const apply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || submittingApply) return;

    const dateError = licenseDatesError(
      {
        licenseIssueDate: licenseIssueDate || undefined,
        licenseExpiryDate: licenseExpiryDate || undefined,
      },
      ar,
    );
    if (dateError) {
      setError(dateError);
      return;
    }

    if (!profile && (inviteState !== "valid" || !inviteToken)) {
      setError(
        inviteError ||
          (ar
            ? "يلزم رابط دعوة صالح من الإدارة للتسجيل كمزود خدمة جديد."
            : "A valid administration invitation link is required to register as a new provider."),
      );
      return;
    }

    setSubmittingApply(true);
    setBusy(true);
    setError("");

    try {
      const res = await providerApi.apply({
        invitationToken: !profile ? inviteToken : undefined,
        kind,
        registrationAnswers,
        specializationId: kind === "general" ? specializationId || undefined : undefined,
        city,
        requestedCategories: categories,
        deliveryModes,
        licenseNumber,
        licenseDocument,
        licenseIssueDate: licenseIssueDate || undefined,
        licenseExpiryDate: licenseExpiryDate || undefined,
        notes,
      });

      if (!mountedRef.current) return;
      dirtyFieldsRef.current.clear();
      try {
        sessionStorage.removeItem(INVITE_STORAGE_KEY);
        if (!user?.nafathVerifiedAt) {
          sessionStorage.setItem("providerRegistrationReturn", "1");
        }
      } catch {
        // Ignore storage errors.
      }
      setProfile(res.data);
      await load();
    } catch (err) {
      if (!mountedRef.current) return;
      // Retain all dirty fields and document references on failure
      setError(
        providerError(
          err,
          ar ? "تعذر حفظ بيانات التسجيل" : "Could not save registration application",
        ),
      );
    } finally {
      if (mountedRef.current) {
        setSubmittingApply(false);
        setBusy(false);
      }
    }
  };

  const upload = async (file?: File) => {
    if (!file || busy) return;
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      if (validation.errorKey === "file_too_large") {
        setError(
          ar
            ? "حجم الملف يتجاوز الحد المسموح به (5 ميجابايت)."
            : "File size exceeds 5 MB limit.",
        );
      } else {
        setError(
          ar
            ? "ارفع صورة أو PDF بحد أقصى 5 ميجابايت."
            : "Upload an image or PDF up to 5 MB.",
        );
      }
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data = new FormData();
      data.append("file", file);
      const result = await api.post("/user/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!mountedRef.current) return;
      const uploadedUrl = result.data.data?.url || result.data.url;
      if (uploadedUrl) {
        setLicenseDocument(uploadedUrl);
        markDirty("licenseDocument");
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setError(
        providerError(
          err,
          ar ? "تعذر رفع المستند المرفق" : "Could not upload attached document",
        ),
      );
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  };

  const submitOffer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || busy || submittingOffer) return;

    const numericAmount = Number(amount);
    const minAllowed = calculateMinOffer(profile);
    const maxAllowed = calculateMaxOffer(profile);
    const validation = validateOfferSubmission(numericAmount, mode, profile, selected);

    if (!validation.valid) {
      if (validation.errorKey === "below_min") {
        setOfferError(
          ar
            ? `قيمة العرض أقل من الحد الأدنى المسموح (${minAllowed} ر.س)`
            : `Offer amount is below minimum allowed (${minAllowed} SAR)`,
        );
      } else if (validation.errorKey === "above_max") {
        setOfferError(
          ar
            ? `قيمة العرض تتجاوز الحد الأقصى المسموح (${maxAllowed} ر.س)`
            : `Offer amount exceeds maximum allowed (${maxAllowed} SAR)`,
        );
      } else if (validation.errorKey === "invalid_delivery_mode") {
        setOfferError(
          ar
            ? "طريقة تقديم الخدمة المحددة غير مسموحة لهذه الفرصة"
            : "Selected delivery mode is not permitted for this opportunity",
        );
      } else {
        setOfferError(ar ? "يرجى تحديد مبلغ صالح للعرض" : "Please enter a valid offer amount");
      }
      return;
    }

    setSubmittingOffer(true);
    setBusy(true);
    setOfferError("");

    try {
      await providerApi.offer(selected.id, {
        amount: numericAmount,
        deliveryMode: mode,
        note: offerNote,
      });

      if (!mountedRef.current) return;
      setSelected(null);
      setAmount("");
      setOfferNote("");
      await load(page);
    } catch (err) {
      if (!mountedRef.current) return;
      // Retain entered values inside the modal so the provider doesn't lose inputs
      setOfferError(
        providerError(
          err,
          ar ? "تعذر إرسال العرض للإدارة" : "Could not submit offer to administration",
        ),
      );
    } finally {
      if (mountedRef.current) {
        setSubmittingOffer(false);
        setBusy(false);
      }
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <main className={styles.pageContainer} dir={ar ? "rtl" : "ltr"}>
        <div className={styles.innerWrap}>
          <div role="status" className={`${styles.alertBox} ${styles.alertBoxPending}`}>
            <Clock className="size-5 shrink-0 animate-pulse" />
            <span>{ar ? "جارٍ التحقق من الصلاحيات والتحميل…" : "Checking access and loading…"}</span>
          </div>
        </div>
      </main>
    );
  }

  const minOfferValue = calculateMinOffer(profile);
  const maxOfferValue = calculateMaxOffer(profile);
  const trackingContract = getTrackingNavigationContract();

  return (
    <main className={styles.pageContainer} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.innerWrap}>
        {/* --- Top Navigation Bar --- */}
        <header className={styles.topNav}>
          <Link href="/department-hub" className={styles.backBtn}>
            {ar ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}
            <span>{ar ? "العودة إلى مركز الإدارات" : "Back to Department Hub"}</span>
          </Link>
          {refreshing && (
            <div role="status" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <RefreshCw className="size-3.5 animate-spin text-[var(--pr-gold)]" />
              <span>{ar ? "جارٍ التحديث في الخلفية…" : "Refreshing in background…"}</span>
            </div>
          )}
        </header>

        {/* --- Distinct Request Tracking Notice --- */}
        <nav aria-label={ar ? "روابط المتابعة" : "Tracking links"} className={styles.trackingCallout}>
          <p className={styles.trackingCalloutText}>
            <strong>{ar ? "تنبيه تنظيمي:" : "Organizational notice:"} </strong>
            {ar ? trackingContract.explanationAr : trackingContract.explanationEn}
          </p>
          <div className={styles.trackingCalloutActions}>
            <Link href={trackingContract.clientRequestsHref} className={styles.trackingLink}>
              <FileText className="size-4 shrink-0" />
              <span>{ar ? trackingContract.clientRequestsLabelAr : trackingContract.clientRequestsLabelEn}</span>
            </Link>
            <Link href={trackingContract.providerRequestsHref} className={styles.trackingLink}>
              <Briefcase className="size-4 shrink-0" />
              <span>{ar ? trackingContract.providerRequestsLabelAr : trackingContract.providerRequestsLabelEn}</span>
            </Link>
          </div>
        </nav>

        {/* --- Editorial Hero Header --- */}
        <section className={styles.heroHeader}>
          <span className={styles.heroEyebrow}>
            <ShieldCheck className="size-3.5" />
            {ar ? "منصة مزودي الخدمات العقارية" : "Licensed Provider Portal"}
          </span>
          <h1 className={styles.heroTitle}>
            {ar ? "بوابة اعتماد المزودين والفرص" : "Provider Onboarding & Opportunities"}
          </h1>
          <p className={styles.heroSubtitle}>
            {ar
              ? "منظومة متكاملة لربط مقدمي الخدمات العقارية والموثقين بطلبات العملاء المؤكدة وفق معايير الاعتماد والامتثال الرسمية."
              : "An integrated portal connecting certified real estate providers and notaries with verified client requests under official compliance guidelines."}
          </p>
        </section>

        {/* --- Stage Hierarchy Ribbon --- */}
        <div aria-label={ar ? "مراحل الاعتماد" : "Onboarding stages"} className={styles.stageRibbon}>
          <div className={`${styles.stageItem} ${!profile ? styles.stageItemActive : ""}`}>
            <span className={styles.stageNumber}>1</span>
            <div className={styles.stageMeta}>
              <span className={styles.stageTitle}>{ar ? "التسجيل والترخيص" : "Registration"}</span>
              <span className={styles.stageDesc}>
                {profile ? (ar ? "تم حفظ البيانات" : "Saved") : (ar ? "المرحلة الحالية" : "In Progress")}
              </span>
            </div>
          </div>
          <div
            className={`${styles.stageItem} ${
              profile?.status === "pending"
                ? styles.stageItemActive
                : ""
            }`}
          >
            <span className={styles.stageNumber}>2</span>
            <div className={styles.stageMeta}>
              <span className={styles.stageTitle}>{ar ? "توثيق الهوية عبر نفاذ" : "Nafath identity"}</span>
              <span className={styles.stageDesc}>
                {profile?.status === "approved" || user?.nafathVerifiedAt
                  ? ar
                    ? "تم التوثيق"
                    : "Verified"
                  : profile
                    ? providerStatus(profile.status, ar)
                    : ar
                      ? "بعد حفظ التسجيل"
                      : "After registration"}
              </span>
            </div>
          </div>
          <div className={`${styles.stageItem} ${profile?.status === "approved" ? styles.stageItemActive : ""}`}>
            <span className={styles.stageNumber}>3</span>
            <div className={styles.stageMeta}>
              <span className={styles.stageTitle}>{ar ? "الخدمات والفرص المتاحة" : "Services available"}</span>
              <span className={styles.stageDesc}>
                {profile?.status === "approved"
                  ? ar
                    ? "مفعل ومتاح"
                    : "Active"
                  : ar
                    ? "يتطلب إكمال نفاذ"
                    : "Requires Nafath"}
              </span>
            </div>
          </div>
        </div>

        {/* --- Global Messages & Feedback --- */}
        {error && (
          <div role="alert" className={`${styles.alertBox} ${styles.alertBoxDanger}`}>
            <AlertCircle className="size-5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{ar ? "حدث خطأ أثناء المعالجة:" : "An error occurred:"}</p>
              <p className="text-sm">{error}</p>
            </div>
            {!loading && (
              <button type="button" onClick={() => void load()} className={styles.secondaryBtn}>
                <RefreshCw className="size-3.5" />
                <span>{ar ? "إعادة المحاولة" : "Retry"}</span>
              </button>
            )}
          </div>
        )}

        {loading && !profileReady && (
          <div role="status" className={`${styles.alertBox} ${styles.alertBoxPending}`}>
            <Clock className="size-5 shrink-0 animate-spin text-[var(--pr-gold)]" />
            <span>{ar ? "جارٍ قراءة بيانات الملف الشخصي والتراخيص…" : "Loading profile details and licenses…"}</span>
          </div>
        )}

        {/* --- Current Profile Status Banner --- */}
        {profile && (
          <section
            aria-label={ar ? "حالة الملف والترخيص" : "Profile and license status"}
            className={`${styles.statusCard} ${
              profile.status === "approved"
                ? styles.statusCardApproved
                : profile.status === "pending"
                  ? styles.statusCardPending
                  : profile.status === "rejected"
                    ? styles.statusCardRejected
                    : styles.statusCardSuspended
            }`}
          >
            <div className={styles.statusHeader}>
              <div className="flex items-center gap-2">
                {profile.status === "approved" ? (
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                ) : profile.status === "pending" ? (
                  <Clock className="size-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <AlertCircle className="size-5 text-rose-600 dark:text-rose-400" />
                )}
                <h2 className="text-base font-bold text-[var(--pr-ink)]">
                  {ar ? "حالة اعتماد ملف المزود:" : "Provider Status:"}
                </h2>
                <span
                  className={`${styles.statusBadge} ${
                    profile.status === "approved"
                      ? styles.alertBoxSuccess
                      : profile.status === "pending"
                        ? styles.alertBoxPending
                        : styles.alertBoxDanger
                  }`}
                >
                  {providerStatus(profile.status, ar)}
                </span>
              </div>
              {profile.licenseNumber && (
                <span className="text-xs font-mono text-[var(--pr-muted)]">
                  {ar ? "رقم الترخيص:" : "License #:"} {profile.licenseNumber}
                </span>
              )}
            </div>

            <div className={styles.statusDatesGrid}>
              <div className={styles.dateBlock}>
                <span className={styles.dateLabel}>{ar ? "تاريخ إصدار الترخيص" : "License Issue Date"}</span>
                <span className={styles.dateValue}>
                  {formatLicenseDate(profile.licenseIssueDate, ar)}
                </span>
              </div>
              <div className={styles.dateBlock}>
                <span className={styles.dateLabel}>{ar ? "تاريخ انتهاء الترخيص" : "License Expiry Date"}</span>
                <span className={styles.dateValue}>
                  {formatLicenseDate(profile.licenseExpiryDate, ar)}
                </span>
              </div>
              {profile.licenseDocument && (
                <div className={styles.dateBlock}>
                  <span className={styles.dateLabel}>{ar ? "المستند المعتمد" : "Attached Document"}</span>
                  <a
                    href={profile.licenseDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--pr-gold)] underline hover:text-[var(--pr-gold-deep)]"
                  >
                    <ExternalLink className="size-3.5" />
                    <span>{ar ? "استعراض ملف الترخيص" : "View License File"}</span>
                  </a>
                </div>
              )}
            </div>

            {licenseBlocked && (
              <div role="alert" className={`${styles.alertBox} ${styles.alertBoxDanger}`}>
                <AlertCircle className="size-5 shrink-0" />
                <span>
                  {ar
                    ? "تواريخ الترخيص غير صالحة أو انتهت صلاحيته. يرجى التواصل مع الإدارة لتحديث الترخيص ومراجعته قبل تقديم عروض جديدة."
                    : "License dates are invalid or the license has expired. Contact the administrator to update and review the license before submitting new offers."}
                </span>
              </div>
            )}

            {profile.reviewNote && (
              <div className={styles.reviewNoteBlock}>
                <p className="text-xs font-bold text-[var(--pr-muted)] mb-1">
                  {ar ? "ملاحظات فريق المراجعة والتدقيق:" : "Reviewer Notes:"}
                </p>
                <p className="text-sm">{profile.reviewNote}</p>
              </div>
            )}
          </section>
        )}

        {/* --- VIEW 1: APPROVED PROVIDER DASHBOARD (Marketplace & Opportunities) --- */}
        {profile?.status === "approved" ? (
          <>
            {/* Financial Agreement Summary */}
            <section
              aria-label={ar ? "اتفاقك المالي المعتمد" : "Approved financial agreement"}
              className={styles.agreementGrid}
            >
              <div className={styles.agreementItem}>
                <span className={styles.agreementLabel}>{ar ? "حصة المنصة المعتمدة" : "Platform Share"}</span>
                <span className={styles.agreementValue}>
                  {profile.agreementValue ?? 0}
                  {profile.agreementType === "percentage" ? "%" : ar ? " ريال" : " SAR"}
                </span>
              </div>
              <div className={styles.agreementItem}>
                <span className={styles.agreementLabel}>{ar ? "نطاق قيمة العروض المسموح" : "Authorized Offer Range"}</span>
                <span className={styles.agreementValue}>
                  {profile.minOffer ?? 0} – {profile.maxOffer ?? 0} {ar ? "ريال" : "SAR"}
                </span>
              </div>
              <div className={styles.agreementItem}>
                <span className={styles.agreementLabel}>{ar ? "طرق التقديم المصرح بها" : "Approved Delivery Modes"}</span>
                <span className={styles.agreementValue}>
                  {profile.deliveryModes?.map((m) => deliveryLabel(m, ar)).join("، ") || (ar ? "غير محدد" : "None")}
                </span>
              </div>
            </section>

            {/* Opportunities Marketplace */}
            <section aria-label={ar ? "فرص الطلبات المتاحة" : "Available opportunities"} className="space-y-4">
              <div className={styles.sectionHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>{ar ? "الطلبات المتاحة لتقديم العروض" : "Available Requests"}</h2>
                  <p className="text-xs text-[var(--pr-muted)] mt-0.5">
                    {ar
                      ? "الفرص تظهر بحسب نطاق مدينتك والأقسام المعتمدة في ملفك."
                      : "Requests filtered by your approved categories and registered city."}
                  </p>
                </div>
                {total > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--pr-surface-subtle)] border border-[var(--pr-border)]">
                    {ar ? `إجمالي الفرص: ${total}` : `Total opportunities: ${total}`}
                  </span>
                )}
              </div>

              {/* Service Category Browser Filter */}
              <ServiceCategoryBrowser
                value={serviceSelection}
                onChange={(value) => {
                  ++loadRevision.current;
                  setOpportunities([]);
                  setTotal(0);
                  setOpportunitiesLoading(true);
                  setOpportunityError("");
                  setServiceSelection(value);
                  setPage(1);
                  setDisplayedPage(1);
                }}
                grants={profile.categories}
              />

              {/* Opportunities List */}
              {loading || opportunitiesLoading ? (
                <div role="status" className={`${styles.alertBox} ${styles.alertBoxPending}`}>
                  <RefreshCw className="size-4 animate-spin text-[var(--pr-gold)]" />
                  <span>{ar ? "جارٍ جلب وتحديث الفرص المتاحة…" : "Loading available requests…"}</span>
                </div>
              ) : opportunityError ? (
                <div role="alert" className={`${styles.alertBox} ${styles.alertBoxDanger}`}>
                  <AlertCircle className="size-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">{ar ? "تعذر تحميل الفرص:" : "Could not load requests:"}</p>
                    <p className="text-sm">{opportunityError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void load(page)}
                    className={styles.secondaryBtn}
                  >
                    <RefreshCw className="size-3.5" />
                    <span>{ar ? "إعادة المحاولة" : "Retry"}</span>
                  </button>
                </div>
              ) : !opportunities.length ? (
                <div className={`${styles.alertBox} ${styles.alertBoxPending}`}>
                  <FileText className="size-5 shrink-0 text-[var(--pr-gold)]" />
                  <span>
                    {ar
                      ? "لا توجد طلبات مطابقة لاختيارك وصلاحياتك ومدينتك حالياً. يمكنك تغيير تصفية الأقسام أو العودة لاحقاً."
                      : "No matching requests for your grants, city, and filter selection. Try adjusting the category filter or check back later."}
                  </span>
                </div>
              ) : (
                <div className={styles.opportunitiesGrid}>
                  {opportunities.map((item) => {
                    const hasSubmitted = !!item.ownOffer;
                    const canOffer = isOpportunityActionable({
                      item,
                      profile,
                      licenseBlocked,
                      isPageLoading: loading || refreshing || opportunitiesLoading,
                      isBusy: busy,
                    });

                    return (
                      <article
                        key={item.id}
                        className={`${styles.opportunityCard} ${hasSubmitted ? styles.opportunityCardSubmitted : ""}`}
                      >
                        <div className={styles.oppMeta}>
                          <h3 className={styles.oppTitle}>{item.serviceType}</h3>
                          <p className={styles.oppLocation}>
                            {item.city}
                            {item.district ? ` · ${item.district}` : ""}
                            {item.quantity > 1 ? ` · ${ar ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}` : ""}
                          </p>
                          {item.ownOffer && (
                            <p className={styles.oppSubmittedInfo}>
                              {ar ? "عرضك الحالي:" : "Your submitted offer:"} {item.ownOffer.amount} {ar ? "ريال" : "SAR"} ·{" "}
                              {deliveryLabel(item.ownOffer.deliveryMode, ar)}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={!canOffer}
                          onClick={() => {
                            setSelected(item);
                            setAmount("");
                            setOfferNote("");
                            setOfferError("");
                            const modes = item.availableDeliveryModes ?? profile.deliveryModes ?? ["online"];
                            setMode(modes[0] || "online");
                          }}
                          className={hasSubmitted ? styles.secondaryBtn : styles.primaryBtn}
                        >
                          {hasSubmitted
                            ? ar
                              ? "تم تقديم العرض"
                              : "Offer submitted"
                            : ar
                              ? "تقديم عرض سعر"
                              : "Submit offer"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {total > 30 && (
                <nav aria-label={ar ? "تنقل الصفحات" : "Pagination"} className={styles.paginationBar}>
                  <button
                    type="button"
                    disabled={displayedPage <= 1 || loading || refreshing || opportunitiesLoading}
                    onClick={() => setPage(displayedPage - 1)}
                    className={styles.secondaryBtn}
                  >
                    {ar ? "السابق" : "Previous"}
                  </button>
                  <span className={styles.pageIndicator}>
                    {displayedPage} / {Math.ceil(total / 30)}
                  </span>
                  <button
                    type="button"
                    disabled={displayedPage * 30 >= total || loading || refreshing || opportunitiesLoading}
                    onClick={() => setPage(displayedPage + 1)}
                    className={styles.secondaryBtn}
                  >
                    {ar ? "التالي" : "Next"}
                  </button>
                </nav>
              )}
            </section>
          </>
        ) : (
          /* --- VIEW 2: ONBOARDING & REGISTRATION FORM (When not yet approved) --- */
          !loading &&
          profileReady && (
            <>
              {/* Invitation status for fresh registrations */}
              {!profile && inviteState === "checking" && (
                <div role="status" className={`${styles.alertBox} ${styles.alertBoxPending}`}>
                  <Clock className="size-5 shrink-0 animate-spin text-[var(--pr-gold)]" />
                  <span>{ar ? "جارٍ التحقق من صلاحية رابط الدعوة…" : "Validating invitation link…"}</span>
                </div>
              )}

              {!profile && (inviteState === "missing" || inviteState === "invalid") && (
                <div role="alert" className={`${styles.alertBox} ${styles.alertBoxDanger}`}>
                  <AlertCircle className="size-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {inviteState === "missing"
                        ? ar ? "رابط الدعوة مطلوب للتسجيل" : "Invitation Required"
                        : ar ? "رابط الدعوة غير صالح أو منتهي" : "Invalid or Expired Invitation"}
                    </p>
                    <p className="text-sm mt-0.5">{inviteError}</p>
                  </div>
                </div>
              )}

              {!profile && inviteState === "valid" && (
                <div role="status" className={`${styles.alertBox} ${styles.alertBoxSuccess}`}>
                  <CheckCircle2 className="size-5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {ar ? "رابط الدعوة صالح" : "Valid Invitation Link"}
                    </p>
                    <p className="text-sm mt-0.5">
                      {ar
                        ? "احفظ بيانات التسجيل أولاً ثم أكمل توثيق الهوية عبر نفاذ لتفعيل خدماتك مباشرة."
                        : "Save your registration application first, then complete Nafath identity verification to activate your services."}
                      {inviteExpiresAt ? ` (${ar ? "ينتهي:" : "Expires:"} ${new Date(inviteExpiresAt).toLocaleString(ar ? "ar-SA" : "en-US")})` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Embedded Nafath Verification after application is saved */}
              {profile && profile.status === "pending" && (
                <section
                  aria-label={ar ? "توثيق الهوية عبر نفاذ" : "Nafath Identity Verification"}
                  className={styles.nafathCard}
                >
                  <div className={styles.formSectionHeader}>
                    <h2 className={styles.formSectionTitle}>
                      {ar ? "الخطوة الثانية: توثيق الهوية عبر نفاذ" : "Step 2: Complete Nafath Identity Verification"}
                    </h2>
                    <p className={styles.formSectionSubtitle}>
                      {ar
                        ? "تم حفظ طلبك بنجاح. أكمل التحقق عبر نفاذ الوطني لتفعيل حسابك والوصول إلى الفرص المتاحة."
                        : "Your application is saved. Complete Nafath identity verification to activate your account and access available opportunities."}
                    </p>
                  </div>

                  <NafathVerification
                    userId={user.id}
                    verifiedAt={user.nafathVerifiedAt}
                    onVerified={(updatedUser) => {
                      updateUser(updatedUser);
                      void load();
                    }}
                  />

                  {user.nafathVerifiedAt && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-[var(--pr-muted)]">
                        {ar
                          ? "تم توثيق هويتك عبر نفاذ. حدّث الصفحة إذا لم يتم تفعيل الخدمات بعد."
                          : "Your identity is verified via Nafath. Refresh if services are not active yet."}
                      </span>
                      <button type="button" onClick={() => void load()} className={styles.secondaryBtn}>
                        <RefreshCw className="size-3.5" />
                        <span>{ar ? "تحديث الحالة" : "Refresh status"}</span>
                      </button>
                    </div>
                  )}
                </section>
              )}

              <form onSubmit={apply} className={styles.formContainer}>
                <div className={styles.formSectionHeader}>
                  <h2 className={styles.formSectionTitle}>
                    {profile
                      ? ar
                        ? "تعديل واستكمال بيانات التسجيل"
                        : "Update Registration & Credentials"
                      : ar
                        ? "طلب التسجيل كمزود خدمة"
                        : "New Provider Registration Application"}
                  </h2>
                  <p className={styles.formSectionSubtitle}>
                    {ar
                      ? "يرجى تعبئة كافة الحقول المطلوبة ورفع وثائق الترخيص. تبقى التعديلات والمستندات المرفوعة محفوظة أثناء تغيير اللغة وإعادة المحاولة والتحديث."
                      : "Complete all required fields and upload license documents. Form inputs and attached documents remain preserved during language toggles, retries, and background refreshes."}
                  </p>
                </div>

              {/* Stage 1: Requested Categories & Provider Kind */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3 className={styles.formSectionTitle}>
                    {ar ? "1. تصنيف النشاط والأقسام المطلوبة" : "1. Provider Kind & Requested Categories"}
                  </h3>
                  <p className={styles.formSectionSubtitle}>
                    {ar
                      ? "حدد الأقسام التي تقدم خدماتك فيها وفق تراخيصك المهنية."
                      : "Select the categories where you are licensed to provide services."}
                  </p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "نوع المزود" : "Provider Kind"}</span>
                      <span className="text-xs text-rose-500">*</span>
                    </span>
                    <select
                      className={styles.fieldSelect}
                      value={kind}
                      onChange={(e) => {
                        markDirty("kind");
                        setKind(e.target.value as "general" | "notary");
                      }}
                    >
                      <option value="general">{ar ? "مزود خدمات عقارية" : "General Service Provider"}</option>
                      <option value="notary">{ar ? "موثق معتمد" : "Licensed Notary"}</option>
                    </select>
                  </label>

                  {kind === "general" &&
                    (specializations.some((item) => item.enabled) || !!profile?.specializationId) && (
                      <label className={styles.fieldLabel}>
                        <span className={styles.fieldLabelSpan}>
                          <span>{ar ? "تخصص المزود المعتمد" : "Specialization"}</span>
                        </span>
                        <select
                          disabled={!categories.length}
                          value={specializationId}
                          onChange={(e) => {
                            markDirty("specializationId");
                            setSpecializationId(e.target.value);
                          }}
                          className={styles.fieldSelect}
                        >
                          <option value="">{ar ? "مزود خدمات عام" : "General service provider"}</option>
                          {profile?.specializationId &&
                            !specializations.some(
                              (item) => item.id === profile.specializationId && item.enabled,
                            ) && (
                              <option value={profile.specializationId}>
                                {profile.specializationTitle || profile.specializationId} —{" "}
                                {ar ? "تخصص سابق" : "Previous specialization"}
                              </option>
                            )}
                          {specializations
                            .filter((item) => matchesSpecialization(item, categories))
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    )}
                </div>

                {/* Categories Selection Tree */}
                <fieldset className="space-y-2 border-0 p-0 m-0">
                  <legend className="text-sm font-semibold text-[var(--pr-ink)] mb-2">
                    {ar ? "الأقسام المحددة للترخيص" : "Requested Service Categories"} *
                  </legend>
                  <ServiceCategoryTree
                    selected={categories}
                    onChange={(next) => {
                      markDirty("categories");
                      setCategories(next);
                      setSpecializationId("");
                    }}
                  />
                </fieldset>
              </div>

              {/* Stage 2: Location & Delivery Modes */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3 className={styles.formSectionTitle}>
                    {ar ? "2. النطاق الجغرافي وطرق تقديم الخدمة" : "2. Geographic Scope & Delivery Modes"}
                  </h3>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "المدينة الرئيسية للعمل" : "Operating City"}</span>
                      <span className="text-xs text-rose-500">*</span>
                    </span>
                    <input
                      required
                      type="text"
                      maxLength={100}
                      className={styles.fieldInput}
                      value={city}
                      onChange={(e) => {
                        markDirty("city");
                        setCity(e.target.value);
                      }}
                      placeholder={ar ? "مثال: الرياض" : "e.g. Riyadh"}
                    />
                  </label>

                  <div className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "طرق التنفيذ المتاحة" : "Available Delivery Modes"}</span>
                      <span className="text-xs text-rose-500">*</span>
                    </span>
                    <div className={styles.checkboxGroup}>
                      {(["online", "in_person"] as const).map((deliveryMode) => (
                        <label key={deliveryMode} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={deliveryModes.includes(deliveryMode)}
                            onChange={() => {
                              markDirty("deliveryModes");
                              setDeliveryModes((current) =>
                                current.includes(deliveryMode)
                                  ? current.filter((item) => item !== deliveryMode)
                                  : [...current, deliveryMode],
                              );
                            }}
                            className={styles.checkboxInput}
                          />
                          <span>{deliveryLabel(deliveryMode, ar)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage 3: License & Verification Documents */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3 className={styles.formSectionTitle}>
                    {ar ? "3. بيانات الترخيص والمستندات الثبوتية" : "3. License Credentials & Documents"}
                  </h3>
                  <p className={styles.formSectionSubtitle}>
                    {ar
                      ? "أدخل التواريخ الميلادية المطابقة للترخيص الرسمي. التواريخ الهجرية للعرض الإرشادي فقط."
                      : "Enter Gregorian dates matching official license. Hijri dates are for reference only."}
                  </p>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "رقم الترخيص المهني" : "License Number"}</span>
                      {kind === "notary" && <span className="text-xs text-rose-500">*</span>}
                    </span>
                    <input
                      required={kind === "notary"}
                      type="text"
                      maxLength={100}
                      className={styles.fieldInput}
                      value={licenseNumber}
                      onChange={(e) => {
                        markDirty("licenseNumber");
                        setLicenseNumber(e.target.value);
                      }}
                      placeholder={ar ? "رقم رخصة العمل أو التوثيق" : "Official license number"}
                    />
                  </label>

                  {/* License Issue Date */}
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "تاريخ إصدار الترخيص (ميلادي)" : "License Issue Date (Gregorian)"}</span>
                    </span>
                    <input
                      type="date"
                      className={styles.fieldInput}
                      value={licenseIssueDate}
                      max={licenseExpiryDate || undefined}
                      onChange={(e) => {
                        markDirty("licenseIssueDate");
                        setLicenseIssueDate(e.target.value);
                      }}
                    />
                    {licenseIssueDate && (
                      <span className="text-xs text-[var(--pr-muted)]">
                        {formatLicenseDate(licenseIssueDate, ar)}
                      </span>
                    )}
                  </label>

                  {/* License Expiry Date */}
                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "تاريخ انتهاء الترخيص (ميلادي)" : "License Expiry Date (Gregorian)"}</span>
                    </span>
                    <input
                      type="date"
                      className={styles.fieldInput}
                      value={licenseExpiryDate}
                      min={licenseIssueDate || undefined}
                      onChange={(e) => {
                        markDirty("licenseExpiryDate");
                        setLicenseExpiryDate(e.target.value);
                      }}
                    />
                    {licenseExpiryDate && (
                      <span className="text-xs text-[var(--pr-muted)]">
                        {formatLicenseDate(licenseExpiryDate, ar)}
                      </span>
                    )}
                  </label>
                </div>

                {/* Upload File Zone */}
                <div className={styles.fieldLabel}>
                  <span className={styles.fieldLabelSpan}>
                    <span>
                      {ar
                        ? "مستند الترخيص أو السجل التجاري (PDF أو صورة حتى 5 ميجابايت)"
                        : "License / Registration Document (PDF or image up to 5 MB)"}
                    </span>
                    {kind === "notary" && <span className="text-xs text-rose-500">*</span>}
                  </span>

                  <label className={styles.uploadZone}>
                    <UploadCloud className="size-6 text-[var(--pr-gold)]" />
                    <span className="text-sm font-medium text-[var(--pr-ink)]">
                      {ar ? "اضغط هنا لاختيار الملف من جهازك" : "Click to select a file"}
                    </span>
                    <span className="text-xs text-[var(--pr-muted)]">
                      PDF, PNG, JPG, WebP ({ar ? "الحد الأقصى 5 ميجابايت" : "Max 5 MB"})
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={busy}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>

                  {licenseDocument && (
                    <div className={styles.fileActive}>
                      <span className="inline-flex items-center gap-2 text-[var(--pr-ink)]">
                        <FileCheck className="size-4 text-emerald-600" />
                        <span>{ar ? "تم إرفاق المستند بنجاح" : "Document attached"}</span>
                      </span>
                      <a
                        href={licenseDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[var(--pr-gold)] underline"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>{ar ? "معاينة الملف" : "View"}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 4: Dynamic Fields & Notes */}
              {(registrationFields.length > 0 || notes !== undefined) && (
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3 className={styles.formSectionTitle}>
                      {ar ? "4. معلومات إضافية ومتطلبات تخصصية" : "4. Additional Details & Requirements"}
                    </h3>
                  </div>

                  {registrationFields
                    .filter((field) => matchesFieldCategories(field, categories))
                    .map((field) => (
                      <label key={field.id} className={styles.fieldLabel}>
                        <span className={styles.fieldLabelSpan}>
                          <span>
                            {field.label}
                            {field.required && " *"}
                          </span>
                        </span>
                        {field.type === "textarea" ? (
                          <textarea
                            required={field.required}
                            maxLength={2000}
                            value={registrationAnswers[field.id] || ""}
                            onChange={(e) => {
                              markDirty("registrationAnswers");
                              setRegistrationAnswers((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }));
                            }}
                            className={styles.fieldTextarea}
                          />
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            step={field.type === "number" ? "any" : undefined}
                            required={field.required}
                            maxLength={2000}
                            value={registrationAnswers[field.id] || ""}
                            onChange={(e) => {
                              markDirty("registrationAnswers");
                              setRegistrationAnswers((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }));
                            }}
                            className={styles.fieldInput}
                          />
                        )}
                      </label>
                    ))}

                  <label className={styles.fieldLabel}>
                    <span className={styles.fieldLabelSpan}>
                      <span>{ar ? "ملاحظات إضافية للإدارة" : "Additional Notes to Admin"}</span>
                    </span>
                    <textarea
                      maxLength={2000}
                      className={styles.fieldTextarea}
                      value={notes}
                      onChange={(e) => {
                        markDirty("notes");
                        setNotes(e.target.value);
                      }}
                      placeholder={
                        ar
                          ? "أي تفاصيل أخرى أو خبرات ترغب في توضيحها لفريق المراجعة…"
                          : "Any additional details or certifications you wish to share…"
                      }
                    />
                  </label>
                </div>
              )}

              {/* Form Submission Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--pr-border-subtle)]">
                <span className="text-xs text-[var(--pr-muted)]">
                  {ar
                    ? "بحفظ البيانات، أنت تقر بصحة كافة المعلومات والوثائق المرفوعة ومطابقتها للتنظيمات المعمول بها."
                    : "By saving, you confirm the accuracy of all credentials and compliance with official regulations."}
                </span>

                <button
                  type="submit"
                  disabled={
                    busy ||
                    submittingApply ||
                    (!profile && inviteState !== "valid") ||
                    !categories.length ||
                    !deliveryModes.length ||
                    (kind === "notary" && !licenseDocument)
                  }
                  className={styles.primaryBtn}
                >
                  {submittingApply ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>{ar ? "جارٍ حفظ الطلب…" : "Saving…"}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="size-4" />
                      <span>
                        {profile
                          ? ar ? "حفظ التعديلات" : "Save Changes"
                          : ar ? "حفظ والمتابعة لتوثيق نفاذ" : "Save & Continue to Nafath"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
            </>
          )
        )}

        {/* --- Accessible Scrollable Offer Modal --- */}
        <Dialog
          open={!!selected}
          onOpenChange={(open) => {
            if (!open && !submittingOffer) {
              setSelected(null);
              setOfferError("");
            }
          }}
        >
          <DialogContent dir={ar ? "rtl" : "ltr"} className={`${styles.dialogPortalTokens} max-h-[90dvh] flex flex-col p-0`}>
            <DialogHeader className={styles.dialogHeaderCustom}>
              <DialogTitle>{ar ? "تقديم عرض سعر للفرصة" : "Submit Opportunity Offer"}</DialogTitle>
              <DialogDescription>
                {selected?.serviceType} · {selected?.city}
                {selected?.district ? ` (${selected.district})` : ""}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submitOffer} className={styles.dialogScrollForm}>
              {offerError && (
                <div role="alert" className={`${styles.alertBox} ${styles.alertBoxDanger}`}>
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{offerError}</span>
                </div>
              )}

              {/* Offer Amount */}
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelSpan}>
                  <span>{ar ? "قيمة العرض بالريال السعودي" : "Offer Amount (SAR)"}</span>
                  <span className="text-xs text-[var(--pr-muted)]">
                    {ar
                      ? `الحد الأدنى: ${minOfferValue} ر.س | الحد الأقصى: ${maxOfferValue || "غير محدد"} ر.س`
                      : `Min: ${minOfferValue} SAR | Max: ${maxOfferValue || "unspecified"} SAR`}
                  </span>
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min={minOfferValue}
                  max={maxOfferValue}
                  className={styles.fieldInput}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={ar ? "أدخل قيمة العرض" : "Enter amount"}
                />
              </label>

              {/* Delivery Mode */}
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelSpan}>
                  <span>{ar ? "طريقة تقديم وتنفيذ الخدمة" : "Delivery Mode"}</span>
                </span>
                <select
                  className={styles.fieldSelect}
                  value={mode}
                  onChange={(e) => setMode(e.target.value as DeliveryMode)}
                >
                  {(selected?.availableDeliveryModes ?? profile?.deliveryModes ?? ["online"]).map(
                    (deliveryOption) => (
                      <option key={deliveryOption} value={deliveryOption}>
                        {deliveryLabel(deliveryOption, ar)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              {/* Offer Note */}
              <label className={styles.fieldLabel}>
                <span className={styles.fieldLabelSpan}>
                  <span>{ar ? "ملاحظات أو اشتراطات العرض للإدارة" : "Offer Note to Admin"}</span>
                </span>
                <textarea
                  maxLength={2000}
                  className={styles.fieldTextarea}
                  value={offerNote}
                  onChange={(e) => setOfferNote(e.target.value)}
                  placeholder={
                    ar
                      ? "أي تفاصيل أو مدة زمنية مقترحة لتنفيذ الخدمة…"
                      : "Proposed turnaround time or fulfillment details…"
                  }
                />
              </label>

              {/* Modal Actions */}
              <div className={styles.dialogFooterCustom}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  disabled={submittingOffer}
                  onClick={() => {
                    setSelected(null);
                    setOfferError("");
                  }}
                >
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={busy || submittingOffer || licenseBlocked || !amount || Number(amount) <= 0}
                  className={styles.primaryBtn}
                >
                  {submittingOffer ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>{ar ? "جارٍ إرسال العرض…" : "Sending offer…"}</span>
                    </>
                  ) : (
                    <span>{ar ? "تأكيد وإرسال العرض" : "Confirm and Submit"}</span>
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
