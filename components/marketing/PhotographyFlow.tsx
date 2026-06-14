"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Calendar, Clock, Loader2, 
  Rocket, Trash2, CheckCircle, Info,
  Sparkles, ShieldCheck, MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from "@/context/LanguageContext";
import { marketingApi, MarketingRequest, MarketingRequestType, MarketingRequestStatus } from '@/lib/marketing-service';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider';

export default function PhotographyFlow() {
    const { t, language } = useLanguage();
    const confirmDialog = useConfirmDialog();
    const [formData, setFormData] = useState({
        propertyId: '',
        date: '',
        time: '',
        notes: '',
        type: MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL
    });
    const [submitting, setSubmitting] = useState(false);
    const [myRequests, setMyRequests] = useState<MarketingRequest[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const requests = await marketingApi.getMyRequests();
                const photoRequests = requests.filter(r => 
                    r.type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL || 
                    r.type === MarketingRequestType.PHOTOGRAPHY_FIELD
                );
                photoRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setMyRequests(photoRequests);
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [refreshTrigger]);

    const handleSubmit = async () => {
        if (!formData.propertyId || !formData.date) {
            toast.error(t('orders.required'));
            return;
        }
        setSubmitting(true);
        try {
            await marketingApi.createRequest({
                type: formData.type,
                details: {
                    propertyId: formData.propertyId,
                    preferredDate: formData.date,
                    preferredTime: formData.time,
                    notes: formData.notes
                }
            });
            toast.success(t('orders.success'));
            setFormData(prev => ({ ...prev, propertyId: '', date: '', time: '', notes: '' }));
            setRefreshTrigger(prev => prev + 1);
        } catch (err: any) {
            toast.error(t('orders.error'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRequest = async (id: string) => {
        const ok = await confirmDialog({
            title: t('common.deleteConfirm'),
            confirmLabel: language === 'ar' ? 'حذف' : 'Delete',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
            destructive: true,
        });
        if (!ok) return;
        try {
            await marketingApi.deleteRequest(id);
            toast.success(t('bm.request.success'));
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error(err);
            toast.error(t('bm.toast.error'));
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Request Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5"
            >
                <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
                    <div className="p-10 bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-50" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                                <Camera className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight">{t('marketing.photo.req')}</h3>
                                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">{t('marketing.photo.steps')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-10 space-y-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('marketing.photo.type')}</Label>
                            <Select 
                                value={formData.type} 
                                onValueChange={(val) => setFormData({...formData, type: val as MarketingRequestType})}
                            >
                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-bold text-sm">
                                    <SelectValue placeholder={t('marketing.photo.type')} />
                                </SelectTrigger>
                                <SelectContent dir={language === 'ar' ? 'rtl' : 'ltr'} className="rounded-2xl border-slate-100 shadow-2xl p-2">
                                    <SelectItem value={MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL} className="py-3 px-4 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors my-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-sm text-slate-900">{t('marketing.photo.professional')}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{t('marketing.photo.resolution')}</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={MarketingRequestType.PHOTOGRAPHY_FIELD} className="py-3 px-4 rounded-xl cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors my-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-sm text-slate-900">{t('marketing.photo.field')}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{t('marketing.photo.fieldDesc')}</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('marketing.photo.propId')}</Label>
                            <div className="relative group">
                                <Input 
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 px-5 transition-all text-sm font-bold placeholder:font-normal"
                                    value={formData.propertyId}
                                    onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                                    placeholder="PRP-1001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('marketing.photo.date')}</Label>
                                <Input 
                                    type="date" 
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-bold text-xs px-4"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('marketing.photo.time')}</Label>
                                <Input 
                                    type="time" 
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all font-bold text-xs px-4" 
                                    value={formData.time}
                                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{t('marketing.photo.notes')}</Label>
                            <Textarea 
                                className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-slate-100 focus:border-slate-300 transition-all resize-none p-5 font-bold text-sm placeholder:font-normal"
                                placeholder={t('marketing.photo.notesPlaceholder')} 
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            />
                        </div>

                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit} 
                            disabled={submitting}
                            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                                <>
                                    <Rocket className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                    {t('marketing.btn.submit')}
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* My Requests List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-7 space-y-6"
            >
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                        <Camera className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">
                            {t('marketing.myRequests')}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('marketing.requests.active')}</p>
                        </div>
                    </div>
                  </div>
                  <div className="bg-white px-5 py-2.5 rounded-xl text-xs font-black text-slate-900 border border-slate-100 shadow-sm shadow-slate-100/50">
                    {myRequests.length} <span className="text-slate-400 font-bold ml-1">{t('marketing.requests.count')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                    {myRequests.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-24 text-slate-300 rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-white/50"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Camera className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="font-black text-xs opacity-50 uppercase tracking-widest">{t('marketing.noRequests')}</p>
                        </motion.div>
                    ) : (
                        myRequests.map((req, i) => (
                             <motion.div 
                               layout
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.9 }}
                               transition={{ delay: i * 0.05 }}
                               key={req.id} 
                               className="group bg-white border border-slate-100 rounded-[2rem] p-5 lg:p-6 flex flex-col md:flex-row justify-between items-center hover:border-slate-900 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default relative overflow-hidden text-right"
                               dir={language === 'ar' ? 'rtl' : 'ltr'}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-slate-100 transition-colors -z-10" />
                                
                                <div className="flex items-center gap-5 w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:scale-110 transition-transform duration-500">
                                        <Camera className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-black text-base text-slate-900 tracking-tight">
                                            {req.type === MarketingRequestType.PHOTOGRAPHY_PROFESSIONAL ? t('marketing.photo.professional') : t('marketing.photo.field')}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3">
                                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg">
                                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                              <p className="text-[10px] text-slate-500 font-bold">
                                                  {new Date(req.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-CA')}
                                              </p>
                                          </div>
                                          {req.details?.propertyId && (
                                              <div className="text-[9px] font-black bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-wider">
                                                  {t('marketing.photo.propId')}: {req.details.propertyId}
                                              </div>
                                          )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 md:text-right w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-3 min-w-[120px]">
                                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm
                                        ${req.status === MarketingRequestStatus.PENDING ? 'bg-slate-50 text-slate-500 border-slate-100' : 
                                          req.status === MarketingRequestStatus.COMPLETED ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' : 
                                          req.status === MarketingRequestStatus.REJECTED ? 'bg-red-50 text-red-500 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${req.status === MarketingRequestStatus.PENDING ? 'bg-slate-400 animate-pulse' : 'bg-current'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                        {t('marketing.status.' + req.status)}
                                    </span>
                                     <motion.button 
                                        whileHover={{ scale: 1.1, backgroundColor: '#FEF2F2', borderColor: '#FEE2E2', color: '#EF4444' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDeleteRequest(req.id)}
                                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 transition-all shadow-sm"
                                        title={t('common.delete')}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                </div>
                            </motion.div>
                        ))
                    )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
