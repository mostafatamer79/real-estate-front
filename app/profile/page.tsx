"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Loader2,
  MapPin,
  FileText,
  Building2,
  Upload,
  ShieldCheck,
  Camera,
  ArrowRight,
  ArrowLeft,
  LogOut,
  Mail,
  Phone,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Role, User as UserType } from '@/types/user';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';
import { useLanguage } from "@/context/LanguageContext";
import { getLicenseState, LICENSE_LABELS } from '@/lib/license-state';
import NafathVerification from '@/components/profile/NafathVerification';
import { ProfileCompletionError, profileUpdatePlan, profileRoleAction } from '@/lib/profile-onboarding';
import { safeHttpUrl } from '@/lib/safe-url';
import { loginHref } from '@/lib/auth-navigation';
import styles from './profile.module.css';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'profile.nameRequired'),
  lastName: z.string().optional(),
  role: z.nativeEnum(Role),

  // Conditional fields
  roleOtherDescription: z.string().optional(),

  // Broker / Office
  brokerType: z.enum(['individual', 'office']).optional(),
  falLicenseNumber: z.string().optional(),
  falLicenseExpiry: z.string().optional(), // Date string YYYY-MM-DD
  licenseIssueDate: z.string().optional(),
  commercialRegistrationNumber: z.string().optional(),
  lawLicenseNumber: z.string().optional(),

  // National Address
  city: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

function dateInputValue(value: string | undefined) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

export default function ProfilePage() {
  const { user, updateUser, logout, needsProfileCompletion, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t: translate, language, toggleLanguage } = useLanguage();
  const isAr = language === 'ar';
  const localCopy: Record<string, readonly [string, string]> = {
    'profile.brokerType.label': ['نوع الوساطة', 'Broker type'],
    'profile.brokerType.individual': ['فرد', 'Individual'],
    'profile.brokerType.office': ['مكتب', 'Office'],
    'profile.license.issueDate': ['تاريخ إصدار الرخصة', 'License issue date'],
    'profile.nationalId': ['رقم الهوية', 'National ID'],
    'profile.upload.image': ['تحديث الصورة الشخصية', 'Update profile photo'],
  };
  const t = (key: string) => {
    const value = translate(key);
    return value === key ? localCopy[key]?.[isAr ? 0 : 1] || value : value;
  };
  const [verificationOpen, setVerificationOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const sync = () => setVerificationOpen(desktop.matches);
    sync(); desktop.addEventListener('change', sync);
    return () => desktop.removeEventListener('change', sync);
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [operationError, setOperationError] = useState('');
  const [brokenAvatar, setBrokenAvatar] = useState<string | null>(null);
  const mounted = useRef(true);
  const requests = useRef(new Set<AbortController>());
  useEffect(() => {
    mounted.current = true;
    const active = requests.current;
    return () => { mounted.current = false; active.forEach(controller => controller.abort()); active.clear(); };
  }, []);
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) router.replace(loginHref('/profile'));
  }, [authLoading, isAuthenticated, user, router]);
  const beginOperation = () => {
    if (requests.current.size) return null;
    const controller = new AbortController();
    requests.current.add(controller);
    setOperationError('');
    return controller;
  };
  const readUpdatedUser = (data: unknown): UserType => {
    const wrapped = data as { data?: unknown } | null;
    const profile = (wrapped?.data || data) as UserType | null;
    if (!profile || profile.id !== user?.id || typeof profile.role !== 'string') throw new Error(isAr ? 'لم تصل بيانات حساب صالحة من الخادم.' : 'The server did not return valid account details.');
    return profile;
  };

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: Role.USER,
      city: '',
      country: 'saudi',
      brokerType: 'individual',
    },
  });

  const selectedRole = watch('role');
  const selectedBrokerType = watch('brokerType');

  const hasLicenseRole = [
    Role.AGENT,
    Role.BROKER,
    Role.REAL_ESTATE_OFFICE,
    Role.LAWYER,
    Role.NOTARY,
    Role.LEGAL_CONSULTANT,
  ].includes(selectedRole as Role);

  const roleAction = profileRoleAction(user?.role || Role.USER, selectedRole || Role.USER);
  const hasUnsavedChanges = Object.keys(dirtyFields).length > 0;
  const isServiceProviderRole = [
    Role.LAWYER,
    Role.NOTARY,
    Role.LEGAL_CONSULTANT,
    Role.ENGINEERING_OFFICE,
    Role.OTHER,
  ].includes(selectedRole as Role);

  // Sync user data to form
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.requestedRole || user.role || Role.USER,
        roleOtherDescription: user.roleOtherDescription || '',

        brokerType: user.role === Role.REAL_ESTATE_OFFICE ? 'office' : user.brokerType || 'individual',
        falLicenseNumber: user.falLicenseNumber || user.agentLicenseNumber || '',
        falLicenseExpiry: dateInputValue(user.falLicenseExpiry),
        licenseIssueDate: dateInputValue(user.licenseIssueDate),
        lawLicenseNumber: user.lawLicenseNumber || '',
        commercialRegistrationNumber: user.commercialRegistrationNumber || '',

        city: user.city || '',
        country: user.country || 'saudi',
      }, { keepDirtyValues: true });
    }
  }, [user, reset]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'license') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    const types = kind === 'avatar' ? ['image/jpeg', 'image/png', 'image/webp'] : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!types.includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      setOperationError(isAr ? 'اختر ملفاً من الأنواع الموضحة بحجم أكبر من صفر وأقصى 5 ميجابايت.' : 'Choose one of the listed file types, larger than zero and up to 5 MB.');
      return;
    }
    const controller = beginOperation();
    if (!controller) return;
    const setUploading = kind === 'avatar' ? setIsUploadingAvatar : setIsUploadingLicense;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<ApiResponse<{ url: string }>>('/user/upload', formData, { signal: controller.signal, headers: { 'Content-Type': 'multipart/form-data' } });
      const data = response.data as { data?: { url?: string }; url?: string };
      const url = data?.data?.url || data?.url;
      if (typeof url !== 'string' || !safeHttpUrl(url)) throw new Error(isAr ? 'تعذر قراءة رابط الملف المرفوع.' : 'The upload did not return a valid file URL.');
      const key = kind === 'avatar' ? 'profileImage' : 'licenseDocument';
      const saved = await api.put('/user/profile', { [key]: url }, { signal: controller.signal });
      const updated = readUpdatedUser(saved.data);
      if (controller.signal.aborted || !mounted.current) return;
      updateUser(updated);
      toast({ title: t('common.success'), description: kind === 'license' ? (isAr ? 'تم حفظ ملف الرخصة. تظهر حالة المراجعة في حسابك.' : 'The license file was saved. Its review status is shown on your account.') : (isAr ? 'تم تحديث الصورة الشخصية.' : 'Profile photo updated.') });
    } catch (error: unknown) {
      if (!controller.signal.aborted && mounted.current) {
        const failure = error as { response?: { data?: { message?: string } }; message?: string };
        setOperationError(failure.response?.data?.message || failure.message || (isAr ? 'تعذر رفع الملف. حاول مرة أخرى.' : 'Could not upload the file. Try again.'));
      }
    } finally {
      requests.current.delete(controller);
      if (mounted.current) setUploading(false);
    }
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => upload(e, 'avatar');
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => upload(e, 'license');

  // Truthful Back / Sign-out logic
  const handleBack = () => {
    if (needsProfileCompletion) {
      logout();
    } else {
      router.push('/details');
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    const controller = beginOperation();
    if (!controller) return;
    setIsSaving(true);
    let basicSaved = false;
    try {
      const plan = profileUpdatePlan(user.role || Role.USER, data);
      const saved = await api.put('/user/profile', plan.profile, { signal: controller.signal });
      let updated = readUpdatedUser(saved.data);
      basicSaved = true;
      if (plan.application) {
        const application = await api.post('/user/profile/license-application', plan.application, { signal: controller.signal });
        updated = readUpdatedUser(application.data);
      }
      if (controller.signal.aborted || !mounted.current) return;
      updateUser(updated);
      toast({
        title: t('common.success'),
        description: plan.application
          ? (isAr ? 'تم إرسال طلب الرخصة للمراجعة. سيبقى نوع حسابك الحالي حتى الاعتماد.' : 'Your license application was submitted for review. Your current account type stays active until approval.')
          : t('wallet.saveSuccess'),
      });
      router.push('/details');
    } catch (error: unknown) {
      if (controller.signal.aborted || !mounted.current) return;
      if (error instanceof ProfileCompletionError) {
        setOperationError(error.code === 'role_requires_contact'
          ? (isAr ? 'يتطلب هذا النوع من الحسابات التواصل مع الإدارة.' : 'This account type requires contacting the administration.')
          : error.code === 'license_required'
            ? (isAr ? 'أدخل رقم رخصة فال قبل إرسال الطلب.' : 'Enter a FAL license number before submitting the application.')
            : t('profile.nameRequired'));
      } else {
        const failure = error as { response?: { data?: { message?: string | string[] } }; message?: string };
        const raw = failure.response?.data?.message || failure.message;
        const message = Array.isArray(raw) ? raw.join('، ') : raw || (isAr ? 'تعذر حفظ البيانات.' : 'Could not save your details.');
        setOperationError(basicSaved && roleAction === 'apply'
          ? (isAr ? 'تم حفظ بياناتك الأساسية، لكن تعذر إرسال طلب الاعتماد. أعد المحاولة: ' : 'Your basic details were saved, but the application could not be submitted. Try again: ') + message
          : message);
      }
    } finally {
      requests.current.delete(controller);
      if (mounted.current) setIsSaving(false);
    }
  };

  // Initials badge calculation (for authentic identity display without decorative stock images)
  const userInitials = useMemo(() => {
    const first = (user?.firstName || '').trim();
    const last = (user?.lastName || '').trim();
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    if (first) {
      return first.slice(0, 2).toUpperCase();
    }
    return '—';
  }, [user?.firstName, user?.lastName]);

  // License state calculation
  const licenseState = getLicenseState(user || {});
  const licenseLabel = LICENSE_LABELS[licenseState][isAr ? 'ar' : 'en'];

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className={styles.page} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--pf-gold)] mb-4" />
          <p className="text-sm font-medium text-[var(--pf-text-muted)]">
            {isAr ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  const roleDisplayTitle = (() => {
    switch (user.role) {
      case Role.BROKER:
        return t('profile.role.broker');
      case Role.REAL_ESTATE_OFFICE:
        return t('profile.role.office');
      case Role.OWNER:
        return t('profile.role.owner');
      case Role.AGENT:
        return isAr ? 'وكيل عقاري' : 'Real estate agent';
      case Role.LAWYER:
        return t('profile.role.lawyer');
      case Role.NOTARY:
        return t('profile.role.notary');
      case Role.LEGAL_CONSULTANT:
        return t('profile.role.legal_consultant');
      case Role.ENGINEERING_OFFICE:
        return t('profile.role.eng');
      case Role.USER:
        return t('profile.role.user');
      case Role.ADMIN:
        return t('profile.role.admin');
      case Role.OTHER:
        return user.roleOtherDescription || t('profile.role.other');
      default:
        return user.role;
    }
  })();

  return (
    <div className={styles.page} dir={isAr ? 'rtl' : 'ltr'}>
      <div className={styles.architecturalBackdrop} aria-hidden="true" />

      <div className={styles.container}>
        {/* Static In-Page Navigation Bar */}
        <nav className={styles.staticNav} aria-label={isAr ? 'التنقل الداخلي' : 'In-page navigation'}>
          <div className={styles.navBreadcrumb}>
            <span className={styles.breadcrumbSegment}>{isAr ? 'لوحة المتابعة' : 'Dashboard'}</span>
            <span aria-hidden="true">/</span>
            <span className={styles.breadcrumbCurrent}>{t('profile.title')}</span>
          </div>

          <button type="button" className={`${styles.backButton} ${styles.mobileLanguage}`} onClick={toggleLanguage} aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}>{isAr ? 'English' : 'العربية'}</button>
          <button
            type="button"
            onClick={handleBack}
            className={`${styles.backButton} ${needsProfileCompletion ? styles.backButtonSignOut : ''}`}
            aria-label={
              needsProfileCompletion
                ? isAr
                  ? 'تسجيل الخروج من الحساب'
                  : 'Sign out of account'
                : isAr
                  ? 'العودة إلى لوحة المتابعة والتفاصيل'
                  : 'Return to dashboard and details'
            }
          >
            {needsProfileCompletion ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
              </>
            ) : (
              <>
                {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                <span>{t('profile.back')}</span>
              </>
            )}
          </button>
        </nav>

        {/* Editorial Page Header */}
        <header className={styles.editorialHeader}>
          <div className={styles.headerEyebrow}>
            <IdCard className="w-4 h-4" />
            <span>{isAr ? 'الملف الشخصي والاعتماد' : 'Account & Verification'}</span>
          </div>
          <h1 className={styles.pageTitle}>{t('profile.title')}</h1>
          <p className={styles.pageDescription}>
            {isAr
              ? 'حدّث بيانات حسابك وصورتك، وتابع حالة توثيق الهوية والرخصة.'
              : 'Update your account and photo, and check your identity and license status.'}
          </p>
        </header>

        {/* Main Responsive Grid Layout */}
        <div className={styles.profileLayout}>
          {/* Left Column: Identity & Verification Dossier */}
          <aside className={styles.identityDossier} aria-label={isAr ? 'ملف الهوية والتحقق' : 'Identity dossier'}>
            <div className={styles.dossierCard}>
              {/* User Avatar & Monogram */}
              <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper}>
                  {safeHttpUrl(user.profileImage) && brokenAvatar !== user.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.profileImage!}
                      onError={() => setBrokenAvatar(user.profileImage || null)}
                      alt={user.firstName || 'User'}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <div className={styles.initialsBadge} aria-label={`${user.firstName} ${user.lastName}`}>
                      {userInitials}
                    </div>
                  )}

                  <label
                    htmlFor="profile-avatar-upload"
                    className={styles.avatarUploadTrigger}
                    title={t('profile.upload.image')}
                    aria-label={t('profile.upload.image')}
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--pf-gold)]" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                    <input
                      id="profile-avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={styles.visuallyHiddenInput}
                      onChange={handleImageUpload}
                      disabled={isUploadingAvatar || isUploadingLicense || isSaving}
                    />
                  </label>
                </div>

                <h2 className={styles.userName}>
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || (isAr ? 'مستخدم المنصة' : 'Platform User')}
                </h2>

                <p className={styles.userContact}>
                  {user.email || user.phone || '—'}
                </p>

                <div className={styles.roleChip}>
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{roleDisplayTitle}</span>
                </div>
              </div>

              <details className={styles.verificationDetails} open={verificationOpen} onToggle={(event) => setVerificationOpen(event.currentTarget.open)}>
                <summary>{isAr ? 'توثيق الهوية والرخصة' : 'Identity & license verification'} <span aria-hidden="true">{verificationOpen ? '−' : '+'}</span></summary>
              {/* Nafath Verification Block */}
              <div className={styles.dossierSection}>
                <div className={styles.sectionHeading}>
                  <h3 className={styles.sectionHeadingTitle}>
                    <ShieldCheck className="w-4 h-4 text-[var(--pf-gold)]" />
                    <span>{isAr ? 'توثيق نفاذ الوطني' : 'Nafath Identity Verification'}</span>
                  </h3>
                </div>

                <NafathVerification
                  userId={user.id}
                  verifiedAt={user.nafathVerifiedAt}
                  onVerified={updateUser}
                />

                {user.nafathVerifiedAt && user.nationalId && (
                  <div className={styles.nationalIdBox}>
                    <span className={styles.nationalIdLabel}>{t('profile.nationalId')}</span>
                    <span dir="ltr" className={styles.nationalIdValue}>
                      {'••••••' + user.nationalId.slice(-4)}
                    </span>
                  </div>
                )}
              </div>

              {/* License Status Block */}
              {hasLicenseRole && (
                <div className={styles.dossierSection}>
                  <div className={styles.sectionHeading}>
                    <h3 className={styles.sectionHeadingTitle}>
                      <FileText className="w-4 h-4 text-[var(--pf-gold)]" />
                      <span>{[Role.AGENT, Role.BROKER, Role.REAL_ESTATE_OFFICE].includes(selectedRole as Role) ? (isAr ? 'حالة رخصة فال' : 'FAL license status') : (isAr ? 'حالة الرخصة المهنية' : 'Professional license status')}</span>
                    </h3>
                  </div>

                  <div
                    className={`${styles.licenseStatusPanel} ${
                      licenseState === 'verified'
                        ? styles.licenseStatusVerified
                        : licenseState === 'pending'
                        ? styles.licenseStatusPending
                        : ['rejected', 'expired'].includes(licenseState)
                        ? styles.licenseStatusRejected
                        : styles.licenseStatusMissing
                    }`}
                  >
                    <div className={styles.licenseStatusHeader}>
                      <span>{isAr ? 'الوضع الحالي للرخصة' : 'Current Status'}</span>
                      <span className="font-bold">{licenseLabel}</span>
                    </div>

                    {user.agentVerificationStatus === 'rejected' && (
                      <p className={styles.licenseStatusNote}>
                        {isAr
                          ? 'الرخصة المدخلة غير معتمدة أو لم تطابق السجلات الرسمية. يرجى إعادة التحقق من الرقم والمستند.'
                          : 'The submitted license was not approved. Please verify the license number and documentation.'}
                      </p>
                    )}

                    {licenseState === 'pending' && (
                      <p className={styles.licenseStatusNote}>
                        {isAr
                          ? 'طلب الرخصة قيد مراجعة الإدارة.'
                          : 'The license application is under review by the administration.'}
                      </p>
                    )}
                  </div>

                  {/* License Document Upload */}
                  <div className={styles.licenseUploadContainer}>
                    <label
                      htmlFor="profile-license-upload"
                      className={styles.uploadDropArea}
                    >
                      <div className={styles.uploadDropIcon}>
                        {isUploadingLicense ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <span className={styles.uploadDropText}>
                        {user.licenseDocument
                          ? isAr
                            ? 'استبدال وثيقة الرخصة'
                            : 'Replace license document'
                          : isAr
                            ? 'إرفاق صورة أو وثيقة الرخصة'
                            : 'Attach license document'}
                      </span>
                      <span className={styles.uploadDropHint}>JPG, PNG, WEBP, PDF · 5 MB</span>
                      <input
                        id="profile-license-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className={styles.visuallyHiddenInput}
                        disabled={isUploadingAvatar || isUploadingLicense || isSaving}
                        onChange={handleLicenseUpload}
                      />
                    </label>

                    {user.licenseDocument && (
                      <div className={styles.licensePreviewBox}>
                        {user.licenseDocument.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-8 h-8 text-[var(--pf-gold)]" />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={user.licenseDocument}
                            alt={isAr ? 'صورة الرخصة' : 'License preview'}
                            className={styles.licenseThumb}
                          />
                        )}
                        <div className="flex flex-col text-start overflow-hidden">
                          <span className="text-xs font-bold text-[var(--pf-text)] truncate">
                            {isAr ? 'وثيقة الرخصة المرفقة' : 'Submitted License File'}
                          </span>
                          <span className="text-[11px] text-[var(--pf-text-muted)]">
                            {licenseLabel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </details>
            </div>
          </aside>

          {/* Right Column: Editable Account Details Form */}
          <section className={styles.formContainer} aria-label={isAr ? 'بيانات الحساب' : 'Account form'}>
            {operationError && <div role="alert" className={styles.operationError}>{operationError}</div>}
            {roleAction === 'apply' && <p className={styles.operationHint}>{isAr ? 'سيُرسل طلب اعتماد. سيبقى نوع حسابك الحالي حتى الموافقة.' : 'An application will be submitted. Your current account type stays active until approval.'}</p>}
            {roleAction === 'contact' && <p className={styles.operationHint}>{isAr ? 'هذا النوع من الحسابات يحتاج التواصل مع الإدارة.' : 'This account type requires contacting the administration.'} <Link href="/customerservice/support">{isAr ? 'التواصل مع الدعم' : 'Contact support'}</Link></p>}
            <p className={styles.operationHint} role="status">{hasUnsavedChanges ? (isAr ? 'لديك تغييرات لم تُحفظ بعد.' : 'You have unsaved changes.') : ''}</p>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Chapter 01: Personal & Role Details */}
              <div className={styles.ruledChapter}>
                <div className={styles.chapterTitleBar}>
                  <span className={styles.chapterIndex}>01</span>
                  <h3 className={styles.chapterHeading}>{t('profile.accountInfo')}</h3>
                </div>

                <div className={styles.fieldsGrid}>
                  <div className={`${styles.fieldsGrid} ${styles.fieldsGridTwo}`}>
                    {/* First Name (Required Contract) */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-first-name" className={styles.fieldLabel}>
                        <span>{t('profile.nameLabel')}</span>
                        <span className={styles.requiredStar}>*</span>
                      </label>
                      <input
                        id="profile-first-name"
                        type="text"
                        {...register('firstName')}
                        className={`${styles.textInput} ${errors.firstName ? styles.textInputError : ''}`}
                        aria-invalid={errors.firstName ? 'true' : 'false'}
                        aria-describedby={errors.firstName ? 'first-name-error' : undefined}
                      />
                      {errors.firstName && (
                        <span id="first-name-error" className={styles.fieldErrorText}>
                          {t(errors.firstName.message || 'profile.nameRequired')}
                        </span>
                      )}
                    </div>

                    {/* Last Name (Optional Contract) */}
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-last-name" className={styles.fieldLabel}>
                        <span>{isAr ? 'اسم العائلة' : 'Last name'}</span>
                        <span className={styles.optionalLabel}>{isAr ? '(اختياري)' : '(optional)'}</span>
                      </label>
                      <input
                        id="profile-last-name"
                        type="text"
                        {...register('lastName')}
                        className={styles.textInput}
                      />
                    </div>
                  </div>

                  {/* Primary Role Selector */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="profile-role" className={styles.fieldLabel}>
                      <span>{t('profile.roleLabel')}</span>
                      <span className={styles.requiredStar}>*</span>
                    </label>
                    <select
                      id="profile-role"
                      value={
                        [
                          Role.LAWYER,
                          Role.NOTARY,
                          Role.LEGAL_CONSULTANT,
                          Role.ENGINEERING_OFFICE,
                          Role.OTHER,
                        ].includes(selectedRole as Role)
                          ? 'service_provider'
                          : selectedRole
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'service_provider') {
                          if (
                            ![
                              Role.LAWYER,
                              Role.NOTARY,
                              Role.LEGAL_CONSULTANT,
                              Role.ENGINEERING_OFFICE,
                              Role.OTHER,
                            ].includes(selectedRole as Role)
                          ) {
                            setValue('role', Role.LAWYER, { shouldDirty: true });
                          }
                        } else {
                          setValue('role', val as Role, { shouldDirty: true });
                        }
                      }}
                      className={styles.selectInput}
                    >
                      <option value={Role.USER}>{t('profile.role.user')}</option>
                      <option value={Role.OWNER}>{t('profile.role.owner')}</option>
                      <option value={Role.AGENT}>{isAr ? 'وكيل عقاري' : 'Real estate agent'}</option>
                      <option value={Role.BROKER}>{t('profile.role.broker')}</option>
                      <option value="service_provider">{t('profile.role.serviceProvider')}</option>
                      {selectedRole && ![Role.USER, Role.OWNER, Role.AGENT, Role.BROKER, Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT, Role.ENGINEERING_OFFICE, Role.OTHER].includes(selectedRole) && <option value={selectedRole}>{selectedRole === Role.REAL_ESTATE_OFFICE ? t('profile.role.office') : selectedRole}</option>}
                    </select>
                  </div>

                  {/* Service Provider Specialized Sub-role Selector */}
                  {isServiceProviderRole && (
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-subrole" className={styles.fieldLabel}>
                        <span>{t('profile.activityType')}</span>
                        <span className={styles.requiredStar}>*</span>
                      </label>
                      <select
                        id="profile-subrole"
                        value={selectedRole}
                        onChange={(e) =>
                          setValue('role', e.target.value as Role, { shouldDirty: true })
                        }
                        className={styles.selectInput}
                      >
                        <option value={Role.LAWYER}>{t('profile.role.lawyer')}</option>
                        <option value={Role.NOTARY}>{t('profile.role.notary')}</option>
                        <option value={Role.LEGAL_CONSULTANT}>{t('profile.role.legal_consultant')}</option>
                        <option value={Role.ENGINEERING_OFFICE}>{t('profile.role.eng')}</option>
                        <option value={Role.OTHER}>{t('profile.role.other')}</option>
                      </select>
                    </div>
                  )}

                  {/* Other Activity Free-text Description */}
                  {selectedRole === Role.OTHER && (
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-other-description" className={styles.fieldLabel}>
                        <span>{t('profile.activityType')}</span>
                      </label>
                      <input
                        id="profile-other-description"
                        type="text"
                        {...register('roleOtherDescription')}
                        placeholder={t('profile.activityPlaceholder')}
                        className={styles.textInput}
                      />
                    </div>
                  )}

                  {/* Informational Guidance for Service Providers */}
                  {isServiceProviderRole && (
                    <div className={styles.editorialNotice}>
                      <ShieldCheck className={styles.editorialNoticeIcon} />
                      <p className={styles.editorialNoticeText}>
                        {t('profile.pendingAdminApproval')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chapter 02: Professional Licensing & Registrations */}
              {hasLicenseRole && (
                <div className={styles.ruledChapter}>
                  <div className={styles.chapterTitleBar}>
                    <span className={styles.chapterIndex}>02</span>
                    <h3 className={styles.chapterHeading}>
                      {isAr ? 'الترخيص المهني والسجل التجاري' : 'Professional Licensing & Registration'}
                    </h3>
                  </div>

                  <div className={styles.fieldsGrid}>
                    {/* Individual vs Office Toggle */}
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <Building2 className="w-4 h-4 text-[var(--pf-gold)]" />
                        <span>{t('profile.brokerType.label')}</span>
                      </label>
                      <RadioGroup
                        defaultValue={selectedBrokerType}
                        value={selectedBrokerType}
                        onValueChange={(val) => {
                          setValue('brokerType', val as 'individual' | 'office', { shouldDirty: true });
                          setValue('role', val === 'office' ? Role.REAL_ESTATE_OFFICE : Role.BROKER, {
                            shouldDirty: true,
                          });
                        }}
                        className={styles.radioOptionsRow}
                      >
                        <label
                          htmlFor="broker-individual"
                          className={`${styles.radioOptionCard} ${
                            selectedBrokerType === 'individual' ? styles.radioOptionSelected : ''
                          }`}
                        >
                          <RadioGroupItem value="individual" id="broker-individual" />
                          <Label htmlFor="broker-individual" className="cursor-pointer font-semibold">
                            {t('profile.brokerType.individual')}
                          </Label>
                        </label>

                        <label
                          htmlFor="broker-office"
                          className={`${styles.radioOptionCard} ${
                            selectedBrokerType === 'office' ? styles.radioOptionSelected : ''
                          }`}
                        >
                          <RadioGroupItem value="office" id="broker-office" />
                          <Label htmlFor="broker-office" className="cursor-pointer font-semibold">
                            {t('profile.brokerType.office')}
                          </Label>
                        </label>
                      </RadioGroup>
                    </div>

                    {/* License Input Fields */}
                    <div className={`${styles.fieldsGrid} ${styles.fieldsGridTwo}`}>
                      <div className={styles.fieldGroup}>
                        <label htmlFor="profile-fal-number" className={styles.fieldLabel}>
                          <span>{t('profile.license.falNum')}</span>
                          <span className={styles.requiredStar}>*</span>
                        </label>
                        <input
                          id="profile-fal-number"
                          type="text"
                          {...register('falLicenseNumber')}
                          className={styles.textInput}
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor="profile-issue-date" className={styles.fieldLabel}>
                          <span>{t('profile.license.issueDate')}</span>
                        </label>
                        <input
                          id="profile-issue-date"
                          type="date"
                          {...register('licenseIssueDate')}
                          className={styles.textInput}
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label htmlFor="profile-fal-expiry" className={styles.fieldLabel}>
                          <span>{t('profile.license.falExpiry')}</span>
                        </label>
                        <input
                          id="profile-fal-expiry"
                          type="date"
                          {...register('falLicenseExpiry')}
                          className={styles.textInput}
                        />
                      </div>

                      {selectedBrokerType === 'office' && (
                        <div className={styles.fieldGroup}>
                          <label htmlFor="profile-cr-number" className={styles.fieldLabel}>
                            <span>{t('profile.license.cr')}</span>
                            <span className={styles.requiredStar}>*</span>
                          </label>
                          <input
                            id="profile-cr-number"
                            type="text"
                            {...register('commercialRegistrationNumber')}
                            className={styles.textInput}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Legal & Notary Specific Fields */}
              {[Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT].includes(selectedRole as Role) && (
                <div className={styles.ruledChapter}>
                  <div className={styles.chapterTitleBar}>
                    <span className={styles.chapterIndex}>02</span>
                    <h3 className={styles.chapterHeading}>
                      {isAr ? 'بيانات رخصة المحاماة أو التوثيق' : 'Law License Details'}
                    </h3>
                  </div>

                  <div className={`${styles.fieldsGrid} ${styles.fieldsGridTwo}`}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-law-number" className={styles.fieldLabel}>
                        <span>{t('profile.license.num')}</span>
                      </label>
                      <input
                        id="profile-law-number"
                        type="text"
                        {...register('lawLicenseNumber')}
                        className={styles.textInput}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-law-issue-date" className={styles.fieldLabel}>
                        <span>{t('profile.license.issueDate')}</span>
                      </label>
                      <input
                        id="profile-law-issue-date"
                        type="date"
                        {...register('licenseIssueDate')}
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Engineering Office Specific Fields */}
              {selectedRole === Role.ENGINEERING_OFFICE && (
                <div className={styles.ruledChapter}>
                  <div className={styles.chapterTitleBar}>
                    <span className={styles.chapterIndex}>02</span>
                    <h3 className={styles.chapterHeading}>
                      {isAr ? 'بيانات السجل التجاري للمكتب الهندسي' : 'Engineering Office Registration'}
                    </h3>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="profile-eng-cr" className={styles.fieldLabel}>
                      <span>{t('profile.license.cr')}</span>
                    </label>
                    <input
                      id="profile-eng-cr"
                      type="text"
                      {...register('commercialRegistrationNumber')}
                      className={styles.textInput}
                    />
                  </div>
                </div>
              )}

              {/* Chapter 03: Contact Verification & National Address */}
              <div className={styles.ruledChapter}>
                <div className={styles.chapterTitleBar}>
                  <span className={styles.chapterIndex}>
                    {hasLicenseRole ||
                    [Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT, Role.ENGINEERING_OFFICE].includes(
                      selectedRole as Role
                    )
                      ? '03'
                      : '02'}
                  </span>
                  <h3 className={styles.chapterHeading}>
                    {isAr ? 'بيانات الاتصال والعنوان' : 'Contact & National Address'}
                  </h3>
                </div>

                <div className={styles.fieldsGrid}>
                  {/* Verified Read-Only Contact Records */}
                  <div className={`${styles.fieldsGrid} ${styles.fieldsGridTwo}`}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <Phone className="w-3.5 h-3.5 text-[var(--pf-text-muted)]" />
                        <span>{t('profile.mobile')}</span>
                      </label>
                      <div className={styles.readOnlyBox}>
                        <span>{user.phone || '—'}</span>
                      </div>
                      <span className={styles.fieldHintText}>
                        {isAr
                          ? 'رقم الجوال موثق عبر نظام الدخول الموحد.'
                          : 'Phone number associated with your account.'}
                      </span>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>
                        <Mail className="w-3.5 h-3.5 text-[var(--pf-text-muted)]" />
                        <span>{t('profile.email')}</span>
                      </label>
                      <div className={styles.readOnlyBox}>
                        <span>{user.email || '—'}</span>
                      </div>
                      <span className={styles.fieldHintText}>
                        {isAr
                          ? 'البريد الإلكتروني المرتبط بحسابك.'
                          : 'Email address associated with your account.'}
                      </span>
                    </div>
                  </div>

                  {/* National Address City */}
                  <div className={`${styles.fieldsGrid} ${styles.fieldsGridTwo}`}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="profile-city" className={styles.fieldLabel}>
                        <MapPin className="w-3.5 h-3.5 text-[var(--pf-gold)]" />
                        <span>{t('city.name')}</span>
                      </label>
                      <input
                        id="profile-city"
                        type="text"
                        {...register('city')}
                        placeholder={t('city.name')}
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className={styles.formActionsBar}>
                {selectedRole === Role.REAL_ESTATE_OFFICE ? (
                  <button
                    type="button"
                    className={styles.secondaryActionButton}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{t('profile.linkBrokers')}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  disabled={isUploadingAvatar || isUploadingLicense || isSaving}
                  className={styles.submitButton}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('profile.saving')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{t('profile.save')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
