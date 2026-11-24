// app/verify-otp/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { safeReturnTo } from "@/lib/auth-navigation";
import { otpDeadline, otpSecondsLeft } from "@/lib/otp-expiry";
import { getApiUrl } from "@/lib/api";
import styles from "./verify-otp.module.css";
import AnimatedArtwork from "@/components/cinematic/AnimatedArtwork";

function maskIdentifier(val: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (trimmed.includes("@")) {
    const parts = trimmed.split("@");
    const local = parts[0] || "";
    const domain = parts.slice(1).join("@");
    if (!domain) return trimmed;
    if (local.length <= 2) {
      return `${local.charAt(0)}•••@${domain}`;
    }
    return `${local.slice(0, 2)}••••@${domain}`;
  }
  const digits = trimmed.replace(/\s+/g, "");
  if (digits.length <= 4) return digits;
  const last4 = digits.slice(-4);
  const prefix = digits.startsWith("+")
    ? digits.slice(0, 4) + " "
    : digits.startsWith("05")
    ? "05 "
    : "";
  return `${prefix}•••• ••${last4}`;
}

// --- OTP failure classification ---------------------------------------------
// Verification/resend can fail in three distinct ways:
// 1. The server rejected the code or request (HTTP 4xx with a JSON body).
// 2. The network/server could not be reached (timeout, offline, DNS failure).
// 3. The server responded with something we cannot interpret (non-JSON body or
//    an unexpected 5xx). Cases 2 and 3 are recoverable — retrying may help —
//    and must never be reported to the user as "invalid code".

const OTP_CONNECTION_ERROR_MESSAGE = {
  ar: "انتهت مهلة الاتصال أو تعذّر الوصول إلى الخادم. تحقق من اتصالك وحاول مرة أخرى.",
  en: "Connection timed out or the server could not be reached. Check your connection and try again.",
} as const;

const OTP_INVALID_RESPONSE_MESSAGE = {
  ar: "استجابة غير متوقعة من الخادم. حاول مرة أخرى بعد قليل.",
  en: "Unexpected response from the server. Please try again shortly.",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readOptionalStringField(
  data: Record<string, unknown>,
  field: string,
): string | null {
  const value = data[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readServerMessage(data: unknown): string | null {
  if (!isRecord(data)) return null;
  return readOptionalStringField(data, "message");
}

/** The server answered and rejected the code/request (4xx): keep its message. */
class OtpRejectedError extends Error {
  readonly serverMessage: string | null;

  constructor(serverMessage: string | null) {
    super(serverMessage ?? "otp-rejected");
    this.name = "OtpRejectedError";
    this.serverMessage = serverMessage;
  }
}

/** Uninterpretable/unexpected response: recoverable, but not a code rejection. */
class OtpInvalidResponseError extends Error {
  constructor(reason: string) {
    super(`otp-invalid-response: ${reason}`);
    this.name = "OtpInvalidResponseError";
  }
}

function describeOtpFailure(
  err: unknown,
  language: "ar" | "en",
  t: (key: string) => string,
  rejectedFallback = "otp.errorInvalid",
): string {
  if (err instanceof OtpRejectedError) {
    // Preserve a human-readable server message verbatim; translate it only
    // when the server sent one of our dictionary keys.
    const serverMessage = err.serverMessage;
    if (serverMessage) {
      return t(serverMessage) !== serverMessage
        ? t(serverMessage)
        : serverMessage;
    }
    return t(rejectedFallback);
  }
  if (err instanceof OtpInvalidResponseError) {
    return language === "ar"
      ? OTP_INVALID_RESPONSE_MESSAGE.ar
      : OTP_INVALID_RESPONSE_MESSAGE.en;
  }
  // A locally-aborted request has already returned early via the abort guard,
  // so AbortError/TimeoutError here mean fetchWithTimeout timed out, and
  // TypeError means fetch failed outright (offline, DNS failure, ...).
  const errorName = err instanceof Error ? err.name : "";
  if (
    errorName === "AbortError" ||
    errorName === "TimeoutError" ||
    errorName === "TypeError"
  ) {
    return language === "ar"
      ? OTP_CONNECTION_ERROR_MESSAGE.ar
      : OTP_CONNECTION_ERROR_MESSAGE.en;
  }
  return t(rejectedFallback);
}

export default function VerifyOtpPage() {
  const pendingRequest = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pendingRequest.current?.abort(); }; }, []);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [inputIndex, setInputIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const { t, language } = useLanguage();
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    // Hide global header while on verify-otp to give full immersion to architectural composition
    document.body.setAttribute("data-hide-header", "true");
    return () => {
      document.body.removeAttribute("data-hide-header");
    };
  }, []);

  useEffect(() => {
    // Get email/phone from localStorage
    const pendingVerification = localStorage.getItem("pendingVerification");
    if (!pendingVerification) {
      router.replace("/login");
      return;
    }
    setEmail(pendingVerification);
    const deadline = otpDeadline(localStorage.getItem("pendingVerificationExpiresAt"));
    localStorage.setItem("pendingVerificationExpiresAt", new Date(deadline).toISOString());
    setExpiresAt(deadline);
    setTimer(otpSecondsLeft(deadline));
  }, [router]);

  useEffect(() => {
    // Auto-focus first input on mount (leftmost box visually)
    const firstInput = document.getElementById("otp-0");
    firstInput?.focus();
  }, []);

  useEffect(() => {
    if (expiresAt === null) return;
    const updateTimer = () => setTimer(otpSecondsLeft(expiresAt));
    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    window.addEventListener("focus", updateTimer);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", updateTimer);
    };
  }, [expiresAt]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) { fillCode(value); return; }
    // Allow only single digits
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input if value entered (move right visually in LTR)
      if (value && index < 5) {
        const nextIndex = index + 1;
        setInputIndex(nextIndex);
        const nextInput = document.getElementById(`otp-${nextIndex}`);
        nextInput?.focus();
      }

      // Auto-focus previous input if value deleted and not first input
      if (!value && index > 0 && inputIndex === index) {
        const prevIndex = index - 1;
        setInputIndex(prevIndex);
        const prevInput = document.getElementById(`otp-${prevIndex}`);
        prevInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      setInputIndex(index - 1);
    }

    // Handle arrow keys for navigation
    if (e.key === "ArrowRight" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
      setInputIndex(index + 1);
    }

    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
      setInputIndex(index - 1);
    }

  };

  const fillCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    const focusIndex = Math.min(digits.length, 5);
    setInputIndex(focusIndex);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillCode(e.clipboardData.getData("text"));
  };

  const handleEditIdentifier = useCallback(() => {
    // Abort any in-flight verify/resend BEFORE navigating so a late success
    // can neither store credentials nor redirect behind the user's back.
    pendingRequest.current?.abort();
    router.replace("/login");
  }, [router]);

  const handleCustomerServiceClick = (e?: React.MouseEvent<HTMLAnchorElement>) => {
    // Cancel only navigation that actually leaves this page.
    // If the user opens support in another tab or window (Ctrl/Cmd-click,
    // shift-click, middle-click, or target="_blank"), leave the in-flight
    // verification in this tab running.
    if (e) {
      if (
        e.defaultPrevented ||
        (typeof e.button === 'number' && e.button !== 0) ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (e.currentTarget && e.currentTarget.target === '_blank')
      ) {
        return;
      }
    }
    pendingRequest.current?.abort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expiresAt === null || otpSecondsLeft(expiresAt) === 0) {
      setTimer(0);
      setError(language === "ar" ? "انتهت صلاحية الرمز. اطلب رمزًا جديدًا." : "This code has expired. Request a new code.");
      return;
    }
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError(t("otp.errorRequired"));
      return;
    }

    // One in-flight request at a time; ignore re-entrant submits instead of
    // aborting a verification that may already be completing.
    if (pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(
        `${getApiUrl()}/auth/verify-otp`,
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.includes("@") ? email : undefined,
            phone: !email.includes("@") ? email : undefined,
            otp: otpCode,
          }),
        }
      );

      let data: unknown;
      try {
        data = await response.json();
      } catch (parseError) {
        // A cancelled request stays silent; otherwise the body was not
        // interpretable JSON (proxy error page, empty 5xx body, ...).
        if (controller.signal.aborted || !mounted.current) throw parseError;
        throw new OtpInvalidResponseError("unreadable-response-body");
      }
      if (controller.signal.aborted || !mounted.current) return;

      if (!response.ok) {
        if (response.status >= 500) {
          throw new OtpInvalidResponseError(`server-error-${response.status}`);
        }
        throw new OtpRejectedError(readServerMessage(data));
      }

      if (
        !isRecord(data) ||
        typeof data.token !== "string" ||
        !data.token.trim() ||
        typeof data.refreshToken !== "string" ||
        !data.refreshToken.trim() ||
        !isRecord(data.user)
      ) {
        throw new OtpInvalidResponseError("unexpected-success-shape");
      }

      // Store user data in localStorage
      const user = data.user;
      const token = data.token;
      const refreshToken = data.refreshToken;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);

      // Dispatch custom event for reactive components (Navbar, AdminLayout)
      window.dispatchEvent(new Event("auth-change"));

      // Clear pending verification
      localStorage.removeItem("pendingVerification");
      localStorage.removeItem("pendingVerificationExpiresAt");

      const returnTo = safeReturnTo(sessionStorage.getItem("authReturnTo"));
      sessionStorage.removeItem("authReturnTo");
      if (returnTo) {
        sessionStorage.removeItem("providerRegistrationReturn");
        hapticSuccess();
        router.replace(returnTo);
        return;
      }
      if (sessionStorage.getItem("providerRegistrationReturn") === "1") {
        sessionStorage.removeItem("providerRegistrationReturn");
        hapticSuccess();
        router.replace("/service-providers");
        return;
      }

      if (user.role === "admin") {
        hapticSuccess();
        router.replace("/details");
      } else {
        hapticSuccess();
        if (user.firstName && user.lastName) {
          router.replace("/details");
        } else {
          router.replace("/profile");
        }
      }
    } catch (err: unknown) {
      if (controller.signal.aborted || !mounted.current) return;
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "OTP verification error:",
          err instanceof Error ? err.name : "Unknown error"
        );
      }
      hapticError();
      setError(describeOtpFailure(err, language, t, "otp.errorInvalid"));
    } finally {
      if (mounted.current && pendingRequest.current === controller) { setIsLoading(false); pendingRequest.current = null; }
    }
  };

  const handleVerifyOtp = handleSubmit;

  const handleResendOtp = async () => {
    // One in-flight request at a time; ignore duplicate clicks instead of
    // aborting a resend that may already be completing.
    if (pendingRequest.current) return;
    const controller = new AbortController();
    pendingRequest.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithTimeout(
        `${getApiUrl()}/auth/resend-otp`,
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.includes("@") ? email : undefined,
            phone: !email.includes("@") ? email : undefined,
          }),
        }
      );

      let data: unknown;
      try {
        data = await response.json();
      } catch (parseError) {
        if (controller.signal.aborted || !mounted.current) throw parseError;
        throw new OtpInvalidResponseError("unreadable-response-body");
      }
      if (controller.signal.aborted || !mounted.current) return;

      if (!response.ok) {
        if (response.status >= 500) {
          throw new OtpInvalidResponseError(`server-error-${response.status}`);
        }
        throw new OtpRejectedError(readServerMessage(data));
      }

      if (!isRecord(data) || typeof data.expiresAt !== "string") {
        throw new OtpInvalidResponseError("missing-expires-at");
      }

      const deadline = otpDeadline(data.expiresAt);
      localStorage.setItem(
        "pendingVerificationExpiresAt",
        new Date(deadline).toISOString()
      );
      setExpiresAt(deadline);
      setTimer(otpSecondsLeft(deadline));
      setError(null);
      setOtp(["", "", "", "", "", ""]);
      setInputIndex(0);

      // Focus first input again
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
    } catch (err: unknown) {
      if (controller.signal.aborted || !mounted.current) return;
      setError(describeOtpFailure(err, language, t, "otp.errorGeneric"));
    } finally {
      if (mounted.current && pendingRequest.current === controller) { setIsLoading(false); pendingRequest.current = null; }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const logoSrc = settings.isDark
    ? settings.logoWhiteUrl || "/icons/white.png"
    : settings.logoBlackUrl || "/icons/black.png";

  const maskedEmail = maskIdentifier(email);

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className={styles.pageOverlay}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />
      <div className={styles.architecturalGrid} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.portalGrid}>
          {/* Dominant Architectural Showcase Column (~58% Desktop) — Chapter 02 */}
          <div className={styles.architecturalShowcase}>
            <AnimatedArtwork src="/artworks/otp-staircase-v1.webp" priority />
            <div className={styles.showcaseOverlay} aria-hidden="true" />

            {/* Decorative Typographic Chapter Index & Linework */}
            <span className={styles.chapterWatermark} aria-hidden="true">
              02
            </span>
            <div className={styles.architecturalFrameLines} aria-hidden="true">
              <span className={styles.cornerCrosshairTopLeft} />
              <span className={styles.cornerCrosshairBottomRight} />
              <div className={styles.coordinateStamp}>
                {language === "ar"
                  ? "الوساطة الرقمية / تأكيد الدخول"
                  : "DIGITAL BROKERAGE / CONFIRM"}
              </div>
            </div>

            {/* Content Anchored Over the Showcase Image */}
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseTopMeta}>
                <div className={styles.showcaseBrand}>
                  <Image
                    unoptimized
                    src={settings.logoWhiteUrl || "/icons/white.png"}
                    alt={t("project.name")}
                    width={150}
                    height={44}
                    priority
                    className="w-auto h-9 object-contain"
                  />
                </div>
                <div className={styles.showcaseStatusPill}>
                  <span className={styles.pulseDot} aria-hidden="true" />
                  <span>
                    {language === "ar"
                      ? "تأكيد تسجيل الدخول"
                      : "SIGN-IN CONFIRMATION"}
                  </span>
                </div>
              </div>

              <div className={styles.showcaseIdentityCard}>
                <div className={styles.cardHeaderLinework}>
                  <span className={styles.cardIndexLabel}>
                    {language === "ar"
                      ? "رمز دخول لمرة واحدة"
                      : "ONE-TIME ACCESS CODE"}
                  </span>
                  <span className={styles.cardSerial} aria-hidden="true">
                    № 02
                  </span>
                </div>
                <h2 className={styles.showcaseTagline}>
                  {language === "ar"
                    ? "الخطوة الثانية: تأكيد رمز الدخول"
                    : "Step Two: Confirm Your Access Code"}
                </h2>
                <p className={styles.showcaseSubtext}>
                  {language === "ar"
                    ? "أدخل رمز التحقق المكون من ٦ أرقام لإكمال تسجيل الدخول واستعراض محفظتك العقارية وخدماتك."
                    : "Enter the 6-digit one-time code to authenticate your session and access your properties and services."}
                </p>
              </div>
            </div>
          </div>

          {/* Sculptural Offset Form Column (~42% Desktop) */}
          <div className={styles.formCard}>
            {/* Architectural Linework Accent */}
            <div className={styles.sculpturalHeaderLine} aria-hidden="true">
              <span className={styles.hairlineSegment} />
              <span className={styles.hairlineCode}>
                {language === "ar" ? "تحقق // ٠٢" : "VERIFY // 02"}
              </span>
            </div>

            {/* Top Navigation Row: Back & Customer Service */}
            <div className={styles.navBar}>
              <button
                type="button"
                onClick={handleEditIdentifier}
                className={styles.navButton}
                aria-label={t("common.back")}
              >
                <ArrowLeft
                  className={`w-4 h-4 shrink-0 ${
                    language === "en" ? "" : "rotate-180"
                  }`}
                />
                <span>{t("common.back")}</span>
              </button>

              <Link
                href="/customerservice"
                className={styles.customerServiceLink}
                onClick={handleCustomerServiceClick}
              >
                {t("header.customerService")}
              </Link>
            </div>

            {/* Mobile Authored Architectural Visual (< 1024px) */}
            <div className={styles.mobileGlimpse}>
              <AnimatedArtwork src="/artworks/otp-staircase-v1.webp" priority />
              <div className={styles.mobileGlimpseOverlay}>
                <div className={styles.mobileGlimpseTop}>
                  <Image
                    unoptimized
                    src={settings.logoWhiteUrl || "/icons/white.png"}
                    alt={t("project.name")}
                    width={130}
                    height={36}
                    priority
                    className="w-auto h-7 object-contain"
                  />
                  <span className={styles.mobileStatusBadge}>
                    <span className={styles.pulseDot} aria-hidden="true" />
                    <span>
                      {language === "ar" ? "تأكيد الدخول" : "VERIFICATION"}
                    </span>
                  </span>
                </div>
                <div className={styles.mobileGlimpseBottom}>
                  <span className={styles.mobileChapterNum} aria-hidden="true">
                    02
                  </span>
                  <p className={styles.mobileGlimpseCaption}>
                    {language === "ar"
                      ? "تأكيد الرمز وإكمال الدخول"
                      : "Access & Identity Confirmation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Oversized Expressive Heading Block */}
            <div className={styles.headingBlock}>
              <div className={styles.desktopLogo}>
                <Image
                  unoptimized
                  src={logoSrc}
                  alt={t("project.name")}
                  width={150}
                  height={44}
                  priority
                  className="w-auto h-9 object-contain"
                />
              </div>

              <div className={styles.kickerRow}>
                <span className={styles.kickerPill}>
                  {language === "ar"
                    ? "رمز الأمان لمرة واحدة"
                    : "ONE-TIME PASSCODE"}
                </span>
                <span className={styles.chapterBadge} aria-hidden="true">
                  CH.02
                </span>
              </div>

              <h1 className={styles.headingTitle}>{t("otp.title")}</h1>
              <div className={styles.recipientRow}>
                <span>{t("otp.sentTo")}</span>
                <strong className={styles.maskedIdentifier} dir="ltr">
                  {maskedEmail}
                </strong>
                <button
                  type="button"
                  onClick={handleEditIdentifier}
                  className={styles.editIdentifierBtn}
                  aria-label={
                    language === "ar"
                      ? "تعديل البريد أو رقم الجوال"
                      : "Edit email or phone number"
                  }
                >
                  {language === "ar" ? "تعديل" : "Change"}
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <form
              onSubmit={handleVerifyOtp}
              className={styles.formElement}
              noValidate
            >
              {/* Six Code Slots — Always LTR */}
              <div
                className={styles.otpGrid}
                dir="ltr"
                role="group"
                aria-label={
                  language === "ar"
                    ? "خانة إدخال رمز التحقق المكون من 6 أرقام"
                    : "6-digit verification code inputs"
                }
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={index === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setInputIndex(index)}
                    disabled={isLoading}
                    className={`${styles.otpSlot} ${
                      digit ? styles.otpSlotFilled : ""
                    }`}
                    dir="ltr"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={
                      language === "ar"
                        ? `الرقم ${index + 1} من 6`
                        : `Digit ${index + 1} of 6`
                    }
                    aria-required="true"
                    aria-invalid={error ? "true" : "false"}
                  />
                ))}
              </div>

              <p className={styles.instructionText}>
                {language === "ar"
                  ? "أدخل الرمز المكون من ٦ أرقام للمتابعة"
                  : "Enter the 6-digit code to continue"}
              </p>

              {/* Error Message with role="alert" */}
              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className={styles.errorAlert}
                >
                  <p>{error}</p>
                </div>
              )}

              {/* Countdown Timer without live announcement each second */}
              <div className={styles.countdownContainer}>
                <div className={styles.countdownRow}>
                  <span className={styles.countdownLabel}>
                    {t("otp.timeLeft")}
                  </span>
                  <span
                    className={`${styles.countdownValue} ${
                      timer < 60 ? styles.countdownUrgent : ""
                    }`}
                    dir="ltr"
                    aria-label={
                      language === "ar"
                        ? `الوقت المتبقي: ${Math.floor(timer / 60)} دقيقة و ${
                            timer % 60
                          } ثانية`
                        : `Time remaining: ${Math.floor(
                            timer / 60
                          )} minutes and ${timer % 60} seconds`
                    }
                  >
                    {formatTime(timer)}
                  </span>
                </div>
                {timer === 0 && (
                  <p className={styles.expiredHint}>
                    {language === "ar"
                      ? "انتهت مهلة الرمز الحالي. يمكنك طلب رمز جديد الآن."
                      : "Current code expired. You can request a new code now."}
                  </p>
                )}
              </div>

              {/* Action Stack: Submit and Resend */}
              <div className={styles.actionStack}>
                <button
                  type="submit"
                  disabled={isLoading || timer === 0 || otp.join("").length !== 6}
                  className={styles.submitButton}
                >
                  {isLoading ? (
                    <span className={styles.btnContent}>
                      <Loader2 className={styles.spinnerIcon} />
                      <span>{t("otp.verifying")}</span>
                    </span>
                  ) : (
                    t("otp.verifyBtn")
                  )}
                </button>

                {timer === 0 && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className={styles.resendButton}
                  >
                    {isLoading ? (
                      <span className={styles.btnContent}>
                        <Loader2 className={styles.spinnerIcon} />
                        <span>{t("otp.resending")}</span>
                      </span>
                    ) : (
                      t("otp.resendBtn")
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className={styles.footerHelp}>
              <p>{t("otp.didNotReceive")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
