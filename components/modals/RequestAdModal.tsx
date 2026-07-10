'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Target, 
  Type, 
  Mail,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SaudiRiyalSymbol } from '@/components/ui/saudi-riyal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestAdModal({ isOpen, onClose, onSuccess }: Props) {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    category: 'offers',
    subject: '',
    content: '',
    frequency: 'weekly', // default frequency
    targetRole: '',
    isActive: false, // user requested ads are pending approval
    sortOrder: 0,
    scheduleMode: 'manual',
    startDate: '',
    endDate: '',
    propertyType: 'فيلا',
    mainCategory: 'residential',
    dealType: 'بيع',
    price: 0,
    area: 0,
    city: 'الرياض',
    neighborhood: '',
    details: {}
  });

  const propertyTypeOptions: Record<string, string[]> = {
    residential: ['فيلا', 'شقة', 'قصر', 'أرض', 'بيت شعبي', 'أرض سكنية'],
    commercial: ['محل', 'مكتب', 'عمارة', 'مستودع', 'محل تجاري', 'برج', 'مصنع', 'فندق', 'تجاري']
  };

  const categories = [
    { value: 'orders', label: t('admin.marketing.categories.orders') || (isRtl ? 'الطلبات' : 'Orders') },
    { value: 'offers', label: t('admin.marketing.categories.offers') || (isRtl ? 'العروض' : 'Offers') },
    { value: 'property_management', label: t('admin.marketing.categories.property_management') || (isRtl ? 'إدارة الأملاك' : 'Property Management') },
    { value: 'custom', label: isRtl ? 'مخصص' : 'Custom' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error(isRtl ? 'وصف الإعلان مطلوب' : 'Ad description is required');
      return;
    }

    try {
      setLoading(true);
      const data = {
        ...formData,
        price: Number(formData.price) || 0,
        area: Number(formData.area) || 0,
      };

      const res = await api.post('/marketing/email-marketing', data);
      const savedCampaign = res.data;

      if (images.length > 0 && savedCampaign?.id) {
        const uploadForm = new FormData();
        images.forEach(file => uploadForm.append('files', file));
        await api.post(`/marketing/email-marketing/${savedCampaign.id}/upload/media`, uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      toast.success(isRtl ? 'تم إرسال طلب الإعلان للإدارة بنجاح' : 'Ad request sent to admin successfully');
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
      <DialogContent className="sm:w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto hide-scrollbar p-0 bg-card rounded-[1rem] border-0 shadow-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader className="sr-only">
          <DialogTitle>{isRtl ? 'طلب إضافة إعلان' : 'Request Ad'}</DialogTitle>
          <DialogDescription>
            {isRtl ? 'إرسال طلب إعلان للإدارة للموافقة' : 'Send an ad request to admin for approval'}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Header */}
        <div className="px-6 py-5 bg-muted border-b border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {isRtl ? 'طلب إعلان جديد' : 'Request New Ad'}
              </h2>
              <p className="text-[11px] text-slate-500 font-bold mt-1">
                {isRtl ? 'سيتم مراجعة طلبك من قبل الإدارة' : 'Your request will be reviewed by admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Mail className="w-3 h-3" />
                {isRtl ? 'عنوان الإعلان' : 'Ad title'}
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-muted border border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder={isRtl ? 'عنوان مختصر للإعلان' : 'Short ad title'}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <Type className="w-3 h-3" />
                {isRtl ? 'نوع الإعلان' : 'Ad Category'}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-muted border border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Property details logic if not custom */}
            {formData.category !== 'custom' && (
              <div className="md:col-span-2 bg-muted/50 p-5 rounded-2xl border border space-y-4 my-2 text-right">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  {isRtl ? 'تفاصيل ومواصفات العقار للإعلان' : 'Ad Property Specifications'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'تصنيف العقار' : 'Category'}</label>
                    <div className="flex bg-card p-1 rounded-xl border border gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainCategory: 'residential', propertyType: 'فيلا' })}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${formData.mainCategory === 'residential' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-muted'}`}
                      >
                        {isRtl ? 'سكني' : 'Residential'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainCategory: 'commercial', propertyType: 'مكتب' })}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${formData.mainCategory === 'commercial' ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-muted'}`}
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
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
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
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                    >
                      <option value="بيع">{isRtl ? 'بيع' : 'Sale'}</option>
                      <option value="إيجار">{isRtl ? 'إيجار' : 'Rent'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-1">{isRtl ? 'السعر' : 'Price'} <SaudiRiyalSymbol iconClassName="h-3 w-3" /></label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'المساحة (م²)' : 'Area (m²)'}</label>
                    <input
                      type="number"
                      value={formData.area || ''}
                      onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'المدينة' : 'City'}</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder={isRtl ? 'الرياض' : 'Riyadh'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{isRtl ? 'الحي' : 'Neighborhood'}</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full h-[38px] bg-card border border rounded-xl px-3 text-xs font-bold outline-none focus:border-slate-950 transition-colors"
                      placeholder={isRtl ? 'الياسمين' : 'Al-Yasmin'}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-1">
                <AlertCircle className="w-3 h-3" />
                {isRtl ? 'تفاصيل ومحتوى الإعلان' : 'Ad Details & Content'}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-muted border border rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder={isRtl ? 'اكتب تفاصيل الإعلان هنا...' : 'Write ad details here...'}
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {isRtl ? 'تحميل صور للإعلان' : 'Upload Ad Images'}
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
                className="w-full bg-card border border rounded-xl px-3 py-1.5 text-xs font-bold outline-none transition-colors cursor-pointer"
              />
              {images.length > 0 && (
                <p className="text-[10px] text-emerald-600 font-bold">
                  {isRtl ? `✓ تم تحديد عدد ${images.length} صور للتحميل` : `✓ Selected ${images.length} images for upload`}
                </p>
              )}
            </div>

          </div>

          <div className="pt-4 border-t border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-muted text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isRtl ? 'إرسال الطلب' : 'Send Request'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
