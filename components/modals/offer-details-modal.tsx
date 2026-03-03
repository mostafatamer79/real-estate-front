"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Offer } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { chatApi } from "@/lib/chat";
import { 
    Home, 
    Maximize, 
    Calendar, 
    Compass, 
    Layers, 
    Waves, 
    Car, 
    Info,
    MapPin,
    Tag,
    MessageCircle,
    Loader2,
    X,
    ChevronRight,
    Map as MapIcon,
    ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";

interface OfferDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    offer: Offer | null;
}

export default function OfferDetailsModal({ isOpen, onClose, offer }: OfferDetailsModalProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [isChatLoading, setIsChatLoading] = useState(false);

    if (!offer) return null;

    const handleChat = async () => {
        if (!currentUser) {
            toast.error(t('chat.loginRequired') || 'Please login to chat');
            router.push('/login');
            return;
        }

        // Check if the offer advertiser ID exists. We'll try to find it in 'userId' or 'user.id'
        const advertiserId = (offer as any).userId || (offer as any).user?.id;

        if (!advertiserId) {
            toast.error(t('chat.noAdvertiser') || 'Advertiser information missing');
            return;
        }

        if (advertiserId === currentUser.id) {
            toast.error(t('chat.ownOffer') || 'You cannot chat with yourself');
            return;
        }

        setIsChatLoading(true);
        try {
            const room = await chatApi.getOrCreateOfferRoom({
                offerId: offer.id,
                sellerId: advertiserId,
                buyerId: currentUser.id,
                offerTitle: `${offer.propertyType} ${t('offer.in')} ${offer.city}`
            });

            if (room && room.id) {
                router.push(`/chat/${room.id}`);
            } else {
                throw new Error('Failed to create chat room');
            }
        } catch (error) {
            console.error('Chat initiation error:', error);
            toast.error(t('chat.failed') || 'Failed to start chat');
        } finally {
            setIsChatLoading(false);
        }
    };

    const SpecItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number | undefined | null }) => {
        if (value === undefined || value === null || value === '') return null;
        return (
            <div className="flex items-center gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-600 border border-slate-50">
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[750px] max-h-[92vh] rounded-[2.5rem] overflow-hidden p-0 gap-0 border-none shadow-2xl flex flex-col">
                {/* Header/Gallery Area */}
                <div className="h-72 w-full bg-slate-950 relative shrink-0">
                    {offer.mediaFiles && offer.mediaFiles.length > 0 ? (
                        <div className="w-full h-full relative">
                            <img 
                                src={offer.mediaFiles[0]} 
                                alt={offer.propertyType} 
                                className="w-full h-full object-cover opacity-70" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-slate-900">
                            <Home className="w-20 h-20 opacity-10 mb-2" />
                            <p className="text-slate-700 text-xs font-medium uppercase tracking-widest">{t('marketing.photo.empty')}</p>
                        </div>
                    )}
                    
                    {/* Close Button Overlay */}
                    <button 
                        onClick={onClose}
                        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Overlay */}
                    <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-700/50">
                                {offer.dealType === 'sale' ? t('bm.offer.dealSale') : t('bm.offer.dealRent')}
                            </span>
                            <span className="px-3 py-1 bg-white text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                                {offer.propertyType}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                            {offer.propertyType} {t('offer.in')} {offer.city}
                        </h2>
                        <div className="flex items-center gap-4 text-slate-300">
                            <p className="text-xs font-bold flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {offer.city} • {offer.neighborhood}
                            </p>
                            {offer.locationUrl && (
                                <a 
                                    href={offer.locationUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs font-bold flex items-center gap-1.5 hover:text-white transition-colors"
                                >
                                    <MapIcon className="w-3.5 h-3.5 text-slate-400" />
                                    {t('bm.offer.locationUrl')}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body Content - Scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 space-y-10 custom-scrollbar bg-white">
                    {/* Price & Primary Stats */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                <Tag className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('offer.price')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {offer.price.toLocaleString()}
                                </span>
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">SAR</span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                <Maximize className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('offer.area')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {offer.area}
                                </span>
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">m²</span>
                            </div>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                             <div className="h-[1px] flex-1 bg-slate-100" />
                             {t('offer.basic')}
                             <div className="h-[1px] flex-1 bg-slate-100" />
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <SpecItem icon={Calendar} label={t('offer.age')} value={offer.propertyAge} />
                            <SpecItem icon={Compass} label={t('offer.direction')} value={offer.direction} />
                            <SpecItem icon={Tag} label={t('offer.deed')} value={offer.deedType} />
                            <SpecItem icon={Maximize} label={t('offer.streetWidth')} value={offer.streetWidth ? `${offer.streetWidth}m` : null} />
                            <SpecItem icon={Layers} label={t('offer.floors')} value={offer.floors} />
                            <SpecItem icon={Info} label={t('offer.condition')} value={offer.propertyCondition} />
                        </div>
                    </section>

                    {/* Rooms & Facilities */}
                    {(offer.rooms || offer.bathrooms || offer.livingRooms || offer.kitchens) && (
                        <section>
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-slate-100" />
                                {t('offer.facilities')}
                                <div className="h-[1px] flex-1 bg-slate-100" />
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <SpecItem icon={Home} label={t('offer.rooms')} value={offer.rooms} />
                                <SpecItem icon={Home} label={t('offer.baths')} value={offer.bathrooms} />
                                <SpecItem icon={Home} label={t('offer.living')} value={offer.livingRooms} />
                                <SpecItem icon={Home} label={t('offer.kitchens')} value={offer.kitchens} />
                            </div>
                        </section>
                    )}

                    {/* Features/Amenities */}
                    {(offer.hasElevator || offer.hasGarage || offer.hasPool || offer.hasRoof || offer.hasMaidRoom) && (
                         <section>
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-slate-100" />
                                {t('offer.features')}
                                <div className="h-[1px] flex-1 bg-slate-100" />
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {offer.hasElevator && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.elevator')}
                                    </div>
                                )}
                                {offer.hasGarage && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <Car className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.garage')}
                                    </div>
                                )}
                                {offer.hasPool && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <Waves className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.pool')}
                                    </div>
                                )}
                                {offer.hasRoof && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.roof')}
                                    </div>
                                )}
                                {offer.hasMaidRoom && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 font-bold text-xs rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all duration-300">
                                        <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.maid')}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Description */}
                    {offer.additionalNotes && (
                        <section className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
                            <h3 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-widest">{t('marketing.field.description')}</h3>
                            <p className="text-sm text-slate-600 leading-[1.8] font-medium italic">
                                "{offer.additionalNotes}"
                            </p>
                        </section>
                    )}
                </div>

                {/* Footer Section - Sticky */}
                <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 shrink-0">
                    <Button 
                        onClick={handleChat}
                        disabled={isChatLoading}
                        className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {isChatLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <MessageCircle className="w-5 h-5" />
                                {t('chat.start') || 'Chat with Advertiser'}
                            </>
                        )}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black text-sm tracking-widest uppercase transition-all">
                             {t('common.close')}
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #e2e8f0;
                }
            `}</style>
        </Dialog>
    );
}
