'use client';

import React, { useEffect, useState } from 'react';
import { 
  Send, 
  Target, 
  Type, 
  CheckCircle,
  AlertCircle,
  Mail
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import api, { offersApi, ordersApi, propertiesApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    category: campaign?.category || 'offers',
    subject: campaign?.subject || '',
    content: campaign?.content || '',
    frequency: campaign?.frequency || 'weekly',
    targetRole: campaign?.targetRole || '',
    isActive: campaign?.isActive !== undefined ? campaign.isActive : true,
    sortOrder: campaign?.sortOrder ?? 0,
    scheduleMode: campaign?.scheduleMode || 'manual',
    linkedResourceId: campaign?.linkedResourceId || '',
    startDate: campaign?.startDate ? String(campaign.startDate).slice(0, 10) : '',
    endDate: campaign?.endDate ? String(campaign.endDate).slice(0, 10) : '',
  });

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
            label: `${item.orderType || (isRtl ? 'طلب' : 'Order')} - ${item.location || item.city || item.id.slice(0, 8)}`,
          })));
          return;
        }

        if (formData.category === 'offers') {
          const res = await offersApi.findAll();
          setResourceOptions((res.data || []).map((item: any) => ({
            id: item.id,
            label: `${item.title || item.propertyType || (isRtl ? 'عرض' : 'Offer')} - ${item.location || item.city || item.id.slice(0, 8)}`,
          })));
          return;
        }

        if (formData.category === 'property_management') {
          const res = await propertiesApi.findAll();
          setResourceOptions((res.data || []).map((item: any) => ({
            id: item.id,
            label: `${item.title || item.name || item.propertyType || (isRtl ? 'ملك' : 'Property')} - ${item.location || item.city || item.id.slice(0, 8)}`,
          })));
          return;
        }
      } catch (error) {
        setResourceOptions([]);
      } finally {
        setResourcesLoading(false);
      }
    };

    loadResources();
  }, [formData.category, isOpen, isRtl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error(isRtl ? 'المحتوى مطلوب' : 'Content is required');
      return;
    }
    if (formData.category !== 'custom' && !formData.linkedResourceId) {
      toast.error(isRtl ? 'اختر العنصر المرتبط' : 'Choose the linked item');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        targetRole: formData.targetRole || null,
        linkedResourceType: categoryResourceMap[formData.category]?.value || 'none',
        linkedResourceId: formData.category === 'custom' ? null : formData.linkedResourceId,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      };

      if (campaign?.id) {
        await api.patch(`/marketing/email-marketing/${campaign.id}`, data);
      } else {
        await api.post('/marketing/email-marketing', data);
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white rounded-[1.5rem] border-0 shadow-2xl" dir={language === 'ar' ? 'rtl' : 'ltr'}>
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Mail className="w-3 h-3" />
                {isRtl ? 'يرتبط بـ' : 'Linked to'}
              </label>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
                {categoryResourceMap[formData.category]?.label || (isRtl ? 'مخصص' : 'Custom')}
              </div>
              <p className="text-[11px] font-bold text-slate-400 px-1">
                {isRtl
                  ? 'طلبات مع الطلبات، العروض مع العروض، الأملاك مع إدارة الأملاك، والمخصص بدون ربط.'
                  : 'Orders map to orders, offers map to offers, property management maps to properties, and custom stays unlinked.'}
              </p>
            </div>

            {formData.category !== 'custom' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                  <Type className="w-3 h-3" />
                  {isRtl ? 'اختر العنصر' : 'Choose item'}
                </label>
                <select
                  value={formData.linkedResourceId}
                  onChange={(e) => setFormData({ ...formData, linkedResourceId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">{resourcesLoading ? (isRtl ? 'جاري التحميل...' : 'Loading...') : (isRtl ? 'اختر' : 'Select')}</option>
                  {resourceOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
