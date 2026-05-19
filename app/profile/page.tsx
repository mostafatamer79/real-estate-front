"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, User as UserIcon, MapPin, Briefcase, FileText, CheckCircle, Building2, Upload, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Role, User as UserType } from '@/types/user';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from "@/context/LanguageContext";

const profileSchema = z.object({
  firstName: z.string().min(1, 'profile.nameRequired'),
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
  postalCode: z.string().optional(),
  city: z.string().optional(),
  streetName: z.string().optional(),
  district: z.string().optional(),
  additionalNumber: z.string().optional(),
  unitNumber: z.string().optional(),
  country: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;



export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { t, language } = useLanguage();


  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: Role.USER,
      city: 'riyadh',
      country: 'saudi',
      brokerType: 'individual',
    },
  });

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'request' | 'otp'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [mockNationalId, setMockNationalId] = useState(''); // In real app, this comes from Nafath
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    if (otpTimer <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [otpTimer]);

  const handleVerifyStart = async () => {
     setIsVerifying(true);
     try {
        const nationalId = mockNationalId || '1000000000';
        const response = await api.post('/user/nafath/send-otp', { nationalId });
        setVerificationStep('otp');
        setOtpTimer(60);
        setOtpCode('');
        setMockNationalId(response.data?.nationalId || nationalId);
     } catch (e) {
        toast({ title: t('common.error'), description: t('otp.errorGeneric'), variant: "destructive" });
     } finally {
        setIsVerifying(false);
     }
  };

  const handleVerifyOtp = async () => {
    setIsVerifying(true);
    try {
       await api.post('/user/nafath/verify', { nationalId: mockNationalId, otp: otpCode });
       toast({ title: t('common.success'), description: t('profile.verification.success'), variant: "default" });
       setShowVerifyDialog(false);
       
       updateUser({ isVerified: true, nationalId: mockNationalId });
    } catch (e) {
       toast({ title: t('common.error'), description: t('otp.errorInvalid'), variant: "destructive" });
    } finally {
        setIsVerifying(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Assume endpoint /upload/image or similar exists or use generic upload
        const res = await api.post<ApiResponse<{url: string}>>('/user/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update profile with new image URL
        // If the API returns the URL directly or in data object
        // Adjust based on actual API response, assuming standard structure
        const imageUrl = res.data.data?.url || (res.data as any).url; 
        
        if (imageUrl) {
            await api.put('/user/profile', { profileImage: imageUrl });
            toast({ title: t('common.success'), variant: "default" });
            
            updateUser({ profileImage: imageUrl });
        }
    } catch (error) {
        toast({ title: t('common.error'), description: t('profile.upload.error'), variant: "destructive" });
    }
  };


  const selectedRole = watch('role');

  // Effect logic
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || Role.USER,
        roleOtherDescription: user.roleOtherDescription || '',
        
        brokerType: user.brokerType || 'individual',
        falLicenseNumber: user.falLicenseNumber || user.agentLicenseNumber || '',
        falLicenseExpiry: user.falLicenseExpiry ? new Date(user.falLicenseExpiry).toISOString().split('T')[0] : '',
        licenseIssueDate: user.licenseIssueDate ? new Date(user.licenseIssueDate).toISOString().split('T')[0] : '',
        lawLicenseNumber: user.lawLicenseNumber || '',
        commercialRegistrationNumber: user.commercialRegistrationNumber || '',
        
        postalCode: user.postalCode || '',
        streetName: user.streetName || '',
        district: user.district || '',
        additionalNumber: user.additionalNumber || '',
        unitNumber: user.unitNumber || '',
        city: user.city || 'riyadh',
        country: user.country || 'saudi',
      });
    } 
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      // Sanitize dates: empty strings -> undefined
      const payload: any = { ...data };
      if (!payload.falLicenseExpiry) payload.falLicenseExpiry = undefined;
      if (!payload.licenseIssueDate) payload.licenseIssueDate = undefined;
      
      const res = await api.put<ApiResponse<UserType>>('/user/profile', payload);
      
      // Update local state
      updateUser(res.data.data || res.data); // Adjust depending on API response structure { data: User } or just User

      toast({
        title: t('common.success'),
        description: t('wallet.saveSuccess'),
        variant: "default",
      });
      
    } catch (error: any) {
        console.error(error);
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-gray-400 font-bold bg-slate-100/50" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-800">{t('profile.title')}</h1>
            <button 
                onClick={() => router.push('/')}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                dir="ltr" 
            >
                {t('profile.back')}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar / User Card */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden mb-4 border-4 border-white shadow-md">
                            {user.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-12 h-12 text-slate-400" />
                            )}
                        </div>
                        {/* Image Upload Trigger */}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                           <label className="cursor-pointer w-full h-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium flex flex-col items-center gap-1">
                                    <Upload className="w-4 h-4" />
                                    {t('profile.upload.image')}
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                           </label>
                        </div>
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 mb-1">{user.firstName} {user.lastName}</h2>
                    <p className="text-sm text-slate-500 mb-4">{user.email || user.phone}</p>
                    
                    {/* Verification / National ID Badge */}
                    <div className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-4 ${user.isVerified ? 'bg-slate-50 text-gray-700' : 'bg-slate-50 text-gray-500'}`}>
                        {user.isVerified ? <ShieldCheck className="w-4 h-4" /> : <Loader2 className="w-4 h-4" />}
                        <span>{user.isVerified ? t('profile.verification.verified') : t('profile.verification.unverified')}</span>
                    </div>

                    {user.isVerified && user.nationalId && (
                        <div className="w-full bg-slate-50 rounded-lg p-3 mb-4">
                            <p className="text-xs text-slate-500 mb-1">{t('profile.nationalId')}</p>
                            <p className="font-mono font-medium text-slate-700 tracking-wider">{user.nationalId}</p>
                        </div>
                    )}

                    {!user.isVerified && (
                        <Button 
                            variant="outline" 
                            className="w-full gap-2 border-gray-600 text-gray-600 hover:bg-slate-50"
                            onClick={() => { setShowVerifyDialog(true); setVerificationStep('request'); }}
                        >
                            <img src="/nafath-logo-placeholder.png" className="w-5 h-5 object-contain hidden" alt="Nafath" /> {/* Placeholder */}
                            {t('profile.verification.btn')}
                        </Button>
                    )}

                     {/* Validation status for Brokers/Offices */}
                    {(selectedRole === Role.BROKER || selectedRole === Role.REAL_ESTATE_OFFICE) && (
                         <div className="w-full border-t pt-4 mt-4">
                             <div className="flex items-center justify-between text-sm mb-2">
                                 <span className="text-slate-500">{t('profile.fal.status')}</span>
                                 <span className="text-green-600 font-medium">{t('profile.fal.valid')}</span>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4 text-start">{t('profile.accountInfo')}</h3>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        
                        {/* 1. Basic Info */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
                                <UserIcon className="w-4 h-4" />
                                {t('profile.nameDesc')}
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 text-start">{t('profile.nameLabel')}</label>
                                    <input
                                    type="text"
                                    {...register('firstName')}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none ${language === 'ar' ? 'text-right' : 'text-left'} ${errors.firstName ? 'border-red-500' : 'border-slate-300 focus:border-gray-500'}`}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{t(errors.firstName.message || 'profile.nameRequired')}</p>}
                                </div>
                                
                                <div className="hidden">
                                    {/* Keeping lastName distinct if logical, but user asked for "Name user/office" */}
                                    <input type="text" {...register('lastName')} /> 
                                </div>
 
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700 text-start">{t('profile.roleLabel')}</label>
                                    <select
                                        {...register('role')}
                                        className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                                    >
                                        <option value={Role.USER}>{t('profile.role.user')}</option>
                                        <option value={Role.BROKER}>{t('profile.role.broker')}</option>
                                        <option value={Role.OWNER}>{t('profile.role.owner')}</option>
                                        <option value={Role.LAWYER}>{t('profile.role.lawyer')}</option>
                                        <option value={Role.NOTARY}>{t('profile.role.notary')}</option>
                                        <option value={Role.LEGAL_CONSULTANT}>{t('profile.role.legal_consultant')}</option>
                                        <option value={Role.ENGINEERING_OFFICE}>{t('profile.role.eng')}</option>
                                        <option value={Role.OTHER}>{t('profile.role.other')}</option>
                                    </select>
                                </div>

                                {selectedRole === Role.OTHER && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.activityType')}</label>
                                        <input
                                            type="text"
                                            {...register('roleOtherDescription')}
                                            placeholder={t('profile.activityPlaceholder')}
                                            className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Specialized Info (Conditional) */}
                        {/* Broker / Office */}
                        {(selectedRole === Role.BROKER || selectedRole === Role.REAL_ESTATE_OFFICE) && (
                              <div className="bg-slate-100/50 p-5 rounded-xl border border-gray-200">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 font-bold text-gray-950 mb-4">
                                    <Building2 className="w-4 h-4" />
                                    {t('profile.brokerType.label')}
                                </h4>
                                
                                {/* Broker Type Toggle */}
                                <div className="mb-6">
                                    <RadioGroup 
                                        defaultValue={watch('brokerType')} 
                                        onValueChange={(val) => {
                                            setValue('brokerType', val as 'individual' | 'office');
                                            // Sync Role
                                            setValue('role', val === 'office' ? Role.REAL_ESTATE_OFFICE : Role.BROKER);
                                        }}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <RadioGroupItem value="individual" id="r-ind" />
                                            <Label htmlFor="r-ind">{t('profile.brokerType.individual')}</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <RadioGroupItem value="office" id="r-office" />
                                            <Label htmlFor="r-office">{t('profile.brokerType.office')}</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <Separator className="my-4 bg-slate-200" />

                                <div className="space-y-4">
                                    <h5 className="text-sm font-semibold text-gray-950 font-semibold text-gray-900 mb-2">{t('profile.license.fal')}</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.falNum')} <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                {...register('falLicenseNumber')}
                                                className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none ${language === 'ar' ? 'text-right' : 'text-left'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.issueDate')}</label>
                                            <input
                                                type="date"
                                                {...register('licenseIssueDate')}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.falExpiry')}</label>
                                            <input
                                                type="date"
                                                {...register('falLicenseExpiry')}
                                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                            />
                                        </div>
                                        
                                        {watch('brokerType') === 'office' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.cr')} <span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    {...register('commercialRegistrationNumber')}
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-2">
                                        <button type="button" className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-gray-200 text-gray-900 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                                            <span>{t('profile.link.fal')}</span>
                                        </button>
                                        <p className="text-xs text-slate-400 mt-2 text-center">{t('profile.verify.auto')}</p>
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* Specialized Legal/Notary Info */}
                        {[Role.LAWYER, Role.NOTARY, Role.LEGAL_CONSULTANT].includes(selectedRole as Role) && (
                             <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                     
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.num')}</label>
                                        <input
                                            type="text"
                                            {...register('lawLicenseNumber')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.issueDate')}</label>
                                        <input
                                            type="date"
                                            {...register('licenseIssueDate')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                        />
                                    </div>
                                </div>
                             </div>
                        )}

                        {/* Engineering Office */}
                        {selectedRole === Role.ENGINEERING_OFFICE && (
                             <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.license.cr')}</label>
                                    <input
                                        type="text"
                                        {...register('commercialRegistrationNumber')}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                             </div>
                        )}

                        {/* 3. Contact Info */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 mt-6">
                                <div className="w-1 h-4 bg-slate-500 rounded-full"></div>
                                {t('profile.contactInfo')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-500 text-start">{t('profile.mobile')}</label>
                                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-start cursor-not-allowed">
                                        {user.phone || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-500 text-start">{t('profile.email')}</label>
                                    <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-start cursor-not-allowed">
                                        {user.email || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* 4. National Address */}
                        <div>
                             <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4 mt-6">
                                <MapPin className="w-4 h-4" />
                                {t('profile.nationalAddress.title')}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.nationalAddress.postal')}</label>
                                    <input
                                        type="text"
                                        {...register('postalCode')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('city.name')}</label>
                                    <select
                                        {...register('city')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    >
                                        {['riyadh', 'jeddah', 'dammam', 'mecca', 'medina', 'taif', 'abha', 'hail', 'other'].map(c => (
                                            <option key={c} value={t(`city.${c}`)} className="slate-900">{t(`city.${c}`)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.nationalAddress.street')}</label>
                                    <input
                                        type="text"
                                        {...register('streetName')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.nationalAddress.district')}</label>
                                    <input
                                        type="text"
                                        {...register('district')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.nationalAddress.addNum')}</label>
                                    <input
                                        type="text"
                                        {...register('additionalNumber')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">{t('profile.nationalAddress.unitNum')}</label>
                                    <input
                                        type="text"
                                        {...register('unitNumber')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-gray-500 focus:outline-none text-start"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t flex justify-end gap-3">
                             {/* Link Brokers Option (as requested) */}
                             {(selectedRole === Role.REAL_ESTATE_OFFICE) && (
                                <button type="button" className="px-4 py-2 text-gray-400 font-bold bg-slate-100/50 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                                    {t('profile.linkBrokers')}
                                </button>
                             )}

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-lg font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-black/10"
                            >
                                {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {t('profile.saving')}
                                </>
                                ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {t('profile.save')}
                                </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
      </div>
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-center">{t('profile.verification.title')}</DialogTitle>
                <DialogDescription className="text-center">
                    {verificationStep === 'request' 
                        ? t('profile.verification.sentToPhone') 
                        : t('profile.verification.enterOtp')
                    }
                </DialogDescription>
            </DialogHeader>

            {verificationStep === 'request' ? (
                <div className="flex flex-col items-center py-4">
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-gray-400 font-bold bg-slate-100/50" />
                     </div>
                     <Button onClick={handleVerifyStart} disabled={isVerifying} className="w-full mt-4">
                        {isVerifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {t('login.submit')}
                     </Button>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    <Input 
                        value={otpCode} 
                        onChange={(e) => setOtpCode(e.target.value)} 
                        maxLength={6} 
                        className="text-center text-2xl tracking-widest" 
                        placeholder="______"
                    />
                    <div className="text-xs text-center text-slate-400">
                        {otpTimer > 0 ? `00:${otpTimer.toString().padStart(2, '0')}` : <span className="text-gray-400 font-bold bg-slate-100/50 cursor-pointer" onClick={handleVerifyStart}>{t('otp.resendBtn')}</span>}
                    </div>
                    <Button onClick={handleVerifyOtp} disabled={isVerifying || otpCode.length < 6} className="w-full">
                         {isVerifying ? t('otp.verifying') : t('otp.verifyBtn')}
                    </Button>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
