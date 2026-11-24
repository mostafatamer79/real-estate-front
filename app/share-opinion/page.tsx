"use client";

import React, { useState, useEffect, useRef } from "react";
import MobileAppHeader from "@/app/src/components/MobileAppHeader";
import { Send, CheckCircle2, ChevronRight, ChevronLeft, MessageSquareHeart, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";
import { opinionApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { safeNavigateBack, validateOpinionForm } from "@/lib/redesign-chat11-content";

export default function ShareOpinionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { settings } = useSettings();
  const isRtl = language === "ar";

  const [prevUser, setPrevUser] = useState(user);
  const [name, setName] = useState(() => (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : ""));
  const [email, setEmail] = useState(() => user?.email || "");

  if (user !== prevUser) {
    setPrevUser(user);
    if (!name && user) {
      setName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
    }
    if (!email && user?.email) {
      setEmail(user.email || "");
    }
  }

  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cancel delayed navigation timer if component unmounts
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    safeNavigateBack(router, "/");
  };

  const handleImmediateHome = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form inputs synchronously
    const validation = validateOpinionForm({ name, email, message }, language as "ar" | "en");
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await opinionApi.create({
        name: name.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
      });
      setIsSuccess(true);
      toast.success(isRtl ? "تم إرسال رأيك بنجاح، شكراً لك!" : "Thank you! Your feedback has been submitted successfully.");

      // Delay navigation with unmount cancellation guard
      redirectTimerRef.current = setTimeout(() => {
        router.push("/");
      }, 3500);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (isRtl ? "فشل إرسال رأيك، يرجى المحاولة لاحقاً." : "Failed to submit feedback. Please try again later.");
      setSubmitError(errorMsg);
      toast.error(isRtl ? "فشل إرسال رأيك، يرجى المحاولة لاحقاً." : "Failed to submit feedback. Please try again later.");
      // Retain form inputs in state so the user never loses their draft
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const inputClass =
    "w-full min-h-[52px] py-3 rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-card/5 focus:bg-background focus:border-amber-500 px-5 text-sm font-bold text-foreground dark:text-white placeholder:text-muted-foreground/60 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass = "text-xs font-black uppercase tracking-wider text-muted-foreground dark:text-slate-300 px-1";

  return (
    <section
      className="calm-page calm-screen w-full min-h-screen bg-background dark:bg-slate-950 text-foreground dark:text-white flex flex-col font-sans overflow-x-hidden selection:bg-amber-500/20 pb-16"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <MobileAppHeader
        theme={settings.isDark ? "dark" : "light"}
        title={isRtl ? "شارك رأيك" : "Share Feedback"}
        onBack={handleBack}
      />

      {/* Desktop Back Navigation */}
      <div className="hidden md:flex relative z-10 max-w-4xl mx-auto w-full px-6 pt-10">
        <button
          type="button"
          onClick={handleBack}
          className="group flex items-center gap-2.5 text-muted-foreground dark:text-slate-400 hover:text-foreground hover:dark:text-white transition-colors text-xs font-black uppercase tracking-wider"
        >
          <div className="w-9 h-9 rounded-full border border-border dark:border-white/10 group-hover:border-amber-500 flex items-center justify-center transition-colors">
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </div>
          <span>{isRtl ? "العودة" : "Back"}</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-8 pb-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 shadow-sm">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-foreground dark:text-white mb-3">
            {isRtl ? "شاركنا رأيك ومقترحاتك" : "Share Your Thoughts & Feedback"}
          </h1>
          <p className="text-muted-foreground dark:text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed font-bold">
            {isRtl
              ? "ملاحظاتك ومقترحاتك تهمنا مباشرة لتطوير التجربة ورفع كفاءة الخدمات العقارية للجميع."
              : "Your perspectives and suggestions directly help us refine the platform experience and elevate services for everyone."}
          </p>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pb-20">
        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="calm-panel bg-card dark:bg-card/5 p-6 sm:p-12 rounded-[1.5rem] border border-border dark:border-white/10 shadow-sm text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground dark:text-white mb-2">
              {isRtl ? "شكراً لمشاركتنا رأيك!" : "Thank You For Your Feedback!"}
            </h2>
            <p className="text-muted-foreground dark:text-slate-400 font-bold text-xs sm:text-sm max-w-md mb-4">
              {isRtl
                ? "نحن نقدر وقتك واهتمامك، رأيك ومقترحاتك تساعدنا على تحسين وتطوير المنصة باستمرار."
                : "We truly appreciate your time. Your valuable input guides our continuous improvements."}
            </p>
            <p className="text-muted-foreground/60 dark:text-slate-500 text-xs mb-8">
              {isRtl ? "سيتم نقلك إلى الصفحة الرئيسية خلال ثوانٍ..." : "Redirecting to home in a few seconds..."}
            </p>
            <button
              type="button"
              onClick={handleImmediateHome}
              className="py-3 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              {isRtl ? "العودة للرئيسية الآن" : "Return to Home Now"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="calm-panel relative bg-card dark:bg-card/5 border border-border dark:border-white/10 rounded-[1.5rem] p-6 sm:p-10 overflow-hidden shadow-sm"
          >
            {/* Form Error Banner */}
            {submitError && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative space-y-6" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="opinion-name" className={labelClass}>
                    {isRtl ? "الاسم الكريم" : "Full Name"}{" "}
                    <span className="text-amber-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="opinion-name"
                    name="name"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? "name-error" : undefined}
                    disabled={isSubmitting}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder={isRtl ? "الاسم الكامل" : "Your full name"}
                    className={inputClass}
                  />
                  {fieldErrors.name && (
                    <p id="name-error" className="text-xs font-bold text-red-500 px-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label htmlFor="opinion-email" className={labelClass}>
                    {isRtl ? "البريد الإلكتروني (اختياري)" : "Email Address (Optional)"}
                  </label>
                  <input
                    id="opinion-email"
                    name="email"
                    type="email"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@example.com"
                    dir="ltr"
                    className={`${inputClass} text-left`}
                  />
                  {fieldErrors.email && (
                    <p id="email-error" className="text-xs font-bold text-red-500 px-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Message / Feedback */}
              <div className="space-y-2">
                <label htmlFor="opinion-message" className={labelClass}>
                  {isRtl ? "رأيك أو مقترحك" : "Your Feedback or Suggestion"}{" "}
                  <span className="text-amber-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="opinion-message"
                  name="message"
                  required
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.message)}
                  aria-describedby={fieldErrors.message ? "message-error" : undefined}
                  disabled={isSubmitting}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
                  }}
                  placeholder={
                    isRtl
                      ? "اكتب تفاصيل مقترحك أو ملاحظاتك هنا لمساعدتنا على تحسين الخدمات..."
                      : "Provide your detailed feedback or suggestions here..."
                  }
                  className="w-full min-h-[160px] rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-card/5 focus:bg-background focus:border-amber-500 p-5 text-sm font-bold text-foreground dark:text-white placeholder:text-muted-foreground/60 transition-all outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {fieldErrors.message && (
                  <p id="message-error" className="text-xs font-bold text-red-500 px-1">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim() || !message.trim()}
                  className="min-h-[52px] py-3 px-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (isRtl ? "جاري الإرسال..." : "Submitting...") : (isRtl ? "إرسال الرأي" : "Submit Feedback")}
                  {!isSubmitting && <Send className={`w-4 h-4 ${isRtl ? "rtl:-scale-x-100" : ""}`} />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  );
}
