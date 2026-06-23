"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Loader2, MapPin, Building, Ruler, Calendar, 
    DollarSign, FileText, User, Home, Bath, 
    MessageSquare, ArrowRight, Clock, Map as MapIcon
} from "lucide-react";
import { useLanguage } from '@/context/LanguageContext';
import { ordersApi } from '@/lib/api';
import { chatApi } from '@/lib/chat';
import { Order } from '@/types/api';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const { user: currentUser } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatBasePath = pathname?.startsWith('/internal') ? '/internal/chat' : '/chat';

    const locale = language === 'ar' ? ar : enUS;

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails(orderId);
        } else {
            setOrder(null);
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async (id: string) => {
        try {
            setLoading(true);
            const response = await ordersApi.findOne(id);
            setOrder(response.data);
        } catch (err) {
            console.error(err);
            toast.error(t('common.errorLoad') || 'Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!order || !currentUser) {
            toast.error(t('chat.pleaseLogin') || 'Please login to start a chat');
            return;
        }

        const advertiserId = order.user?.id;
        if (!advertiserId) {
            toast.error('Advertiser information not found');
            return;
        }

        if (currentUser.id === advertiserId) {
            toast.error(t('chat.ownOffer') || "This is your order, you can't chat with yourself");
            return;
        }

        try {
            setIsChatLoading(true);
            const room = await chatApi.getOrCreateOrderRoom({
                orderId: order.id,
                otherId: advertiserId,
                title: `${order.propertyType} - ${order.city}`
            });

            if (room && room.id) {
                router.push(`${chatBasePath}/${room.id}`);
            } else {
                throw new Error('Failed to create chat room');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            toast.error('Failed to start chat. Please try again.');
        } finally {
            setIsChatLoading(false);
        }
    };

    const SpecItem = ({ icon: Icon, label, value, colorClass = "text-slate-500" }: { 
        icon: any, 
        label: string, 
        value: string | number | undefined,
        colorClass?: string 
    }) => {
        if (!value && value !== 0) return null;
        return (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-800 leading-none">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white rounded-[2.5rem] border-0 shadow-2xl flex flex-col max-h-[90vh]">
                {/* Custom Header */}
                <DialogHeader className="sr-only">
                    <DialogTitle>{order?.propertyType || 'Order Details'}</DialogTitle>
                    <DialogDescription>
                        {order?.additionalDetails || t('bm.offer.detailedDesc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative h-24 shrink-0 bg-slate-900 flex items-center px-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                    
                    <div className="relative z-10 flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-black text-xl tracking-tight">
                                    {t('bm.offer.detailed') || 'Order Details'}
                                </h2>
                                {order && (
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">
                                        ID: {order.id.substring(0, 8)}
                                    </p>
                                )}
                            </div>
                        </div>
                        {order && (
                            <Badge className="bg-white text-slate-900 hover:bg-white/90 border-0 rounded-full px-4 py-1.5 font-black text-[10px] tracking-widest uppercase">
                                {order.orderType === 'sale' ? t('bm.offer.dealSale') : t('bm.offer.dealRent')}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-slate-100 animate-pulse"></div>
                                <Loader2 className="w-16 h-16 text-slate-900 animate-spin absolute top-0 left-0" />
                            </div>
                            <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {t('common.loading')}
                            </p>
                        </div>
                    ) : order ? (
                        <>
                            {/* Main Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col justify-center gap-1 group hover:bg-slate-900 hover:border-slate-800 transition-all duration-500">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-slate-800 transition-colors">
                                            <Building className="w-4 h-4 text-slate-600 group-hover:text-slate-300" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500">{t('bm.offer.propertyType')}</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 group-hover:text-white transition-colors">{order.propertyType}</p>
                                </div>
                                
                                <div className="p-6 rounded-[2rem] bg-slate-900 border border-slate-800 flex flex-col justify-center gap-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shadow-sm">
                                            <DollarSign className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('common.price')}</span>
                                    </div>
                                    <p className="text-2xl font-black text-white">
                                        <SaudiRiyalAmount amount={order.price || 0} locale={language === 'ar' ? 'ar-SA' : 'en-US'} iconClassName="h-5 w-5 text-white/40" className="text-2xl font-black text-white" />
                                    </p>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('bm.offer.location')}</span>
                                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <MapIcon className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{t('bm.order.city')}</p>
                                            <p className="text-sm font-bold text-slate-800 mt-0.5">{order.city}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{t('bm.order.neighborhood')}</p>
                                            <p className="text-sm font-bold text-slate-800 mt-0.5">{order.neighborhood}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Specifications Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('bm.offer.specs')}</span>
                                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <SpecItem icon={Ruler} label={t('bm.prop.area')} value={`${order.area} م²`} />
                                    <SpecItem icon={Home} label={t('orders.rooms')} value={order.rooms} />
                                    <SpecItem icon={Bath} label={t('orders.baths')} value={order.bathrooms} />
                                    {order.propertyAge && <SpecItem icon={Calendar} label={t('bm.prop.age')} value={order.propertyAge} />}
                                    {order.livingRooms && <SpecItem icon={Home} label={t('orders.living')} value={order.livingRooms} />}
                                    {order.kitchens && <SpecItem icon={Building} label={t('orders.kitchens')} value={order.kitchens} />}
                                    {order.furnitureStatus && (
                                        <SpecItem 
                                            icon={Home} 
                                            label={t('orders.furniture')} 
                                            value={order.furnitureStatus === 'furnished' ? t('orders.furnished') : t('orders.unfurnished')} 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Additional Details */}
                            {order.additionalDetails && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{t('bm.offer.notes')}</h4>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                                        "{order.additionalDetails}"
                                    </div>
                                </div>
                            )}

                            {/* Timestamp */}
                            <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        {format(new Date(order.createdAt), "EEEE d MMMM yyyy", { locale })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                                    <span className="text-[10px] font-medium text-slate-300">
                                        {format(new Date(order.createdAt), "HH:mm")}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Sticky Footer Actions */}
                <div className="shrink-0 p-8 border-t border-slate-50 bg-white flex flex-col sm:flex-row gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="flex-1 h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                    >
                        {t('common.close')}
                    </Button>
                    
                    {order && currentUser && (
                        <Button 
                            className="flex-[2] h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 group transition-all" 
                            onClick={handleChat}
                            disabled={isChatLoading}
                        >
                            {isChatLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <MessageSquare className="w-5 h-5 me-3 transition-transform group-hover:scale-110" />
                                    {t('chat.customer') || 'Chat with Customer'}
                                    <ArrowRight className={`ms-3 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all ${language === 'ar' ? 'rotate-180 group-hover:translate-x-0' : ''}`} />
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
