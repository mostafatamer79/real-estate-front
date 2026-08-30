"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  ChevronDown,
  Info,
  Smartphone,
  X,
  Mail,
  Loader2,
} from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { hapticSuccess, hapticError } from "@/lib/haptics";

interface SignInProps {
  onClose?: () => void;
}

export default function SignIn({ onClose }: SignInProps) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isPhoneMode, setIsPhoneMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const loginConfig = settings.loginConfig;
  const phoneLoginEnabled = true;
  const emailStatus = loginConfig.emailStatus || (loginConfig.emailEnabled ? 'enabled' : 'hidden');
  const phoneStatus = loginConfig.phoneStatus || (loginConfig.phoneEnabled ? 'enabled' : 'soon');
  const effectivePhoneEnabled = phoneStatus === 'enabled' && phoneLoginEnabled;
  const effectiveEmailEnabled = emailStatus === 'enabled';

  useEffect(() => {
    if (loginConfig && !effectiveEmailEnabled && effectivePhoneEnabled) {
      setIsPhoneMode(true);
    } else if (loginConfig && effectiveEmailEnabled && !effectivePhoneEnabled) {
      setIsPhoneMode(false);
    }
  }, [loginConfig, effectiveEmailEnabled, effectivePhoneEnabled]);

  useEffect(() => {
    // Hide global header and disable scrolling when login overlay is active
    document.body.setAttribute('data-hide-header', 'true');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.removeAttribute('data-hide-header');
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.role === 'admin') {
            router.push('/details');
          } else {
            if (u.firstName && u.lastName) {
              router.push('/details');
            } else {
              router.push('/profile');
            }
          }
        } catch {
          router.push('/profile');
        }
      }
    }
  }, [router]);

  const isGlobalFreeTrial = settings.uiFlags['enable_global_free_trial'] === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
      const payload = isPhoneMode
        ? { phone }
        : { email };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || t('login.error.generic'));
      }

      const userIdentifier = isPhoneMode ? phone : email;
      localStorage.setItem('pendingVerification', userIdentifier);
      hapticSuccess();
      router.push('/verify-otp');

    } catch (err: unknown) {
      console.error('Registration error:', err);
      hapticError();
      const message = err instanceof Error ? err.message : t('login.error.generic');
      setError(t(message) !== message ? t(message) : t('login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const activeMethodEnabled = isPhoneMode ? effectivePhoneEnabled : effectiveEmailEnabled;
  const isFormValid = activeMethodEnabled && (isPhoneMode
    ? phone.trim().length > 0
    : email.trim().length > 0);

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-start md:pt-12 p-3 sm:p-6 z-[60] overflow-y-auto"
      style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
    >
      {/* Enhanced Background Orbs — animated and more dramatic */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Decorative dot grid */}
      <div className="absolute inset-0 z-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.04) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      {/* Floating decorative particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/10"
            style={{
              left: `${10 + (i * 12) % 80}%`,
              top: `${5 + (i * 17) % 90}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Premium mobile hero logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
          className="md:hidden flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full animate-pulse scale-150" />
            <div className="absolute inset-0 bg-purple-500/15 blur-2xl rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            <Image
              src={settings.logoWhiteUrl || '/icons/white.png'}
              alt={t('project.name')}
              width={160}
              height={48}
              className="relative object-contain w-auto h-12 drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)]"
              priority
            />
          </div>
        </motion.div>

        {/* Header/Back Link */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex justify-between items-center mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-200 active:scale-95"
          >
            <ArrowLeft className={`w-5 h-5 sm:w-4 sm:h-4 ${language === 'en' ? '' : 'rotate-180'}`} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>

          <Link href="/customerservice" className="text-white/40 hover:text-white text-xs transition-colors duration-200 underline underline-offset-4">
            {t('header.customerService')}
          </Link>
        </motion.div>

        {/* Login Card — premium glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 26 }}
          className="relative"
        >
          {/* Mobile glow ring behind card — animated */}
          <motion.div
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
            className="md:hidden absolute -inset-px rounded-[1.8rem] bg-gradient-to-b from-white/20 via-indigo-500/10 to-transparent pointer-events-none"
          />
          <div
            className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[1.8rem] p-5 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Inner top highlight */}
            <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="pointer-events-none absolute inset-x-6 top-0 h-8 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-[1.8rem]" />

            {typeof onClose === 'function' && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors duration-200 active:scale-90"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-8">
       
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="text-lg sm:text-xl font-bold mb-2 leading-snug"
                >
                  {isPhoneMode ? t('login.title.phone') : t('login.title.email')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.4 }}
                  className="text-white/60 text-sm"
                >
                  {isPhoneMode ? t('login.info.phone') : t('login.info.email')}
                </motion.p>
            </div>

            {/* Mode Switcher — premium segmented control */}
            {(emailStatus !== 'hidden' || phoneStatus !== 'hidden') && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex bg-slate-800/80 p-1.5 rounded-2xl mb-6 border border-white/5 backdrop-blur-sm"
              >
                  {/* Email tab */}
                  {effectiveEmailEnabled ? (
                    <button
                      onClick={() => setIsPhoneMode(false)}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 ${
                        !isPhoneMode
                          ? "bg-white/10 text-white shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
                          : "text-white/40 hover:text-white/60"
                      } disabled:opacity-50`}
                    >
                      <Mail className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-[11px] sm:text-sm font-semibold whitespace-nowrap">{t('login.tab.email')}</span>
                    </button>
                  ) : emailStatus === 'soon' ? (
                    <div className="relative flex-1">
                      <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white/20 cursor-not-allowed select-none">
                        <Mail className="w-5 h-5 sm:w-4 sm:h-4" />
                        <span className="text-sm font-semibold">{t('login.tab.email')}</span>
                      </div>
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400/50 animate-pulse">
                        {t('common.soon')}
                      </span>
                    </div>
                  ) : null}

                  {/* Phone tab */}
                  {effectivePhoneEnabled ? (
                    <button
                      onClick={() => setIsPhoneMode(true)}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 sm:px-4 rounded-xl transition-all duration-300 ${
                        isPhoneMode
                          ? "bg-white/10 text-white shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
                          : "text-white/40 hover:text-white/60"
                      } disabled:opacity-50`}
                    >
                      <Phone className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="text-[11px] sm:text-sm font-semibold whitespace-nowrap">{t('login.tab.phone')}</span>
                    </button>
                  ) : phoneStatus === 'soon' ? (
                    <div className="relative flex-1">
                      <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white/20 cursor-not-allowed select-none">
                        <Phone className="w-5 h-5 sm:w-4 sm:h-4" />
                        <span className="text-sm font-semibold">{t('login.tab.phone')}</span>
                      </div>
                      {loginConfig.phoneLabel && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400/50 animate-pulse">
                          {phoneLoginEnabled ? loginConfig.phoneLabel : t('common.soon')}
                        </span>
                      )}
                    </div>
                  ) : null}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-1"
              >
                <div className="relative group">
                  <div className={`absolute inset-0 bg-indigo-500/15 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative flex items-center bg-slate-800/60 border border-white/8 rounded-2xl p-3.5 sm:p-4 focus-within:border-indigo-500/40 focus-within:bg-slate-800/80 transition-all duration-300">
                    {isPhoneMode ? (
                      <>
                        <div className="flex items-center gap-2 border-l border-white/10 pl-3 shrink-0">
                          <span className="text-lg">🇸🇦</span>
                          <ChevronDown className="w-5 h-5 sm:w-4 sm:h-4 text-white/40 shrink-0" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isLoading}
                          className="w-full bg-transparent outline-none px-3 text-white placeholder:text-white/25"
                          placeholder={t('login.placeholder.phone')}
                          required
                        />
                      </>
                    ) : (
                      <>
                        <Mail className="w-6 h-6 sm:w-5 sm:h-5 text-white/40 mr-3" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="w-full bg-transparent outline-none px-3 text-white placeholder:text-white/25"
                          placeholder={t('login.placeholder.email')}
                          required
                        />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <p className="text-red-400 text-xs text-center font-medium leading-relaxed">{error}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex items-start gap-3 px-1 text-white/40"
              >
                <Info className="w-5 h-5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  {isPhoneMode ? t('login.note.phone') : t('login.note.email')}
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                type="submit"
                disabled={!isFormValid || isLoading}
                whileTap={isFormValid && !isLoading ? { scale: 0.98 } : undefined}
                className={`w-full relative group overflow-hidden py-4 rounded-2xl font-bold transition-all duration-300 ${
                  isFormValid && !isLoading
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.4)] wow-shine"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t('login.sending')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('login.submit')}</span>
                      <ArrowLeft className={`w-5 h-5 sm:w-4 sm:h-4 ${language === 'en' ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
              </motion.button>
            </form>
        </div>
        </motion.div>

        {/* Footer Info — guest access during free trial */}
        {isGlobalFreeTrial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => router.push('/')}
              className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200 underline underline-offset-4 active:scale-95"
            >
              {t('login.continueWithoutLogin') || 'تصفح بدون تسجيل دخول'}
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
