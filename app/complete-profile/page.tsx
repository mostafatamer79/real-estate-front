// app/complete-profile/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types/user';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Briefcase,
  UserCheck,
  AlertCircle,
  Save,
} from 'lucide-react';
import styles from './complete-profile.module.css';
import { ProfileCompletionError, profileCompletionPlan, profileRoleAction } from '@/lib/profile-onboarding';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/api';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  role: Role;
  licenseNumber: string;
  roleOtherDescription: string;
  address: string;
  city: string;
  country: string;
}

const SERVICE_PROVIDER_ROLES: Role[] = [
  Role.LAWYER,
  Role.NOTARY,
  Role.LEGAL_CONSULTANT,
  Role.ENGINEERING_OFFICE,
  Role.OTHER,
];

const ROLES_WITH_LICENSE: Role[] = [
  Role.AGENT,
  Role.BROKER,
  Role.REAL_ESTATE_OFFICE,
  Role.LAWYER,
  Role.NOTARY,
  Role.LEGAL_CONSULTANT,
];

const CITIES: Array<{ key: string; ar: string; en: string }> = [
  { key: 'riyadh', ar: 'الرياض', en: 'Riyadh' },
  { key: 'jeddah', ar: 'جدة', en: 'Jeddah' },
  { key: 'dammam', ar: 'الدمام', en: 'Dammam' },
  { key: 'mecca', ar: 'مكة المكرمة', en: 'Mecca' },
  { key: 'medina', ar: 'المدينة المنورة', en: 'Medina' },
  { key: 'taif', ar: 'الطائف', en: 'Taif' },
  { key: 'abha', ar: 'أبها', en: 'Abha' },
  { key: 'hail', ar: 'حائل', en: 'Hail' },
  { key: 'other', ar: 'أخرى', en: 'Other' },
];

const COUNTRIES: Array<{ key: string; ar: string; en: string }> = [
  { key: 'sa', ar: 'السعودية', en: 'Saudi Arabia' },
  { key: 'uae', ar: 'الإمارات', en: 'UAE' },
  { key: 'kw', ar: 'الكويت', en: 'Kuwait' },
  { key: 'qa', ar: 'قطر', en: 'Qatar' },
  { key: 'om', ar: 'عمان', en: 'Oman' },
  { key: 'bh', ar: 'البحرين', en: 'Bahrain' },
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, isAuthenticated, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const saveRequest = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; saveRequest.current?.abort(); };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    role: Role.USER,
    licenseNumber: '',
    roleOtherDescription: '',
    address: '',
    city: 'الرياض',
    country: 'السعودية',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isRtl = language === 'ar';
  const isServiceProvider = SERVICE_PROVIDER_ROLES.includes(formData.role);
  const requiresLicense = ROLES_WITH_LICENSE.includes(formData.role);
  const roleAction = profileRoleAction(user?.role || Role.USER, formData.role);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      router.replace('/login?next=%2Fcomplete-profile');
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || Role.USER,
        licenseNumber: user.agentLicenseNumber || user.lawLicenseNumber || user.falLicenseNumber || '',
        roleOtherDescription: user.roleOtherDescription || '',
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
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleSelectRole = (newRole: Role) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    if (errors.licenseNumber && !ROLES_WITH_LICENSE.includes(newRole)) {
      setErrors(prev => ({ ...prev, licenseNumber: '' }));
    }
  };

  const handleSelectServiceProviderGroup = () => {
    if (!isServiceProvider) {
      setFormData(prev => ({ ...prev, role: Role.LAWYER }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveRequest.current || !user || !token) return;
    setErrors({});
    let basicSaved = false;
    const controller = new AbortController();
    try {
      const plan = profileCompletionPlan(user.role || Role.USER, formData);
      saveRequest.current = controller;
      setIsSaving(true);
      const request = async (path: string, method: string, body: unknown) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const response = await fetch(`${getApiUrl()}${cleanPath}`, {
          method,
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          const message = Array.isArray(json?.message) ? json.message.join('، ') : json?.message;
          throw new Error(typeof message === 'string' ? message : (isRtl ? 'تعذر حفظ البيانات. حاول مرة أخرى.' : 'Could not save your details. Try again.'));
        }
        const updated = json?.data || json;
        if (!updated || updated.id !== user.id || typeof updated.role !== 'string') {
          throw new Error(isRtl ? 'لم تصل بيانات حساب صالحة من الخادم. حاول مرة أخرى.' : 'The server did not return valid account details. Try again.');
        }
        return updated;
      };
      let updated = await request('/user/profile', 'PUT', plan.profile);
      basicSaved = true;
      if (plan.application) updated = await request('/user/profile/license-application', 'POST', plan.application);
      if (!mounted.current || controller.signal.aborted) return;
      updateUser(updated);
      if (plan.application) toast({
        title: isRtl ? 'تم إرسال طلب الاعتماد' : 'Application submitted',
        description: isRtl ? 'سيبقى نوع حسابك الحالي حتى مراجعة الطلب واعتماده.' : 'Your current account type stays active until the application is reviewed and approved.',
      });
      router.replace('/details');
    } catch (err: unknown) {
      if (!mounted.current || controller.signal.aborted) return;
      if (err instanceof ProfileCompletionError) {
        if (err.code === 'license_required') setErrors({ licenseNumber: isRtl ? 'أدخل رقم الرخصة المهنية.' : 'Enter your professional license number.' });
        else if (err.code === 'names_required') setErrors({ general: t('profile.error.names'), firstName: !formData.firstName.trim() ? t('profile.error.names') : '', lastName: !formData.lastName.trim() ? t('profile.error.names') : '' });
        else setErrors({ general: isRtl ? 'يتطلب تغيير نوع الحساب هذا التواصل مع الإدارة. بياناتك المدخلة ما زالت محفوظة في النموذج.' : 'This account type requires contacting the administration. Your entered details are still in the form.' });
        const name = err.code === 'license_required' ? 'licenseNumber' : err.code === 'names_required' ? (!formData.firstName.trim() ? 'firstName' : 'lastName') : 'role';
        document.querySelector<HTMLInputElement>(`[name="${name}"]`)?.focus();
      } else {
        const message = err instanceof Error ? err.message : (isRtl ? 'تعذر حفظ البيانات.' : 'Could not save your details.');
        setErrors({ general: basicSaved && roleAction === 'apply'
          ? (isRtl ? 'تم حفظ البيانات الأساسية، لكن تعذر إرسال طلب الاعتماد. أعد المحاولة: ' : 'Basic details were saved, but the application could not be submitted. Try again: ') + message
          : message });
      }
    } finally {
      saveRequest.current = null;
      if (mounted.current) setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className={styles.page} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={styles.loadingContainer} role="status" aria-live="polite">
          <div className={styles.pageSpinner} aria-hidden="true" />
          <p className={styles.loadingText}>
            {isRtl ? 'جارٍ تحميل بيانات الحساب…' : 'Loading account credentials…'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={styles.page} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={styles.architecturalGrid} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.editorialLayout}>
          {/* Column 1: Editorial Guidance & Orientation */}
          <aside className={styles.guidanceColumn} aria-label={isRtl ? 'معلومات التوجيه والاعتماد' : 'Guidance & Orientation'}>
            <Link href="/" className={styles.backLink}>
              {isRtl ? (
                <ArrowRight className={styles.backIcon} aria-hidden="true" />
              ) : (
                <ArrowLeft className={styles.backIcon} aria-hidden="true" />
              )}
              <span>{t('profile.backHome') || (isRtl ? 'العودة للرئيسية' : 'Back to Home')}</span>
            </Link>

            <div>
              <div className={styles.chapterKicker}>
                <span className={styles.kickerLine} aria-hidden="true" />
                <span>{isRtl ? 'بيانات الحساب' : 'Your account'}</span>
              </div>
              <h1 className={styles.heading}>
                {t('profile.complete.title') || (isRtl ? 'إكمال الملف الشخصي' : 'Complete Profile')}
              </h1>
            </div>

            <p className={styles.lead}>
              {isRtl ? 'أكمل بياناتك، وحدّد نوع الحساب المناسب لنشاطك.' : 'Complete your details and choose the account type that fits your activity.'}
            </p>

            <div className={styles.guidanceList}>
              <div className={styles.guidanceItem}>
                <div className={styles.guidanceIconBox} aria-hidden="true">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className={styles.guidanceContent}>
                  <h2 className={styles.guidanceTitle}>
                    {(isRtl ? 'بياناتك الشخصية' : 'Personal details')}
                  </h2>
                  <p className={styles.guidanceText}>
                    {(isRtl ? 'أدخل اسمك كما تريد أن يظهر في حسابك.' : 'Enter your name as you want it to appear on your account.')}
                  </p>
                </div>
              </div>

              <div className={styles.guidanceItem}>
                <div className={styles.guidanceIconBox} aria-hidden="true">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className={styles.guidanceContent}>
                  <h2 className={styles.guidanceTitle}>
                    {isRtl ? 'نوع الحساب' : 'Account type'}
                  </h2>
                  <p className={styles.guidanceText}>
                    {isRtl
                      ? 'اختر نوع الحساب، وستظهر حقول الترخيص إذا كانت مطلوبة.'
                      : 'Choose an account type to see its required license fields.'}
                  </p>
                </div>
              </div>

              <div className={styles.guidanceItem}>
                <div className={styles.guidanceIconBox} aria-hidden="true">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className={styles.guidanceContent}>
                  <h2 className={styles.guidanceTitle}>
                    {(isRtl ? 'الترخيص المهني' : 'Professional license')}
                  </h2>
                  <p className={styles.guidanceText}>
                    {(isRtl ? 'طلبات الوكلاء والوسطاء تُرسل للمراجعة قبل تغيير نوع الحساب.' : 'Agent and broker applications are reviewed before your account type changes.')}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Column 2: The Open Architectural Form */}
          <div className={styles.formColumn}>
            {errors.general && (
              <div id="cp-general-error" className={styles.errorAlert} role="alert" aria-live="assertive">
                <AlertCircle className={styles.errorIcon} aria-hidden="true" />
                <div>{errors.general}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.formRoot} noValidate>
              {/* Section 01: Personal Identity */}
              <fieldset className={styles.section} aria-labelledby="cp-personal-heading">
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIndex} aria-hidden="true">01</span>
                  <h2 id="cp-personal-heading" className={styles.sectionTitle}>
                    {t('profile.personalInfo') || (isRtl ? 'المعلومات الشخصية' : 'Personal Information')}
                  </h2>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="cp-firstName" className={styles.label}>
                      <span>
                        {isRtl ? 'الاسم الأول' : 'First Name'}
                        <span className={styles.requiredMark}>*</span>
                      </span>
                    </label>
                    <input
                      id="cp-firstName"
                      type="text"
                      name="firstName"
                      aria-invalid={Boolean(errors.firstName)}
                      aria-describedby={errors.firstName ? 'cp-general-error' : undefined}
                      value={formData.firstName}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder={isRtl ? 'الاسم الأول' : 'First Name'}
                      required
                      autoComplete="given-name"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="cp-lastName" className={styles.label}>
                      <span>
                        {isRtl ? 'الاسم الأخير' : 'Last Name'}
                        <span className={styles.requiredMark}>*</span>
                      </span>
                    </label>
                    <input
                      id="cp-lastName"
                      type="text"
                      name="lastName"
                      aria-invalid={Boolean(errors.lastName)}
                      aria-describedby={errors.lastName ? 'cp-general-error' : undefined}
                      value={formData.lastName}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder={isRtl ? 'الاسم الأخير' : 'Last Name'}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Section 02: Account Classification & Role */}
              <fieldset className={styles.section} aria-labelledby="cp-account-heading">
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIndex} aria-hidden="true">02</span>
                  <h2 id="cp-account-heading" className={styles.sectionTitle}>
                    {t('profile.accountType') || (isRtl ? 'نوع الحساب والصفة المهنية' : 'Account Type & Role')}
                  </h2>
                </div>

                {roleAction === 'apply' && <p className={styles.licenseHelper} role="note">{isRtl ? 'سيُرسل طلب اعتماد للوكيل أو الوسيط. سيبقى نوع حسابك الحالي حتى الموافقة.' : 'An agent or broker application will be submitted. Your current account type stays active until approval.'}</p>}
                {roleAction === 'contact' && <p className={styles.licenseHelper} role="note">{isRtl ? 'يتطلب هذا النوع من الحسابات التواصل مع الإدارة.' : 'This account type requires contacting the administration.'} <Link href="/customerservice/support" className="underline">{isRtl ? 'التواصل مع الدعم' : 'Contact support'}</Link></p>}
                {user?.role === Role.REAL_ESTATE_OFFICE && <p className={styles.licenseHelper}>{isRtl ? 'نوع الحساب الحالي: مكتب عقاري' : 'Current account type: real estate office'}</p>}

                <div className={styles.roleGrid}>
                  {/* Beneficiary / User */}
                  <label
                    htmlFor="role-user"
                    className={`${styles.roleCard} ${formData.role === Role.USER ? styles.roleCardSelected : ''}`}
                  >
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleCardTitleGroup}>
                        <input
                          id="role-user"
                          type="radio"
                          name="role"
                          value={Role.USER}
                          checked={formData.role === Role.USER}
                          onChange={() => handleSelectRole(Role.USER)}
                          className={styles.roleRadio}
                          aria-describedby="role-user-desc"
                        />
                        <span className={styles.roleLabel}>
                          {t('profile.role.user') || (isRtl ? 'مستفيد / عميل' : 'User / Beneficiary')}
                        </span>
                      </div>
                    </div>
                    <p id="role-user-desc" className={styles.roleCardDesc}>
                      {isRtl
                        ? 'تصفح العروض، تقديم طلبات الشراء، وحجز الخدمات العقارية والاستشارية.'
                        : 'Browse offers, place purchase requests, and order real estate services.'}
                    </p>
                  </label>

                  {/* Broker / Agent */}
                  <label
                    htmlFor="role-broker"
                    className={`${styles.roleCard} ${
                      formData.role === Role.BROKER || formData.role === Role.AGENT ? styles.roleCardSelected : ''
                    }`}
                  >
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleCardTitleGroup}>
                        <input
                          id="role-broker"
                          type="radio"
                          name="role"
                          value={Role.BROKER}
                          checked={formData.role === Role.BROKER || formData.role === Role.AGENT}
                          onChange={() => handleSelectRole(Role.BROKER)}
                          className={styles.roleRadio}
                          aria-describedby="role-broker-desc"
                        />
                        <span className={styles.roleLabel}>
                          {t('profile.role.broker') || (isRtl ? 'وسيط عقاري' : 'Real Estate Broker')}
                        </span>
                      </div>
                    </div>
                    <p id="role-broker-desc" className={styles.roleCardDesc}>
                      {isRtl
                        ? 'نشر العروض العقارية، تمثيل الملاك، والتسويق برخصة الهيئة العامة للعقار.'
                        : 'Publish listings, represent property owners, and operate under REGA license.'}
                    </p>
                  </label>

                  {/* Property Owner */}
                  <label
                    htmlFor="role-owner"
                    className={`${styles.roleCard} ${formData.role === Role.OWNER ? styles.roleCardSelected : ''}`}
                  >
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleCardTitleGroup}>
                        <input
                          id="role-owner"
                          type="radio"
                          name="role"
                          value={Role.OWNER}
                          checked={formData.role === Role.OWNER}
                          onChange={() => handleSelectRole(Role.OWNER)}
                          className={styles.roleRadio}
                          aria-describedby="role-owner-desc"
                        />
                        <span className={styles.roleLabel}>
                          {t('profile.role.owner') || (isRtl ? 'مالك عقار' : 'Property Owner')}
                        </span>
                      </div>
                    </div>
                    <p id="role-owner-desc" className={styles.roleCardDesc}>
                      {isRtl
                        ? 'إدارة محفظة العقارات، متابعة العروض، وتفويض الوسطاء المعتمدين.'
                        : 'Manage property assets, review active offers, and appoint accredited brokers.'}
                    </p>
                  </label>

                  {/* Service Provider */}
                  <label
                    htmlFor="role-service-provider"
                    className={`${styles.roleCard} ${isServiceProvider ? styles.roleCardSelected : ''}`}
                  >
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleCardTitleGroup}>
                        <input
                          id="role-service-provider"
                          type="radio"
                          name="role"
                          value="service_provider"
                          checked={isServiceProvider}
                          onChange={handleSelectServiceProviderGroup}
                          className={styles.roleRadio}
                          aria-describedby="role-provider-desc"
                        />
                        <span className={styles.roleLabel}>
                          {t('profile.role.serviceProvider') || (isRtl ? 'مزود خدمة مهني' : 'Service Provider')}
                        </span>
                      </div>
                    </div>
                    <p id="role-provider-desc" className={styles.roleCardDesc}>
                      {isRtl
                        ? 'تقديم الخدمات القانونية، الاستشارات الهندسية، والتوثيق المعتمد.'
                        : 'Provide accredited legal services, notary acts, and engineering consultancy.'}
                    </p>
                  </label>
                </div>

                {/* Sub-Specialty Selection when Service Provider is active */}
                {isServiceProvider && (
                  <div className={styles.conditionalBlock}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="cp-activityType" className={styles.label}>
                        <span>
                          {t('profile.activityType') || (isRtl ? 'تحديد نوع النشاط المهني' : 'Professional Activity Type')}
                          <span className={styles.requiredMark}>*</span>
                        </span>
                      </label>
                      <div className={styles.selectWrapper}>
                        <select
                          id="cp-activityType"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className={styles.select}
                        >
                          <option value={Role.LAWYER}>{t('profile.role.lawyer') || (isRtl ? 'محامي' : 'Lawyer')}</option>
                          <option value={Role.NOTARY}>{t('profile.role.notary') || (isRtl ? 'موثق' : 'Notary')}</option>
                          <option value={Role.LEGAL_CONSULTANT}>
                            {t('profile.role.legal_consultant') || (isRtl ? 'مستشار قانوني' : 'Legal Consultant')}
                          </option>
                          <option value={Role.ENGINEERING_OFFICE}>
                            {t('profile.role.eng') || (isRtl ? 'مكتب هندسي' : 'Engineering Office')}
                          </option>
                          <option value={Role.OTHER}>{t('profile.role.other') || (isRtl ? 'أخرى' : 'Other')}</option>
                        </select>
                      </div>
                    </div>

                    {formData.role === Role.OTHER && (
                      <div className={styles.fieldGroup}>
                        <label htmlFor="cp-roleOtherDescription" className={styles.label}>
                          <span>
                            {t('profile.activityType') || (isRtl ? 'وصف النشاط المقدم' : 'Activity Description')}
                            <span className={styles.requiredMark}>*</span>
                          </span>
                        </label>
                        <input
                          id="cp-roleOtherDescription"
                          type="text"
                          name="roleOtherDescription"
                          value={formData.roleOtherDescription}
                          onChange={handleChange}
                          className={styles.input}
                          placeholder={
                            t('profile.activityPlaceholder') || (isRtl ? 'اكتب نوع الخدمة المقدمة' : 'Describe the service provided')
                          }
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* License Input when role requires license */}
                {requiresLicense && (
                  <div className={styles.conditionalBlock}>
                    <div className={styles.fieldGroup}>
                      <label htmlFor="cp-licenseNumber" className={styles.label}>
                        <span>
                          {formData.role === Role.BROKER || formData.role === Role.AGENT
                            ? t('profile.license.falNum') || (isRtl ? 'رقم ترخيص فال / رخصة الوساطة' : 'Fal / Broker License Number')
                            : t('profile.license.num') || (isRtl ? 'رقم الرخصة المهنية' : 'Professional License Number')}
                          <span className={styles.requiredMark}>*</span>
                        </span>
                      </label>
                      <input
                        id="cp-licenseNumber"
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.licenseNumber ? styles.inputError : ''}`}
                        placeholder={
                          formData.role === Role.BROKER || formData.role === Role.AGENT
                            ? isRtl ? 'أدخل رقم ترخيص فال' : 'Enter Fal License Number'
                            : t('profile.license.num') || (isRtl ? 'رقم الرخصة' : 'License Number')
                        }
                        aria-invalid={!!errors.licenseNumber}
                        aria-describedby={errors.licenseNumber ? 'cp-licenseNumber-err cp-licenseNumber-notice' : 'cp-licenseNumber-notice'}
                        required
                      />
                      {errors.licenseNumber && (
                        <p id="cp-licenseNumber-err" className={styles.errorText} role="alert">
                          {errors.licenseNumber}
                        </p>
                      )}
                      <p id="cp-licenseNumber-notice" className={styles.licenseHelper}>
                        <ShieldCheck className={styles.helperIcon} aria-hidden="true" />
                        <span>
                          {isRtl ? 'إدخال رقم الرخصة لا يعني اعتماد الحساب المهني؛ يخضع الطلب لمراجعة الإدارة.' : 'Entering a license number does not approve a professional account; applications are reviewed by the administration.'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Section 03: Geographic Registry */}
              <fieldset className={styles.section} aria-labelledby="cp-location-heading">
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIndex} aria-hidden="true">03</span>
                  <h2 id="cp-location-heading" className={styles.sectionTitle}>
                    {t('profile.location') || (isRtl ? 'النطاق الجغرافي والإقامة' : 'Geographic Location')}
                  </h2>
                  <span className={styles.sectionOptional}>
                    {isRtl ? 'اختياري' : 'Optional'}
                  </span>
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="cp-address" className={styles.label}>
                    <span>{t('profile.address') || (isRtl ? 'العنوان' : 'Address')}</span>
                  </label>
                  <input
                    id="cp-address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder={
                      t('profile.addressPlaceholder') || (isRtl ? 'العنوان ومكان الإقامة أو مقر العمل' : 'Address and location')
                    }
                    autoComplete="street-address"
                  />
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="cp-city" className={styles.label}>
                      <span>{t('city.name') || (isRtl ? 'المدينة' : 'City')}</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="cp-city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={styles.select}
                        autoComplete="address-level2"
                      >
                        {CITIES.map(c => (
                          <option key={c.key} value={c.ar}>
                            {isRtl ? c.ar : c.en}
                          </option>
                        ))}
                        {!CITIES.some(c => c.ar === formData.city) && formData.city && (
                          <option value={formData.city}>{formData.city}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="cp-country" className={styles.label}>
                      <span>{t('profile.country') || (isRtl ? 'الدولة' : 'Country')}</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="cp-country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className={styles.select}
                        autoComplete="country-name"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.key} value={c.ar}>
                            {isRtl ? c.ar : c.en}
                          </option>
                        ))}
                        {!COUNTRIES.some(c => c.ar === formData.country) && formData.country && (
                          <option value={formData.country}>{formData.country}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Action Area: Submit button */}
              <div className={styles.actionArea}>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={styles.submitButton}
                >
                  {isSaving ? (
                    <>
                      <div className={styles.buttonSpinner} aria-hidden="true" />
                      <span>{t('profile.processing') || (isRtl ? 'جارٍ المعالجة…' : 'Processing…')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" aria-hidden="true" />
                      <span>{t('profile.saveChanges') || (isRtl ? 'حفظ البيانات والمتابعة' : 'Save Changes & Proceed')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
