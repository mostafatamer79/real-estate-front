"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Offer } from "@/types/api";
import { useLanguage } from "@/context/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { chatApi } from "@/lib/chat";
import { offersApi } from "@/lib/api";
import { SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
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
    const pathname = usePathname();
    const { user: currentUser } = useAuth();
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [hydratedOffer, setHydratedOffer] = useState<Offer | null>(offer);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    useEffect(() => {
        setHydratedOffer(offer);
    }, [offer]);

    useEffect(() => {
        const fetchOfferDetails = async () => {
            if (!isOpen || !offer?.id) return;
            try {
                setIsLoadingDetails(true);
                const response = await offersApi.findOne(offer.id);
                setHydratedOffer(response.data || offer);
            } catch (error) {
                console.error("Failed to load offer details:", error);
                setHydratedOffer(offer);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchOfferDetails();
    }, [isOpen, offer]);

    if (!hydratedOffer) return null;

    const activeOffer = hydratedOffer;
    const chatBasePath = pathname?.startsWith('/internal') ? '/internal/chat' : '/chat';

    const handleChat = async () => {
        if (!currentUser) {
            toast.error(t('chat.loginRequired') || 'Please login to chat');
            router.push('/login');
            return;
        }

        // Check if the offer advertiser ID exists. We'll try to find it in 'userId' or 'user.id'
        const advertiserId = (activeOffer as any).userId || (activeOffer as any).user?.id;

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
                offerId: activeOffer.id,
                sellerId: advertiserId,
                buyerId: currentUser.id,
                offerTitle: `${activeOffer.propertyType} ${t('offer.in')} ${activeOffer.city}`
            });

            if (room && room.id) {
                router.push(`${chatBasePath}/${room.id}`);
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
            <div className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-2xl border border-/50 hover:bg-card hover:shadow-sm transition-all duration-300">
                <div className="w-9 h-9 rounded-xl bg-card shadow-sm flex items-center justify-center text-slate-600 border border">
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
            <DialogContent className="sm:max-w-[750px] max-h-[92vh] rounded-[1rem] overflow-hidden p-0 gap-0 border-none shadow-2xl flex flex-col">
                {/* Header/Gallery Area */}
                <div className="h-72 w-full bg-slate-950 relative shrink-0">
                    {activeOffer.mediaFiles && activeOffer.mediaFiles.length > 0 ? (
                        <div className="w-full h-full relative">
                            <img 
                                src={activeOffer.mediaFiles[0]} 
                                alt={activeOffer.propertyType} 
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
                        className="absolute top-6 left-6 w-10 h-10 rounded-full bg-card/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-card/20 transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content Overlay */}
                    <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-slate-800/80 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-700/50">
                                {activeOffer.dealType === 'sale' ? t('bm.offer.dealSale') : t('bm.offer.dealRent')}
                            </span>
                            <span className="px-3 py-1 bg-card text-slate-950 text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg">
                                {activeOffer.propertyType}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                            {activeOffer.propertyType} {t('offer.in')} {activeOffer.city}
                        </h2>
                        <div className="flex items-center gap-4 text-slate-300">
                            <p className="text-xs font-bold flex items-center gap-1.5 bg-card/5 backdrop-blur-sm px-2.5 py-1 rounded-full">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {activeOffer.city} • {activeOffer.neighborhood}
                            </p>
                            {activeOffer.locationUrl && (
                                <a 
                                    href={activeOffer.locationUrl} 
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
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 space-y-10 custom-scrollbar bg-card">
                    {/* Price & Primary Stats */}
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 p-6 bg-muted rounded-3xl border border relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                <Tag className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('offer.price')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                {activeOffer.price.toLocaleString()}
                                </span>
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></span>
                            </div>
                        </div>
                        <div className="flex-1 p-6 bg-muted rounded-3xl border border relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                <Maximize className="w-12 h-12 text-slate-900" />
                            </div>
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mb-2">{t('offer.area')}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {activeOffer.area}
                                </span>
                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">m²</span>
                            </div>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <section>
                        <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                             <div className="h-[1px] flex-1 bg-muted" />
                             {t('offer.basic')}
                             <div className="h-[1px] flex-1 bg-muted" />
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <SpecItem icon={Calendar} label={t('offer.age')} value={activeOffer.propertyAge} />
                            <SpecItem icon={Compass} label={t('offer.direction')} value={activeOffer.direction} />
                            <SpecItem icon={Tag} label={t('offer.deed')} value={activeOffer.deedType} />
                            <SpecItem icon={Maximize} label={t('offer.streetWidth')} value={activeOffer.streetWidth ? `${activeOffer.streetWidth}m` : null} />
                            <SpecItem icon={Layers} label={t('offer.floors')} value={activeOffer.floors} />
                            <SpecItem icon={Info} label={t('offer.condition')} value={activeOffer.propertyCondition} />
                        </div>
                    </section>

                    {/* Rooms & Facilities */}
                    {(activeOffer.rooms || activeOffer.bathrooms || activeOffer.livingRooms || activeOffer.kitchens) && (
                        <section>
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-muted" />
                                {t('offer.facilities')}
                                <div className="h-[1px] flex-1 bg-muted" />
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <SpecItem icon={Home} label={t('offer.rooms')} value={activeOffer.rooms} />
                                <SpecItem icon={Home} label={t('offer.baths')} value={activeOffer.bathrooms} />
                                <SpecItem icon={Home} label={t('offer.living')} value={activeOffer.livingRooms} />
                                <SpecItem icon={Home} label={t('offer.kitchens')} value={activeOffer.kitchens} />
                            </div>
                        </section>
                    )}

                    {/* Features/Amenities */}
                    {(activeOffer.hasElevator || activeOffer.hasGarage || activeOffer.hasPool || activeOffer.hasRoof || activeOffer.hasMaidRoom) && (
                         <section>
                            <h3 className="text-xs font-black text-slate-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="h-[1px] flex-1 bg-muted" />
                                {t('offer.features')}
                                <div className="h-[1px] flex-1 bg-muted" />
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {activeOffer.hasElevator && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-muted text-slate-600 font-bold text-xs rounded-2xl border border hover:bg-card hover:shadow-sm transition-all duration-300">
                                        <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.elevator')}
                                    </div>
                                )}
                                {activeOffer.hasGarage && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-muted text-slate-600 font-bold text-xs rounded-2xl border border hover:bg-card hover:shadow-sm transition-all duration-300">
                                        <Car className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.garage')}
                                    </div>
                                )}
                                {activeOffer.hasPool && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-muted text-slate-600 font-bold text-xs rounded-2xl border border hover:bg-card hover:shadow-sm transition-all duration-300">
                                        <Waves className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.pool')}
                                    </div>
                                )}
                                {activeOffer.hasRoof && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-muted text-slate-600 font-bold text-xs rounded-2xl border border hover:bg-card hover:shadow-sm transition-all duration-300">
                                        <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.roof')}
                                    </div>
                                )}
                                {activeOffer.hasMaidRoom && (
                                    <div className="group flex items-center gap-2 px-4 py-2.5 bg-muted text-slate-600 font-bold text-xs rounded-2xl border border hover:bg-card hover:shadow-sm transition-all duration-300">
                                        <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                                        {t('offer.maid')}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Description */}
                    {activeOffer.additionalNotes && (
                        <section className="bg-muted/50 p-6 rounded-[1.25rem] border border-/50">
                            <h3 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-widest">{t('marketing.field.description')}</h3>
                            <p className="text-sm text-slate-600 leading-[1.8] font-medium italic">
                                "{activeOffer.additionalNotes}"
                            </p>
                        </section>
                    )}
                </div>

                {/* Footer Section - Sticky */}
                <div className="p-6 sm:p-8 bg-card border-t border flex flex-col sm:flex-row gap-4 shrink-0">
                    <Button 
                        onClick={handleChat}
                        disabled={isChatLoading || isLoadingDetails}
                        className="flex-[2] h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl shadow-stone-400/10 transition-all active:scale-95 disabled:opacity-70"
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
                        <Button variant="outline" className="flex-1 h-14 rounded-2xl border text-slate-400 hover:text-slate-900 hover:bg-muted font-black text-sm tracking-widest uppercase transition-all">
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
