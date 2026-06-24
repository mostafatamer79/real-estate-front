'use client';

import React, { useEffect, useState } from 'react';
import { 
  Send, 
  Target, 
  Type, 
  CheckCircle,
  AlertCircle,
  Mail,
  Upload
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import api, { offersApi, ordersApi, propertiesApi, usersApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { SaudiRiyalSymbol } from '@/components/ui/saudi-riyal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campaign?: any;
}

export default function MarketingCampaignModal({ isOpen, onClose, onSuccess, campaign }: Props) {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [sourceType, setSourceType] = useState<'existing' | 'new'>(campaign?.linkedResourceId ? 'existing' : 'new');
  const [linkedResourceId, setLinkedResourceId] = useState(campaign?.linkedResourceId || '');
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<Array<{ id: string; label: string; item: any }>>([]);
  const [formData, setFormData] = useState({
    category: campaign?.category || 'offers',
    subject: campaign?.subject || '',
    content: campaign?.content || '',
    frequency: campaign?.frequency || 'weekly',
    targetRole: campaign?.targetRole || '',
    isActive: campaign?.isActive !== undefined ? campaign.isActive : true,
    sortOrder: campaign?.sortOrder ?? 0,
    scheduleMode: campaign?.scheduleMode || 'manual',
    assignedTo: campaign?.assignedTo || '',
    startDate: campaign?.startDate ? String(campaign.startDate).slice(0, 10) : '',
    endDate: campaign?.endDate ? String(campaign.endDate).slice(0, 10) : '',
    propertyType: campaign?.propertyType || 'فيلا',
    mainCategory: campaign?.mainCategory || 'residential',
    dealType: campaign?.dealType || 'بيع',
    price: campaign?.price || 0,
    area: campaign?.area || 0,
    city: campaign?.city || 'الرياض',
    neighborhood: campaign?.neighborhood || '',
    mediaFiles: campaign?.mediaFiles || [],
    details: campaign?.details || {
      rooms: '',
      bathrooms: '',
      propertyAge: '',
      priceFrom: '',
      priceTo: '',
      areaFrom: '',
      areaTo: '',
      livingRooms: '',
      kitchens: '',
      floors: '',
      apartments: '',
      hasMaidRoom: false,
      hasRoof: false,
      hasExternalAnnex: false,
      buildingArea: '',
      hasGarage: false,
      hasPool: false,
      hasElevator: false,
      furnitureStatus: '',
      direction: '',
      streetWidth: '',
      deedType: '',
      propertyCondition: '',
      length: '',
      width: ''
    },
  });

  const propertyTypeOptions: Record<string, string[]> = {
    residential: ['فيلا', 'شقة', 'قصر', 'أرض', 'بيت شعبي', 'أرض سكنية'],
    commercial: ['محل', 'مكتب', 'عمارة', 'مستودع', 'محل تجاري', 'برج', 'مصنع', 'فندق', 'تجاري']
  };

  const categories = [
    { value: 'orders', label: t('admin.marketing.categories.orders') },
    { value: 'offers', label: t('admin.marketing.categories.offers') },
    { value: 'property_management', label: t('admin.marketing.categories.property_management') },
    { value: 'custom', label: language === 'ar' ? 'مخصص' : 'Custom' },
  ];
  const roles = [
    { value: '', label: t('admin.marketing.targetRole.all') },
    { value: 'user', label: isRtl ? 'مستفيد' : 'Beneficiary (User)' },
    { value: 'broker', label: isRtl ? 'وسيط عقاري' : 'Broker' },
    { value: 'agent', label: isRtl ? 'وكيل' : 'Agent' },
    { value: 'owner', label: isRtl ? 'مالك' : 'Owner' },
    { value: 'lawyer', label: isRtl ? 'محامي' : 'Lawyer' },
  ];

  const categoryResourceMap: Record<string, { label: string; value: string }> = {
    orders: { label: isRtl ? 'طلبات' : 'Orders', value: 'order' },
    offers: { label: isRtl ? 'عروض' : 'Offers', value: 'offer' },
    property_management: { label: isRtl ? 'أملاك' : 'Property management', value: 'property' },
    custom: { label: isRtl ? 'مخصص' : 'Custom', value: 'none' },
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        const res = await usersApi.findAll();
        setUsers(res.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [isOpen, isRtl]);

  useEffect(() => {
    if (!isOpen || sourceType !== 'existing') return;
    const loadResources = async () => {
      if (formData.category === 'custom') {
        setResourceOptions([]);
        return;
      }
      try {
        setResourcesLoading(true);
        if (formData.category === 'orders') {
          const res = await ordersApi.findAll();
          setResourceOptions((res.data || []).map((item: any) => ({
            id: item.id,
            label: `${item.orderType || (isRtl ? 'طلب' : 'Order')} - ${item.city || item.id.slice(0, 8)}`,
            item
          })));
        } else if (formData.category === 'offers') {
          const res = await offersApi.findAll();
          setResourceOptions((res.data || []).map((item: any) => ({
            id: item.id,
            label: `${item.propertyType || (isRtl ? 'عرض' : 'Offer')} - ${item.city || item.id.slice(0, 8)} - ${item.price} SAR`,
            item
          })));
        } else if (formData.category === 'property_management') {
          const res = await propertiesApi.findAll();
          setResourceOptions((res.data || []).map((item: any) => ({
            id: item.id,
            label: `${item.propertyType || (isRtl ? 'ملك' : 'Property')} - ${item.city || item.id.slice(0, 8)}`,
            item
          })));
        }
      } catch (error) {
        setResourceOptions([]);
      } finally {
        setResourcesLoading(false);
      }
    };
    loadResources();
  }, [formData.category, isOpen, isRtl, sourceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error(isRtl ? 'المحتوى مطلوب' : 'Content is required');
      return;
    }


    try {
      setLoading(true);
      const data = {
        ...formData,
        targetRole: formData.targetRole || null,
        assignedTo: formData.assignedTo || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        linkedResourceType: sourceType === 'existing' && formData.category !== 'custom' ? categoryResourceMap[formData.category]?.value || 'none' : null,
        linkedResourceId: sourceType === 'existing' && formData.category !== 'custom' ? linkedResourceId : null,
      };

      let savedCampaign: any;
      if (campaign?.id) {
        const res = await api.patch(`/marketing/email-marketing/${campaign.id}`, data);
        savedCampaign = res.data;
      } else {
        const res = await api.post('/marketing/email-marketing', data);
        savedCampaign = res.data;
      }

      if (images.length > 0 && savedCampaign?.id) {
        const uploadForm = new FormData();
        images.forEach(file => uploadForm.append('files', file));
        await api.post(`/marketing/email-marketing/${savedCampaign.id}/upload/media`, uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success(t('common.success'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto hide-scrollbar p-0 bg-white rounded-[1.5rem] border-0 shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader className="sr-only">
          <DialogTitle>{campaign ? (isRtl ? 'تعديل الإعلان' : 'Edit campaign') : t('admin.marketing.create')}</DialogTitle>
          <DialogDescription>
            {campaign ? (isRtl ? 'تحديث الإعلان الحالي' : 'Update existing marketing campaign') : (isRtl ? 'إنشاء إعلان جديد' : 'Create a new automated campaign')}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {campaign ? (isRtl ? 'تعديل الإعلان' : 'Edit campaign') : (isRtl ? 'إنشاء إعلان' : t('admin.marketing.create'))}
              </h2>
              <p className="text-[11px] text-slate-500 font-bold mt-1">
                {campaign ? (isRtl ? 'تحديث الإعلان الحالي' : 'Update existing marketing campaign') : (isRtl ? 'إعلان يظهر في صفحة التفاصيل' : 'Ad visible on details page')}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Mail className="w-3 h-3" />
                {isRtl ? 'عنوان الإعلان' : 'Ad title'}
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder={isRtl ? 'عنوان مختصر للإعلان' : 'Short ad title'}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Type className="w-3 h-3" />
                {isRtl ? 'الفئة' : t('admin.marketing.table.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Type */}
            {formData.category !== 'custom' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                  <Target className="w-3 h-3" />
                  {isRtl ? 'مصدر بيانات الإعلان' : 'Ad Data Source'}
                </label>
                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSourceType('new')}
                    className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      sourceType === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isRtl ? 'إنشاء بيانات جديدة للإعلان' : 'Create new data'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('existing')}
                    className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${
                      sourceType === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isRtl ? 'ربط بعنصر موجود مسبقاً' : 'Link existing item'}
                  </button>
                </div>
              </div>
            )}

            {/* Linked Resource Selector */}
            {sourceType === 'existing' && formData.category !== 'custom' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                  <Type className="w-3 h-3" />
                  {isRtl ? 'اختر العنصر المرتبط' : 'Choose Linked Item'}
                </label>
                <select
                  value={linkedResourceId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setLinkedResourceId(id);
                    const selected = resourceOptions.find(opt => opt.id === id)?.item;
                    if (selected) {
                      setFormData(prev => ({
                        ...prev,
                        propertyType: selected.propertyType || prev.propertyType,
                        mainCategory: selected.mainCategory || prev.mainCategory,
                        dealType: selected.dealType || prev.dealType,
                        price: selected.price || prev.price,
                        area: selected.area || prev.area,
                        city: selected.city || prev.city,
                        neighborhood: selected.neighborhood || prev.neighborhood,
                        details: {
                          ...prev.details,
                          rooms: selected.rooms || prev.details?.rooms || '',
                          bathrooms: selected.bathrooms || prev.details?.bathrooms || '',
                          propertyAge: selected.propertyAge || prev.details?.propertyAge || '',
                          priceFrom: selected.price || prev.details?.priceFrom || '',
                          priceTo: selected.price || prev.details?.priceTo || '',
                          areaFrom: selected.area || prev.details?.areaFrom || '',
                          areaTo: selected.area || prev.details?.areaTo || ''
                        }
                      }));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">{resourcesLoading ? (isRtl ? 'جاري التحميل...' : 'Loading...') : (isRtl ? 'اختر العنصر لجلبه' : 'Select item to fetch')}</option>
                  {resourceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {linkedResourceId && (
                  <p className="text-[10px] text-emerald-600 font-bold px-1 mt-1">
                    {isRtl ? '✓ تم ربط العنصر وتعبئة الحقول أدناه لتتمكن من تخصيصها.' : '✓ Item linked and fields below are auto-filled.'}
                  </p>
                )}
              </div>
            )}

            {/* Target Role */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <CheckCircle className="w-3 h-3" />
                {isRtl ? 'الدور المستهدف' : t('admin.marketing.table.role')}
              </label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <CheckCircle className="w-3 h-3" />
                {isRtl ? 'مسند إلى' : 'Assigned to'}
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="">{isRtl ? 'غير مسند' : 'Unassigned'}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>


              <div className="md:col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4 my-2 text-right">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  {isRtl ? 'تفاصيل ومواصفات العقار للإعلان' : 'Ad Property Specifications'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'تصنيف العقار' : 'Category'}</label>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainCategory: 'residential', propertyType: 'فيلا' })}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${formData.mainCategory === 'residential' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {isRtl ? 'سكني' : 'Residential'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainCategory: 'commercial', propertyType: 'مكتب' })}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${formData.mainCategory === 'commercial' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                        {isRtl ? 'تجاري' : 'Commercial'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'نوع العقار' : 'Type'}</label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                    >
                      {propertyTypeOptions[formData.mainCategory || 'residential']?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'نوع الصفقة' : 'Deal type'}</label>
                    <select
                      value={formData.dealType}
                      onChange={(e) => setFormData({ ...formData, dealType: e.target.value })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                    >
                      <option value="بيع">{isRtl ? 'بيع' : 'Sale'}</option>
                      <option value="إيجار">{isRtl ? 'إيجار' : 'Rent'}</option>
                    </select>
                  </div>
                </div>

                {formData.category === 'orders' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1">{isRtl ? 'من سعر' : 'Price From'} <SaudiRiyalSymbol iconClassName="h-3 w-3" /></label>
                        <input
                          type="number"
                          value={formData.details?.priceFrom || ''}
                          onChange={(e) => setFormData({ ...formData, details: { ...formData.details, priceFrom: e.target.value } })}
                          className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1">{isRtl ? 'إلى سعر' : 'Price To'} <SaudiRiyalSymbol iconClassName="h-3 w-3" /></label>
                        <input
                          type="number"
                          value={formData.details?.priceTo || ''}
                          onChange={(e) => setFormData({ ...formData, details: { ...formData.details, priceTo: e.target.value } })}
                          className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'من مساحة (م²)' : 'Area From (m²)'}</label>
                        <input
                          type="number"
                          value={formData.details?.areaFrom || ''}
                          onChange={(e) => setFormData({ ...formData, details: { ...formData.details, areaFrom: e.target.value } })}
                          className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'إلى مساحة (م²)' : 'Area To (m²)'}</label>
                        <input
                          type="number"
                          value={formData.details?.areaTo || ''}
                          onChange={(e) => setFormData({ ...formData, details: { ...formData.details, areaTo: e.target.value } })}
                          className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1">{isRtl ? 'السعر' : 'Price'} <SaudiRiyalSymbol iconClassName="h-3 w-3" /></label>
                      <input
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'المساحة (م²)' : 'Area (m²)'}</label>
                      <input
                        type="number"
                        value={formData.area || ''}
                        onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                        className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'المدينة' : 'City'}</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder={isRtl ? 'الرياض' : 'Riyadh'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'الحي' : 'Neighborhood'}</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder={isRtl ? 'الياسمين' : 'Al-Yasmin'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد الغرف' : 'Rooms'}</label>
                    <input
                      type="number"
                      value={formData.details?.rooms || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, rooms: e.target.value } })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد الحمامات' : 'Bathrooms'}</label>
                    <input
                      type="number"
                      value={formData.details?.bathrooms || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, bathrooms: e.target.value } })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عمر العقار' : 'Property Age'}</label>
                    <input
                      type="text"
                      value={formData.details?.propertyAge || ''}
                      onChange={(e) => setFormData({ ...formData, details: { ...formData.details, propertyAge: e.target.value } })}
                      className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder={isRtl ? 'جديد' : 'New'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد الصالات' : 'Living Rooms'}</label>
                    <input type="number" value={formData.details?.livingRooms || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, livingRooms: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد المطابخ' : 'Kitchens'}</label>
                    <input type="number" value={formData.details?.kitchens || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, kitchens: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد الأدوار' : 'Floors'}</label>
                    <input type="number" value={formData.details?.floors || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, floors: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عدد الشقق' : 'Apartments'}</label>
                    <input type="number" value={formData.details?.apartments || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, apartments: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'مساحة البناء' : 'Building Area'}</label>
                    <input type="number" value={formData.details?.buildingArea || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, buildingArea: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'الطول' : 'Length'}</label>
                    <input type="number" value={formData.details?.length || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, length: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'العرض' : 'Width'}</label>
                    <input type="number" value={formData.details?.width || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, width: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'عرض الشارع' : 'Street Width'}</label>
                    <input type="number" value={formData.details?.streetWidth || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, streetWidth: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'الواجهة' : 'Direction'}</label>
                    <select value={formData.details?.direction || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, direction: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">{isRtl ? 'الكل' : 'All'}</option>
                      <option value="شمالي">شمالي</option>
                      <option value="جنوبي">جنوبي</option>
                      <option value="شرقي">شرقي</option>
                      <option value="غربي">غربي</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'نوع الصك' : 'Deed Type'}</label>
                    <select value={formData.details?.deedType || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, deedType: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">{isRtl ? 'الكل' : 'All'}</option>
                      <option value="إلكتروني">إلكتروني</option>
                      <option value="ورقي">ورقي</option>
                      <option value="مشاع">مشاع</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'حالة العقار' : 'Condition'}</label>
                    <select value={formData.details?.propertyCondition || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, propertyCondition: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">{isRtl ? 'الكل' : 'All'}</option>
                      <option value="جديد">جديد</option>
                      <option value="ممتاز">ممتاز</option>
                      <option value="جيد">جيد</option>
                      <option value="يحتاج صيانة">يحتاج صيانة</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'التأثيث' : 'Furniture'}</label>
                    <select value={formData.details?.furnitureStatus || ''} onChange={(e) => setFormData({ ...formData, details: { ...formData.details, furnitureStatus: e.target.value } })} className="w-full h-[38px] bg-white border border-slate-200 rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">{isRtl ? 'الكل' : 'All'}</option>
                      <option value="مؤثث">مؤثث</option>
                      <option value="شبه مؤثث">شبه مؤثث</option>
                      <option value="غير مؤثث">غير مؤثث</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 pb-2">
                  {[
                    { key: 'hasGarage', label: isRtl ? 'كراج' : 'Garage' },
                    { key: 'hasPool', label: isRtl ? 'مسبح' : 'Pool' },
                    { key: 'hasElevator', label: isRtl ? 'مصعد' : 'Elevator' },
                    { key: 'hasMaidRoom', label: isRtl ? 'غرفة خادمة' : 'Maid Room' },
                    { key: 'hasRoof', label: isRtl ? 'سطح' : 'Roof' },
                    { key: 'hasExternalAnnex', label: isRtl ? 'ملحق خارجي' : 'External Annex' }
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData.details?.[f.key]}
                        onChange={(e) => setFormData({ ...formData, details: { ...formData.details, [f.key]: e.target.checked } })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 border-slate-300"
                      />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{f.label}</span>
                    </label>
                  ))}
                </div>

                {formData.category !== 'orders' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      {isRtl ? 'تحميل صور إضافية للإعلان' : 'Upload Additional Ad Images'}
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setImages(Array.from(e.target.files));
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none transition-colors cursor-pointer"
                    />
                    {images.length > 0 && (
                      <p className="text-[10px] text-emerald-600 font-bold">
                        {isRtl ? `✓ تم تحديد عدد ${images.length} صور للتحميل` : `✓ Selected ${images.length} images for upload`}
                      </p>
                    )}
                    {formData.mediaFiles && formData.mediaFiles.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'الصور الحالية:' : 'Current Images:'}</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.mediaFiles.map((url: string, idx: number) => (
                            <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm shrink-0 bg-slate-100">
                              <img src={url} alt="ad property" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            {/* Status */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? 'الحالة' : t('admin.marketing.table.status')}
              </label>
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl h-[46px]">
                <span className="text-sm font-bold text-slate-700">{formData.isActive ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'متوقف' : 'Paused')}</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? 'ترتيب الظهور' : 'Sort order'}
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? 'نوع الجدولة' : 'Schedule type'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleMode: 'manual' })}
                  className={`rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-widest ${formData.scheduleMode === 'manual' ? 'border-slate-900 bg-slate-100 text-slate-950' : 'border-slate-200 bg-white text-slate-500'}`}
                >
                  {isRtl ? 'يدوي حتى الإيقاف' : 'Manual until off'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleMode: 'date_range' })}
                  className={`rounded-xl border px-4 py-2 text-[11px] font-black uppercase tracking-widest ${formData.scheduleMode === 'date_range' ? 'border-slate-900 bg-slate-100 text-slate-950' : 'border-slate-200 bg-white text-slate-500'}`}
                >
                  {isRtl ? 'من تاريخ إلى تاريخ' : 'From date to date'}
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? 'تكرار إرسال البريد الإلكتروني' : 'Email Send Frequency'}
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="daily">{isRtl ? 'يومي' : 'Daily'}</option>
                <option value="every_2_days">{isRtl ? 'كل يومين' : 'Every 2 days'}</option>
                <option value="weekly">{isRtl ? 'أسبوعي' : 'Weekly'}</option>
                <option value="biweekly">{isRtl ? 'كل أسبوعين' : 'Biweekly'}</option>
              </select>
            </div>

            {formData.scheduleMode === 'date_range' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3 h-3" />
                    {isRtl ? 'تاريخ البداية' : 'Start date'}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                    <AlertCircle className="w-3 h-3" />
                    {isRtl ? 'تاريخ النهاية' : 'End date'}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
              <Mail className="w-3 h-3" />
              {isRtl ? 'المحتوى' : `${t('admin.marketing.table.content')} (HTML Allowed)`}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              placeholder={isRtl ? 'اكتب محتوى الإعلان هنا...' : 'Enter the ad content here...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <DialogFooter className="flex items-center justify-end gap-3 pt-2 bg-transparent border-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {campaign ? (isRtl ? 'تحديث الإعلان' : 'Update Campaign') : (isRtl ? 'إنشاء الإعلان' : 'Create Campaign')}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
