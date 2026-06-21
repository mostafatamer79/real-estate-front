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
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

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
  const effectivePhoneEnabled = loginConfig.phoneEnabled && phoneLoginEnabled;

  useEffect(() => {
    if (loginConfig && !loginConfig.emailEnabled && effectivePhoneEnabled) {
      setIsPhoneMode(true);
    } else if (loginConfig && loginConfig.emailEnabled && !effectivePhoneEnabled) {
      setIsPhoneMode(false);
    }
  }, [loginConfig, effectivePhoneEnabled]);

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
        const u = JSON.parse(storedUser);
        const assignedDepartments = Array.isArray(u.departments) ? u.departments : [];
        const permissionDepartments = Object.entries(u.departmentPermissions || {})
          .filter(([, value]) => value === true || value === 'manage' || value === 'view')
          .map(([key]) => key);
        const hasDepartmentAccess = [...assignedDepartments, ...permissionDepartments].length > 0;

        router.push('/details');
      }
    }
  }, [router]);

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
      router.push('/verify-otp');

    } catch (err: unknown) {
      console.error('Registration error:', err);
      const message = err instanceof Error ? err.message : t('login.error.generic');
      setError(t(message) !== message ? t(message) : t('login.error.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = isPhoneMode
    ? phone.trim().length > 0
    : email.trim().length > 0;

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-start pt-8 md:pt-16 p-6 z-[60] overflow-hidden"
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Decorative Lines */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header/Back Link */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${language === 'en' ? '' : 'rotate-180'}`} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>

          <Link href="/customerservice" className="text-white/40 hover:text-white text-xs transition-colors underline underline-offset-4">
            {t('header.customerService')}
          </Link>
        </div>

        {/* Login Card */}
        <div 
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative"
        >
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="text-center mb-10">
       
                <h1 className="text-2xl font-bold mb-2">
                  {isPhoneMode ? t('login.title.phone') : t('login.title.email')}
                </h1>
                <p className="text-white/60 text-sm">
                  {isPhoneMode ? t('login.info.phone') : t('login.info.email')}
                </p>
            </div>

            {/* Mode Switcher */}
            {(loginConfig.emailEnabled || loginConfig.phoneEnabled) && (
              <div className="flex bg-slate-900/50 p-1.5 rounded-2xl mb-8 border border-white/5">
                  {/* Email tab */}
                  {loginConfig.emailEnabled && (
                    <button
                      onClick={() => setIsPhoneMode(false)}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
                        !isPhoneMode
                          ? "bg-white/10 text-white shadow-lg"
                          : "text-white/40 hover:text-white/60"
                      } disabled:opacity-50`}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-semibold">{t('login.tab.email')}</span>
                    </button>
                  )}

                  {/* Phone tab */}
                  {effectivePhoneEnabled ? (
                    <button
                      onClick={() => setIsPhoneMode(true)}
                      disabled={isLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all ${
                        isPhoneMode
                          ? "bg-white/10 text-white shadow-lg"
                          : "text-white/40 hover:text-white/60"
                      } disabled:opacity-50`}
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-semibold">{t('login.tab.phone')}</span>
                    </button>
                  ) : (
                    <div className="relative flex-1">
                      <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white/20 cursor-not-allowed select-none">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-semibold">{t('login.tab.phone')}</span>
                      </div>
                      {loginConfig.phoneLabel && (
                        <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400/50 animate-pulse">
                          {phoneLoginEnabled ? loginConfig.phoneLabel : t('common.soon')}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <div className="relative group">
                  <div className={`absolute inset-0 bg-slate-600/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity`}></div>
                  <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-2xl p-4 focus-within:border-blue-500/50 transition-all">
                    {isPhoneMode ? (
                      <>
                        <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                          <span className="text-lg">🇸🇦</span>
                          <ChevronDown className="w-4 h-4 text-white/40" />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={isLoading}
                          className="w-full bg-transparent outline-none px-3 text-white placeholder:text-white/20"
                          placeholder={t('login.placeholder.phone')}
                          required
                        />
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 text-white/40 mr-3" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className="w-full bg-transparent outline-none px-3 text-white placeholder:text-white/20"
                          placeholder={t('login.placeholder.email')}
                          required
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
                  <p className="text-red-400 text-xs text-center font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <div className="flex items-start gap-3 px-1 text-white/40">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  {isPhoneMode ? t('login.note.phone') : t('login.note.email')}
                </p>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className={`w-full relative group overflow-hidden py-4 rounded-2xl font-bold transition-all ${
                  isFormValid && !isLoading
                    ? "bg-slate-600 hover:bg-slate-500 text-white shadow-xl shadow-blue-600/20"
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
                      <ArrowLeft className={`w-4 h-4 ${language === 'en' ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform"></div>
              </button>
            </form>
        </div>

        {/* Footer Info */}

      </div>
    </div>
  );
}
