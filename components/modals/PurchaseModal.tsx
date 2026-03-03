"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading?: boolean;
    propertyTitle: string;
    price: string;
}

export default function PurchaseModal({ isOpen, onClose, onConfirm, loading, propertyTitle, price }: PurchaseModalProps) {
    const { t, language } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {language === 'ar' ? 'تأكيد طلب الشراء' : 'Confirm Purchase Request'}
                    </DialogTitle>
                    <DialogDescription>
                        {propertyTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-blue-800">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1">
                                {language === 'ar' ? 'ملاحظة هامة' : 'Important Note'}
                            </p>
                            <p>
                                {language === 'ar' 
                                    ? 'هذا الطلب مبدئي ولا يعتبر نهائياً. سيتم التواصل معك من قبل فريق المبيعات لتأكيد التفاصيل.' 
                                    : 'This is a preliminary request. Our sales team will contact you to confirm details.'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">{language === 'ar' ? 'سعر العقار' : 'Property Price'}</span>
                            <span className="font-bold text-lg">{price}</span>
                        </div>
                       
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex gap-3 w-full sm:justify-end">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button 
                            className="bg-slate-900 hover:bg-slate-800 text-white min-w-[120px]" 
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'تأكيد الطلب' : 'Confirm Request')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
