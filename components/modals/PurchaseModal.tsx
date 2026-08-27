"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { hapticTick } from '@/lib/haptics';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    propertyTitle: string;
    price: React.ReactNode;
}

export default function PurchaseModal({ isOpen, onClose, onConfirm, loading, propertyTitle, price }: PurchaseModalProps) {
    const { t, language } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] sm:max-w-[500px] rounded-2xl border-0 p-0 overflow-hidden bg-gradient-to-b from-white to-slate-50">
                <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {language === 'ar' ? 'تأكيد طلب الشراء' : 'Confirm Purchase Request'}
                        </DialogTitle>
                        <DialogDescription>
                            {propertyTitle}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-6 space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800"
                        >
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">
                                    {language === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
                                </p>
                                <p className="text-blue-700 leading-relaxed">
                                    {language === 'ar' 
                                        ? 'هذا الطلب مبدئي ولا يعتبر نهائياً. سيتم التواصل معك من قبل فريق المبيعات لتأكيد التفاصيل.' 
                                        : 'This is a preliminary request. Our sales team will contact you to confirm details.'}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="space-y-3"
                        >
                            <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-gray-500 font-medium">{language === 'ar' ? 'سعر العقار' : 'Property Price'}</span>
                                <span className="font-black text-lg text-slate-900">{price}</span>
                            </div>
                        </motion.div>
                    </div>

                    <DialogFooter className="p-6 pt-0">
                        <div className="flex gap-3 w-full sm:justify-end">
                            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 sm:flex-none h-11 rounded-xl font-semibold">
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button 
                                className="flex-1 sm:flex-none h-11 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/25" 
                                onClick={() => { onConfirm(); hapticTick(); }}
                                disabled={loading}
                            >
                                {loading ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'تأكيد الطلب' : 'Confirm Request')}
                            </Button>
                        </div>
                    </DialogFooter>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}
