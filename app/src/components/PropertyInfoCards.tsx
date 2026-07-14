"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Megaphone, FileText, PlusCircle, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useSettings } from "@/context/SettingsContext";
import ComingSoonInline from "@/components/ComingSoonInline";
import RequestAdModal from "@/components/modals/RequestAdModal";

interface PropertyInfoCardsProps {
  propertyId?: string;
  operations?: any[];
  marketingRequests?: any[];
  userRole?: string;
}

export default function PropertyInfoCards({ propertyId, operations = [], marketingRequests = [], userRole }: PropertyInfoCardsProps) {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isRequestAdModalOpen, setIsRequestAdModalOpen] = useState(false);

  const handleCardClick = (cardType: string) => setSelectedCard(cardType);
  const handleCloseModal = () => setSelectedCard(null);

  const getCardTitle = (cardType: string) => {
    switch (cardType) {
      case "operations": return t('cards.prevOperations');
      case "ads": return t('cards.dealsAds');
      default: return "";
    }
  };

  const getActivityText = (activity: any) => {
    const title = String(activity?.title || '');
    const description = String(activity?.description || '');
    const userName = description.replace(/\s*joined the system\.?$/i, '').trim();

    if (title.toLowerCase() === 'new user joined') {
      return {
        title: language === 'ar' ? 'انضم مستخدم جديد' : 'New User Joined',
        description: language === 'ar'
          ? `${userName || 'مستخدم'} انضم إلى النظام`
          : description || `${userName || 'User'} joined the system`,
      };
    }

    return {
      title: title || description || t('cards.prevOperations'),
      description,
    };
  };

  const getActivityDate = (activity: any) => {
    const value = activity?.timestamp || activity?.createdAt || activity?.updatedAt;
    return value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="w-full grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* ── Operations Card ── */}
        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card
            className="
              relative overflow-hidden group h-full cursor-pointer
              bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900
              border border-slate-700/60 hover:border-slate-600/80
              shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(99,102,241,0.08)]
              transition-all duration-500
            "
            onClick={() => {
              if (settings.sectionFlags.wallet === 'hidden' || settings.sectionFlags.wallet === 'closed') return;
              handleCardClick("operations");
            }}
          >
            {settings.sectionFlags.wallet === 'hidden' ? null : settings.sectionFlags.wallet === 'closed' ? (
              <div className="absolute inset-0 z-50">
                <ComingSoonInline 
                  sectionName={t('cards.prevOperations')} 
                  message={settings.sectionMessages.wallet} 
                />
              </div>
            ) : null}
            {/* Soon Badge */}
            {settings.sectionFlags.financial === 'hidden' ? null : settings.sectionFlags.financial === 'closed' && (
              <div
                className="absolute top-4 left-4 z-20 px-2 py-0.5 text-[8px] font-black rounded-full shadow-lg ring-1 ring-white/10 border"
                style={{
                  backgroundColor: "var(--soon-badge-bg, #ffffff)",
                  color: "var(--soon-badge-text, #000000)",
                  borderColor: "var(--soon-badge-bg, #ffffff)",
                }}
              >
                {t('common.soon') || 'قريباً'}
              </div>
            )}
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 -mr-20 -mt-20 rounded-full bg-indigo-500/8 blur-3xl group-hover:bg-indigo-500/15 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 -ml-10 -mb-10 rounded-full bg-slate-600/20 blur-2xl" />

            {/* Top shimmer line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-4">
                <div className="
                  p-2.5 rounded-xl
                  bg-gradient-to-br from-slate-700 to-slate-800
                  border border-slate-600/50
                  text-indigo-400 group-hover:text-indigo-300
                  shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                  group-hover:shadow-[0_2px_12px_rgba(99,102,241,0.25)]
                  transition-all duration-300
                ">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <CardTitle className="text-base font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                  {t('cards.prevOperations')}
                </CardTitle>
              </div>
            
            </CardHeader>

            <CardContent className="relative z-10">
              <div className="space-y-3">
                {operations.slice(0, 2).map((op, i) => {
                  const activityText = getActivityText(op);
                  return (
                    <div
                      key={op.id || i}
                      className="
                        p-4 rounded-xl
                        bg-slate-700/25 hover:bg-slate-700/45
                        border border-slate-700/40 hover:border-slate-600/50
                        transition-all duration-200
                      "
                    >
                      <p className="font-semibold text-sm mb-1 text-slate-200">{activityText.title}</p>
                      <p className="text-slate-400 text-xs">{activityText.description}</p>
                    </div>
                  );
                })}
                {operations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-900/30 border border-slate-700/40 rounded-2xl border-dashed">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium text-center">{t('cards.noOperations')}</p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 relative z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="
                      w-full
                      bg-slate-700/60 hover:bg-slate-700
                      border border-slate-600/40 hover:border-slate-500/60
                      text-slate-400 hover:text-slate-100
                      font-semibold py-2.5 px-4 rounded-xl
                      transition-all duration-200 text-sm
                      flex items-center justify-center gap-2
                    "
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (settings.sectionFlags.wallet === 'hidden' || settings.sectionFlags.wallet === 'closed') return;
                      handleCardClick("operations"); 
                    }}
                  >
                    {t('cards.viewAll')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs font-bold px-2 py-1.5 rounded-lg shadow-xl">
                  {t('cards.viewAll')}
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        </motion.div>

        {/* ── Ads Card ── */}
        <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card
            className="
              relative overflow-hidden group h-full cursor-pointer
              bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900
              border border-slate-700/60 hover:border-slate-600/80
              shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.06)]
              transition-all duration-500
            "
            onClick={() => {
              if (settings.sectionFlags.offers === 'hidden' || settings.sectionFlags.offers === 'closed') return;
              handleCardClick("ads");
            }}
          >
            {settings.sectionFlags.offers === 'hidden' ? null : settings.sectionFlags.offers === 'closed' ? (
              <div className="absolute inset-0 z-50">
                <ComingSoonInline 
                  sectionName={t('cards.dealsAds')} 
                  message={settings.sectionMessages.offers} 
                />
              </div>
            ) : null}
            {/* Soon Badge */}
            {settings.sectionFlags.offers === 'hidden' ? null : settings.sectionFlags.offers === 'closed' && (
              <div
                className="absolute top-4 left-4 z-20 px-2 py-0.5 text-[8px] font-black rounded-full shadow-lg ring-1 ring-white/10 border"
                style={{
                  backgroundColor: "var(--soon-badge-bg, #ffffff)",
                  color: "var(--soon-badge-text, #000000)",
                  borderColor: "var(--soon-badge-bg, #ffffff)",
                }}
              >
                {t('common.soon') || 'قريباً'}
              </div>
            )}
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-48 h-48 -mr-20 -mt-20 rounded-full bg-emerald-500/6 blur-3xl group-hover:bg-emerald-500/12 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-32 h-32 -ml-10 -mb-10 rounded-full bg-slate-600/20 blur-2xl" />

            {/* Top shimmer line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div className="flex items-center gap-4">
                <div className="
                  p-2.5 rounded-xl
                  bg-gradient-to-br from-slate-700 to-slate-800
                  border border-slate-600/50
                  text-emerald-400 group-hover:text-emerald-300
                  shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                  group-hover:shadow-[0_2px_12px_rgba(16,185,129,0.2)]
                  transition-all duration-300
                ">
                  <Megaphone className="h-5 w-5 text-slate-400" />
                </div>
                <CardTitle className="text-base font-bold tracking-tight text-slate-100 group-hover:text-white transition-colors">
                  {t('cards.dealsAds')}
                </CardTitle>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsRequestAdModalOpen(true); }}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors"
                title={language === 'ar' ? 'إضافة إعلان جديد' : 'Request New Ad'}
              >
                <PlusCircle className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="relative z-10">
              <div className="space-y-3">
                {marketingRequests.slice(0, 2).map((ad, i) => (
                  <div
                    key={i}
                    className="
                      p-4 rounded-xl
                      bg-slate-700/25 hover:bg-slate-700/45
                      border border-slate-700/40 hover:border-slate-600/50
                      transition-all duration-200
                    "
                  >
                    <p className="font-semibold text-sm mb-1 text-slate-200">{ad.subject || ad.title || t('cards.ads.featured')}</p>
                    <p className="text-slate-400 text-xs line-clamp-1">{ad.content || ad.description || ad.category || t('cards.ads.special')}</p>
                  </div>
                ))}
                {marketingRequests.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 bg-slate-900/30 border border-slate-700/40 rounded-2xl border-dashed">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                      <Megaphone className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium text-center">{t('cards.noAds')}</p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="pt-2 relative z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="
                      w-full
                      bg-slate-700/60 hover:bg-slate-700
                      border border-slate-600/40 hover:border-slate-500/60
                      text-slate-400 hover:text-slate-100
                      font-semibold py-2.5 px-4 rounded-xl
                      transition-all duration-200 text-sm
                      flex items-center justify-center gap-2
                    "
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (settings.sectionFlags.offers === 'hidden' || settings.sectionFlags.offers === 'closed') return;
                      handleCardClick("ads"); 
                    }}
                  >
                    {t('cards.viewAll')}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 border-slate-700 text-slate-200 text-xs font-bold px-2 py-1.5 rounded-lg shadow-xl">
                  {t('cards.viewAll')}
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {selectedCard && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={handleCloseModal}
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="
                relative z-10
                bg-gradient-to-b from-slate-800 to-slate-900
                border border-slate-700/70
                rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)]
                w-full max-w-2xl overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal top shimmer */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/60 to-transparent" />

              <div className="flex items-center justify-between p-3 sm:p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-slate-100">{getCardTitle(selectedCard)}</h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-700/60 rounded-full transition-colors text-slate-500 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 sm:p-6 max-h-[70vh] overflow-y-auto">
                {selectedCard === "operations" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t('cards.details')}</h3>
                    <div className="grid gap-3">
                      {operations.length > 0 ? operations.map((op, i) => {
                        const activityText = getActivityText(op);
                        return (
                          <div key={op.id || i} className="p-5 rounded-2xl bg-slate-700/30 border border-slate-700/40 hover:border-slate-600/50 hover:bg-slate-700/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-slate-100 text-base">{activityText.title}</p>
                              <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-700/60 border border-slate-600/40 px-2.5 py-1 rounded-full">
                                {getActivityDate(op)}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm">{activityText.description}</p>
                          </div>
                        );
                      }) : (
                        <div className="text-center text-slate-500 py-8">{t('cards.noOperations')}</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCard === "ads" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{t('cards.details')}</h3>
                    <div className="grid gap-3">
                      {marketingRequests.length > 0 ? marketingRequests.map((ad, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-slate-700/30 border border-slate-700/40 hover:border-slate-600/50 hover:bg-slate-700/50 transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-slate-100 text-base">{ad.subject || ad.title || (language === 'ar' ? 'إعلان مميز' : 'Featured Ad')}</p>
                            <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-700/60 border border-slate-600/40 px-2.5 py-1 rounded-full">
                              {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{ad.content || ad.description || ''}</p>
                        </div>
                      )) : (
                        <div className="text-center text-slate-500 py-8">{t('cards.noAds')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RequestAdModal
        isOpen={isRequestAdModalOpen}
        onClose={() => setIsRequestAdModalOpen(false)}
        onSuccess={() => {
          setIsRequestAdModalOpen(false);
          // Optional: re-fetch or show a success message
        }}
      />
    </>
  );
}
