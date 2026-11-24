"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Phone,
  Info,
  X,
  Mail,
  Loader2,
  Globe,
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import { publicLoginExit } from "@/lib/login-exit";
import { safeReturnTo } from "@/lib/auth-navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { otpDeadline } from "@/lib/otp-expiry";
import { getApiUrl } from "@/lib/api";
import LoginServiceDoor from "./LoginServiceDoor";
import styles from "./sign-in.module.css";

interface SignInProps {
  onClose?: () => void;
  next?: string;
}

export default function SignIn({ onClose, next: nextProp }: SignInProps) {
  const pendingRequest = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const emailTabRef = useRef<HTMLButtonElement | null>(null);
  const phoneTabRef = useRef<HTMLButtonElement | null>(null);
  const mounted = useRef(true);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const { settings } = useSettings();
  const loginConfig = settings.loginConfig;
  const phoneLoginEnabled = true;
  const emailStatus = loginConfig.emailStatus || (loginConfig.emailEnabled ? 'enabled' : 'hidden');
  const phoneStatus = loginConfig.phoneStatus || (loginConfig.phoneEnabled ? 'enabled' : 'soon');
  const effectivePhoneEnabled = phoneStatus === 'enabled' && phoneLoginEnabled;
  const effectiveEmailEnabled = emailStatus === 'enabled';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pendingRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (loginConfig && !effectiveEmailEnabled && effectivePhoneEnabled) {
      setIsPhoneMode(true);
    } else if (loginConfig && effectiveEmailEnabled && !effectivePhoneEnabled) {
      setIsPhoneMode(false);
    }
  }, [loginConfig, effectiveEmailEnabled, effectivePhoneEnabled]);

  useEffect(() => {
    // Hide global header and disable background scrolling when login overlay is active
    document.body.setAttribute('data-hide-header', 'true');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.removeAttribute('data-hide-header');
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const queryNext = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const next = safeReturnTo(nextProp || queryNext);
    if (next) sessionStorage.setItem('authReturnTo', next);
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (next) {
            sessionStorage.removeItem('authReturnTo');
            router.replace(next);
            return;
          }
          if (u.role === 'admin') {
            router.replace('/details');
          } else {
            if (u.firstName && u.lastName) {
              router.replace('/details');
            } else {
              router.replace('/profile');
            }
          }
        } catch {
          router.replace('/profile');
        }
      }
    }
  }, [router, nextProp]);

  const isGlobalFreeTrial = settings.uiFlags['enable_global_free_trial'] === true;

  const validateIdentifier = () => {
    const value = (isPhoneMode ? phone : email).trim();
    if (!value) {
      return language === 'ar'
        ? `أدخل ${isPhoneMode ? 'رقم الجوال' : 'البريد الإلكتروني'}.`
        : `Enter your ${isPhoneMode ? 'phone number' : 'email address'}.`;
    }
    if (!isPhoneMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return language === 'ar' ? 'أدخل بريدًا إلكترونيًا صحيحًا.' : 'Enter a valid email address.';
    }
    if (isPhoneMode && !/^\+?[0-9\s()-]{7,}$/.test(value)) {
      return language === 'ar' ? 'أدخل رقم جوال صحيحًا.' : 'Enter a valid phone number.';
    }
    return null;
  };

  const handleBack = () => {
    pendingRequest.current?.abort();
    const destination = publicLoginExit(document.referrer, window.location.origin);
    sessionStorage.removeItem('authReturnTo');
    sessionStorage.removeItem('providerRegistrationReturn');
    if (!destination || destination === '/') {
      router.push('/');
    } else {
      router.push(destination);
    }
  };

  const handleClose = () => {
    pendingRequest.current?.abort();
    if (onClose) {
      sessionStorage.removeItem('authReturnTo');
      sessionStorage.removeItem('providerRegistrationReturn');
      onClose();
      return;
    }
    const returnTo = safeReturnTo(sessionStorage.getItem('authReturnTo'));
    sessionStorage.removeItem('authReturnTo');
    sessionStorage.removeItem('providerRegistrationReturn');
    router.push(publicLoginExit(returnTo));
  };

  const handleFreeTrialContinue = () => {
    pendingRequest.current?.abort();
    sessionStorage.removeItem('authReturnTo');
    sessionStorage.removeItem('providerRegistrationReturn');
    if (onClose) {
      onClose();
    } else {
      router.push('/');
    }
  };

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentTab: 'email' | 'phone') => {
    const isRtl = language === 'ar';
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const shouldGoPhone = isRtl ? e.key === 'ArrowLeft' : e.key === 'ArrowRight';
      if (shouldGoPhone && currentTab === 'email' && effectivePhoneEnabled) {
        setIsPhoneMode(true);
        setError(null);
        phoneTabRef.current?.focus();
      } else if (!shouldGoPhone && currentTab === 'phone' && effectiveEmailEnabled) {
        setIsPhoneMode(false);
        setError(null);
        emailTabRef.current?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (effectiveEmailEnabled) {
        setIsPhoneMode(false);
        setError(null);
        emailTabRef.current?.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (effectivePhoneEnabled) {
        setIsPhoneMode(true);
        setError(null);
        phoneTabRef.current?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateIdentifier();
    if (validationError) {
      setError(validationError);
      hapticError();
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    pendingRequest.current?.abort();
    pendingRequest.current = controller;

    try {
      const canonicalIdentifier = isPhoneMode
        ? phone.trim()
        : email.trim().toLowerCase();

      const endpoint = `${getApiUrl()}/auth/register`;
      const payload = isPhoneMode
        ? { phone: canonicalIdentifier }
        : { email: canonicalIdentifier };

      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (controller.signal.aborted || !mounted.current) return;
      let data: { message?: string; expiresAt?: string } | null = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || t('login.error.generic'));
      }

      if (controller.signal.aborted || !mounted.current) return;
      hapticSuccess();
      setIsConfirmed(true);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        await new Promise<void>(resolve => {
          const timer = window.setTimeout(resolve, 220);
          controller.signal.addEventListener('abort', () => { window.clearTimeout(timer); resolve(); }, { once: true });
        });
      }
      if (controller.signal.aborted || !mounted.current) return;
      localStorage.setItem('pendingVerification', canonicalIdentifier);
      localStorage.setItem('pendingVerificationExpiresAt', new Date(otpDeadline(data?.expiresAt)).toISOString());
      router.replace('/verify-otp');
    } catch (err: unknown) {
      if (controller.signal.aborted || !mounted.current) return;
      if (process.env.NODE_ENV !== 'production') {
        console.error('Registration failed:', err instanceof Error ? err.name : 'Unknown error');
      }
      hapticError();
      const message = err instanceof Error && err.name === 'AbortError'
        ? (language === 'ar' ? 'انتهت مهلة الاتصال. يمكنك إعادة المحاولة.' : 'Connection timed out. Please retry.')
        : err instanceof Error
          ? err.message
          : t('login.error.generic');
      setError(t(message) !== message ? t(message) : message);
    } finally {
      if (mounted.current && pendingRequest.current === controller) {
        setIsLoading(false);
        pendingRequest.current = null;
      }
    }
  };

  const activeMethodEnabled = isPhoneMode ? effectivePhoneEnabled : effectiveEmailEnabled;
  const isFormValid = activeMethodEnabled;

  const logoSrc = settings.isDark
    ? (settings.logoWhiteUrl || "/icons/white.png")
    : (settings.logoBlackUrl || "/icons/black.png");

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`${styles.loginOverlay} ${isConfirmed ? styles.confirmed : ''}`}
    >
      <div className={styles.ambientGlow} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.portalGrid}>
          {/* Selected SVG doorway; service previews stay on the sign-in page. */}
          <div className={styles.architecturalShowcase}>
            <LoginServiceDoor />
          </div>

          {/* Open Ivory/Navy Form Plane Aligned with the Gateway Opening */}
          <div className={styles.formPlane}>
            {/* Top Navigation Row: Back, Local Language Toggle, Customer Service, Close */}
            <div className={styles.navBar}>
              <button
                type="button"
                onClick={handleBack}
                className={styles.navButton}
                aria-label={t('common.back')}
              >
                <ArrowLeft className={`w-4 h-4 shrink-0 ${language === 'en' ? '' : 'rotate-180'}`} />
                <span>{t('common.back')}</span>
              </button>

              <div className={styles.navTrailing}>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={styles.languageToggle}
                  aria-label={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
                >
                  <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>

                <Link
                  href="/customerservice"
                  onClick={event => {
                    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                      pendingRequest.current?.abort();
                      setIsConfirmed(false);
                    }
                  }}
                  className={styles.customerServiceLink}
                >
                  {t('header.customerService')}
                </Link>

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label={language === 'ar' ? 'إغلاق تسجيل الدخول' : 'Close sign in'}
                  className={styles.closeButton}
                >
                  <X className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </div>

            {/* Single Elegant Brand Anchor */}
            <div className={styles.formBrand}>
              <Image
                unoptimized
                src={logoSrc}
                alt={t('project.name')}
                width={140}
                height={40}
                priority
                className="w-auto h-8 object-contain"
              />
            </div>

            {/* Oversized Expressive Heading Block */}
            <div className={styles.headingBlock}>
              <h1 className={styles.headingTitle}>
                {language === 'ar' ? 'خطوتك التالية، تبدأ هنا.' : 'Your next chapter starts here.'}
              </h1>
              <p className={styles.headingSubtitle}>
                {isPhoneMode ? t('login.info.phone') : t('login.info.email')}
              </p>
            </div>

            {/* Segmented Mode Switcher Tabs */}
            {(emailStatus !== 'hidden' || phoneStatus !== 'hidden') && (
              <div
                role="tablist"
                aria-label={language === 'ar' ? 'طريقة تسجيل الدخول' : 'Sign-in method'}
                className={styles.tabList}
              >
                {/* Email Tab */}
                {effectiveEmailEnabled ? (
                  <button
                    ref={emailTabRef}
                    id="tab-email"
                    type="button"
                    role="tab"
                    aria-selected={!isPhoneMode}
                    aria-controls="panel-login-form"
                    tabIndex={!isPhoneMode ? 0 : -1}
                    onClick={() => {
                      setIsPhoneMode(false);
                      setError(null);
                    }}
                    onKeyDown={(e) => handleTabKeyDown(e, 'email')}
                    disabled={isLoading}
                    className={`${styles.tabButton} ${!isPhoneMode ? styles.tabButtonActive : ''}`}
                  >
                    <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t('login.tab.email')}</span>
                  </button>
                ) : emailStatus === 'soon' ? (
                  <div className={styles.tabSoonContainer}>
                    <div className={styles.tabButtonDisabled}>
                      <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{t('login.tab.email')}</span>
                    </div>
                    <span className={styles.soonPill}>
                      {t('common.soon')}
                    </span>
                  </div>
                ) : null}

                {/* Phone Tab */}
                {effectivePhoneEnabled ? (
                  <button
                    ref={phoneTabRef}
                    id="tab-phone"
                    type="button"
                    role="tab"
                    aria-selected={isPhoneMode}
                    aria-controls="panel-login-form"
                    tabIndex={isPhoneMode ? 0 : -1}
                    onClick={() => {
                      setIsPhoneMode(true);
                      setError(null);
                    }}
                    onKeyDown={(e) => handleTabKeyDown(e, 'phone')}
                    disabled={isLoading}
                    className={`${styles.tabButton} ${isPhoneMode ? styles.tabButtonActive : ''}`}
                  >
                    <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{t('login.tab.phone')}</span>
                  </button>
                ) : phoneStatus === 'soon' ? (
                  <div className={styles.tabSoonContainer}>
                    <div className={styles.tabButtonDisabled}>
                      <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{t('login.tab.phone')}</span>
                    </div>
                    {loginConfig.phoneLabel && (
                      <span className={styles.soonPill}>
                        {phoneLoginEnabled ? loginConfig.phoneLabel : t('common.soon')}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {!effectiveEmailEnabled && !effectivePhoneEnabled && (
              <p role="status" className={styles.noteBox}>
                {language === 'ar'
                  ? 'تسجيل الدخول غير متاح حاليًا. تواصل مع خدمة العملاء للمساعدة.'
                  : 'Sign in is currently unavailable. Contact customer service for help.'}
              </p>
            )}

            {/* Form */}
            <form
              role={activeMethodEnabled ? "tabpanel" : undefined}
              aria-labelledby={activeMethodEnabled ? (isPhoneMode ? "tab-phone" : "tab-email") : undefined}
              id="panel-login-form"
              onSubmit={handleSubmit}
              className={styles.form}
            >
              <div className={styles.fieldGroup}>
                <label htmlFor={isPhoneMode ? 'login-phone' : 'login-email'} className={styles.label}>
                  {isPhoneMode ? t('login.tab.phone') : t('login.tab.email')}
                </label>

                <div className={styles.inputWrapper}>
                  {isPhoneMode ? (
                    <>
                      <div
                        className={styles.phonePrefix}
                        aria-label={language === 'ar' ? 'رمز الدولة السعودية' : 'Saudi Arabia country code'}
                      >
                        <span className={styles.flagIcon}>🇸🇦</span>
                        <span dir="ltr">+966</span>
                      </div>
                      <input
                        id="login-phone"
                        ref={inputRef}
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isLoading || !activeMethodEnabled}
                        className={styles.textInput}
                        placeholder={t('login.placeholder.phone')}
                        autoComplete="tel"
                        aria-describedby="login-method-note"
                        aria-invalid={Boolean(error)}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <Mail className={styles.fieldIcon} aria-hidden="true" />
                      <input
                        id="login-email"
                        ref={inputRef}
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading || !activeMethodEnabled}
                        className={styles.textInput}
                        placeholder={t('login.placeholder.email')}
                        autoComplete="email"
                        aria-describedby="login-method-note"
                        aria-invalid={Boolean(error)}
                        required
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Inline recoverable error */}
              {error && (
                <div role="alert" className={styles.errorAlert}>
                  <p className={styles.errorMessage}>{error}</p>
                </div>
              )}

              {/* Informational Method Note */}
              <div id="login-method-note" className={styles.noteBox}>
                <Info className={styles.noteIcon} aria-hidden="true" />
                <p className={styles.noteText}>
                  {isPhoneMode ? t('login.note.phone') : t('login.note.email')}
                </p>
              </div>

              {/* Submit CTA button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={styles.submitBtn}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
                    <span>{t('login.sending')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('login.submit')}</span>
                    <ArrowLeft className={`w-4 h-4 shrink-0 ${language === 'en' ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </>
                )}
                <div className={styles.submitBtnShine} aria-hidden="true" />
              </button>
            </form>

            {/* Optional Free Trial / Guest Browse Action */}
            {isGlobalFreeTrial && (
              <div className={styles.freeTrialWrapper}>
                <button
                  type="button"
                  onClick={handleFreeTrialContinue}
                  className={styles.freeTrialBtn}
                >
                  {t('login.continueWithoutLogin') || 'تصفح بدون تسجيل دخول'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
