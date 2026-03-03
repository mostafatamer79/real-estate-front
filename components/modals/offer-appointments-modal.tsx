"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bookingsApi } from '@/lib/api';
import { Booking } from '@/types/api';
import { useLanguage } from '@/context/LanguageContext';
import { Calendar, Clock, User, Phone, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OfferAppointmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string | null;
    propertyTitle?: string;
}

export default function OfferAppointmentsModal({ isOpen, onClose, offerId, propertyTitle }: OfferAppointmentsModalProps) {
    const { t, language } = useLanguage();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && offerId) {
            fetchBookings();
        }
    }, [isOpen, offerId]);

    const fetchBookings = async () => {
        if (!offerId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await bookingsApi.getOfferBookings(offerId);
            setBookings(response.data);
        } catch (err) {
            console.error('Error fetching bookings:', err);
            setError(language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading appointments');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'accepted':
            case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
            case 'rejected':
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        if (language !== 'ar') return status.charAt(0).toUpperCase() + status.slice(1);
        
        switch (status.toLowerCase()) {
            case 'pending': return 'قيد الانتظار';
            case 'accepted': return 'تم القبول';
            case 'confirmed': return 'مؤكد';
            case 'rejected': return 'مرفوض';
            case 'cancelled': return 'ملغى';
            case 'completed': return 'مكتمل';
            default: return status;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-slate-700" />
                        {language === 'ar' ? 'مواعيد العقار' : 'Property Appointments'}
                    </DialogTitle>
                    {propertyTitle && (
                        <p className="text-slate-500 mt-1">
                            {propertyTitle}
                        </p>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-4" />
                            <p className="text-slate-500">
                                {language === 'ar' ? 'جاري تحميل المواعيد...' : 'Loading appointments...'}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                            <p className="text-red-600 font-medium mb-2">{error}</p>
                            <button 
                                onClick={fetchBookings}
                                className="text-slate-900 underline hover:text-slate-700 transition-colors"
                            >
                                {language === 'ar' ? 'إعادة المحاولة' : 'Try again'}
                            </button>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">
                                {language === 'ar' ? 'لا توجد مواعيد لهذا العقار حتى الآن' : 'No appointments yet for this property'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-4 pb-6">
                                {bookings.map((booking) => (
                                    <div 
                                        key={booking.id} 
                                        className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                                                    <User className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {booking.user?.firstName || (language === 'ar' ? 'مستخدم' : 'User')}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {new Date(booking.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                                            {' - '}
                                                            {booking.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className={`${getStatusColor(booking.status)} px-3 py-1 font-medium capitalize`}>
                                                {getStatusLabel(booking.status)}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-slate-50 rounded-lg p-3">
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <span>{booking.user?.phone || (language === 'ar' ? 'غير متوفر' : 'Not available')}</span>
                                            </div>
                                            <div className="flex items-center gap-2.5 text-slate-600">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="truncate">{booking.user?.email}</span>
                                            </div>
                                        </div>

                                        {booking.notes && (
                                            <div className="mt-4 flex gap-2.5 items-start bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
                                                <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                                <div className="text-sm">
                                                    <p className="text-blue-900/60 font-semibold mb-1">
                                                        {language === 'ar' ? 'ملاحظات العميل:' : 'Customer Notes:'}
                                                    </p>
                                                    <p className="text-blue-900/80 leading-relaxed italic">
                                                        "{booking.notes}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
