"use client";

import { ShoppingBag, Scale, Hammer, MoreHorizontal, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { motion, useReducedMotion } from "framer-motion";
import { useSettings, resolveSurfaceColor } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import { hapticTick } from "@/lib/haptics";
import SoonBadge from "./SoonBadge";
import { Button } from "@/components/ui/button";
import detailsStyles from "./quick-actions-details.module.css";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Role } from "@/types/user";


interface QuickActionsProps {
  id?: string;
  variant?: "default" | "details";
}

interface QuickActionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
}

interface ServiceShortcut {
  id: string;
  icon: React.ElementType;
  labelKey: string;
}

const serviceShortcuts: ServiceShortcut[] = [
  { id: "postPurchase", icon: ShoppingBag,     labelKey: "postPurchase" },
  { id: "legal",        icon: Scale,           labelKey: "legal"        },
  { id: "construction", icon: Hammer,          labelKey: "construction" },
  { id: "other",        icon: MoreHorizontal,  labelKey: "other"        },
];

export default function QuickActions({ id, variant = "default" }: QuickActionsProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { user } = useAuth();
  const ui = settings.uiFlags;
  const isRtl = language === "ar";

  const actions: QuickActionItem[] = [
    {
      id: "subscriptions",
      title: t('sub.public.quickAction'),
      icon: <Image src="/icons/subscriptions-transparent.png" alt="Subscriptions" width={40} height={40} className="h-10 w-10 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-indigo-400/50",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]",
    },
    {
      id: "wallet",
      title: t('action.wallet'),
      icon: <Image src="/icons/wallet.png" alt="Wallet" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.15)]",
    },

    {
      id: "services",
      title: t('action.services'),
      icon: <Image src="/icons/2.png" alt="Services" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-gray-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(156,163,175,0.15)]",
    },
    {
      id: "offers",
      title: t('action.offers'),
      icon: <Image src="/icons/3.png" alt="Offers" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-400/50",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.12)]",
    },

    {
      id: "requests",
      title: t('action.requests'),
      icon: <Image src="/icons/4.png" alt="Requests" width={56} height={56} className="h-14 w-14 object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity" />,
      accentColor: "group-hover:border-slate-500/60",
      glowColor: "group-hover:shadow-[0_8px_30px_rgba(148,163,184,0.12)]",
    },

  ].filter((action) => {
    // Hide buildingmanagement if user has no departments (and is not admin)
    if (action.id === 'buildingmanagement') {
      if (!user) return false;
      if (user.role === Role.VIEWER) return false;
      if (user.role !== Role.ADMIN && user.role !== Role.MANGER && (!user.departments || user.departments.length === 0)) return false;
    }

    // Filter icons based on admin UI flags
    const flagMap: Record<string, string> = {
      buildingmanagement: 'show_quickaction_buildingmgmt',
      wallet:             'show_quickaction_wallet',
      subscriptions:      'show_quickaction_subscriptions',
      services:           'show_quickaction_services',
      offers:             'show_quickaction_offers',
      requests:           'show_quickaction_orders',
      scan_map:           'show_map_section',
    };
    const flagKey = flagMap[action.id];
    if (!flagKey) return true;
    return ui[flagKey] !== false;
  });

  if (variant === "details") {
    const destinations: Record<string, { href: string; ar: string; en: string }> = {
      subscriptions: { href: '/subscriptions/new', ar: 'الباقات وإدارة الاشتراك', en: 'Plans and subscription' },
      wallet: { href: '/wallet', ar: 'الرصيد والمعاملات', en: 'Balance and transactions' },
      services: { href: '/services', ar: 'استعرض الخدمات وقدّم طلبك', en: 'Browse and request services' },
      offers: { href: '/offers', ar: 'تصفّح العروض المتاحة', en: 'Browse available listings' },
      requests: { href: '/orders', ar: 'تابع طلباتك وتفاصيلها', en: 'Follow your requests' },
    };
    const iconSize = Math.max(20, Math.min(40, parseFloat(settings.quickActionsIconSize || '24') || 24));
    return <div id={id} data-action-variant="details" className={detailsStyles.shortcuts} dir={isRtl ? 'rtl' : 'ltr'}>
      {actions.map(action => {
        const flagKey = action.id === 'requests' ? 'orders' : action.id;
        if (settings.sectionFlags[flagKey] === 'hidden') return null;
        const closed = settings.sectionFlags[flagKey] === 'closed';
        const destination = destinations[action.id];
        if (!destination) return null;
        return <Button variant="ghost" key={action.id} id={`tour-target-${action.id}`} type="button"
          aria-label={action.title} disabled={closed} className={detailsStyles.action}
          onClick={() => { if (!closed) { hapticTick(); router.push(destination.href); } }}>
          <span className={detailsStyles.icon} style={{ width: iconSize, height: iconSize }} aria-hidden="true">{action.icon}</span>
          <span className={detailsStyles.copy}>
            <span className={detailsStyles.label} style={{ color: resolveSurfaceColor(settings.quickActionsTitleColor, settings.isDark), fontSize: `${Math.max(14, Math.min(20, parseFloat(settings.quickActionFontSize || '15') || 15))}px` }}>{action.title}</span>
            <span className={detailsStyles.description}>{closed ? t('common.soon') : isRtl ? destination.ar : destination.en}</span>
          </span>
          {!closed && <ChevronRight className={detailsStyles.arrow} aria-hidden="true" />}
        </Button>;
      })}
    </div>;
  }

  const container = {
    hidden: settings.isDark && !reduceMotion ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 },
    show: {
      opacity: 1, y: 0,
      transition: settings.isDark ? { staggerChildren: 0.08, type: "spring", stiffness: 200 } : { staggerChildren: 0.025, duration: 0.18 }
    } as any
  };

  const item = {
    hidden: settings.isDark && !reduceMotion ? { opacity: 0, scale: 0.6, y: 10 } : { opacity: 1, scale: 1, y: 0 },
    show:  { opacity: 1, scale: 1,   y: 0  }
  };

  return (
    <motion.div
      id={id}
      data-action-variant={variant}
      variants={container}
      initial={settings.isDark && !reduceMotion ? "hidden" : false}
      whileInView="show"
      viewport={{ once: true }}
      className="w-full flex flex-col gap-4 py-4"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Main Quick Actions ── */}
      <div className="
        home-action-grid calm-panel w-full flex items-center justify-between gap-3 md:gap-3 md:gap-6
        px-6 py-6 max-md:px-3 max-md:py-5 max-md:gap-1.5
        bg-gradient-to-b from-muted/80 dark:from-slate-800/80 to-card/90 dark:to-slate-900/90
        border border-border dark:border-slate-700/40
        rounded-[1.25rem]
        shadow-[0_8px_28px_rgba(32,59,50,0.07)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)]
        relative overflow-hidden overflow-x-auto hide-scrollbar
        max-md:backdrop-blur-xl max-md:saturate-150
      " style={{background:!settings.isDark&&settings.quickActionBg==='rgba(51, 65, 85, 0.6)'?'var(--card)':settings.quickActionBg||'var(--card)',borderRadius:`${Math.max(8,Math.min(32,parseFloat(settings.quickActionRadius||'12')||12))}px`}}>
        {/* Top shimmer highlight */}
        <div className="calm-decoration absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        {/* Subtle ambient glow */}
        <div className="calm-decoration absolute inset-0 bg-gradient-to-tr from-indigo-500/3 via-transparent to-purple-500/2 pointer-events-none" />
        {/* Inner top glow */}
        <div className="calm-decoration pointer-events-none absolute inset-x-4 top-0 h-6 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-[1.25rem]" />

        {actions.map((action, index) => {
          const flagKey = action.id === 'requests' ? 'orders' : action.id;
          if (settings.sectionFlags[flagKey] === 'hidden') return null;

          return (
            <div key={action.id} className="flex flex-col items-center shrink-0 max-md:flex-1 max-md:min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  id={`tour-target-${action.id}`}
                  type="button"
                  aria-label={action.title}
                  disabled={settings.sectionFlags[flagKey] === 'closed'}
                  variants={item}
                  whileHover={reduceMotion ? undefined : settings.isDark ? { scale: 1.12, y: -8 } : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: settings.isDark ? 0.9 : 0.985 }}
                  onClick={() => {
                    hapticTick();
                    const flagKey = action.id === 'requests' ? 'orders' : action.id;
                    if (settings.sectionFlags[flagKey] === 'hidden' || settings.sectionFlags[flagKey] === 'closed') return;

                    if (action.id === "services")           router.push("/services");
                    else if (action.id === "wallet")        router.push("/wallet");
                    else if (action.id === "subscriptions") router.push("/subscriptions/new");
                    else if (action.id === "offers")        router.push("/offers");
                    else if (action.id === "requests")      router.push("/orders");
                    else if (action.id === "buildingmanagement") router.push("/buildingmanagement");
                    else if (action.id === "scan_map")      router.push("/scan-map");
                  }}
                  className={`
                    calm-action group relative
                    w-16 h-16 max-md:w-full max-md:max-w-[62px] max-md:h-auto max-md:aspect-square md:w-24 md:h-24
                    rounded-[1rem] md:rounded-[1.25rem]
                    bg-gradient-to-br from-muted/50 dark:from-slate-700/50 to-muted/70 dark:to-slate-800/70
                    border border-border dark:border-slate-700/40
                    ${action.accentColor}
                    flex items-center justify-center
                    shadow-[0_2px_12px_rgba(0,0,0,0.3)]
                    ${action.glowColor}
                    transition-all duration-300
                    max-md:active:shadow-[0_1px_6px_rgba(0,0,0,0.4)]
                    ${settings.sectionFlags[flagKey] === 'closed' ? 'opacity-40 grayscale pointer-events-none cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Inner shimmer on hover */}
                  <div className="absolute inset-0 rounded-[1rem] md:rounded-[1.25rem] bg-gradient-to-tr from-transparent via-white/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Top highlight line */}
                  <div className="absolute top-0 inset-x-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Optimized Soon Badge */}
                  {settings.sectionFlags[flagKey] === 'closed' && (
                    <SoonBadge className="absolute -top-1.5 -right-1.5 z-20 px-2 py-0.5 rounded-lg shadow-sm dark:shadow-xl shadow-black/40">
                      {t('common.soon') || 'قريباً'}
                    </SoonBadge>
                  )}

                  {/* Icon */}
                  <div className="relative z-10 p-2 md:p-3 flex items-center justify-center w-14 h-14 md:w-20 md:h-20">
                    <div style={{width:`${Math.max(20,Math.min(72,parseFloat(settings.quickActionsIconSize||'40')||40))}px`,height:`${Math.max(20,Math.min(72,parseFloat(settings.quickActionsIconSize||'40')||40))}px`}} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center [&_img]:!h-full [&_img]:!w-full [&_img]:max-h-full [&_img]:max-w-full [&_svg]:!h-full [&_svg]:!w-full [&_svg]:max-h-full [&_svg]:max-w-full">
                      {action.icon}
                    </div>
                  </div>


                  {/* Active dot indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    className="calm-decoration absolute -bottom-1 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_6px_rgba(99,102,241,0.5)]"
                  />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent className="bg-card/95 dark:bg-slate-900/95 backdrop-blur-xl border-border dark:border-slate-700/60 text-foreground dark:text-slate-200 font-bold px-3 py-2 rounded-xl shadow-sm dark:shadow-2xl">
                {action.title}
              </TooltipContent>
            </Tooltip>
            <span style={{fontSize:`${Math.max(12,Math.min(20,parseFloat(settings.quickActionFontSize||'14')||14))}px`,color:resolveSurfaceColor(settings.quickActionsTitleColor,settings.isDark)}} className="home-action-label text-xs mt-1.5 text-foreground dark:text-slate-200 text-center max-md:leading-tight max-md:mt-1.5 font-medium">{action.title}</span>
            </div>
          );
        })}
      </div>

    </motion.div>
  );
}
