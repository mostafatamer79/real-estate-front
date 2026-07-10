// app/complete-profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, User, Shield, MapPin, ArrowRight, CheckCircle2, Building2, Globe } from 'lucide-react';
import { Role } from '@/types/user';

import { useLanguage } from '@/context/LanguageContext';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, isAuthenticated, updateUser } = useAuth();
  const { t, language } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: Role.USER,
    licenseNumber: '',
    address: '',
    city: 'الرياض',
    country: 'السعودية',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || Role.USER,
        licenseNumber: user.agentLicenseNumber || user.lawLicenseNumber || user.falLicenseNumber || '',
        address: user.address || '',
        city: user.city || 'الرياض',
        country: user.country || 'السعودية',
      });
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrors({ general: t('profile.error.names') });
      setIsSaving(false);
      return;
    }

    const rolesWithLicense = [Role.AGENT, Role.BROKER, Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT];
    if (rolesWithLicense.includes(formData.role) && !formData.licenseNumber.trim()) {
      setErrors({ licenseNumber: t('profile.error.license') });
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          agentLicenseNumber: formData.role === Role.AGENT || formData.role === Role.BROKER ? formData.licenseNumber : undefined,
          lawLicenseNumber: [Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT].includes(formData.role) ? formData.licenseNumber : undefined,
          falLicenseNumber: formData.role === Role.BROKER ? formData.licenseNumber : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تحديث الملف الشخصي');
      }

      updateUser(data);
      router.push('/details');

    } catch (err: any) {
      console.error('Update error:', err);
      setErrors({ general: err.message || 'فشل تحديث الملف الشخصي' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
            <div className="absolute inset-0 bg-slate-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 relative overflow-hidden font-sans" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-slate-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-6 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowRight className={`w-5 h-5 transition-transform ${language === 'en' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            <span className="font-medium">{t('profile.backHome')}</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-start">
            {/* Left Column: Title & Info */}
            <div className="lg:col-span-4 space-y-6">
                <div>
                    <h1 className="text-3xl md:text-2xl sm:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        {t('profile.complete.title')}
                    </h1>
                    <p className="text-slate-400 leading-relaxed">
                        {t('profile.complete.desc')}
                    </p>
                </div>
                
                <div className="slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-3 sm:p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-slate-500/10 rounded-xl text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{t('profile.digitalId')}</h3>
                            <p className="text-sm text-slate-400 mt-1">{t('profile.digitalIdDesc')}</p>
                        </div>
                    </div>
                    <div className="w-full h-px bg-slate-800"></div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">{t('profile.trusted')}</h3>
                            <p className="text-sm text-slate-400 mt-1">{t('profile.trustedDesc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-8">
                <div className="slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-4 sm:p-8 shadow-2xl relative overflow-hidden">
                     {/* Glass effect highlight */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                           {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Info Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <User className="w-5 h-5 text-blue-400" />
                                {t('profile.personalInfo')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('login.placeholder.firstName') || "First Name"}</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-600"
                                        placeholder={t('login.placeholder.firstName')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('login.placeholder.lastName') || "Last Name"}</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-600"
                                        placeholder={t('login.placeholder.lastName')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                {t('profile.accountType')}
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.USER ? 'bg-slate-600/10 border-blue-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.USER}
                                            checked={formData.role === Role.USER}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.USER ? 'border-blue-500' : 'border-slate-500'}`}>
                                                {formData.role === Role.USER && <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.USER ? 'text-blue-400' : 'text-slate-400'}`}>{t('profile.role.user')}</span>
                                        </div>
                                    </label>

                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${[Role.AGENT, Role.BROKER].includes(formData.role) ? 'bg-purple-600/10 border-purple-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.BROKER}
                                            checked={formData.role === Role.BROKER || formData.role === Role.AGENT}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${[Role.AGENT, Role.BROKER].includes(formData.role) ? 'border-purple-500' : 'border-slate-500'}`}>
                                                 {[Role.AGENT, Role.BROKER].includes(formData.role) && <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>}
                                            </div>
                                            <span className={`font-medium ${[Role.AGENT, Role.BROKER].includes(formData.role) ? 'text-purple-400' : 'text-slate-400'}`}>{t('profile.role.broker')}</span>
                                        </div>
                                    </label>

                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.LAWYER ? 'bg-amber-600/10 border-amber-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.LAWYER}
                                            checked={formData.role === Role.LAWYER}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.LAWYER ? 'border-amber-500' : 'border-slate-500'}`}>
                                                 {formData.role === Role.LAWYER && <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.LAWYER ? 'text-amber-400' : 'text-slate-400'}`}>{t('profile.role.lawyer')}</span>
                                        </div>
                                    </label>

                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.NOTARY ? 'bg-emerald-600/10 border-emerald-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.NOTARY}
                                            checked={formData.role === Role.NOTARY}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.NOTARY ? 'border-emerald-500' : 'border-slate-500'}`}>
                                                 {formData.role === Role.NOTARY && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.NOTARY ? 'text-emerald-400' : 'text-slate-400'}`}>{t('profile.role.notary')}</span>
                                        </div>
                                    </label>

                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.LEGAL_CONSULTANT ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.LEGAL_CONSULTANT}
                                            checked={formData.role === Role.LEGAL_CONSULTANT}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.LEGAL_CONSULTANT ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                 {formData.role === Role.LEGAL_CONSULTANT && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.LEGAL_CONSULTANT ? 'text-indigo-400' : 'text-slate-400'}`}>{t('profile.role.legal_consultant')}</span>
                                        </div>
                                    </label>
                                </div>

                                {([Role.AGENT, Role.BROKER, Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT].includes(formData.role)) && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-slate-300 mb-2 block">{t('profile.license.num')}</label>
                                        <input
                                            type="text"
                                            name="licenseNumber"
                                            value={formData.licenseNumber}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder:text-slate-600"
                                            placeholder={t('profile.license.num')}
                                        />
                                         {errors.licenseNumber && <p className="text-red-500 text-xs mt-1">{errors.licenseNumber}</p>}
                                         <p className="text-xs text-purple-400/80 mt-2 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {t('profile.verifyDocs')}
                                         </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="space-y-4">
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <MapPin className="w-5 h-5 text-emerald-400" />
                                {t('profile.location')}
                            </h2>
                            <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">{t('profile.address')}</label>
                                    <div className="relative">
                                        <Building2 className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-600"
                                            placeholder={t('profile.addressPlaceholder')}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('city.name')}</label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                        >
                                            {['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'taif', 'abha', 'hail', 'other'].map(c => (
                                                <option key={c} value={t(`city.${c}`)} className="slate-900">{t(`city.${c}`)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">{t('country.name')}</label>
                                        <div className="relative">
                                             <Globe className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                            >
                                                {['sa', 'uae', 'kw', 'qa', 'om', 'bh'].map(c => (
                                                    <option key={c} value={t(`country.${c}`)} className="slate-900">{t(`country.${c}`)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex h-full w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-sm font-bold text-white transition-all group-hover:bg-transparent group-hover:from-blue-600/90 group-hover:to-blue-500/90">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('profile.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {t('profile.saveChanges')}
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}