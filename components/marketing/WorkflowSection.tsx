"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Search, Filter, FileDown, 
  MoreHorizontal, Eye, Trash2, CheckCircle, 
  Clock, AlertCircle, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useLanguage } from "@/context/LanguageContext";
import { marketingApi, MarketingRequest, MarketingRequestStatus } from '@/lib/marketing-service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/components/ui/confirm-dialog-provider';

export default function WorkflowSection() {
    const { t, language } = useLanguage();
    const confirmDialog = useConfirmDialog();
    const [requests, setRequests] = useState<MarketingRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<MarketingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    
    // Details Modal State
    const [selectedRequest, setSelectedRequest] = useState<MarketingRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await marketingApi.getMyRequests();
                data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setRequests(data);
                setFilteredRequests(data);
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        load();
    }, []);

    useEffect(() => {
        setFilteredRequests(statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter));
    }, [statusFilter, requests]);

    const handleDeleteRequest = async (requestId: string) => {
        const ok = await confirmDialog({
            title: t('common.deleteConfirm'),
            confirmLabel: language === 'ar' ? 'حذف' : 'Delete',
            cancelLabel: language === 'ar' ? 'إلغاء' : 'Cancel',
            destructive: true,
        });
        if (!ok) return;
        try {
            await marketingApi.deleteRequest(requestId);
            toast.success(t('orders.deleteSuccess'));
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (err) {
            console.error(err);
            toast.error(t('orders.deleteError'));
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl shadow-slate-200/50"
        >
            <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50">
                <div>
                    <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                      {t('marketing.history.title')}
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    </h4>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 ml-1">
                        {t('marketing.history.desc') || (t('marketing.requests.count') + ': ' + filteredRequests.length)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none h-11 rounded-xl border-slate-200 hover:bg-slate-50 gap-2 font-bold text-[10px] uppercase tracking-widest transition-all">
                        <FileDown className="w-3.5 h-3.5" />
                        {t('marketing.btn.export')}
                    </Button>
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl gap-1 border border-slate-200/50">
                      {['all', 'pending', 'completed'].map((f) => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f as any)}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
                        >
                          {f === 'all' ? t('marketing.filter.all') : t('marketing.status.' + f)}
                        </button>
                      ))}
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto hide-scrollbar">
                <Table>
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.request')}</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.date')}</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.status')}</TableHead>
                                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100/50">
                            {filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className='text-center py-24'>
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <div className="p-4 bg-slate-100 rounded-full">
                                                <ClipboardList className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <p className="font-black text-xs uppercase tracking-widest text-slate-400">{t('marketing.noRequests')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.map((req, i) => (
                                <TableRow key={req.id} className="hover:bg-slate-50/50 transition-colors group border-slate-50">
                                    <TableCell className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-110
                                                ${req.type === 'photography_professional' ? 'bg-blue-100 text-blue-600' : 
                                                  req.type === 'ad_campaign' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {t('marketing.type.' + req.type).charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-sm group-hover:text-slate-900 transition-colors">{t('marketing.type.' + req.type)}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold">#{req.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(req.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-CA')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(req.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-6">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm
                                            ${req.status === MarketingRequestStatus.PENDING ? 'bg-slate-50 text-slate-500 border-slate-100' : 
                                              req.status === MarketingRequestStatus.COMPLETED ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' : 
                                              req.status === MarketingRequestStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                            <div className={`w-1 h-1 rounded-full ${req.status === MarketingRequestStatus.PENDING ? 'bg-slate-400 animate-pulse' : 'bg-current'} ${language === 'ar' ? 'ml-1.5' : 'mr-1.5'}`} />
                                            {t('marketing.status.' + req.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-8 py-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setIsDetailsOpen(true);
                                                }}
                                                className="w-9 h-9 rounded-lg border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                onClick={() => handleDeleteRequest(req.id)}
                                                className="w-9 h-9 rounded-lg border-slate-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all text-slate-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                </Table>
            </div>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader className="p-8 bg-slate-950 text-white">
                        <DialogTitle className="text-2xl font-black">
                            {selectedRequest && t(`marketing.type.${selectedRequest.type}`)}
                        </DialogTitle>
                        <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                            #{selectedRequest?.id.substring(0, 8)}
                        </p>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.status')}</label>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border
                                                ${selectedRequest.status === MarketingRequestStatus.PENDING ? 'bg-slate-50 text-slate-500 border-slate-100' : 
                                                  selectedRequest.status === MarketingRequestStatus.COMPLETED ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20' : 
                                                  selectedRequest.status === MarketingRequestStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                {t('marketing.status.' + selectedRequest.status)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.date')}</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-slate-900">
                                                {new Date(selectedRequest.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-CA')}
                                                {' • '}
                                                {new Date(selectedRequest.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pm.field.propertyName')}</label>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-900">
                                                {selectedRequest.details?.propertyId || t('common.noData')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('pm.field.notes')}</label>
                                        <p className="font-medium text-slate-600 text-sm">
                                            {selectedRequest.details?.notes || t('common.noData')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {selectedRequest.details?.platform && (
                                <div className="space-y-2 pt-6 border-t border-slate-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</label>
                                    <p className="text-sm font-medium text-slate-600 p-4 bg-slate-50 rounded-2xl">{selectedRequest.details?.platform?.join?.(', ') || selectedRequest.details?.platform}</p>
                                </div>
                            )}

                             {selectedRequest.details?.preferredDate && (
                                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>تاريخ مفضل: {new Date(selectedRequest.details?.preferredDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </motion.div>
    );
}
